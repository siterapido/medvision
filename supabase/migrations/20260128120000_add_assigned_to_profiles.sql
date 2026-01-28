-- Add assigned_to column for tracking which seller is responsible for each lead
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id);

-- Create index for efficient queries by seller
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_to ON profiles(assigned_to);

-- Add comment for documentation
COMMENT ON COLUMN profiles.assigned_to IS 'ID do vendedor responsável pelo lead';
