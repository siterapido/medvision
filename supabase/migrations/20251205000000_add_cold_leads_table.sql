-- =====================================================
-- Cold Leads System - SPIM Pipeline
-- =====================================================

-- Create leads table for cold leads (before trial signup)
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  phone text NOT NULL UNIQUE,
  email text,
  status text NOT NULL DEFAULT 'situacao',
  notes text,
  source text,
  converted_at timestamptz,
  converted_to_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.leads IS 'Leads frios importados via CSV antes do cadastro no trial';
COMMENT ON COLUMN public.leads.phone IS 'Número de telefone único (chave para identificação)';
COMMENT ON COLUMN public.leads.status IS 'Etapa do pipeline SPIM: situacao, problema, implicacao, motivacao, convertido';
COMMENT ON COLUMN public.leads.source IS 'Origem do lead (ex: Facebook, Google, etc)';
COMMENT ON COLUMN public.leads.converted_at IS 'Data em que o lead se converteu em trial';
COMMENT ON COLUMN public.leads.converted_to_user_id IS 'ID do usuário criado quando o lead se converteu';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_converted_to_user_id ON public.leads(converted_to_user_id);

-- Add check constraint for valid status values (SPIM)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'leads_status_check'
  ) THEN
    ALTER TABLE public.leads
    ADD CONSTRAINT leads_status_check
    CHECK (
      status IN (
        'situacao',
        'problema',
        'implicacao',
        'motivacao',
        'convertido'
      )
    );
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view and manage leads
CREATE POLICY "Admins can view all leads"
  ON public.leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

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

CREATE POLICY "Admins can update leads"
  ON public.leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at_trigger ON public.leads;
CREATE TRIGGER update_leads_updated_at_trigger
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- Note: Lead conversion is handled in handle_new_user() function
-- See migration 20251205000001_integrate_leads_with_signup.sql

