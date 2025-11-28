-- =============================================
-- Fix recursion in profiles policies + helper
-- =============================================

-- Função helper para verificar se usuário é admin sem recursão em RLS
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = user_id
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin from public;
grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

-- Atualiza política de perfis para evitar subconsulta recursiva
drop policy if exists "Admins podem gerenciar perfis" on public.profiles;
create policy "Admins podem gerenciar perfis"
  on public.profiles
  for all
  using (auth.uid() = id or public.is_admin(auth.uid()))
  with check (auth.uid() = id or public.is_admin(auth.uid()));

-- Atualiza política de live_events para usar helper e evitar dependência recursiva
drop policy if exists "Admins podem gerenciar lives" on public.live_events;
create policy "Admins podem gerenciar lives"
  on public.live_events
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
