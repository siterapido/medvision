-- Add last_active_at column to profiles table for tracking user activity
-- This column is used by the pipeline system to identify churn risk and engagement

-- Add the column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- Initialize with existing data (use updated_at, or created_at as fallback)
UPDATE profiles
SET last_active_at = COALESCE(updated_at, created_at)
WHERE last_active_at IS NULL;

-- Create index for efficient querying (sorting by most recent activity)
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON profiles(last_active_at DESC NULLS LAST);

-- Add comment for documentation
COMMENT ON COLUMN profiles.last_active_at IS 'Timestamp of the user''s last activity in the platform. Used for churn detection and engagement tracking.';
