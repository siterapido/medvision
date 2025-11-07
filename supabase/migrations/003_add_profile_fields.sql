-- =====================================================
-- Add additional profile fields
-- =====================================================

-- Add new fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profession text,
ADD COLUMN IF NOT EXISTS cro text,
ADD COLUMN IF NOT EXISTS company text;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.profession IS 'User profession (e.g., Dentista, Estudante)';
COMMENT ON COLUMN public.profiles.cro IS 'CRO registration number';
COMMENT ON COLUMN public.profiles.company IS 'Company or clinic name';
