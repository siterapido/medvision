-- =====================================================
-- Update Pipeline System to SPIN Methodology
-- =====================================================
-- Migrates pipeline stages from old system to SPIN methodology:
-- Situação (S) → Problema (P) → Implicação (I) → Necessidade-Benefício (N) → Proposta Enviada → Convertido/Perdido

-- Step 1: Migrate existing data to new stages
UPDATE public.profiles
SET pipeline_stage = CASE
  WHEN pipeline_stage = 'novo_lead' THEN 'situacao'
  WHEN pipeline_stage = 'trial_ativo' THEN 'problema'
  WHEN pipeline_stage = 'urgente' THEN 'necessidade_beneficio'
  WHEN pipeline_stage = 'contato_realizado' THEN 'implicacao'
  WHEN pipeline_stage = 'proposta_enviada' THEN 'proposta_enviada'
  WHEN pipeline_stage = 'convertido' THEN 'convertido'
  WHEN pipeline_stage = 'perdido' THEN 'perdido'
  ELSE pipeline_stage
END
WHERE pipeline_stage IS NOT NULL;

-- Step 2: Drop old constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_pipeline_stage_check;

-- Step 3: Add new constraint with SPIN stages
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_pipeline_stage_check
CHECK (
  pipeline_stage IS NULL OR 
  pipeline_stage IN (
    'situacao',
    'problema',
    'implicacao',
    'necessidade_beneficio',
    'proposta_enviada',
    'convertido',
    'perdido'
  )
);

-- Step 4: Update comment
COMMENT ON COLUMN public.profiles.pipeline_stage IS 'Etapa atual do lead no pipeline SPIN: situacao, problema, implicacao, necessidade_beneficio, proposta_enviada, convertido, perdido';



