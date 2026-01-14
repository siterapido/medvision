-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for Agent Sessions (Unified schema for api.py and Agno)
-- Agno uses specific columns for storage, api.py uses others.
-- We must support both or ensure Agno adapts.
-- Agno (PostgresDb) requires: session_id (text), session_data (jsonb), created_at, updated_at
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Used by api.py as 'id'
    session_id TEXT GENERATED ALWAYS AS (id::text) STORED, -- Computed for Agno compatibility if needed
    
    -- Fields required by api.py
    user_id UUID NOT NULL REFERENCES auth.users(id), -- Assuming Supabase Auth
    agent_type TEXT,
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    
    -- Fields required by Agno (PostgresDb)
    session_data JSONB DEFAULT '{}', 
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Agno lookups
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);

-- Table for Agent Messages (Expected by api.py get_session)
-- Note: Logic to populate this is currently MISSING in api.py
CREATE TABLE IF NOT EXISTS agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,
    agent_id TEXT,
    role TEXT, -- 'user', 'assistant', 'system'
    content TEXT,
    tool_calls JSONB,
    tool_results JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_session_id ON agent_messages(session_id);

-- Table for Knowledge Base (RAG) - Created by populate_knowledge.py usually, but good to have here
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    specialty TEXT,
    source_type TEXT NOT NULL, -- 'course', 'lesson'
    source_id UUID NOT NULL,
    metadata JSONB,
    embedding vector(1536), -- OpenAI Embedding size
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_specialty ON knowledge_base(specialty);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_fulltext ON knowledge_base USING gin(to_tsvector('portuguese', title || ' ' || COALESCE(content, '')));
