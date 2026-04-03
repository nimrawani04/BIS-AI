import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Parse scraper header contract (rag.md §5).
 * Every document produced by crawl-bis starts with:
 *   Source URL: https://...
 *   Page Title: ...
 *   Date Scraped: ISO8601
 * Falls back to caller-supplied values when headers are absent.
 */
function parseDocumentHeaders(content: string, fallbackUrl?: string, fallbackTitle?: string) {
  const lines = content.split("\n");
  let sourceUrl = fallbackUrl || "";
  let pageTitle = fallbackTitle || "";
  let dateScraped = new Date().toISOString();
  let bodyStart = 0;

  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (line.startsWith("Source URL:")) {
      sourceUrl = line.slice("Source URL:".length).trim();
      bodyStart = i + 1;
    } else if (line.startsWith("Page Title:")) {
      pageTitle = line.slice("Page Title:".length).trim();
      bodyStart = i + 1;
    } else if (line.startsWith("Date Scraped:")) {
      dateScraped = line.slice("Date Scraped:".length).trim();
      bodyStart = i + 1;
    } else if (line.trim() === "" && bodyStart > 0) {
      bodyStart = i + 1;
      break;
    }
  }

  return { sourceUrl, pageTitle, dateScraped, body: lines.slice(bodyStart).join("\n") };
}

/**
 * Chunk text (rag.md §6): 400 tokens, 80 overlap, drop chunks < 40 tokens.
 */
function chunkText(text: string, maxTokens = 400, overlap = 80, minTokens = 40): string[] {
  const lines = text.split("\n");
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;
  let lastHeading = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#") || (trimmed.startsWith("**") && trimmed.endsWith("**"))) {
      lastHeading = trimmed;
    }
    const lineTokens = trimmed.split(/\s+/).length;

    if (currentLength + lineTokens > maxTokens && currentChunk.length > 0) {
      if (currentChunk.join(" ").split(/\s+/).length >= minTokens) {
        chunks.push(currentChunk.join("\n"));
      }
      const overlapLines: string[] = [];
      let overlapLen = 0;
      for (let i = currentChunk.length - 1; i >= 0 && overlapLen < overlap; i--) {
        overlapLines.unshift(currentChunk[i]);
        overlapLen += currentChunk[i].split(/\s+/).length;
      }
      currentChunk = lastHeading ? [lastHeading, ...overlapLines] : [...overlapLines];
      currentLength = currentChunk.reduce((s, l) => s + l.split(/\s+/).length, 0);
    }
    currentChunk.push(trimmed);
    currentLength += lineTokens;
  }

  if (currentChunk.length > 0 && currentChunk.join(" ").split(/\s+/).length >= minTokens) {
    chunks.push(currentChunk.join("\n"));
  }
  return chunks;
}

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text }] } }),
    }
  );
  if (!res.ok) throw new Error(`Embedding API error: ${res.status}`);
  const data = await res.json();
  return data.embedding.values;
}

async function generateEmbeddingsBatch(texts: string[], apiKey: string, batchSize = 5): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    embeddings.push(...await Promise.all(batch.map(t => generateEmbedding(t, apiKey))));
    if (i + batchSize < texts.length) await new Promise(r => setTimeout(r, 100));
  }
  return embeddings;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { documents } = await req.json();
    if (!documents || !Array.isArray(documents)) {
      return new Response(JSON.stringify({ error: "Missing documents array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalChunks = 0;
    let totalSkipped = 0;

    for (const doc of documents) {
      const { url: docUrl, title: docTitle, content_type, content } = doc;
      if (!content) continue;

      // Parse scraper header contract (rag.md §5)
      const { sourceUrl, pageTitle, dateScraped, body } = parseDocumentHeaders(content, docUrl, docTitle);
      const effectiveUrl = sourceUrl || docUrl || null;
      const effectiveTitle = pageTitle || docTitle || effectiveUrl || "Untitled";

      const chunks = chunkText(body || content);
      if (chunks.length === 0) continue;

      // Compute content_hash for deduplication (rag.md §6, §7)
      const hashes = await Promise.all(chunks.map(c => sha256(c)));

      // Deduplicate within this batch before inserting (rag.md §7)
      const seen = new Set<string>();
      const uniqueChunks: { chunk: string; hash: string; index: number }[] = [];
      for (let i = 0; i < chunks.length; i++) {
        if (!seen.has(hashes[i])) {
          seen.add(hashes[i]);
          uniqueChunks.push({ chunk: chunks[i], hash: hashes[i], index: i });
        }
      }
      totalSkipped += chunks.length - uniqueChunks.length;

      let embeddings: number[][] = [];
      if (geminiApiKey) {
        try {
          embeddings = await generateEmbeddingsBatch(uniqueChunks.map(c => c.chunk), geminiApiKey);
        } catch (e) { console.error("Embedding error:", e); }
      }

      const rows = uniqueChunks.map(({ chunk, hash, index }, i) => ({
        url: effectiveUrl,
        title: effectiveTitle,
        content_type: content_type || "general",
        content: chunk,
        chunk_index: index,
        content_hash: hash,
        date_scraped: dateScraped,
        embedding: embeddings[i] || null,
      }));

      // Upsert — skip rows whose content_hash already exists (rag.md §7)
      const { error } = await supabase
        .from("bis_knowledge_chunks")
        .upsert(rows, { onConflict: "content_hash", ignoreDuplicates: true });

      if (error) {
        console.error(`Insert error for "${effectiveTitle}":`, error);
        throw error;
      }
      totalChunks += rows.length;
    }

    return new Response(JSON.stringify({
      success: true,
      chunks_created: totalChunks,
      chunks_skipped_duplicate: totalSkipped,
      embeddings_generated: !!geminiApiKey,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("rag-ingest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
