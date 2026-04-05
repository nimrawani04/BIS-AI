# BIS Scraping Pipeline

Local 3-step pipeline for scraping BIS content, generating embeddings, and syncing to Supabase.

## Prerequisites

1. Copy `.env.example` to `.env` and fill in:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JINA_API_KEY` (only needed for edge functions, not for local scraping)

2. Install Python dependencies:
   ```bash
   pip install -r scripts/bis/requirements.txt
   ```

3. Set Supabase secrets for edge functions:
   ```bash
   supabase secrets set JINA_API_KEY=jina_your_key_here
   supabase secrets set OPENROUTER_API_KEY=sk-or-v1-your_key_here
   ```

## Usage

### Step 1: Scrape BIS pages

```bash
npm run scrape:bis
```

- Fetches all BIS URLs
- Strips HTML to plain text
- Saves to `data/bis/*.txt` with headers (Source URL, Page Title, Date Scraped)
- Takes ~1 minute (1s delay between requests)

### Step 2: Chunk + embed locally (Python)

```bash
npm run ingest:bis
```

- Reads all `.txt` files from `data/bis/`
- Chunks text (400 tokens, 80 overlap, min 40)
- Generates 768-d embeddings using **local BAAI/bge-base-en-v1.5** model
- Saves to `data/bis/metadata.json`
- Takes ~2-3 minutes (first run downloads model ~500MB)

### Step 3: Sync to Supabase

```bash
npm run sync:bis
```

- Uploads `metadata.json` to `bis_knowledge_chunks` table
- Deduplicates by `content_hash`
- Batches of 100 rows
- Takes ~10 seconds

## Benefits

- **100% local embeddings** — no API calls during scraping, uses BAAI/bge-base-en-v1.5
- **Scrape once, re-embed many times** — no need to hit BIS servers again
- **Inspect before pushing** — review `.txt` files and `metadata.json` locally
- **Swap embedding models** — change from BGE to another model without re-scraping
- **Version control** — commit scraped data to track changes over time
- **Jina only for queries** — edge functions still use Jina API for real-time query embedding (~10-50 calls/day vs 1000s for bulk)

## File Structure

```
data/bis/
├── *.txt              # Raw scraped pages with headers
└── metadata.json      # Chunked + embedded data ready for Supabase

scripts/bis/
├── scrape.mjs         # Step 1: Fetch HTML → save .txt
├── ingest.py          # Step 2: Chunk + embed (local BGE) → save metadata.json
├── sync.mjs           # Step 3: Push metadata.json → Supabase
└── requirements.txt   # Python dependencies
```

## Troubleshooting

**"No .txt files found"** → Run `npm run scrape:bis` first

**"No module named 'sentence_transformers'"** → Run `pip install -r scripts/bis/requirements.txt`

**"SUPABASE_SERVICE_ROLE_KEY must be set"** → Add it to `.env`

**First run is slow** → Model downloads ~500MB on first use, cached after that

**Out of memory during embedding** → Reduce batch size or use a smaller model
