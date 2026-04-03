-- Core RAG knowledge store
CREATE TABLE IF NOT EXISTS public.bis_knowledge_chunks (
  id          bigserial PRIMARY KEY,
  url         text,
  title       text NOT NULL,
  content_type text NOT NULL DEFAULT 'general'
                CHECK (content_type IN ('webpage','pdf','table','certification','hallmarking','standards','consumer','laboratory','management','about','general')),
  content     text NOT NULL,
  chunk_index integer NOT NULL DEFAULT 0,
  embedding   extensions.vector(768),
  -- auto-computed word count
  word_count  integer GENERATED ALWAYS AS (array_length(string_to_array(trim(content), ' '), 1)) STORED,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bis_knowledge_chunks_updated_at
  BEFORE UPDATE ON public.bis_knowledge_chunks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS bis_chunks_fts_idx        ON public.bis_knowledge_chunks USING gin (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS bis_chunks_title_fts_idx  ON public.bis_knowledge_chunks USING gin (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS bis_chunks_embedding_idx  ON public.bis_knowledge_chunks USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS bis_chunks_url_idx        ON public.bis_knowledge_chunks (url);
CREATE INDEX IF NOT EXISTS bis_chunks_content_type_idx ON public.bis_knowledge_chunks (content_type);

-- RLS
ALTER TABLE public.bis_knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_bis_chunks"
  ON public.bis_knowledge_chunks FOR SELECT USING (true);

CREATE POLICY "service_role_write_bis_chunks"
  ON public.bis_knowledge_chunks FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
