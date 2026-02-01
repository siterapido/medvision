-- =====================================================
-- Update Signup Trigger to Transfer Vendor Assignment
-- =====================================================
-- When a cold lead signs up, transfer their assigned_to to the profile

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  sanitized_role text;
  profile_name text;
  trial_start timestamptz;
  trial_end timestamptz;
  lead_phone text;
  matched_lead record;
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

  trial_start := timezone('utc', now());
  trial_end := trial_start + interval '7 days';

  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    trial_started_at,
    trial_ends_at,
    trial_used,
    plan_type,
    subscription_status,
    whatsapp,
    pipeline_stage
  )
  VALUES (
    new.id,
    profile_name,
    new.email,
    sanitized_role,
    trial_start,
    trial_end,
    false,
    'free',
    'free',
    new.raw_user_meta_data->>'whatsapp',
    'cadastro'  -- Start at 'cadastro' stage in behavioral funnel
  )
  ON CONFLICT (id) DO UPDATE
    SET name = excluded.name,
        email = excluded.email,
        role = excluded.role,
        trial_started_at = coalesce(public.profiles.trial_started_at, excluded.trial_started_at),
        trial_ends_at = coalesce(public.profiles.trial_ends_at, excluded.trial_ends_at),
        trial_used = coalesce(public.profiles.trial_used, false),
        plan_type = coalesce(public.profiles.plan_type, excluded.plan_type),
        subscription_status = coalesce(public.profiles.subscription_status, excluded.subscription_status),
        whatsapp = coalesce(excluded.whatsapp, public.profiles.whatsapp),
        pipeline_stage = coalesce(public.profiles.pipeline_stage, 'cadastro');

  -- Check if there's a matching lead by phone number
  IF new.raw_user_meta_data->>'whatsapp' IS NOT NULL THEN
    lead_phone := regexp_replace(new.raw_user_meta_data->>'whatsapp', '\D', '', 'g');

    -- Find matching lead and get its assigned_to
    SELECT id, assigned_to INTO matched_lead
    FROM public.leads
    WHERE regexp_replace(phone, '\D', '', 'g') = lead_phone
      AND status != 'convertido'
    LIMIT 1;

    -- Mark lead as converted and transfer vendor assignment
    IF matched_lead.id IS NOT NULL THEN
      -- Mark lead as converted
      UPDATE public.leads
      SET
        status = 'convertido',
        converted_at = timezone('utc', now()),
        converted_to_user_id = new.id
      WHERE id = matched_lead.id;

      -- Transfer vendor assignment to profile if lead had one assigned
      IF matched_lead.assigned_to IS NOT NULL THEN
        UPDATE public.profiles
        SET assigned_to = matched_lead.assigned_to
        WHERE id = new.id;
      END IF;
    END IF;
  END IF;

  RETURN new;
END;
$$;
