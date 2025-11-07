-- =====================================================
-- Odonto GPT - Initial Database Schema
-- =====================================================

-- Create notes table (example table for testing)
create table if not exists public.notes (
  id bigint primary key generated always as identity,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert sample data
insert into public.notes (title)
values
  ('Hoje criei o projeto Odonto GPT no Supabase.'),
  ('Adicionei autenticação e dados de exemplo.'),
  ('O sistema está funcionando perfeitamente!');

-- Enable Row Level Security
alter table public.notes enable row level security;

-- Create policy: anyone can read notes (public access for testing)
create policy "public can read notes"
  on public.notes
  for select
  to anon
  using (true);

-- =====================================================
-- User Profiles Table
-- =====================================================

-- Create profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text,
  avatar_url text,
  role text not null default 'cliente' check (role in ('cliente', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policy: Users can view their own profile
create policy "Clientes podem ver o próprio perfil"
  on public.profiles
  for select
  using ( auth.uid() = id );

-- Policy: Clients can update their own profile (role enforced elsewhere)
create policy "Clientes podem atualizar o próprio perfil"
  on public.profiles
  for update
  using ( auth.uid() = id and role = 'cliente' )
  with check ( auth.uid() = id and role = 'cliente' );

-- Policy: Admins have full access to manage every profile
create policy "Admins podem gerenciar perfis"
  on public.profiles
  for all
  using (
    exists (
      select 1
      from public.profiles admins
      where admins.id = auth.uid()
        and admins.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles admins
      where admins.id = auth.uid()
        and admins.role = 'admin'
    )
  );

-- =====================================================
-- Trigger: Auto-create profile on user signup
-- =====================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  sanitized_role text;
  profile_name text;
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

  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    profile_name,
    new.email,
    sanitized_role
  )
  on conflict (id) do update
  set name = excluded.name,
      email = excluded.email,
      role = excluded.role;

  return new;
end;
$$;

-- Trigger on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- Updated_at trigger function
-- =====================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger to profiles
drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- =====================================================
-- Subscriptions Table (for future use)
-- =====================================================

create table if not exists public.subscriptions (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users on delete cascade not null,
  plan text not null check (plan in ('monthly', 'annual')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  cancel_at_period_end boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on subscriptions
alter table public.subscriptions enable row level security;

-- Policy: Users can view their own subscription
create policy "Users can view own subscription"
  on public.subscriptions
  for select
  using ( auth.uid() = user_id );

-- Apply updated_at trigger to subscriptions
drop trigger if exists on_subscription_updated on public.subscriptions;
create trigger on_subscription_updated
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

-- =====================================================
-- Usage Tracking Table (for analytics)
-- =====================================================

create table if not exists public.usage_logs (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users on delete cascade not null,
  action text not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on usage_logs
alter table public.usage_logs enable row level security;

-- Policy: Users can view their own usage logs
create policy "Users can view own usage logs"
  on public.usage_logs
  for select
  using ( auth.uid() = user_id );

-- Policy: Users can insert their own usage logs
create policy "Users can insert own usage logs"
  on public.usage_logs
  for insert
  with check ( auth.uid() = user_id );

-- =====================================================
-- Indexes for better performance
-- =====================================================

create index if not exists profiles_user_id_idx on public.profiles(id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists usage_logs_user_id_idx on public.usage_logs(user_id);
create index if not exists usage_logs_created_at_idx on public.usage_logs(created_at desc);

-- =====================================================
-- Comments for documentation
-- =====================================================

comment on table public.notes is 'Example table for testing Supabase connection';
comment on table public.profiles is 'User profile information linked to auth.users';
comment on table public.subscriptions is 'User subscription plans and status';
comment on table public.usage_logs is 'Track user actions for analytics';

-- =====================================================
-- Grant necessary permissions
-- =====================================================

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
