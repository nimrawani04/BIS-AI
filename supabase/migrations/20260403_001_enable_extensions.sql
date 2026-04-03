-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Enable pg_trgm for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Enable unaccent for better multilingual FTS
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
