-- =====================================================
-- Repair Pipeline Data: Fix Missing Trial/Funnel Fields
-- =====================================================
-- This migration ensures ALL non-admin/vendedor profiles appear in pipelines
-- by backfilling NULL values with sensible defaults

-- Step 1: Repair profiles with trial_started_at NULL
-- Set trial_started_at to created_at for older profiles
UPDATE profiles
SET
  trial_started_at = created_at,
  trial_ends_at = COALESCE(trial_ends_at, created_at + INTERVAL '7 days'),
  trial_used = COALESCE(trial_used, false)
WHERE trial_started_at IS NULL
  AND deleted_at IS NULL
  AND role NOT IN ('admin', 'vendedor');

-- Step 2: Repair profiles with pipeline_stage NULL
-- Set to 'cadastro' which is the initial stage
UPDATE profiles
SET pipeline_stage = 'cadastro'
WHERE pipeline_stage IS NULL
  AND deleted_at IS NULL
  AND role NOT IN ('admin', 'vendedor');

-- Step 3: Assign funnel_id where missing
-- All trial users should be assigned to the trial-7-dias funnel
UPDATE profiles
SET funnel_id = (
  SELECT id FROM funnel_configurations
  WHERE slug = 'trial-7-dias'
  LIMIT 1
)
WHERE funnel_id IS NULL
  AND deleted_at IS NULL
  AND role NOT IN ('admin', 'vendedor');

-- Step 4: Normalize phone numbers in leads table (keep only digits)
-- This ensures consistent matching when users sign up with WhatsApp
UPDATE leads
SET phone = regexp_replace(phone, '\D', '', 'g')
WHERE phone IS NOT NULL
  AND phone != regexp_replace(phone, '\D', '', 'g');

-- Step 5: Set last_active_at where missing
-- Use updated_at or created_at as fallback
UPDATE profiles
SET last_active_at = COALESCE(updated_at, created_at)
WHERE last_active_at IS NULL
  AND deleted_at IS NULL
  AND role NOT IN ('admin', 'vendedor');

-- Step 6: Ensure plan_type and subscription_status have defaults
UPDATE profiles
SET
  plan_type = COALESCE(plan_type, 'free'),
  subscription_status = COALESCE(subscription_status, 'free')
WHERE (plan_type IS NULL OR subscription_status IS NULL)
  AND deleted_at IS NULL
  AND role NOT IN ('admin', 'vendedor');

-- Add comments documenting this repair
COMMENT ON TABLE profiles IS 'User profiles with trial tracking. All non-admin/vendedor users should have trial_started_at, pipeline_stage, and funnel_id populated.';
