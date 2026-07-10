-- Clinical audit + signatures + orgs foundation
CREATE TABLE IF NOT EXISTS public.laudo_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('analyzed','saved','edited','signed','exported','viewed')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_laudo_audit_artifact ON public.laudo_audit_log(artifact_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.laudo_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_crm TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(artifact_id) -- one signature per laudo for v1
);

-- Multi-clinic foundation
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'medico' CHECK (role IN ('admin','medico','revisor')),
  PRIMARY KEY (org_id, user_id)
);

-- Patient grouping (internal id, not PHI-heavy)
ALTER TABLE public.artifacts
  ADD COLUMN IF NOT EXISTS patient_key TEXT,
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_artifacts_patient_key ON public.artifacts(user_id, patient_key) WHERE patient_key IS NOT NULL;

-- RLS: users manage own audit/signatures; org tables basic own-membership later
ALTER TABLE public.laudo_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laudo_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY laudo_audit_own ON public.laudo_audit_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY laudo_sig_own ON public.laudo_signatures FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY org_members_own ON public.organization_members FOR SELECT USING (auth.uid() = user_id);
