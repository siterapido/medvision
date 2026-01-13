-- Migration: Agent Sessions and Messages for Agno Service
-- Created: 2025-01-13
-- Description: Adds agent_sessions and agent_messages tables for Agno AI agent session persistence

-- ============================================================================
-- TABLE: agent_sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type text NOT NULL CHECK (agent_type IN ('qa', 'image-analysis', 'orchestrated')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'error')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS agent_sessions_user_id_idx ON public.agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS agent_sessions_agent_type_idx ON public.agent_sessions(agent_type);
CREATE INDEX IF NOT EXISTS agent_sessions_status_idx ON public.agent_sessions(status);
CREATE INDEX IF NOT EXISTS agent_sessions_created_at_idx ON public.agent_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own sessions
CREATE POLICY "Users can view own agent sessions"
  ON public.agent_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent sessions"
  ON public.agent_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent sessions"
  ON public.agent_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent sessions"
  ON public.agent_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policy: Admins can access all sessions
CREATE POLICY "Admins can manage all agent sessions"
  ON public.agent_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- TABLE: agent_messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.agent_sessions(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text,
  tool_calls jsonb,
  tool_results jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS agent_messages_session_id_idx ON public.agent_messages(session_id);
CREATE INDEX IF NOT EXISTS agent_messages_agent_id_idx ON public.agent_messages(agent_id);
CREATE INDEX IF NOT EXISTS agent_messages_role_idx ON public.agent_messages(role);
CREATE INDEX IF NOT EXISTS agent_messages_session_created_idx ON public.agent_messages(session_id, created_at);

-- Enable RLS
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- Policies: Users can access messages from their own sessions
CREATE POLICY "Users can view own agent messages"
  ON public.agent_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_sessions
      WHERE agent_sessions.id = agent_messages.session_id
      AND agent_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own agent messages"
  ON public.agent_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agent_sessions
      WHERE agent_sessions.id = agent_messages.session_id
      AND agent_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own agent messages"
  ON public.agent_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_sessions
      WHERE agent_sessions.id = agent_messages.session_id
      AND agent_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agent_sessions
      WHERE agent_sessions.id = agent_messages.session_id
      AND agent_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own agent messages"
  ON public.agent_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_sessions
      WHERE agent_sessions.id = agent_messages.session_id
      AND agent_sessions.user_id = auth.uid()
    )
  );

-- Admin policy: Admins can access all messages
CREATE POLICY "Admins can manage all agent messages"
  ON public.agent_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- FUNCTION: Handle updated_at for agent_sessions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_agent_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for agent_sessions updated_at
DROP TRIGGER IF EXISTS on_agent_sessions_updated ON public.agent_sessions;

CREATE TRIGGER on_agent_sessions_updated
  BEFORE UPDATE ON public.agent_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_agent_sessions_updated_at();

-- ============================================================================
-- FUNCTION: Update agent_sessions status when agent_errors occur
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_agent_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update session updated_at timestamp when new message is added
  UPDATE public.agent_sessions
  SET updated_at = NEW.created_at
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session on new message
DROP TRIGGER IF EXISTS on_agent_message_insert ON public.agent_messages;

CREATE TRIGGER on_agent_message_insert
  AFTER INSERT ON public.agent_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_session_on_message();

-- ============================================================================
-- COMMENT: Table documentation
-- ============================================================================
COMMENT ON TABLE public.agent_sessions IS 'Stores AI agent session data for Agno service conversation context';
COMMENT ON TABLE public.agent_messages IS 'Stores individual messages within agent sessions for full conversation history';

COMMENT ON COLUMN public.agent_sessions.agent_type IS 'Type of agent: qa (Q&A), image-analysis, or orchestrated (multi-agent)';
COMMENT ON COLUMN public.agent_sessions.status IS 'Session status: active, completed, or error';
COMMENT ON COLUMN public.agent_messages.tool_calls IS 'JSON array of tool/function calls made by the agent';
COMMENT ON COLUMN public.agent_messages.tool_results IS 'JSON object containing results from tool executions';
