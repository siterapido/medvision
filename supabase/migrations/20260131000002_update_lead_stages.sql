-- =====================================================
-- Update Cold Lead Stages from SPIM to Conversion-Focused
-- =====================================================
-- Old SPIM stages: novo_lead, situacao, problema, implicacao, motivacao, convertido, nao_convertido
-- New stages: novo_lead, contato_realizado, interessado, aguardando_cadastro, convertido, descartado

-- First, map existing leads to new stages
UPDATE public.leads SET status =
  CASE status
    WHEN 'situacao' THEN 'contato_realizado'
    WHEN 'problema' THEN 'interessado'
    WHEN 'implicacao' THEN 'interessado'
    WHEN 'motivacao' THEN 'aguardando_cadastro'
    WHEN 'nao_convertido' THEN 'descartado'
    ELSE status
  END
WHERE status IN ('situacao', 'problema', 'implicacao', 'motivacao', 'nao_convertido');

-- Drop old constraint
ALTER TABLE public.leads
DROP CONSTRAINT IF EXISTS leads_status_check;

-- Add new constraint with conversion-focused stages
ALTER TABLE public.leads
ADD CONSTRAINT leads_status_check
CHECK (
  status IN (
    'novo_lead',           -- Lead recém importado
    'contato_realizado',   -- Primeiro contato feito
    'interessado',         -- Demonstrou interesse real
    'aguardando_cadastro', -- Convite enviado, aguardando cadastro
    'convertido',          -- Cadastrou no trial
    'descartado'           -- Não qualificado
  )
);

-- Update comments
COMMENT ON COLUMN public.leads.status IS 'Etapa do funil de prospecção: novo_lead → contato_realizado → interessado → aguardando_cadastro → convertido/descartado';
