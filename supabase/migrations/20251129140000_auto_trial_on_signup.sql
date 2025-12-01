-- =====================================================
-- Trial automático a partir do cadastro (7 dias)
-- =====================================================

-- Recria o trigger de novo usuário para sempre preencher trial
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
    subscription_status
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
    'free'
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email,
        role = excluded.role,
        trial_started_at = coalesce(public.profiles.trial_started_at, excluded.trial_started_at),
        trial_ends_at = coalesce(public.profiles.trial_ends_at, excluded.trial_ends_at),
        trial_used = coalesce(public.profiles.trial_used, false),
        plan_type = coalesce(public.profiles.plan_type, excluded.plan_type),
        subscription_status = coalesce(public.profiles.subscription_status, excluded.subscription_status);

  return new;
end;
$$;

-- Backfill para perfis gratuitos sem trial configurado
update public.profiles
set trial_started_at = coalesce(trial_started_at, created_at),
    trial_ends_at = coalesce(trial_ends_at, created_at + interval '7 days'),
    trial_used = coalesce(trial_used, false),
    plan_type = coalesce(plan_type, 'free'),
    subscription_status = coalesce(subscription_status, 'free')
where (trial_started_at is null or trial_ends_at is null)
  and (plan_type is null or plan_type = 'free');
