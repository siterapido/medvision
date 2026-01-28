-- =====================================================
-- Fix Pipeline Stage Enum Constraint
-- Align CHECK constraint with SPIM model stages
-- =====================================================

-- Drop old constraint (if exists)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pipeline_stage_check;

-- Add corrected constraint matching SPIM model
-- Stages: novo_usuario, situacao, problema, implicacao, motivacao, convertido, nao_convertido
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pipeline_stage_check CHECK (
  pipeline_stage IS NULL OR
  pipeline_stage IN (
    'novo_usuario',
    'situacao',
    'problema',
    'implicacao',
    'motivacao',
    'convertido',
    'nao_convertido'
  )
);

-- Update table comment to reflect correct stages
COMMENT ON COLUMN public.profiles.pipeline_stage IS 'Etapa atual do lead no pipeline de conversão SPIM: novo_usuario, situacao, problema, implicacao, motivacao, convertido, nao_convertido';
