-- =====================================================
-- Adiciona coluna "Não Convertido" aos pipelines
-- =====================================================

-- Drop old constraint para profiles
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_pipeline_stage_check;

-- Adiciona nova constraint com 'nao_convertido' incluído para profiles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_pipeline_stage_check
CHECK (
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

-- Atualiza comentário para profiles
COMMENT ON COLUMN public.profiles.pipeline_stage IS 'Etapa atual do lead no pipeline de conversão SPIM: novo_usuario, situacao, problema, implicacao, motivacao, convertido, nao_convertido';

-- =====================================================
-- Atualiza constraint da tabela leads (se existir)
-- =====================================================

DO $$
BEGIN
  -- Verifica se a tabela leads existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'leads'
  ) THEN
    -- Drop constraint antiga
    ALTER TABLE public.leads
    DROP CONSTRAINT IF EXISTS leads_status_check;
    
    -- Adiciona nova constraint com 'nao_convertido'
    ALTER TABLE public.leads
    ADD CONSTRAINT leads_status_check
    CHECK (
      status IN (
        'novo_lead',
        'situacao',
        'problema',
        'implicacao',
        'motivacao',
        'convertido',
        'nao_convertido'
      )
    );
    
    -- Atualiza comentário
    EXECUTE 'COMMENT ON COLUMN public.leads.status IS ''Status do lead no pipeline SPIM: novo_lead, situacao, problema, implicacao, motivacao, convertido, nao_convertido''';
  END IF;
END $$;


