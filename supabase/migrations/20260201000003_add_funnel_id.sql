-- Add funnel_id to leads and profiles tables for multi-funnel system

-- Add funnel_id to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS funnel_id uuid REFERENCES funnel_configurations(id) ON DELETE SET NULL;

-- Add funnel_id to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS funnel_id uuid REFERENCES funnel_configurations(id) ON DELETE SET NULL;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_leads_funnel_id ON leads(funnel_id);
CREATE INDEX IF NOT EXISTS idx_profiles_funnel_id ON profiles(funnel_id);

-- Add comments
COMMENT ON COLUMN leads.funnel_id IS 'Reference to the funnel configuration this lead belongs to';
COMMENT ON COLUMN profiles.funnel_id IS 'Reference to the funnel configuration this user was acquired through';
