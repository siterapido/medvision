-- Migration: Fix agent_sessions status CHECK constraint
-- Created: 2026-01-27
-- Description: Add 'deleted' status to allow soft delete functionality

-- Drop the existing constraint
ALTER TABLE public.agent_sessions
DROP CONSTRAINT IF EXISTS agent_sessions_status_check;

-- Add constraint with 'deleted' status included
ALTER TABLE public.agent_sessions
ADD CONSTRAINT agent_sessions_status_check
CHECK (status IN ('active', 'completed', 'error', 'deleted'));

-- Add title column if it doesn't exist (needed for session titles)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'agent_sessions'
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.agent_sessions
    ADD COLUMN title text;
  END IF;
END $$;

-- Update the comment to reflect the new status
COMMENT ON COLUMN public.agent_sessions.status IS 'Session status: active, completed, error, or deleted (soft delete)';
