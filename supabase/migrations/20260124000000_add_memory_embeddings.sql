-- Migration: Add Embeddings to Agent Memories
-- Created: 2026-01-24
-- Purpose: Enable vector search for semantic memory retrieval

-- ============================================================================
-- STEP 1: Ensure pgvector extension is enabled
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- STEP 2: Add new columns to agent_memories
-- ============================================================================

-- Embedding column for semantic search (1536 dimensions for OpenAI text-embedding-3-small)
ALTER TABLE public.agent_memories
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Expiration column for short-term memories
ALTER TABLE public.agent_memories
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Topic column for categorization
ALTER TABLE public.agent_memories
ADD COLUMN IF NOT EXISTS topic text;

-- Confidence score for extracted facts
ALTER TABLE public.agent_memories
ADD COLUMN IF NOT EXISTS confidence float DEFAULT 1.0;

-- Source session for traceability
ALTER TABLE public.agent_memories
ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.agent_sessions(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 3: Add type 'episodic' to allowed types
-- ============================================================================
ALTER TABLE public.agent_memories
DROP CONSTRAINT IF EXISTS agent_memories_type_check;

ALTER TABLE public.agent_memories
ADD CONSTRAINT agent_memories_type_check
CHECK (type IN ('short_term', 'long_term', 'fact', 'episodic'));

-- ============================================================================
-- STEP 4: Create indexes for efficient querying
-- ============================================================================

-- Vector index for semantic search
CREATE INDEX IF NOT EXISTS agent_memories_embedding_idx
ON public.agent_memories USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for type filtering
CREATE INDEX IF NOT EXISTS agent_memories_type_idx
ON public.agent_memories(type);

-- Index for topic filtering
CREATE INDEX IF NOT EXISTS agent_memories_topic_idx
ON public.agent_memories(topic);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS agent_memories_expires_at_idx
ON public.agent_memories(expires_at)
WHERE expires_at IS NOT NULL;

-- ============================================================================
-- STEP 5: Create semantic search function
-- ============================================================================
CREATE OR REPLACE FUNCTION search_memories(
  p_user_id uuid,
  p_query_embedding vector(1536),
  p_match_threshold float DEFAULT 0.7,
  p_match_count int DEFAULT 5,
  p_memory_types text[] DEFAULT ARRAY['long_term', 'fact']
)
RETURNS TABLE (
  id uuid,
  content text,
  type text,
  topic text,
  metadata jsonb,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.id,
    am.content,
    am.type,
    am.topic,
    am.metadata,
    1 - (am.embedding <=> p_query_embedding) as similarity,
    am.created_at
  FROM public.agent_memories am
  WHERE am.user_id = p_user_id
    AND am.type = ANY(p_memory_types)
    AND (am.expires_at IS NULL OR am.expires_at > now())
    AND am.embedding IS NOT NULL
    AND 1 - (am.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY am.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- ============================================================================
-- STEP 6: Create function to get recent memories (without embeddings)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_recent_memories(
  p_user_id uuid,
  p_memory_types text[] DEFAULT ARRAY['long_term', 'fact'],
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content text,
  type text,
  topic text,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.id,
    am.content,
    am.type,
    am.topic,
    am.metadata,
    am.created_at
  FROM public.agent_memories am
  WHERE am.user_id = p_user_id
    AND am.type = ANY(p_memory_types)
    AND (am.expires_at IS NULL OR am.expires_at > now())
  ORDER BY am.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- STEP 7: Create function to cleanup expired memories
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_memories()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM public.agent_memories
  WHERE expires_at IS NOT NULL AND expires_at < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- STEP 8: Create function to summarize session (for episodic memory)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_session_messages_for_summary(
  p_session_id uuid,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  role text,
  content text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.role,
    am.content,
    am.created_at
  FROM public.agent_messages am
  WHERE am.session_id = p_session_id
  ORDER BY am.created_at ASC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- STEP 9: Grant execute permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION search_memories TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_memories TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_memories TO service_role;
GRANT EXECUTE ON FUNCTION get_session_messages_for_summary TO authenticated;
