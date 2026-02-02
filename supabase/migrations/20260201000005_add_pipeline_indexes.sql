-- Migration: Add indexes for pipeline queries to avoid timeout (error 57014)
-- This addresses the performance issue with complex OR conditions and ordering

-- Index for pipeline query on profiles table
-- Covers the main filtering conditions and ordering
CREATE INDEX IF NOT EXISTS idx_profiles_pipeline_query
ON profiles (trial_started_at DESC NULLS LAST)
WHERE deleted_at IS NULL
  AND role NOT IN ('admin', 'vendedor');

-- Index for trial users query (trial_started_at NOT NULL)
CREATE INDEX IF NOT EXISTS idx_profiles_trial_users
ON profiles (trial_started_at DESC)
WHERE deleted_at IS NULL
  AND role NOT IN ('admin', 'vendedor')
  AND trial_started_at IS NOT NULL;

-- Index for cold leads ordering by created_at
CREATE INDEX IF NOT EXISTS idx_leads_created_at_desc
ON leads (created_at DESC);

-- Composite index for leads with assigned_to for seller queries
CREATE INDEX IF NOT EXISTS idx_leads_assigned_seller
ON leads (assigned_to, created_at DESC)
WHERE assigned_to IS NOT NULL;
