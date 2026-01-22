
-- Migration: Add Shared Memory and Update Agent Sessions
-- Created: 2026-01-23

-- ============================================================================
-- TABLE: agent_memories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  content text NOT NULL,
  type text CHECK (type IN ('short_term', 'long_term', 'fact')) DEFAULT 'fact',
  shared boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS agent_memories_user_id_idx ON public.agent_memories(user_id);
CREATE INDEX IF NOT EXISTS agent_memories_agent_id_idx ON public.agent_memories(agent_id);
CREATE INDEX IF NOT EXISTS agent_memories_shared_idx ON public.agent_memories(shared);

-- RLS
ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories"
  ON public.agent_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories"
  ON public.agent_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories"
  ON public.agent_memories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories"
  ON public.agent_memories FOR DELETE
  USING (auth.uid() = user_id);


-- Update agent_sessions to allow more agent types
ALTER TABLE public.agent_sessions DROP CONSTRAINT IF EXISTS agent_sessions_agent_type_check;
-- We can either add a new constraint or leave it open. Let's leave it open but maybe add a check if needed later.
-- For now, just dropping the strict check is safest to allow dynamic agents.
-- If we want to enforce, we can add:
-- ALTER TABLE public.agent_sessions ADD CONSTRAINT agent_sessions_agent_type_check CHECK (agent_type IN ('qa', 'image-analysis', 'orchestrated', 'odonto-gpt', 'odonto-research'));

-- Add title to agent_sessions
ALTER TABLE public.agent_sessions ADD COLUMN IF NOT EXISTS title text;
