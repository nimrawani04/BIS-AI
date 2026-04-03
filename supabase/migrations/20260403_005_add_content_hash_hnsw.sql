-- Add content_hash for deduplication (rag.md §4, §6, §7)
ALTER TABLE public.bis_knowledge_chunks
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS date_scraped timestamptz;

-- Unique index on content_hash — upsert/dedupe key (rag.md §7)
CREATE UNIQUE INDEX IF NOT EXISTS bis_chunks_content_hash_idx
  ON public.bis_knowledge_chunks (content_hash)
  WHERE content_hash IS NOT NULL;

-- Drop IVFFlat (requires training data, fails on empty tables)
DROP INDEX IF EXISTS bis_chunks_embedding_idx;

-- HNSW index — works at any table size, better recall (rag.md §4)
CREATE INDEX IF NOT EXISTS bis_chunks_embedding_hnsw_idx
  ON public.bis_knowledge_chunks
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
