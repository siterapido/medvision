-- Migration: Chat Threads and History
-- Created: 2025-12-08
-- Description: Adds chat_threads table and updates chat_messages to support conversation history

-- ============================================================================
-- TABLE: chat_threads
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  plan text,
  metadata jsonb DEFAULT '{}'::jsonb,
  last_message_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS chat_threads_user_id_idx ON public.chat_threads(user_id);
CREATE INDEX IF NOT EXISTS chat_threads_last_message_at_idx ON public.chat_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS chat_threads_created_at_idx ON public.chat_threads(created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own threads
CREATE POLICY "Users can view own chat threads"
  ON public.chat_threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat threads"
  ON public.chat_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat threads"
  ON public.chat_threads FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat threads"
  ON public.chat_threads FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policy: Admins can access all threads
CREATE POLICY "Admins can manage all chat threads"
  ON public.chat_threads FOR ALL
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
-- UPDATE: chat_messages table to add thread_id
-- ============================================================================

-- Add thread_id column (nullable for backward compatibility)
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES public.chat_threads(id) ON DELETE CASCADE;

-- Create index for thread_id
CREATE INDEX IF NOT EXISTS chat_messages_thread_id_idx ON public.chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS chat_messages_thread_created_idx ON public.chat_messages(thread_id, created_at);

-- Update RLS policies to include thread_id check
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;

-- Recreate policies with thread_id support
CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  USING (
    auth.uid() = user_id AND (
      thread_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.chat_threads
        WHERE chat_threads.id = chat_messages.thread_id
        AND chat_threads.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      thread_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.chat_threads
        WHERE chat_threads.id = chat_messages.thread_id
        AND chat_threads.user_id = auth.uid()
      )
    )
  );

-- Admin policy for chat_messages
CREATE POLICY "Admins can manage all chat messages"
  ON public.chat_messages FOR ALL
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
-- FUNCTION: Update thread last_message_at and title
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_thread_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_message_at
  IF NEW.thread_id IS NOT NULL THEN
    UPDATE public.chat_threads
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.thread_id;
    
    -- Set title from first user message if title is null
    IF NEW.role = 'user' AND (
      SELECT title FROM public.chat_threads WHERE id = NEW.thread_id
    ) IS NULL THEN
      UPDATE public.chat_threads
      SET title = LEFT(TRIM(NEW.content), 100)
      WHERE id = NEW.thread_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Auto-update thread metadata on message insert
-- ============================================================================
DROP TRIGGER IF EXISTS on_chat_message_insert ON public.chat_messages;

CREATE TRIGGER on_chat_message_insert
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_thread_on_message();

-- ============================================================================
-- FUNCTION: Handle updated_at for chat_threads
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for chat_threads updated_at
DROP TRIGGER IF EXISTS on_chat_threads_updated ON public.chat_threads;

CREATE TRIGGER on_chat_threads_updated
  BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

