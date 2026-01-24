-- Migration: Add Full-Text Search (FTS) for Hybrid Memory Search
-- Enables keyword search alongside semantic (vector) search for better RAG results

-- =========================================
-- 1. ADD TSVECTOR COLUMN FOR FTS
-- =========================================

-- Add search_vector column as a generated column (auto-updates on content change)
ALTER TABLE agent_memories
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('portuguese', coalesce(content, '') || ' ' || coalesce(topic, ''))
) STORED;

-- =========================================
-- 2. CREATE GIN INDEX FOR FAST FTS QUERIES
-- =========================================

CREATE INDEX IF NOT EXISTS agent_memories_fts_idx
ON agent_memories USING gin(search_vector);

-- =========================================
-- 3. KEYWORD SEARCH FUNCTION
-- =========================================

CREATE OR REPLACE FUNCTION keyword_search_memories(
  p_user_id uuid,
  p_query text,
  p_memory_types text[] DEFAULT ARRAY['long_term', 'fact'],
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content text,
  type text,
  topic text,
  metadata jsonb,
  created_at timestamptz,
  rank float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    m.id,
    m.content,
    m.type,
    m.topic,
    m.metadata,
    m.created_at,
    ts_rank(m.search_vector, plainto_tsquery('portuguese', p_query)) AS rank
  FROM agent_memories m
  WHERE m.user_id = p_user_id
    AND m.type = ANY(p_memory_types)
    AND m.search_vector @@ plainto_tsquery('portuguese', p_query)
    AND (m.expires_at IS NULL OR m.expires_at > now())
  ORDER BY rank DESC
  LIMIT p_limit;
$$;

-- =========================================
-- 4. HYBRID SEARCH FUNCTION (SEMANTIC + KEYWORD)
-- =========================================

CREATE OR REPLACE FUNCTION hybrid_search_memories(
  p_user_id uuid,
  p_query_embedding vector(1536),
  p_query_text text,
  p_match_threshold float DEFAULT 0.7,
  p_match_count int DEFAULT 10,
  p_memory_types text[] DEFAULT ARRAY['long_term', 'fact'],
  p_semantic_weight float DEFAULT 0.7,
  p_keyword_weight float DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  content text,
  type text,
  topic text,
  metadata jsonb,
  created_at timestamptz,
  semantic_score float,
  keyword_score float,
  combined_score float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH semantic_results AS (
    SELECT
      m.id,
      m.content,
      m.type,
      m.topic,
      m.metadata,
      m.created_at,
      1 - (m.embedding <=> p_query_embedding) AS semantic_score
    FROM agent_memories m
    WHERE m.user_id = p_user_id
      AND m.type = ANY(p_memory_types)
      AND m.embedding IS NOT NULL
      AND 1 - (m.embedding <=> p_query_embedding) > p_match_threshold
      AND (m.expires_at IS NULL OR m.expires_at > now())
  ),
  keyword_results AS (
    SELECT
      m.id,
      m.content,
      m.type,
      m.topic,
      m.metadata,
      m.created_at,
      ts_rank(m.search_vector, plainto_tsquery('portuguese', p_query_text)) AS keyword_score
    FROM agent_memories m
    WHERE m.user_id = p_user_id
      AND m.type = ANY(p_memory_types)
      AND m.search_vector @@ plainto_tsquery('portuguese', p_query_text)
      AND (m.expires_at IS NULL OR m.expires_at > now())
  ),
  combined AS (
    SELECT
      COALESCE(s.id, k.id) AS id,
      COALESCE(s.content, k.content) AS content,
      COALESCE(s.type, k.type) AS type,
      COALESCE(s.topic, k.topic) AS topic,
      COALESCE(s.metadata, k.metadata) AS metadata,
      COALESCE(s.created_at, k.created_at) AS created_at,
      COALESCE(s.semantic_score, 0) AS semantic_score,
      COALESCE(k.keyword_score, 0) AS keyword_score,
      (COALESCE(s.semantic_score, 0) * p_semantic_weight +
       COALESCE(k.keyword_score, 0) * p_keyword_weight) AS combined_score
    FROM semantic_results s
    FULL OUTER JOIN keyword_results k ON s.id = k.id
  )
  SELECT
    c.id,
    c.content,
    c.type,
    c.topic,
    c.metadata,
    c.created_at,
    c.semantic_score,
    c.keyword_score,
    c.combined_score
  FROM combined c
  ORDER BY c.combined_score DESC
  LIMIT p_match_count;
END;
$$;

-- =========================================
-- 5. GRANT PERMISSIONS
-- =========================================

GRANT EXECUTE ON FUNCTION keyword_search_memories TO authenticated;
GRANT EXECUTE ON FUNCTION keyword_search_memories TO service_role;
GRANT EXECUTE ON FUNCTION hybrid_search_memories TO authenticated;
GRANT EXECUTE ON FUNCTION hybrid_search_memories TO service_role;

-- =========================================
-- 6. ADD COMMENT FOR DOCUMENTATION
-- =========================================

COMMENT ON FUNCTION keyword_search_memories IS
'Full-text search for agent memories using Portuguese text search configuration.
Returns memories matching the query text ranked by relevance.';

COMMENT ON FUNCTION hybrid_search_memories IS
'Combines semantic (vector) and keyword (FTS) search for better RAG results.
Uses configurable weights for each search type (default: 70% semantic, 30% keyword).';
