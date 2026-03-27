-- =====================================================
-- Add student academic context fields to profiles
-- Safe to run multiple times (IF NOT EXISTS)
-- =====================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS university text,       -- Universidade atual ou onde se formou
  ADD COLUMN IF NOT EXISTS semester text,         -- Ex: "8º Semestre", "Graduado", "Especializando"
  ADD COLUMN IF NOT EXISTS specialty_interest text, -- Ex: "Ortodontia", "Implantodontia"
  ADD COLUMN IF NOT EXISTS academic_level text;   -- Ex: "Graduando", "Profissional", "Especialista"

COMMENT ON COLUMN public.profiles.university IS 'Universidade onde o usuário estuda ou se formou';
COMMENT ON COLUMN public.profiles.semester IS 'Semestre atual do curso ou status de conclusão';
COMMENT ON COLUMN public.profiles.specialty_interest IS 'Especialidade de maior interesse do usuário';
COMMENT ON COLUMN public.profiles.academic_level IS 'Nível de formação: Graduando, Profissional, Especialista, Residente';

-- Migrate data from institution -> university for existing users (if institution is populated)
UPDATE public.profiles
SET university = institution
WHERE institution IS NOT NULL
  AND university IS NULL;
