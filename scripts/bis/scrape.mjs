/**
 * scripts/bis/scrape.mjs
 * 
 * Scrape BIS pages and save as .txt files in data/bis/
 * No embedding, no Supabase — just raw text extraction.
 * 
 * Usage: node scripts/bis/scrape.mjs
 */

import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data/bis");

const BASE = "https://www.bis.gov.in";
const BIS_URLS = [
  // About BIS
  `${BASE}/the-bureau/about-bis/?lang=en`,
  `${BASE}/the-bureau/organization-2/?lang=en`,
  `${BASE}/the-bureau/origin-of-bis/?lang=en`,
  `${BASE}/the-bureau/director-general/?lang=en`,
  `${BASE}/the-bureau/annual-report/?lang=en`,
  `${BASE}/the-bureau/bis-act-rules-and-regulations/?lang=en`,

  // Directory
  `${BASE}/directory/head-quarter/?lang=en`,
  `${BASE}/directory/regional-offices/?lang=en`,
  `${BASE}/directory/branch-office/?lang=en`,
  `${BASE}/directory/laboratory/?lang=en`,

  // Product Certification
  `${BASE}/product-certification/product-certification-overview/?lang=en`,
  `${BASE}/product-certification/products-under-compulsory-certification/?lang=en`,
  `${BASE}/product-certification/product-certification-process/?lang=en`,
  `${BASE}/product-certification/product-specific-information-2/?lang=en`,
  `${BASE}/product-certification/product-certification-fee/?lang=en`,
  `${BASE}/product-certification/product-certificatin-apply-online/?lang=en`,
  `${BASE}/product-certification/product-certification-faq/?lang=en`,

  // Systems Certification
  `${BASE}/system-certification-overview/?lang=en`,
  `${BASE}/system-certification-overview/systems-certification/?lang=en`,
  `${BASE}/system-certification-overview/certification-process/systems-under-certification/?lang=en`,
  `${BASE}/system-certification-overview/certification-process/fee-structure-for-mscs/?lang=en`,
  `${BASE}/system-certification-overview/system-certification-faq/?lang=en`,

  // FMCS
  `${BASE}/fmcs/fmcs-overview/?lang=en`,
  `${BASE}/fmcs/certification-process/products-under-fmcs/?lang=en`,
  `${BASE}/fmcs/certification-process/how-to-apply/?lang=en`,
  `${BASE}/fmcs/fmcs-fee/?lang=en`,
  `${BASE}/fmcs/fmcs-faqs/?lang=en`,

  // CRS
  "https://www.crsbis.in/BIS/about-crs.do",
  "https://www.crsbis.in/BIS/registration-page.do",
  "https://www.crsbis.in/BIS/faq-bis.do",

  // Scheme-X
  `${BASE}/products-under-compulsory-certification-scheme-x/`,
  `${BASE}/certification-process-4/`,
  `${BASE}/scheme-x-certification/faq-scheme-x-certification/`,

  // Laboratory Services
  `${BASE}/laboratorys/laboratory-services-overview/?lang=en`,
  `${BASE}/laboratorys/testing-facility-and-testing-charges/?lang=en`,
  `${BASE}/laboratorys/list-of-bis-recognized-lab/?lang=en`,
  `${BASE}/laboratorys/laboratory-services-overview/laboratory-faq/?lang=en`,

  // Hallmarking
  `${BASE}/hallmarking-overview/?lang=en`,
  `${BASE}/hallmarking-overview/mandatory-hallmarking-order/?lang=en`,
  `${BASE}/hallmarking-overview/jewellers-registration-scheme/?lang=en`,
  `${BASE}/hallmarking-overview/consumer-protection/?lang=en`,
  `${BASE}/hallmarking-overview/hallmarking-faqs/hallmarking-faq/?lang=en`,
  `${BASE}/hallmarking-overview/hallmarking-faqs/mandatory/?lang=en`,

  // Training
  `${BASE}/training-2/overview-of-nits/?lang=en`,
  `${BASE}/training-2/training-programmes/?lang=en`,
  `${BASE}/training-2/training-fee/?lang=en`,

  // Consumer Engagement
  `${BASE}/consumer-overview/?lang=en`,
  `${BASE}/consumer-overview/consumer-overviews/consumer-protection/?lang=en`,
  `${BASE}/consumer-overview/consumer-overviews/online-complaint-registration/?lang=en`,
  `${BASE}/enforcement-activities/?lang=en`,
  `${BASE}/consumer-overview/consumer-overviews/for-consumers-faq/?lang=en`,

  // News & Updates
  `${BASE}/whats-new/?lang=en`,
  `${BASE}/upcoming-qcos-notified-and-due-for-implementation/`,
  `${BASE}/public-alert-for-product-recall-on-account-of-non-conformity-of-product/`,
  `${BASE}/full-faq/?lang=en`,
];

function htmlToText(html) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "");

  text = text.replace(/<\/?(p|div|li|h[1-6]|br|tr|td|th)[^>]*>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/&[a-z]+;/gi, " ");

  return text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join("\n");
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : "";
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });
  console.log(`\n🔍  Scraping ${BIS_URLS.length} BIS URLs → ${DATA_DIR}\n`);

  let saved = 0;
  let skipped = 0;

  for (const url of BIS_URLS) {
    try {
      console.log(`→ ${url}`);
      const res = await fetch(url, {
        headers: { "User-Agent": "BIS-RAG-Bot/1.0" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        console.warn(`  ✗ HTTP ${res.status}`);
        skipped++;
        continue;
      }

      const html = await res.text();
      const title = extractTitle(html) || url;
      const bodyText = htmlToText(html);

      if (bodyText.length < 100) {
        console.warn(`  ✗ Content too short`);
        skipped++;
        continue;
      }

      const now = new Date().toISOString();
      const document = `Source URL: ${url}\nPage Title: ${title}\nDate Scraped: ${now}\n\n${bodyText}`;
      const safeName = url.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 120) + ".txt";
      writeFileSync(join(DATA_DIR, safeName), document, "utf8");

      console.log(`  ✓ Saved ${safeName}`);
      saved++;
    } catch (err) {
      console.warn(`  ✗ ${err.message}`);
      skipped++;
    }

    await sleep(1000);
  }

  console.log(`\n✅  Done — ${saved} pages saved, ${skipped} skipped`);
}

main().catch(e => { console.error(e); process.exit(1); });
