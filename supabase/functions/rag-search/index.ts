import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Config (rag.md §8, §12) ───────────────────────────────────────────────────
const RETRIEVE_COUNT = 15;       // retrieve 15 candidates
const RERANK_TOP_K = 3;          // keep top 3 after reranking
const CONFIDENCE_THRESHOLD = 0.25; // below this → no chunks returned (rag.md §8)

type ChunkMeta = { url: string; title: string; snippet: string; content_type: "webpage" | "pdf" | "table" };

// ── Query embedding (Jina jina-embeddings-v4 → 768-d) ────────────────────────
async function generateQueryEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch("https://api.jina.ai/v1/embeddings", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "jina-embeddings-v4",
        input: [{ text }],
        dimensions: 768,
        task: "retrieval.query",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding ?? null;
  } catch { return null; }
}

// ── Cross-encoder reranking via OpenRouter (rag.md §8) ───────────────────────
// We use the LLM to score (query, chunk) relevance pairs and return top-k.
// This replaces a local cross-encoder model (not available in Deno edge runtime).
async function rerankWithLLM(
  query: string,
  candidates: any[],
  topK: number,
  apiKey: string
): Promise<any[]> {
  if (candidates.length <= topK) return candidates;

  try {
    // Ask the LLM to rank the candidates by relevance to the query
    const candidateList = candidates
      .map((c, i) => `[${i}] ${c.content.slice(0, 300)}`)
      .join("\n\n");

    const prompt = `You are a relevance ranker. Given the query and candidate passages, return ONLY a JSON array of the ${topK} most relevant passage indices (0-based), ordered by relevance descending. Example: [2,0,4]

Query: ${query}

Candidates:
${candidateList}

Return ONLY the JSON array, nothing else.`;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 50,
      }),
    });

    if (!res.ok) throw new Error(`Rerank API error: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const match = text.match(/\[[\d,\s]+\]/);
    if (!match) throw new Error("No valid JSON array in rerank response");

    const indices: number[] = JSON.parse(match[0]);
    const reranked = indices
      .filter(i => i >= 0 && i < candidates.length)
      .slice(0, topK)
      .map(i => candidates[i]);

    return reranked.length > 0 ? reranked : candidates.slice(0, topK);
  } catch (e) {
    console.error("Rerank failed, using top-k by score:", e);
    // Graceful fallback: just take top-k by retrieval score
    return candidates.slice(0, topK);
  }
}

// ── SSE stream helper ─────────────────────────────────────────────────────────
// Pass-through OpenRouter SSE, append sources + chunk-meta before [DONE]
function appendSourcesToStream(
  upstream: ReadableStream,
  sourceUrls: string[],
  chunkMeta: ChunkMeta[]
): ReadableStream {
  const reader = upstream.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line === "data: [DONE]") continue;
            controller.enqueue(encoder.encode(line + "\n"));
          }
        }
        if (sourceUrls.length > 0) {
          const src = "\n\n---SOURCES---\n" + sourceUrls.map(u => `- ${u}`).join("\n");
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: src }, index: 0, finish_reason: null }] })}\n\n`));
        }
        if (chunkMeta.length > 0) {
          const meta = "\n\n---CHUNK_META---\n" + JSON.stringify(chunkMeta);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: meta }, index: 0, finish_reason: null }] })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) { controller.error(err); }
    },
  });
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the BIS Smart Assistant — an expert AI on the Bureau of Indian Standards (BIS).

## PRIORITY ORDER
1. FIRST: Use the RETRIEVED CONTEXT below if it contains relevant information
2. SECOND: Use the BUILT-IN BIS KNOWLEDGE BASE for common BIS topics
3. LAST RESORT: Say you couldn't find it — never hallucinate

## RULES
- OUT-OF-SCOPE: If NOT about BIS, respond: "I can only answer questions related to the Bureau of Indian Standards (BIS) and its services."
- NO HALLUCINATION: Never invent fees, dates, or procedures.
- CITATIONS: Always end with ---SOURCES--- listing relevant URLs.
- SUGGESTIONS: Always end with ---SUGGESTIONS--- with 3 follow-up questions.
- MULTILINGUAL: Match user's language (Hindi/Hinglish/regional). Keep BIS, ISI, FMCS in English.
- Use markdown (headers, lists, bold, tables).

## BUILT-IN BIS KNOWLEDGE BASE

### About BIS
BIS is India's national standards body under BIS Act 2016, Ministry of Consumer Affairs. Formerly ISI (1947). HQ New Delhi, 5 Regional Offices, 21 Branch Offices.

### Certification Schemes
**ISI Mark** — 900+ products. Apply: manakonline.bis.gov.in. Source: https://www.bis.gov.in/index.php/certification/product-certification/
**Hallmarking** — Gold/silver purity. Mandatory for gold since June 2021. HUID on each piece. Source: https://www.bis.gov.in/index.php/certification/hallmarking/
**CRS** — Electronics self-declaration. Source: https://www.bis.gov.in/index.php/certification/scheme-for-compulsory-registration/
**FMCS** — Foreign manufacturers. Source: https://www.bis.gov.in/index.php/certification/foreign-manufacturers-certification-scheme-fmcs/
**ECO Mark** — Environment-friendly products.

### Application Process
1. Register at https://manakonline.bis.gov.in
2. Submit application + documents (test reports, factory details, QC plan)
3. BIS review → factory inspection → product testing → license
4. Annual surveillance + renewal

### BIS Standards
22,000+ Indian Standards (IS + number, e.g. IS 10500 for drinking water). Source: https://www.bis.gov.in/index.php/standards/bis-standards/

### Consumer Affairs
Complaints: https://www.bis.gov.in/index.php/consumer-affairs/

### BIS Laboratories
NABL-accredited labs in Mumbai, Kolkata, Chandigarh, Chennai, Sahibabad. Source: https://www.bis.gov.in/index.php/laboratory-services/

### BIS Act 2016
Replaced BIS Act 1986. Mandatory standards, certification, penalties for misuse of BIS marks.`;

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, topic_filter, language, simple_mode } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Missing messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const JINA_API_KEY = Deno.env.get("JINA_API_KEY");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Extract latest user query
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    const rawQuery = lastUserMsg?.content || "";
    const searchQuery = typeof rawQuery === "string"
      ? rawQuery
      : Array.isArray(rawQuery) ? (rawQuery as any[]).find(c => c.type === "text")?.text || "" : "";

    let candidates: any[] = [];
    let searchMode = "none";

    // ── Step 1: Retrieve 15 candidates (rag.md §8) ────────────────────────────
    if (JINA_API_KEY && searchQuery) {
      const embedding = await generateQueryEmbedding(searchQuery, JINA_API_KEY);
      if (embedding) {
        const { data, error } = await supabase.rpc("search_bis_chunks_hybrid", {
          search_query: searchQuery,
          query_embedding: embedding,
          match_count: RETRIEVE_COUNT,
          filter_type: topic_filter && topic_filter !== "all" ? topic_filter : null,
          rrf_k: 60,
        });
        if (!error && data && data.length > 0) {
          candidates = data;
          searchMode = "hybrid";
        }
      }
    }

    // FTS fallback
    if (candidates.length === 0 && searchQuery) {
      const { data, error } = await supabase.rpc("search_bis_chunks", {
        search_query: searchQuery,
        match_count: RETRIEVE_COUNT,
        filter_type: topic_filter && topic_filter !== "all" ? topic_filter : null,
      });
      if (!error && data && data.length > 0) {
        candidates = data;
        searchMode = "fts";
      }
    }

    // ILIKE last resort
    if (candidates.length === 0 && searchQuery) {
      const keywords = searchQuery.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3).slice(0, 4);
      if (keywords.length > 0) {
        const { data } = await supabase
          .from("bis_knowledge_chunks")
          .select("id, url, title, content_type, content, chunk_index")
          .ilike("content", `%${keywords[0]}%`)
          .limit(RETRIEVE_COUNT);
        if (data && data.length > 0) {
          candidates = data
            .map((row: any) => ({ ...row, rrf_score: keywords.filter((k: string) => row.content.toLowerCase().includes(k)).length }))
            .sort((a: any, b: any) => b.rrf_score - a.rrf_score);
          searchMode = "ilike";
        }
      }
    }

    console.log(`Search: ${searchMode}, candidates: ${candidates.length}`);

    // ── Step 2: Confidence gate (rag.md §8) ───────────────────────────────────
    // For hybrid/semantic results, check top candidate's score
    let chunks: any[] = [];
    if (candidates.length > 0) {
      const topScore = candidates[0]?.rrf_score ?? candidates[0]?.semantic_rank ?? candidates[0]?.rank ?? 1;
      if (searchMode === "hybrid" && topScore < CONFIDENCE_THRESHOLD) {
        console.log(`Confidence gate: top score ${topScore} < ${CONFIDENCE_THRESHOLD}, skipping retrieval`);
        chunks = []; // force fallback to built-in knowledge
      } else {
        // ── Step 3: Rerank top 15 → top 3 (rag.md §8) ────────────────────────
        chunks = await rerankWithLLM(searchQuery, candidates, RERANK_TOP_K, OPENROUTER_API_KEY);
        console.log(`After rerank: ${chunks.length} chunks`);
      }
    }

    // ── Build context block ───────────────────────────────────────────────────
    const sourceUrls: string[] = [];
    const chunkMeta: ChunkMeta[] = [];
    let contextBlock = "";

    if (chunks.length > 0) {
      contextBlock = "\n\n## RETRIEVED CONTEXT (use this to answer)\n\n";
      for (const chunk of chunks) {
        contextBlock += `### ${chunk.title}${chunk.url ? ` (Source: ${chunk.url})` : ""}\n${chunk.content}\n\n`;
        if (chunk.url && !sourceUrls.includes(chunk.url)) {
          sourceUrls.push(chunk.url);
          let ct: "webpage" | "pdf" | "table" = "webpage";
          if (chunk.url.toLowerCase().includes(".pdf") || chunk.content_type === "pdf") ct = "pdf";
          else if (chunk.content_type === "table" || (chunk.content?.includes("|") && chunk.content?.includes("---"))) ct = "table";
          chunkMeta.push({
            url: chunk.url,
            title: chunk.title || chunk.url,
            snippet: (chunk.content || "").replace(/\s+/g, " ").trim().slice(0, 300),
            content_type: ct,
          });
        }
      }
    } else {
      contextBlock = "\n\n## RETRIEVED CONTEXT\nNo relevant chunks found. Use the BUILT-IN BIS KNOWLEDGE BASE above.\n";
    }

    let finalPrompt = SYSTEM_PROMPT + contextBlock;
    if (simple_mode) finalPrompt += "\n\nSIMPLE MODE: Explain like a 10-year-old. Use emojis and short sentences.";

    const langMap: Record<string, string> = {
      hi: "Hindi", bn: "Bengali", ta: "Tamil", te: "Telugu", ur: "Urdu",
      ks: "Kashmiri", mr: "Marathi", gu: "Gujarati", kn: "Kannada",
      ml: "Malayalam", pa: "Punjabi",
    };
    if (language && language !== "en" && langMap[language]) {
      finalPrompt += `\n\nRESPOND IN ${langMap[language]}. Keep technical terms in English.`;
    }

    // ── Step 4: Generate answer (rag.md §10) ──────────────────────────────────
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "grok-beta",
        stream: true,
        messages: [
          { role: "system", content: finalPrompt },
          ...messages.map((m: any) => ({
            role: m.role,
            content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
          })),
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `AI service error: ${response.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(appendSourcesToStream(response.body!, sourceUrls, chunkMeta), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("rag-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
