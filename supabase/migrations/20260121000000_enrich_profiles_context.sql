-- Add academic context fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS university text,
ADD COLUMN IF NOT EXISTS semester text, -- E.g., "8º Semestre" or "Graduado"
ADD COLUMN IF NOT EXISTS specialty_interest text, -- E.g., "Ortodontia"
ADD COLUMN IF NOT EXISTS level text; -- E.g., "Graduando", "Especialista"

COMMENT ON COLUMN profiles.university IS 'Universidade onde o usuário estuda ou se formou';
COMMENT ON COLUMN profiles.semester IS 'Semestre atual do curso ou status de conclusão';
COMMENT ON COLUMN profiles.specialty_interest IS 'Especialidade de maior interesse do usuário';
COMMENT ON COLUMN profiles.level IS 'Nível de formação (Graduando, Profissional, etc)';
