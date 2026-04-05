"""
scripts/bis/ingest.py

Chunk + embed all .txt files in data/bis/ → save metadata.json
Uses local sentence-transformers (BAAI/bge-base-en-v1.5, 768-d).

Usage: python scripts/bis/ingest.py

Requirements:
    pip install sentence-transformers numpy
"""

import json
import hashlib
import re
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "bis"
META_PATH = DATA_DIR / "metadata.json"
MODEL_NAME = "BAAI/bge-base-en-v1.5"  # 768-d, same as Jina/Gemini


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def parse_headers(content: str) -> dict:
    """Extract Source URL, Page Title, Date Scraped from scraped .txt files."""
    lines = content.split("\n")
    source_url = ""
    page_title = ""
    date_scraped = ""
    body_start = 0

    for i, line in enumerate(lines[:6]):
        if line.startswith("Source URL:"):
            source_url = line.removeprefix("Source URL:").strip()
            body_start = i + 1
        elif line.startswith("Page Title:"):
            page_title = line.removeprefix("Page Title:").strip()
            body_start = i + 1
        elif line.startswith("Date Scraped:"):
            date_scraped = line.removeprefix("Date Scraped:").strip()
            body_start = i + 1
        elif line.strip() == "" and body_start > 0:
            body_start = i + 1
            break

    return {
        "source_url": source_url,
        "page_title": page_title,
        "date_scraped": date_scraped,
        "body": "\n".join(lines[body_start:]),
    }


def chunk_text(text: str, max_tokens: int = 400, overlap: int = 80, min_tokens: int = 40) -> list[str]:
    """Chunk text with overlap, preserving headings."""
    lines = text.split("\n")
    chunks = []
    current = []
    current_len = 0
    last_heading = ""

    for line in lines:
        t = line.strip()
        if not t:
            continue
        if re.match(r"^#{1,6}\s", t) or (t.startswith("**") and t.endswith("**")):
            last_heading = t
        line_tokens = len(t.split())

        if current_len + line_tokens > max_tokens and current:
            joined = "\n".join(current)
            if len(joined.split()) >= min_tokens:
                chunks.append(joined)

            # Overlap carry-over
            overlap_lines = []
            overlap_len = 0
            for i in range(len(current) - 1, -1, -1):
                if overlap_len >= overlap:
                    break
                overlap_lines.insert(0, current[i])
                overlap_len += len(current[i].split())

            current = [last_heading, *overlap_lines] if last_heading else overlap_lines
            current_len = sum(len(l.split()) for l in current)

        current.append(t)
        current_len += line_tokens

    if current:
        joined = "\n".join(current)
        if len(joined.split()) >= min_tokens:
            chunks.append(joined)

    return chunks


def get_content_type(url: str) -> str:
    """Classify content type based on URL patterns."""
    if re.search(r"hallmark|jeweller|gold-refinery|gold-monetization", url):
        return "hallmarking"
    if re.search(r"product-certification|fmcs|scheme-x|compulsory-certification|system-certification|crsbis\.in", url):
        return "certification"
    if re.search(r"standard|wc-drafts|SFM\.pdf|manak-pravardhak", url):
        return "standards"
    if re.search(r"consumer|complaint|enforcement|citizen-charter|national-quality-award", url):
        return "consumer"
    if re.search(r"laborator|testing|utrf", url):
        return "laboratory"
    if re.search(r"about-bis|organization|origin|president|director|annual-report|bis-act|directory", url):
        return "about"
    return "general"


def main():
    txt_files = sorted(DATA_DIR.glob("*.txt"))
    if not txt_files:
        print(f"❌  No .txt files found in {DATA_DIR}. Run scrape.mjs first.")
        return

    print(f"\n📦  Ingesting {len(txt_files)} files from {DATA_DIR}")
    print(f"🧠  Loading model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)

    records = []
    texts_for_embedding = []

    for txt_file in txt_files:
        content = txt_file.read_text(encoding="utf-8")
        headers = parse_headers(content)
        chunks = chunk_text(headers["body"])

        for i, chunk in enumerate(chunks):
            content_hash = sha256(chunk)
            chunk_id = sha256(f"{headers['source_url']}::{i}::{chunk}")

            records.append({
                "id": chunk_id,
                "source_url": headers["source_url"],
                "page_title": headers["page_title"],
                "date_scraped": headers["date_scraped"],
                "chunk_index": i,
                "content": chunk,
                "content_hash": content_hash,
                "content_type": get_content_type(headers["source_url"]),
            })
            texts_for_embedding.append(chunk)

        print(f"  ✓ {txt_file.name} → {len(chunks)} chunks")

    print(f"\n🔢  Total chunks: {len(records)}")
    print(f"🧠  Generating embeddings...")

    embeddings = model.encode(
        texts_for_embedding,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=True,
    )

    # Convert to list for JSON serialization
    for i, record in enumerate(records):
        record["embedding"] = embeddings[i].tolist()

    print(f"  ✓ Done")

    META_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n✅  Saved {META_PATH}")


if __name__ == "__main__":
    main()
