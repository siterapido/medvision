-- Migration: Quiz Attempts for Simulados
-- Tracks quiz attempt history and analytics

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_id text NOT NULL,

  -- Attempt details
  answers jsonb NOT NULL DEFAULT '{}',        -- { questionIndex: selectedOptionId }
  score integer NOT NULL DEFAULT 0,           -- Number of correct answers
  total_questions integer NOT NULL,           -- Total questions in quiz
  percentage numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_questions > 0 THEN (score::numeric / total_questions * 100) ELSE 0 END
  ) STORED,

  -- Timing
  time_limit_seconds integer,                 -- Configured time limit (null = no limit)
  time_spent_seconds integer NOT NULL DEFAULT 0,  -- Actual time spent
  timed_out boolean DEFAULT false,            -- Whether timer ran out

  -- Timestamps
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,

  -- Status
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_artifact ON quiz_attempts(user_id, artifact_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed ON quiz_attempts(user_id, completed_at DESC);

-- Create question_analytics table for per-question stats
CREATE TABLE IF NOT EXISTS quiz_question_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_id text NOT NULL,
  question_index integer NOT NULL,

  -- Stats
  times_seen integer DEFAULT 0,
  times_correct integer DEFAULT 0,
  average_time_seconds numeric(8,2),
  last_answered_at timestamptz,

  UNIQUE(user_id, artifact_id, question_index)
);

CREATE INDEX IF NOT EXISTS idx_quiz_analytics_user ON quiz_question_analytics(user_id, artifact_id);

-- RLS Policies
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_question_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only access their own attempts
CREATE POLICY "Users can view own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz attempts"
  ON quiz_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only access their own analytics
CREATE POLICY "Users can view own quiz analytics"
  ON quiz_question_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own quiz analytics"
  ON quiz_question_analytics FOR ALL
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE quiz_attempts IS 'Tracks individual quiz attempt history with timing and scoring';
COMMENT ON TABLE quiz_question_analytics IS 'Per-question analytics for identifying weak areas';
