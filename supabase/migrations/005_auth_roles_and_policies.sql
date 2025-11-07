-- =====================================================
-- Profiles role management (admin x cliente)
-- =====================================================

-- Rename full_name column to name when still present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN full_name TO name;
  END IF;
END $$;

-- Ensure role column exists (older projects might not have applied 001)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role text;
  END IF;
END $$;

-- Ensure role column matches the new enum-like constraint
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'cliente';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'cliente'));

UPDATE public.profiles
SET role = 'cliente'
WHERE role IS NULL OR role NOT IN ('admin', 'cliente');

ALTER TABLE public.profiles
  ALTER COLUMN role SET NOT NULL;

-- Recreate handle_new_user trigger to persist name + role metadata
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

-- Refresh profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Clientes podem ver o próprio perfil"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Clientes podem atualizar o próprio perfil"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id AND role = 'cliente')
  WITH CHECK (auth.uid() = id AND role = 'cliente');

CREATE POLICY "Admins podem gerenciar perfis"
  ON public.profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles admins
      WHERE admins.id = auth.uid()
        AND admins.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles admins
      WHERE admins.id = auth.uid()
        AND admins.role = 'admin'
    )
  );
