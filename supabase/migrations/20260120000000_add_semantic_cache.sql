-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create the semantic cache table
create table if not exists semantic_cache (
  id uuid primary key default gen_random_uuid(),
  query_text text not null,
  query_embedding vector(384), -- Dimension 384 for all-MiniLM-L6-v2 (used by default/fallback) or change to 1536 for OpenAI
  response_text text not null,
  agent_id text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '24 hours') -- Default TTL
);

-- Index for faster vector similarity search
-- lists = 100 is a heuristic, adjust based on table size
create index on semantic_cache using ivfflat (query_embedding vector_cosine_ops)
with (lists = 100);

-- Function to search for similar cached responses
create or replace function match_cached_responses (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  response_text text,
  agent_id text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    semantic_cache.id,
    semantic_cache.response_text,
    semantic_cache.agent_id,
    1 - (semantic_cache.query_embedding <=> query_embedding) as similarity
  from semantic_cache
  where 1 - (semantic_cache.query_embedding <=> query_embedding) > match_threshold
  and expires_at > now() -- Only valid entries
  order by semantic_cache.query_embedding <=> query_embedding
  limit match_count;
end;
$$;
