-- Migration: Create Knowledge Documents Table with Hybrid Search
-- Created: 2026-01-28
-- Purpose: Enable RAG with pgvector embeddings + full-text search on odontology documents

-- ============================================================================
-- ENSURE EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- TABLE: knowledge_documents
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source_type text CHECK (source_type IN ('textbook','article','protocol','guideline','course_material')),
  source_name text,
  author text,
  specialty text,
  chapter text,
  content text NOT NULL,
  chunk_index int DEFAULT 0,
  total_chunks int DEFAULT 1,
  parent_document_id uuid REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  embedding vector(1536),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(content,''))
  ) STORED,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES: Optimized for hybrid search
-- ============================================================================

-- Vector index for semantic search (cosine distance)
CREATE INDEX IF NOT EXISTS knowledge_documents_embedding_idx
ON public.knowledge_documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Full-text search index
CREATE INDEX IF NOT EXISTS knowledge_documents_search_vector_idx
ON public.knowledge_documents USING gin(search_vector);

-- Metadata filters
CREATE INDEX IF NOT EXISTS knowledge_documents_specialty_idx
ON public.knowledge_documents(specialty);

CREATE INDEX IF NOT EXISTS knowledge_documents_source_type_idx
ON public.knowledge_documents(source_type);

CREATE INDEX IF NOT EXISTS knowledge_documents_parent_idx
ON public.knowledge_documents(parent_document_id);

CREATE INDEX IF NOT EXISTS knowledge_documents_created_at_idx
ON public.knowledge_documents(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all documents
CREATE POLICY "read_all_documents"
  ON public.knowledge_documents FOR SELECT
  TO authenticated USING (true);

-- Service role has full access
CREATE POLICY "service_role_all_documents"
  ON public.knowledge_documents FOR ALL
  TO service_role USING (true);

-- ============================================================================
-- FUNCTION: hybrid_search_knowledge
-- Search documents combining semantic (vector) + keyword (FTS) scoring
-- ============================================================================
CREATE OR REPLACE FUNCTION hybrid_search_knowledge(
  p_query_embedding vector(1536),
  p_query_text text,
  p_match_threshold float DEFAULT 0.5,
  p_match_count int DEFAULT 5,
  p_specialties text[] DEFAULT NULL,
  p_semantic_weight float DEFAULT 0.7,
  p_keyword_weight float DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  source text,
  specialty text,
  semantic_score float,
  keyword_score float,
  combined_score float,
  source_type text,
  chunk_index int,
  total_chunks int
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH semantic_results AS (
    SELECT
      d.id,
      d.title,
      d.content,
      d.source_name AS source,
      d.specialty,
      d.source_type,
      d.chunk_index,
      d.total_chunks,
      1 - (d.embedding <=> p_query_embedding) AS semantic_score
    FROM public.knowledge_documents d
    WHERE d.embedding IS NOT NULL
      AND 1 - (d.embedding <=> p_query_embedding) > p_match_threshold
      AND (p_specialties IS NULL OR d.specialty = ANY(p_specialties))
  ),
  keyword_results AS (
    SELECT
      d.id,
      d.title,
      d.content,
      d.source_name AS source,
      d.specialty,
      d.source_type,
      d.chunk_index,
      d.total_chunks,
      ts_rank(d.search_vector, plainto_tsquery('portuguese', p_query_text)) AS keyword_score
    FROM public.knowledge_documents d
    WHERE d.search_vector @@ plainto_tsquery('portuguese', p_query_text)
      AND (p_specialties IS NULL OR d.specialty = ANY(p_specialties))
  ),
  combined AS (
    SELECT
      COALESCE(s.id, k.id) AS id,
      COALESCE(s.title, k.title) AS title,
      COALESCE(s.content, k.content) AS content,
      COALESCE(s.source, k.source) AS source,
      COALESCE(s.specialty, k.specialty) AS specialty,
      COALESCE(s.source_type, k.source_type) AS source_type,
      COALESCE(s.chunk_index, k.chunk_index) AS chunk_index,
      COALESCE(s.total_chunks, k.total_chunks) AS total_chunks,
      COALESCE(s.semantic_score, 0) AS semantic_score,
      COALESCE(k.keyword_score, 0) AS keyword_score,
      (COALESCE(s.semantic_score, 0) * p_semantic_weight +
       COALESCE(k.keyword_score, 0) * p_keyword_weight) AS combined_score
    FROM semantic_results s
    FULL OUTER JOIN keyword_results k ON s.id = k.id
  )
  SELECT * FROM combined
  ORDER BY combined_score DESC
  LIMIT p_match_count;
END;
$$;

-- ============================================================================
-- FUNCTION: hybrid_search_memories
-- Search user memories (agent_memories) with hybrid scoring
-- ============================================================================
CREATE OR REPLACE FUNCTION hybrid_search_memories(
  p_user_id uuid,
  p_query_embedding vector(1536),
  p_query_text text,
  p_match_threshold float DEFAULT 0.5,
  p_match_count int DEFAULT 3,
  p_memory_types text[] DEFAULT ARRAY['long_term', 'fact']::text[],
  p_semantic_weight float DEFAULT 0.7,
  p_keyword_weight float DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  content text,
  topic text,
  type text,
  metadata jsonb,
  semantic_score float,
  keyword_score float,
  combined_score float,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH semantic_results AS (
    SELECT
      m.id,
      m.content,
      m.topic,
      m.type,
      m.metadata,
      m.created_at,
      1 - (m.embedding <=> p_query_embedding) AS semantic_score
    FROM public.agent_memories m
    WHERE m.user_id = p_user_id
      AND m.type = ANY(p_memory_types)
      AND (m.expires_at IS NULL OR m.expires_at > now())
      AND m.embedding IS NOT NULL
      AND 1 - (m.embedding <=> p_query_embedding) > p_match_threshold
  ),
  keyword_results AS (
    SELECT
      m.id,
      m.content,
      m.topic,
      m.type,
      m.metadata,
      m.created_at,
      ts_rank(to_tsvector('portuguese', m.content), plainto_tsquery('portuguese', p_query_text)) AS keyword_score
    FROM public.agent_memories m
    WHERE m.user_id = p_user_id
      AND m.type = ANY(p_memory_types)
      AND (m.expires_at IS NULL OR m.expires_at > now())
      AND to_tsvector('portuguese', m.content) @@ plainto_tsquery('portuguese', p_query_text)
  ),
  combined AS (
    SELECT
      COALESCE(s.id, k.id) AS id,
      COALESCE(s.content, k.content) AS content,
      COALESCE(s.topic, k.topic) AS topic,
      COALESCE(s.type, k.type) AS type,
      COALESCE(s.metadata, k.metadata) AS metadata,
      COALESCE(s.created_at, k.created_at) AS created_at,
      COALESCE(s.semantic_score, 0) AS semantic_score,
      COALESCE(k.keyword_score, 0) AS keyword_score,
      (COALESCE(s.semantic_score, 0) * p_semantic_weight +
       COALESCE(k.keyword_score, 0) * p_keyword_weight) AS combined_score
    FROM semantic_results s
    FULL OUTER JOIN keyword_results k ON s.id = k.id
  )
  SELECT * FROM combined
  ORDER BY combined_score DESC
  LIMIT p_match_count;
END;
$$;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
GRANT SELECT ON public.knowledge_documents TO authenticated;
GRANT ALL ON public.knowledge_documents TO service_role;
GRANT EXECUTE ON FUNCTION hybrid_search_knowledge TO authenticated;
GRANT EXECUTE ON FUNCTION hybrid_search_memories TO authenticated;
