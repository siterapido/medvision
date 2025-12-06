-- =====================================================
-- Integrate Leads with User Signup
-- =====================================================

-- Update handle_new_user to check and mark leads as converted
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  sanitized_role text;
  profile_name text;
  trial_start timestamptz;
  trial_end timestamptz;
  lead_phone text;
  matched_lead_id uuid;
begin
  sanitized_role := case
    when new.raw_user_meta_data->>'role' = 'admin' then 'admin'
    else 'cliente'
  end;

  profile_name := coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    split_part(coalesce(new.email, ''), '@', 1)
  );

  trial_start := timezone('utc', now());
  trial_end := trial_start + interval '7 days';

  insert into public.profiles (
    id,
    name,
    email,
    role,
    trial_started_at,
    trial_ends_at,
    trial_used,
    plan_type,
    subscription_status,
    whatsapp
  )
  values (
    new.id,
    profile_name,
    new.email,
    sanitized_role,
    trial_start,
    trial_end,
    false,
    'free',
    'free',
    new.raw_user_meta_data->>'whatsapp'
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email,
        role = excluded.role,
        trial_started_at = coalesce(public.profiles.trial_started_at, excluded.trial_started_at),
        trial_ends_at = coalesce(public.profiles.trial_ends_at, excluded.trial_ends_at),
        trial_used = coalesce(public.profiles.trial_used, false),
        plan_type = coalesce(public.profiles.plan_type, excluded.plan_type),
        subscription_status = coalesce(public.profiles.subscription_status, excluded.subscription_status),
        whatsapp = coalesce(excluded.whatsapp, public.profiles.whatsapp);

  -- Check if there's a matching lead by phone number
  if new.raw_user_meta_data->>'whatsapp' is not null then
    lead_phone := regexp_replace(new.raw_user_meta_data->>'whatsapp', '\D', '', 'g');
    
    -- Find matching lead
    select id into matched_lead_id
    from public.leads
    where regexp_replace(phone, '\D', '', 'g') = lead_phone
      and status != 'convertido'
    limit 1;
    
    -- Mark lead as converted
    if matched_lead_id is not null then
      update public.leads
      set 
        status = 'convertido',
        converted_at = timezone('utc', now()),
        converted_to_user_id = new.id
      where id = matched_lead_id;
    end if;
  end if;

  return new;
end;
$$;



