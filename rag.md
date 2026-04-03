Building a production-style hybrid RAG (aligned with schedule-savvy-schedules)
1. Goals and non-goals
Goals

Answer questions only from your crawled/indexed documents (admissions, notices, PDFs, etc.).
No paid LLM API as the default; optional local LLM (Ollama / Hugging Face) or a cheap “demo” path that still uses retrieved text.
Supabase pgvector as the primary vector store in production (optional FAISS for local-only).
FastAPI backend with /health, /search, /chat, optional /chat/stream.
React or Gradio frontends calling the same API.
Non-goals

Perfect OCR for every scanned PDF without Tesseract/EasyOCR.
Sub-100ms latency on free-tier CPU with a 3B+ model loaded on first request.
2. High-level architecture
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ scrape_*.py     │────▶️│ data/*.txt,*.pdf │────▶️│ ingest.py           │
│ (httpx + BS4)   │     │                  │     │ chunk + embed + ids │
└─────────────────┘     └──────────────────┘     └──────────┬──────────┘
                                                            │
                    ┌───────────────────────────────────────┴───────────────────────────────────────┐
                    │                                                                               │
                    ▼                                                                               ▼
           ┌────────────────┐                                                            ┌──────────────────┐
           │ metadata.json  │                                                            │ faiss_index.bin  │
           │ + content_hash │                                                            │ (optional local) │
           └───────┬────────┘                                                            └────────┬─────────┘
                   │                                                                            │
                   ▼                                                                            │
           ┌────────────────┐                                                                  │
           │ sync_supabase  │──────────────────────────────────────────────────────────────────┘
           │ (embed + POST) │
           └───────┬────────┘
                   ▼
           ┌──────────────────────────────────────────┐
           │ Supabase: rag_documents + match_rag_docs  │
           │ (vector(384), HNSW, unique content_hash)  │
           └──────────────────┬───────────────────────┘
                              │
                              ▼
           ┌──────────────────────────────────────────┐
           │ FastAPI: embed query → RPC → rerank →    │
           │ PromptBuilder → ModelRouter → /chat       │
           └──────────────────┬───────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
        React (fetch)                   Gradio (httpx)
3. Technology choices (pin these concepts)
Layer  Library / service
Web framework
FastAPI + uvicorn
Rate limit
slowapi (per IP; note Render proxy / X-Forwarded-For if you extend)
Embeddings
sentence-transformers all-MiniLM-L6-v2 → 384-dim vectors, L2-normalized
Reranking
cross-encoder cross-encoder/ms-marco-MiniLM-L-6-v2 on top ~15 candidates
Vector DB (prod)
Supabase + pgvector + SQL RPC match_rag_documents
Vector DB (local alt)
FAISS IndexFlatL2 on same 384-d embeddings
Scraper
httpx + beautifulsoup4; save .txt with a fixed header (see §5)
PDF text
pypdf; optional PyMuPDF fallback when text layer is weak
LLM (optional)
Ollama client or transformers pipeline (lazy load); DEMO_MODE skips full generation
Config
python-dotenv, pydantic-style dataclass Settings
Critical: embedding dimension in DB must match the model (here 384).

4. Database schema (Supabase)
Run SQL equivalent to:
create extension if not exists vector;
Table rag_documents:
id text primary key
source_url text not null
page_title text not null
date_scraped timestamptz
chunk_index int
content text not null
content_hash text not null unique — dedupe/upsert key
embedding vector(384) not null
created_at timestamptz
HNSW index on embedding with vector_cosine_ops (no IVFFlat training on empty table).
RPC match_rag_documents(query_embedding vector(384), match_count int) returning rows ordered by <=>, with similarity = 1 - (embedding <=> query_embedding).
RLS: If you enable RLS, add policies for service_role / anon as needed; backend should use service role only server-side.

Gotcha: Do not name a local folder supabase if you also pip install supabase — it can shadow the package. Prefer httpx to POST /rest/v1/rpc/match_rag_documents with the service key.

5. Scraper contract (fixes bad citations)
Every saved HTML page should start with machine-readable headers, not only raw body text:

Source URL: https://example.edu/admissions
Page Title: Admissions 2026
Date Scraped: 2026-04-03T12:00:00+00:00
<optional contact-extraction block>
<body text...>
Ingest rule: _load_txt must parse these header lines first. Only if missing, fall back to regex on body or file://filename.

PDFs: Prefer storing canonical download URL in metadata when you know it (from crawl). If you only have a file path, source_url may be file://slug.pdf — acceptable for debugging, bad for end-user citations; fix by passing real URL from scraper into a sidecar or filename convention you can map.

6. Ingest pipeline (ingest.py)
Glob data/*.txt and data/*.pdf.
Skip stale bootstrap_kb.txt when real scraped files exist (optional).
Tokenize with the same tokenizer as the embedding model (e.g. MiniLM tokenizer).
Chunk: e.g. 400 tokens, 80 overlap; drop chunks shorter than ~40 tokens.
For each chunk compute:
id = SHA256 of (source_url, chunk_index, text) or similar
content_hash = SHA256 of chunk text only (for dedupe)
Embed all chunk texts in one or batches; normalize vectors.
Write metadata.json (list of records) and optionally faiss_index.bin.
Gotcha: _extract_url over full PDF text picks first URL in document (e.g. random publisher links) — never use that as primary source_url when you have scraper headers or known PDF URL.

7. Sync to Supabase (sync_supabase.py)
Load metadata.json.
Re-encode texts with same model and normalization as ingest (or reuse vectors from ingest if you store them — this repo re-embeds in sync for simplicity).
Deduplicate by content_hash before POST to avoid unique violations in one batch.
POST to /rest/v1/rag_documents with service role Authorization: Bearer ... and apikey: ....
On schema change / bad data: TRUNCATE rag_documents then full reload.
8. Retrieval layer (rag.py)
Flow

embed_query(query) → 384-d normalized vector (cache with lru_cache).
Supabase path: POST JSON {"query_embedding": [...], "match_count": 15} to RPC URL.
Build candidate list (row_index, pseudo_distance) from similarity (e.g. distance = 2*(1-sim) for cosine-like scaling).
Rerank with cross-encoder on (query, chunk_text) pairs; keep top 3.
Host bias (optional): sort reranked rows so cukashmir.ac.in beats ugc.gov.in when rerank scores are close.
Confidence gate: if confidence < CONFIDENCE_THRESHOLD, return empty chunks (or mark mode *_low_confidence) so the app says “I don’t have this information” instead of forcing a bad answer.
FAISS path: load_index() reads faiss_index.bin + metadata.json; same rerank + gate.

Lazy imports: load faiss only when RAG_STORE=faiss to avoid import cost on Supabase-only deploys.
9. Prompting (prompt.py)
System prompt: answer only from context; if missing, fixed refusal string + link to official site.
History: last N turns as plain text blocks.
Context: bullet blocks with Source URL, title, excerpt; enforce token budget (truncate by tokenizer or char estimate).
10. Generation (model.py + main.py)
DEMO_MODE=true: do not run heavy LLM; answer from first chunk snippet (or templated summary). Fast for Render free tier.
DEMO_MODE=false: ModelRouter: try Ollama if reachable; else HF pipeline (lazy). Use thread pool + timeout so one slow generation does not hang forever.
/chat: retrieval → PromptBuilder.build → generate → return { answer, sources, mode }.
Cache: in-memory dict keyed by hash of normalized query + TTL (cap size in production to avoid leaks).
/chat/stream (optional): after full generation, chunk the final string into SSE data: JSON events (meta, token, done) — true token streaming needs streaming APIs from the LLM.
11. FastAPI surface
Method  Path  Purpose
GET
/health
rag_store, model_status, CORS debug
GET
/ping
keep-alive
POST
/search
debug retrieval only
POST
/chat
main chat JSON
POST
/chat/stream
SSE-style stream (if implemented)
CORS: explicit allowlist from env (CORS_ORIGINS comma-separated). No * if you use credentials.

12. Configuration (env)
Typical keys:

RAG_STORE = supabase | faiss
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
DEMO_MODE, MODEL_BACKEND, OLLAMA_URL
CONFIDENCE_THRESHOLD, MAX_TOKENS, CACHE_TTL_SECONDS
CORS_ORIGINS
Frontend:

VITE_CHATBOT_API_URL → backend origin, no trailing slash
Optional: increase fetch timeout if LLM is slow
13. Deployment checklist
Python 3.11 on host (avoid 3.14 for torch/sentence-transformers).
Build: pip install -r backend/requirements.txt — do not run heavy ingest on every deploy unless you mount persistent disk.
Render: set PYTHON_VERSION, RAG_STORE, Supabase keys, CORS_ORIGINS for Vercel + HF Space.
Cold start: /ping cron; lazy model load; DEMO_MODE=true on free tier.
Re-index: run scrape + ingest + sync on a CI runner or local machine, not necessarily on the API dyno.
14. Quality checklist (before calling it “done”)

 Header-based source_url / page_title for all scraper-produced .txt

 No dominant awspublishing.com / facebook.com as source_url unless intentional

 match_rag_documents returns rows; /search returns non-empty for domain queries

 Confidence gate tuned so vague questions don’t pull random guideline PDFs

 CORS matches real browser origins

 Supabase sync dedupes; truncate + full reload documented
15. “Mega-prompt” for another AI (copy-paste)
Use this as a system / task prompt to implement the same system elsewhere:
You are implementing a production-oriented RAG API for a university chatbot.
Stack:
- FastAPI + uvicorn, slowapi rate limiting, CORS from env.
- sentence-transformers all-MiniLM-L6-v2 (384-d, normalized) for query and document embeddings.
- cross-encoder/ms-marco-MiniLM-L-6-v2 to rerank top ~15 chunks down to 3.
- Supabase Postgres with pgvector: table rag_documents (id, source_url, page_title, date_scraped, chunk_index, content, content_hash unique, embedding vector(384)), HNSW index, RPC match_rag_documents(query_embedding, match_count) returning cosine similarity.
- Alternative RAG_STORE=faiss: faiss.IndexFlatL2 + metadata.json.
- Scraper: httpx + BeautifulSoup; every HTML save must begin with lines "Source URL:", "Page Title:", "Date Scraped:". Ingest MUST parse these headers; never use first URL regex on full PDF body as primary source_url.
- ingest.py: token-chunk (e.g. 400/80), SHA256 id and content_hash, write metadata.json + optional faiss.
- sync_supabase.py: dedupe by content_hash, POST batches with service role; use httpx if local folder named supabase would shadow supabase package.
- rag.py: embed query; retrieve 15; rerank to 3; optional host boost for official domain; if confidence < threshold return no chunks.
- prompt.py: strict grounding; refusal if no relevant context; optional history last 8 turns.
- model.py: DEMO_MODE returns extractive/snippet answer; else Ollama or HF with timeout and lazy load.
- main.py: /health, /search, /chat with TTL cache; optional /chat/stream as SSE JSON events after full generation.
- Document all env vars and deployment steps; Python 3.11; no ingest in API build unless persistent disk.
Implement with clean separation of modules, no placeholders, and explain tradeoffs in comments where non-obvious.
You can save everything from the first # through section 15 as your .md file. I’m in Ask mode, so I didn’t create a file in your repo; copy this into RAG_BUILD_SPEC.md locally or switch to Agent mode if you want it written into the project automatically.
