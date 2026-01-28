-- Migration: Certificate System
-- Description: Tables for certificate templates and issued certificates

-- ============================================================================
-- TABLE: certificate_templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  background_url text, -- URL to the background image
  hours integer DEFAULT 0,
  signatures jsonb DEFAULT '[]'::jsonb, -- Array of {name, role, imageUrl}
  layout_config jsonb DEFAULT '{}'::jsonb, -- Config for text positioning
  validity_period_days integer, -- Null means no expiration
  available_start timestamp with time zone,
  available_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins can do everything
CREATE POLICY "Admins can manage certificate templates"
  ON public.certificate_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Everyone can read templates (needed for viewing certificates publicly/by students)
CREATE POLICY "Anyone can read certificate templates"
  ON public.certificate_templates
  FOR SELECT
  USING (true);


-- ============================================================================
-- TABLE: certificates (Issued Certificates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL, -- Verification code
  template_id uuid NOT NULL REFERENCES public.certificate_templates(id),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL, -- Snapshot of course
  issue_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expiry_date timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb, -- Snapshot of student name, course title at issue time
  status text DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins can do everything
CREATE POLICY "Admins can manage certificates"
  ON public.certificates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Users can view their own certificates
CREATE POLICY "Users can view own certificates"
  ON public.certificates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can view a certificate if they have the ID (for public verification pages)
-- Ideally this would be by 'code' on a specific RPC or strict select, but for now allow read by ID
CREATE POLICY "Public verification by ID"
  ON public.certificates
  FOR SELECT
  USING (true);


-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS certificates_user_id_idx ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS certificates_code_idx ON public.certificates(code);
CREATE INDEX IF NOT EXISTS certificates_course_id_idx ON public.certificates(course_id);

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    CREATE TRIGGER on_certificate_templates_updated
      BEFORE UPDATE ON public.certificate_templates
      FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
  END IF;
END $$;
