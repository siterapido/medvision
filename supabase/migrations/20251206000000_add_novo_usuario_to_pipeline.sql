-- =====================================================
-- Add 'novo_usuario' back to pipeline stages
-- =====================================================

-- Drop old constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_pipeline_stage_check;

-- Add new constraint with 'novo_usuario' included
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_pipeline_stage_check
CHECK (
  pipeline_stage IS NULL OR 
  pipeline_stage IN (
    'novo_usuario',
    'situacao',
    'problema',
    'implicacao',
    'motivacao',
    'convertido'
  )
);

-- Update comment
COMMENT ON COLUMN public.profiles.pipeline_stage IS 'Etapa atual do lead no pipeline de conversão SPIM: novo_usuario, situacao, problema, implicacao, motivacao, convertido';

-- =====================================================
-- Update handle_new_user() to set pipeline_stage = 'novo_usuario'
-- Mantém a integração com leads frios da migração anterior
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  sanitized_role text;
  profile_name text;
  initial_pipeline_stage text;
  trial_start timestamptz;
  trial_end timestamptz;
  lead_phone text;
  matched_lead_id uuid;
BEGIN
  sanitized_role := CASE
    WHEN new.raw_user_meta_data->>'role' = 'admin' THEN 'admin'
    ELSE 'cliente'
  END;

  profile_name := coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    split_part(coalesce(new.email, ''), '@', 1)
  );

  -- Define pipeline_stage como 'novo_usuario' para clientes, NULL para admins
  initial_pipeline_stage := CASE
    WHEN sanitized_role = 'admin' THEN NULL
    ELSE 'novo_usuario'
  END;

  -- Inicia trial automaticamente (7 dias)
  trial_start := timezone('utc', now());
  trial_end := trial_start + interval '7 days';

  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    pipeline_stage,
    trial_started_at,
    trial_ends_at,
    trial_used,
    plan_type,
    subscription_status,
    whatsapp
  )
  VALUES (
    new.id,
    profile_name,
    new.email,
    sanitized_role,
    initial_pipeline_stage,
    trial_start,
    trial_end,
    false,
    'free',
    'free',
    new.raw_user_meta_data->>'whatsapp'
  )
  ON CONFLICT (id) DO UPDATE
  SET name = excluded.name,
      email = excluded.email,
      role = excluded.role,
      pipeline_stage = COALESCE(profiles.pipeline_stage, excluded.pipeline_stage),
      trial_started_at = COALESCE(profiles.trial_started_at, excluded.trial_started_at),
      trial_ends_at = COALESCE(profiles.trial_ends_at, excluded.trial_ends_at),
      trial_used = COALESCE(profiles.trial_used, false),
      plan_type = COALESCE(profiles.plan_type, excluded.plan_type),
      subscription_status = COALESCE(profiles.subscription_status, excluded.subscription_status),
      whatsapp = COALESCE(excluded.whatsapp, profiles.whatsapp);

  -- Check if there's a matching lead by phone number
  IF new.raw_user_meta_data->>'whatsapp' IS NOT NULL THEN
    lead_phone := regexp_replace(new.raw_user_meta_data->>'whatsapp', '\D', '', 'g');
    
    -- Find matching lead
    SELECT id INTO matched_lead_id
    FROM public.leads
    WHERE regexp_replace(phone, '\D', '', 'g') = lead_phone
      AND status != 'convertido'
    LIMIT 1;
    
    -- Mark lead as converted
    IF matched_lead_id IS NOT NULL THEN
      UPDATE public.leads
      SET 
        status = 'convertido',
        converted_at = timezone('utc', now()),
        converted_to_user_id = new.id
      WHERE id = matched_lead_id;
    END IF;
  END IF;

  RETURN new;
END;
$$;

