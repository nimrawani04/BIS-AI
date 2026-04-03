-- ============================================================
-- 1. FTS search
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_bis_chunks(
  search_query  text,
  match_count   int  DEFAULT 10,
  filter_type   text DEFAULT NULL
)
RETURNS TABLE (id bigint, url text, title text, content_type text, content text, chunk_index int, rank float)
LANGUAGE plpgsql STABLE SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.url, c.title, c.content_type, c.content, c.chunk_index,
    ts_rank(to_tsvector('english', c.content), websearch_to_tsquery('english', search_query))::float AS rank
  FROM public.bis_knowledge_chunks c
  WHERE to_tsvector('english', c.content) @@ websearch_to_tsquery('english', search_query)
    AND (filter_type IS NULL OR c.content_type = filter_type)
  ORDER BY rank DESC LIMIT match_count;
END;
$$;

-- ============================================================
-- 2. Semantic search
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_bis_chunks_semantic(
  query_embedding extensions.vector(768),
  match_count     int   DEFAULT 10,
  filter_type     text  DEFAULT NULL,
  min_similarity  float DEFAULT 0.3
)
RETURNS TABLE (id bigint, url text, title text, content_type text, content text, chunk_index int, similarity float)
LANGUAGE plpgsql STABLE SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.url, c.title, c.content_type, c.content, c.chunk_index,
    (1 - (c.embedding <=> query_embedding))::float AS similarity
  FROM public.bis_knowledge_chunks c
  WHERE c.embedding IS NOT NULL
    AND (filter_type IS NULL OR c.content_type = filter_type)
    AND (1 - (c.embedding <=> query_embedding)) >= min_similarity
  ORDER BY c.embedding <=> query_embedding LIMIT match_count;
END;
$$;

-- ============================================================
-- 3. Hybrid search with RRF
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_bis_chunks_hybrid(
  search_query    text,
  query_embedding extensions.vector(768),
  match_count     int  DEFAULT 10,
  filter_type     text DEFAULT NULL,
  rrf_k           int  DEFAULT 60
)
RETURNS TABLE (id bigint, url text, title text, content_type text, content text, chunk_index int, fts_rank float, semantic_rank float, rrf_score float)
LANGUAGE plpgsql STABLE SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  WITH fts AS (
    SELECT c.id,
      ts_rank(to_tsvector('english', c.content), websearch_to_tsquery('english', search_query)) AS score,
      ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('english', c.content), websearch_to_tsquery('english', search_query)) DESC) AS pos
    FROM public.bis_knowledge_chunks c
    WHERE to_tsvector('english', c.content) @@ websearch_to_tsquery('english', search_query)
      AND (filter_type IS NULL OR c.content_type = filter_type)
    ORDER BY score DESC LIMIT match_count * 2
  ),
  sem AS (
    SELECT c.id,
      (1 - (c.embedding <=> query_embedding))::float AS score,
      ROW_NUMBER() OVER (ORDER BY c.embedding <=> query_embedding) AS pos
    FROM public.bis_knowledge_chunks c
    WHERE c.embedding IS NOT NULL AND (filter_type IS NULL OR c.content_type = filter_type)
    ORDER BY c.embedding <=> query_embedding LIMIT match_count * 2
  ),
  combined AS (
    SELECT COALESCE(fts.id, sem.id) AS id,
      COALESCE(fts.score, 0)::float AS fts_rank,
      COALESCE(sem.score, 0)::float AS semantic_rank,
      COALESCE(1.0 / (rrf_k + fts.pos), 0.0) + COALESCE(1.0 / (rrf_k + sem.pos), 0.0) AS rrf_score
    FROM fts FULL OUTER JOIN sem ON fts.id = sem.id
  )
  SELECT c2.id, c2.url, c2.title, c2.content_type, c2.content, c2.chunk_index,
    comb.fts_rank, comb.semantic_rank, comb.rrf_score
  FROM combined comb JOIN public.bis_knowledge_chunks c2 ON c2.id = comb.id
  ORDER BY comb.rrf_score DESC LIMIT match_count;
END;
$$;

-- ============================================================
-- 4. Stats helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_bis_chunks_stats()
RETURNS TABLE (total_chunks bigint, chunks_with_embeddings bigint, chunks_without_embeddings bigint, content_type_breakdown jsonb)
LANGUAGE sql STABLE SET search_path = public, extensions
AS $$
  SELECT
    COUNT(*)::bigint,
    COUNT(bkc.embedding)::bigint,
    (COUNT(*) - COUNT(bkc.embedding))::bigint,
    (SELECT jsonb_object_agg(ct, cnt) FROM (SELECT content_type AS ct, COUNT(*) AS cnt FROM public.bis_knowledge_chunks GROUP BY content_type) sub)
  FROM public.bis_knowledge_chunks bkc;
$$;
