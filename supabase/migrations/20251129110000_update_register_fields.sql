-- Ensure fields exist in profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS telefone text,
ADD COLUMN IF NOT EXISTS profession text,
ADD COLUMN IF NOT EXISTS institution text;

-- Update handle_new_user trigger to populate new fields from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  sanitized_role text;
  profile_name text;
  profile_profession text;
  profile_institution text;
  profile_phone text;
BEGIN
  sanitized_role := CASE
    WHEN new.raw_user_meta_data->>'role' = 'admin' THEN 'admin'
    ELSE 'cliente'
  END;

  profile_name := COALESCE(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    split_part(COALESCE(new.email, ''), '@', 1)
  );
  
  -- Extract new fields from metadata
  profile_profession := new.raw_user_meta_data->>'profession';
  profile_institution := new.raw_user_meta_data->>'institution';
  profile_phone := new.raw_user_meta_data->>'whatsapp';

  INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    role, 
    profession, 
    institution, 
    telefone
  )
  VALUES (
    new.id,
    profile_name,
    new.email,
    sanitized_role,
    profile_profession,
    profile_institution,
    profile_phone
  )
  ON CONFLICT (id) DO UPDATE
  SET 
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      profession = EXCLUDED.profession,
      institution = EXCLUDED.institution,
      telefone = EXCLUDED.telefone;

  RETURN new;
END;
$$;











