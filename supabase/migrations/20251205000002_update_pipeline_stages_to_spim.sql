-- =====================================================
-- Update Pipeline Stages to SPIM
-- =====================================================

-- Drop old constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_pipeline_stage_check;

-- Add new constraint with SPIM stages
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_pipeline_stage_check
CHECK (
  pipeline_stage IS NULL OR 
  pipeline_stage IN (
    'situacao',
    'problema',
    'implicacao',
    'motivacao',
    'convertido'
  )
);

-- Update comment
COMMENT ON COLUMN public.profiles.pipeline_stage IS 'Etapa atual do lead no pipeline de conversão SPIM: situacao, problema, implicacao, motivacao, convertido';

-- Migrate existing data from old stages to new stages
UPDATE public.profiles
SET pipeline_stage = 
  CASE 
    WHEN pipeline_stage = 'necessidade_beneficio' THEN 'motivacao'
    WHEN pipeline_stage = 'proposta_enviada' THEN 'motivacao'
    WHEN pipeline_stage = 'perdido' THEN NULL
    ELSE pipeline_stage
  END
WHERE pipeline_stage IN ('necessidade_beneficio', 'proposta_enviada', 'perdido');

