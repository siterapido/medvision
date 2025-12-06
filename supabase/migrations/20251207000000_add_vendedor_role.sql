-- =====================================================
-- Adicionar role 'vendedor' ao sistema
-- =====================================================

-- Atualizar constraint para incluir 'vendedor'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'cliente', 'vendedor'));

-- Atualizar função handle_new_user para reconhecer 'vendedor'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  sanitized_role text;
  profile_name text;
BEGIN
  sanitized_role := CASE
    WHEN new.raw_user_meta_data->>'role' = 'admin' THEN 'admin'
    WHEN new.raw_user_meta_data->>'role' = 'vendedor' THEN 'vendedor'
    ELSE 'cliente'
  END;

  profile_name := coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    split_part(coalesce(new.email, ''), '@', 1)
  );

  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    profile_name,
    new.email,
    sanitized_role
  )
  ON CONFLICT (id) DO UPDATE
  SET name = excluded.name,
      email = excluded.email,
      role = excluded.role;

  RETURN new;
END;
$$;

-- Adicionar política para vendedores verem o próprio perfil
CREATE POLICY "Vendedores podem ver o próprio perfil"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id AND role = 'vendedor');

-- Adicionar política para vendedores atualizarem o próprio perfil
CREATE POLICY "Vendedores podem atualizar o próprio perfil"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id AND role = 'vendedor')
  WITH CHECK (auth.uid() = id AND role = 'vendedor');

-- Atualizar política de admins para incluir gerenciamento de vendedores
-- (a política existente já permite que admins gerenciem todos os perfis)


