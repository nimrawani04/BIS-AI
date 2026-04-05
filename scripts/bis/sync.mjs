/**
 * scripts/bis/sync.mjs
 * 
 * Push metadata.json to Supabase bis_knowledge_chunks table.
 * Deduplicates by content_hash.
 * 
 * Usage: node scripts/bis/sync.mjs
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data/bis");
const META_PATH = join(DATA_DIR, "metadata.json");

// Load .env
function loadEnv() {
  try {
    const raw = readFileSync(join(__dirname, "../../.env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}

function batched(items, size) {
  const result = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

async function main() {
  let docs;
  try {
    docs = JSON.parse(readFileSync(META_PATH, "utf8"));
  } catch {
    console.error(`❌  ${META_PATH} not found. Run ingest.mjs first.`);
    process.exit(1);
  }

  console.log(`\n📤  Syncing ${docs.length} chunks to Supabase`);

  // Deduplicate by content_hash
  const seen = new Set();
  const payload = [];
  for (const doc of docs) {
    if (seen.has(doc.content_hash)) continue;
    seen.add(doc.content_hash);
    payload.push({
      url: doc.source_url,
      title: doc.page_title,
      content_type: doc.content_type,
      content: doc.content,
      chunk_index: doc.chunk_index,
      content_hash: doc.content_hash,
      date_scraped: doc.date_scraped,
      embedding: doc.embedding ?? null,
    });
  }

  console.log(`  → ${payload.length} unique chunks (${docs.length - payload.length} duplicates skipped)`);

  const restUrl = `${SUPABASE_URL}/rest/v1/bis_knowledge_chunks`;
  const headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    // Partial unique index on content_hash can block PostgREST merge upsert inference; skip existing hashes instead.
    "Prefer": "resolution=ignore-duplicates,return=minimal",
  };

  const batches = batched(payload, 100);
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const res = await fetch(restUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌  Batch ${i + 1} failed: ${res.status} ${err}`);
      process.exit(1);
    }

    console.log(`  ✓ Batch ${i + 1}/${batches.length} (${batch.length} rows)`);
  }

  console.log(`\n✅  Synced ${payload.length} chunks to Supabase`);
}

main().catch(e => { console.error(e); process.exit(1); });
