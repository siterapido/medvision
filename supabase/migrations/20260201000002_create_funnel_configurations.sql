-- Create funnel_configurations table for multi-funnel system
-- Supports different funnel types: cold prospecting, paid traffic, events, trial tracking

-- Create enum for funnel types
CREATE TYPE funnel_type AS ENUM (
  'cold_prospecting',  -- Prospecção fria (cold leads)
  'paid_traffic',      -- Tráfego pago (paid ads leads)
  'event',             -- Eventos e webinars
  'trial'              -- Trial tracking (7 dias, 15 dias, etc)
);

-- Create enum for available views
CREATE TYPE funnel_view AS ENUM (
  'kanban',    -- Kanban board view
  'timeline',  -- Timeline/calendar view
  'list'       -- List/table view
);

-- Create enum for source tables
CREATE TYPE funnel_source AS ENUM (
  'leads',     -- Cold leads table
  'profiles'   -- User profiles table
);

-- Create funnel_configurations table
CREATE TABLE funnel_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,

  -- Funnel type and configuration
  funnel_type funnel_type NOT NULL,
  trial_duration_days integer, -- For trial funnels: 3, 7, 15, 30

  -- Stages configuration (JSONB array)
  -- Each stage: { id: string, title: string, emoji: string, color: string, description: string, order: number }
  stages jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Available views for this funnel
  available_views funnel_view[] NOT NULL DEFAULT ARRAY['kanban']::funnel_view[],

  -- Source table for this funnel's data
  source_table funnel_source NOT NULL DEFAULT 'leads',

  -- Status flags
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES profiles(id),

  -- Constraints
  CONSTRAINT valid_trial_duration CHECK (
    (funnel_type = 'trial' AND trial_duration_days IS NOT NULL AND trial_duration_days > 0)
    OR
    (funnel_type != 'trial' AND trial_duration_days IS NULL)
  )
);

-- Create indexes
CREATE INDEX idx_funnel_configurations_type ON funnel_configurations(funnel_type);
CREATE INDEX idx_funnel_configurations_slug ON funnel_configurations(slug);
CREATE INDEX idx_funnel_configurations_active ON funnel_configurations(is_active) WHERE is_active = true;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_funnel_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_funnel_configurations_updated_at
  BEFORE UPDATE ON funnel_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_funnel_configurations_updated_at();

-- RLS Policies
ALTER TABLE funnel_configurations ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage funnel configurations
CREATE POLICY "Admins can manage funnel configurations"
  ON funnel_configurations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow vendedores to view active funnel configurations
CREATE POLICY "Vendedores can view active funnel configurations"
  ON funnel_configurations
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'vendedor')
    )
  );

-- Add comments
COMMENT ON TABLE funnel_configurations IS 'Configuration for multiple sales/conversion funnels';
COMMENT ON COLUMN funnel_configurations.stages IS 'JSONB array of stage configurations: [{id, title, emoji, color, description, order}]';
COMMENT ON COLUMN funnel_configurations.available_views IS 'Array of view types available for this funnel';
COMMENT ON COLUMN funnel_configurations.source_table IS 'Which table to query for funnel data (leads or profiles)';
