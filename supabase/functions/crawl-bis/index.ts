import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── BIS URL list (full sitemap) ───────────────────────────────────────────────
const BIS_URLS = [
  // ── About BIS ──────────────────────────────────────────────────────────────
  "https://www.bis.gov.in/?lang=en",
  "https://www.bis.gov.in/the-bureau/about-bis/?lang=en",
  "https://www.bis.gov.in/the-bureau/organization-2/?lang=en",
  "https://www.bis.gov.in/the-bureau/organization-2/gc-members/?lang=en",
  "https://www.bis.gov.in/the-bureau/organization-2/gc-proceedings/?lang=en",
  "https://www.bis.gov.in/the-bureau/origin-of-bis/?lang=en",
  "https://www.bis.gov.in/the-bureau/president/?lang=en",
  "https://www.bis.gov.in/the-bureau/director-general/?lang=en",
  "https://www.bis.gov.in/the-bureau/annual-report/?lang=en",
  "https://www.bis.gov.in/the-bureau/bis-act-rules-and-regulations/?lang=en",
  "https://www.bis.gov.in/directory/enquiry/?lang=en",
  "https://www.bis.gov.in/directory/head-quarter/?lang=en",
  "https://www.bis.gov.in/directory/regional-offices/?lang=en",
  "https://www.bis.gov.in/directory/branch-office/?lang=en",
  "https://www.bis.gov.in/directory/sales-office/?lang=en",
  "https://www.bis.gov.in/directory/laboratory/?lang=en",

  // ── Standards ──────────────────────────────────────────────────────────────
  "https://www.bis.gov.in/manak-pravardhak-programme/",
  "https://standards.bis.gov.in/website/wc-drafts",
  "https://www.bis.gov.in/wp-content/uploads/2022/12/Revised-SFM.pdf",

  // ── Product Certification ──────────────────────────────────────────────────
  "https://www.bis.gov.in/product-certification/product-certification-overview/?lang=en",
  "https://www.bis.gov.in/product-certification/products-under-compulsory-certification/?lang=en",
  "https://www.bis.gov.in/product-certification/product-certification-process/?lang=en",
  "https://www.bis.gov.in/product-certification/product-specific-information-2/?lang=en",
  "https://www.bis.gov.in/product-certification/product-certification-fee/?lang=en",
  "https://www.bis.gov.in/product-certification/product-certificatin-apply-online/?lang=en",
  "https://www.bis.gov.in/product-certification/online-information/?lang=en",
  "https://www.bis.gov.in/product-certification/product-certification-faq/?lang=en",
  "https://www.bis.gov.in/product-certification/product-certification-contact-us/?lang=en",

  // ── Systems Certification ──────────────────────────────────────────────────
  "https://www.bis.gov.in/system-certification-overview/?lang=en",
  "https://www.bis.gov.in/system-certification-overview/systems-certification/?lang=en",
  "https://www.bis.gov.in/system-certification-overview/certification-process/systems-under-certification/?lang=en",
  "https://www.bis.gov.in/system-certification-overview/certification-process/who-can-apply/?lang=en",
  "https://www.bis.gov.in/system-certification-overview/download-approach-forms/?lang=en",
  "https://www.bis.gov.in/system-certification-overview/certification-process/fee-structure-for-mscs/?lang=en",
  "https://www.bis.gov.in/system-certification-overview/certification-process/system-certification-apply-online/?lang=en",
  "https://www.bis.gov.in/system-certification-overview/system-certification-licence/?lang=en",
  "https://www.bis.gov.in/system-certification-overview/system-certification-faq/?lang=en",
  "https://www.bis.gov.in/system-certification-overview/system-certification-contact-us/?lang=en",

  // ── FMCS ───────────────────────────────────────────────────────────────────
  "https://www.bis.gov.in/fmcs/fmcs-overview/?lang=en",
  "https://www.bis.gov.in/fmcs/certification-process/aboutfmcs/?lang=en",
  "https://www.bis.gov.in/fmcs/certification-process/products-under-fmcs/?lang=en",
  "https://www.bis.gov.in/fmcs/certification-process/bis-standard-mark/?lang=en",
  "https://www.bis.gov.in/fmcs/certification-process/who-can-apply/?lang=en",
  "https://www.bis.gov.in/fmcs/certification-process/how-to-apply/?lang=en",
  "https://www.bis.gov.in/fmcs/certification-process/nomination-of-air/?lang=en",
  "https://www.bis.gov.in/fmcs/certification-process/grant-of-licence/?lang=en",
  "https://www.bis.gov.in/fmcs/certification-process/operation-of-licence/?lang=en",
  "https://www.bis.gov.in/fmcs/inclusion-of-new-varieties/?lang=en",
  "https://www.bis.gov.in/fmcs/renewal-of-licence/?lang=en",
  "https://www.bis.gov.in/fmcs/forms-and-formats/?lang=en",
  "https://www.bis.gov.in/fmcs/fmcs-laboratories/?lang=en",
  "https://www.bis.gov.in/fmcs/licensee/?lang=en",
  "https://www.bis.gov.in/fmcs/fmcs-fee/?lang=en",
  "https://www.bis.gov.in/fmcs/fmcs-faqs/?lang=en",
  "https://www.bis.gov.in/fmcs/fmcs-contact-us/?lang=en",

  // ── Registration Scheme (CRS) ──────────────────────────────────────────────
  "https://www.crsbis.in/BIS/about-crs.do",
  "https://www.crsbis.in/BIS/registration-page.do",
  "https://www.crsbis.in/BIS/bis_lab.do",
  "https://www.crsbis.in/BIS/faq-bis.do",
  "https://www.crsbis.in/BIS/contact.do",

  // ── Scheme-X ───────────────────────────────────────────────────────────────
  "https://www.bis.gov.in/products-under-compulsory-certification-scheme-x/",
  "https://www.bis.gov.in/certification-process-4/",
  "https://www.bis.gov.in/scheme-x-certification/product-specific-information/?lang=en",
  "https://www.bis.gov.in/scheme-x-certification/fee/",
  "https://www.bis.gov.in/scheme-x-certification/faq-scheme-x-certification/",

  // ── Laboratory Services ────────────────────────────────────────────────────
  "https://www.bis.gov.in/laboratorys/laboratory-services-overview/?lang=en",
  "https://www.bis.gov.in/laboratorys/testing-facility-and-testing-charges/?lang=en",
  "https://www.bis.gov.in/laboratorys/list-of-bis-recognized-lab/?lang=en",
  "https://www.bis.gov.in/laboratorys/utrf/?lang=en",
  "https://www.bis.gov.in/laboratorys/laboratory-services-overview/laboratory-faq/?lang=en",
  "https://www.bis.gov.in/laboratorys/testing-overview/laboratory-contact-us/?lang=en",
  "https://www.bis.gov.in/index.php/laboratorys/how-to-apply-for-bis-recognition/",

  // ── Hallmarking ────────────────────────────────────────────────────────────
  "https://www.bis.gov.in/hallmarking-overview/?lang=en",
  "https://www.bis.gov.in/hallmarking-overview/hallmarking-regulation-2018/?lang=en",
  "https://www.bis.gov.in/hallmarking-overview/mandatory-hallmarking-order/?lang=en",
  "https://www.bis.gov.in/hallmarking-overview/jewellers-registration-scheme/?lang=en",
  "https://www.bis.gov.in/hallmarking-overview/jewellers-registration-scheme/list-of-licensed-jewellers/?lang=en",
  "https://www.bis.gov.in/hallmarking-overview/hallmarking-centre/?lang=en",
  "https://www.bis.gov.in/hallmarking-overview/gold-refinery/?lang=en",
  "https://www.bis.gov.in/hallmarking-overview/gold-monetization-scheme/?lang=en",
  "https://www.bis.gov.in/hallmarking-overview/consumer-protection/?lang=en",
  "https://www.bis.gov.in/forms-formats/?lang=en",
  "https://www.bis.gov.in/hallmarking-overview/hallmarking-faqs/hallmarking-faq/?lang=en",
  "https://www.bis.gov.in/hallmarking-overview/hallmarking-faqs/mandatory/?lang=en",
  "https://www.bis.gov.in/hallmarking-jewellers/?lang=en",
  "https://www.bis.gov.in/hallmarking-overview/hallmarking-faqs/bis-act-and-regulation-faq/?lang=en",
  "https://www.bis.gov.in/hallmarking-overview/hallmarking-contact-us/?lang=en",

  // ── Training ───────────────────────────────────────────────────────────────
  "https://www.bis.gov.in/training-2/overview-of-nits/?lang=en",
  "https://www.bis.gov.in/training-2/procedure-for-applying-for-a-training-programme/?lang=en",
  "https://www.bis.gov.in/training-2/training-programmes/?lang=en",
  "https://www.bis.gov.in/training-2/annual-training-calendar/?lang=en",
  "https://www.bis.gov.in/training-2/month-wise-training-calendar/?lang=en",
  "https://www.bis.gov.in/training-2/training-fee/?lang=en",
  "https://www.bis.gov.in/training-2/training-faq/?lang=en",
  "https://www.bis.gov.in/training-2/training-contact-us/?lang=en",

  // ── Consumer Engagement ────────────────────────────────────────────────────
  "https://www.bis.gov.in/consumer-overview/?lang=en",
  "https://www.bis.gov.in/consumer-overview/consumer-overviews/consumer-protection/?lang=en",
  "https://www.bis.gov.in/consumer-overview/consumer-overviews/national-quality-award/?lang=en",
  "https://www.bis.gov.in/consumer-overview/consumer-overviews/brochures/?lang=en",
  "https://www.bis.gov.in/consumer-overview/consumer-overviews/online-complaint-registration/?lang=en",
  "https://www.bis.gov.in/consumer-overview/consumer-overviews/citizen-charter/?lang=en",
  "https://www.bis.gov.in/enforcement-activities/?lang=en",
  "https://www.bis.gov.in/consumer-overview/consumer-overviews/for-consumers-faq/?lang=en",
  "https://www.bis.gov.in/consumer-overview/consumer-overviews/for-consumers-contact-us/?lang=en",

  // ── News & Updates ─────────────────────────────────────────────────────────
  "https://www.bis.gov.in/whats-new/?lang=en",
  "https://www.bis.gov.in/upcoming-qcos-notified-and-due-for-implementation/",
  "https://www.bis.gov.in/public-alert-for-product-recall-on-account-of-non-conformity-of-product/",
  "https://www.bis.gov.in/index.php/standard-of-the-week/?lang=en",
  "https://www.bis.gov.in/index.php/standard-of-the-month/?lang=en",
  "https://www.bis.gov.in/monthly-bis-newsletter/?lang=en",
  "https://www.bis.gov.in/full-faq/?lang=en",
  "https://www.bis.gov.in/career-opportunities/?lang=en",
  "https://www.bis.gov.in/career-opportunities/1961-2/?lang=en",
];

function getContentType(url: string): string {
  if (url.includes("hallmark") || url.includes("jeweller") || url.includes("gold-refinery") || url.includes("gold-monetization") || url.includes("huid")) return "hallmarking";
  if (url.includes("product-certification") || url.includes("fmcs") || url.includes("scheme-x") || url.includes("compulsory-certification") || url.includes("system-certification") || url.includes("crsbis.in")) return "certification";
  if (url.includes("standard") || url.includes("technical-department") || url.includes("wc-drafts") || url.includes("SFM.pdf") || url.includes("manak-pravardhak")) return "standards";
  if (url.includes("consumer") || url.includes("complaint") || url.includes("bis-care") || url.includes("enforcement") || url.includes("citizen-charter") || url.includes("national-quality-award")) return "consumer";
  if (url.includes("laborator") || url.includes("lims.bis") || url.includes("nabl") || url.includes("testing") || url.includes("utrf")) return "laboratory";
  if (url.includes("management-system") || url.includes("system-certification")) return "management";
  if (url.includes("about-bis") || url.includes("organization") || url.includes("origin") || url.includes("president") || url.includes("director") || url.includes("annual-report") || url.includes("bis-act") || url.includes("directory")) return "about";
  if (url.includes("training") || url.includes("career") || url.includes("recruitment")) return "general";
  if (url.includes("whats-new") || url.includes("newsletter") || url.includes("standard-of-the") || url.includes("upcoming-qco") || url.includes("product-recall") || url.includes("full-faq")) return "general";
  return "general";
}

// ── SHA-256 via Web Crypto (available in Deno) ────────────────────────────────
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Scraper header contract (rag.md §5) ───────────────────────────────────────
// Prepend machine-readable headers to every scraped document so ingest can
// reliably extract source_url and page_title without regex on body text.
function buildDocumentWithHeaders(url: string, title: string, markdown: string): string {
  const dateLine = `Date Scraped: ${new Date().toISOString()}`;
  return `Source URL: ${url}\nPage Title: ${title}\n${dateLine}\n\n${markdown}`;
}

// ── Chunker (rag.md §6: 400 tokens, 80 overlap, min 40 tokens) ───────────────
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
      const chunkText = currentChunk.join("\n");
      // Drop chunks shorter than minTokens (rag.md §6)
      if (currentChunk.join(" ").split(/\s+/).length >= minTokens) {
        chunks.push(chunkText);
      }
      // Overlap: carry last ~overlap tokens into next chunk
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

  if (currentChunk.length > 0) {
    const final = currentChunk.join("\n");
    if (currentChunk.join(" ").split(/\s+/).length >= minTokens) {
      chunks.push(final);
    }
  }
  return chunks;
}

// ── Embedding (Gemini text-embedding-004 → 768-d) ────────────────────────────
async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text }] } }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.embedding?.values ?? null;
  } catch { return null; }
}

async function generateEmbeddingsBatch(texts: string[], apiKey: string, batchSize = 5): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    results.push(...await Promise.all(batch.map(t => generateEmbedding(t, apiKey))));
    if (i + batchSize < texts.length) await new Promise(r => setTimeout(r, 200));
  }
  return results;
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let urlsToScrape = BIS_URLS;
    try {
      const body = await req.json();
      if (body?.urls && Array.isArray(body.urls) && body.urls.length > 0) urlsToScrape = body.urls;
    } catch { /* use defaults */ }

    const results: { url: string; status: string; chunks?: number; error?: string }[] = [];
    let totalChunks = 0;
    const dateScrapped = new Date().toISOString();

    for (const url of urlsToScrape) {
      try {
        console.log(`Scraping: ${url}`);

        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 3000 }),
        });

        const scrapeData = await scrapeRes.json();
        if (!scrapeRes.ok || !scrapeData.success) {
          results.push({ url, status: "failed", error: scrapeData.error || `HTTP ${scrapeRes.status}` });
          continue;
        }

        const rawMarkdown = scrapeData.data?.markdown || scrapeData.markdown || "";
        // Use metadata title from Firecrawl; never extract from body text (rag.md §5)
        const title = scrapeData.data?.metadata?.title || scrapeData.metadata?.title || url;

        if (!rawMarkdown || rawMarkdown.length < 50) {
          results.push({ url, status: "skipped", error: "Content too short" });
          continue;
        }

        // Prepend scraper header contract (rag.md §5)
        const documentText = buildDocumentWithHeaders(url, title, rawMarkdown);
        const contentType = getContentType(url);
        const chunks = chunkText(documentText);

        if (chunks.length === 0) {
          results.push({ url, status: "skipped", error: "No valid chunks after filtering" });
          continue;
        }

        // Generate embeddings
        let embeddings: (number[] | null)[] = chunks.map(() => null);
        if (GEMINI_API_KEY) {
          try {
            embeddings = await generateEmbeddingsBatch(chunks, GEMINI_API_KEY);
          } catch (e) { console.error(`Embedding error for ${url}:`, e); }
        }

        // Build rows with content_hash for deduplication (rag.md §6, §7)
        const rows = await Promise.all(chunks.map(async (chunk, index) => ({
          url,
          title,
          content_type: contentType,
          content: chunk,
          chunk_index: index,
          content_hash: await sha256(chunk),
          date_scraped: dateScrapped,
          embedding: embeddings[index] ?? null,
        })));

        // Upsert by content_hash — deduplicates on re-crawl (rag.md §7)
        // First delete stale chunks for this URL that are no longer present
        await supabase.from("bis_knowledge_chunks").delete().eq("url", url);

        const { error: insertError } = await supabase
          .from("bis_knowledge_chunks")
          .upsert(rows, { onConflict: "content_hash", ignoreDuplicates: true });

        if (insertError) {
          results.push({ url, status: "failed", error: insertError.message });
          continue;
        }

        totalChunks += chunks.length;
        results.push({ url, status: "success", chunks: chunks.length });
        console.log(`✓ ${url} → ${chunks.length} chunks`);
      } catch (err) {
        results.push({ url, status: "failed", error: err instanceof Error ? err.message : "Unknown" });
      }

      await new Promise(r => setTimeout(r, 1000));
    }

    return new Response(JSON.stringify({ success: true, total_chunks: totalChunks, pages_processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("crawl-bis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
