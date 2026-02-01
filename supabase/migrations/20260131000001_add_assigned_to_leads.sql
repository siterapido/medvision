-- =====================================================
-- Add Seller Assignment to Cold Leads
-- =====================================================
-- Enables tracking which seller is responsible for each cold lead
-- When lead converts to profile, this is transferred automatically

-- Add assigned_to column to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.leads.assigned_to IS 'ID do vendedor responsável pelo lead';

-- Create index for performance when filtering by seller
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);

-- Update RLS policies to allow vendedores to see their assigned leads

-- Drop existing policies to recreate with vendedor support
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

-- Admins and vendedores can view leads (vendedores only see their assigned leads)
CREATE POLICY "Admins and vendedores can view leads"
  ON public.leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (profiles.role = 'vendedor' AND public.leads.assigned_to = auth.uid())
      )
    )
  );

-- Only admins can insert leads (imports)
CREATE POLICY "Admins can insert leads"
  ON public.leads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update any lead, vendedores can update their assigned leads
CREATE POLICY "Admins and vendedores can update leads"
  ON public.leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (profiles.role = 'vendedor' AND public.leads.assigned_to = auth.uid())
      )
    )
  );

-- Only admins can delete leads
CREATE POLICY "Admins can delete leads"
  ON public.leads
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
