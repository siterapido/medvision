-- Add title column to agent_sessions for easier querying
-- This addresses the issue where title was stored only in metadata,
-- making queries inefficient and error-prone

-- Add title column
ALTER TABLE public.agent_sessions
ADD COLUMN IF NOT EXISTS title text;

-- Create full-text search index for Portuguese
CREATE INDEX IF NOT EXISTS agent_sessions_title_idx
ON public.agent_sessions USING gin(to_tsvector('portuguese', coalesce(title, '')));

-- Migrate existing titles from metadata to title column
UPDATE public.agent_sessions
SET title = metadata->>'title'
WHERE title IS NULL AND metadata ? 'title';

-- Add default title for null/empty titles
UPDATE public.agent_sessions
SET title = 'Nova Conversa'
WHERE title IS NULL OR title = '';

-- Add comment to document the column
COMMENT ON COLUMN public.agent_sessions.title IS 'Chat conversation title - duplicated from metadata for query performance';
