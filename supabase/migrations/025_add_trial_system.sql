-- =====================================================
-- Trial System - 7 Days Free Access
-- =====================================================

-- Add trial fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
ADD COLUMN IF NOT EXISTS trial_used boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.trial_started_at IS 'Data de início do período de trial';
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'Data de término do período de trial';
COMMENT ON COLUMN public.profiles.trial_used IS 'Indica se o usuário já utilizou o período de trial';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at ON public.profiles(trial_ends_at);
