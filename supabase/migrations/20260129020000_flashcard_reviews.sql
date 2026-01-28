-- Migration: Flashcard Reviews for Spaced Repetition
-- Tracks individual card progress using SM-2 algorithm

-- Create flashcard_reviews table
CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_id text NOT NULL,
  card_id text NOT NULL,

  -- SM-2 Algorithm fields
  repetition smallint DEFAULT 0,           -- Number of successful reviews
  ease_factor numeric(4,2) DEFAULT 2.5,    -- Difficulty multiplier (min 1.3)
  interval_days integer DEFAULT 0,         -- Days until next review

  -- Timestamps
  next_review_at timestamptz,              -- When to review next (null = new card)
  last_reviewed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),

  -- Ensure one record per user/artifact/card combination
  UNIQUE(user_id, artifact_id, card_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_artifact
  ON flashcard_reviews(user_id, artifact_id);

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_due
  ON flashcard_reviews(user_id, next_review_at)
  WHERE next_review_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_new
  ON flashcard_reviews(user_id, artifact_id)
  WHERE next_review_at IS NULL;

-- Create review_history table to track individual review events
CREATE TABLE IF NOT EXISTS flashcard_review_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_id text NOT NULL,
  card_id text NOT NULL,

  -- Review details
  quality smallint NOT NULL CHECK (quality BETWEEN 0 AND 5),
  previous_interval integer,
  new_interval integer,
  previous_ease numeric(4,2),
  new_ease numeric(4,2),

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flashcard_review_history_user
  ON flashcard_review_history(user_id, artifact_id);

-- Create study_sessions table to track study sessions
CREATE TABLE IF NOT EXISTS flashcard_study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_id text NOT NULL,

  -- Session stats
  cards_reviewed integer DEFAULT 0,
  cards_correct integer DEFAULT 0,
  total_time_seconds integer DEFAULT 0,

  -- Timestamps
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_flashcard_sessions_user
  ON flashcard_study_sessions(user_id, artifact_id);

-- RLS Policies
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_review_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_study_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own reviews
CREATE POLICY "Users can view own flashcard reviews"
  ON flashcard_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard reviews"
  ON flashcard_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard reviews"
  ON flashcard_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcard reviews"
  ON flashcard_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Users can only access their own review history
CREATE POLICY "Users can view own review history"
  ON flashcard_review_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own review history"
  ON flashcard_review_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only access their own study sessions
CREATE POLICY "Users can view own study sessions"
  ON flashcard_study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
  ON flashcard_study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
  ON flashcard_study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE flashcard_reviews IS 'Tracks individual flashcard progress using SM-2 spaced repetition algorithm';
COMMENT ON TABLE flashcard_review_history IS 'History of all flashcard review events for analytics';
COMMENT ON TABLE flashcard_study_sessions IS 'Tracks study session statistics';
