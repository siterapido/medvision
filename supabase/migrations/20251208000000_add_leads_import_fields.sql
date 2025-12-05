ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS ies text,
ADD COLUMN IF NOT EXISTS sheet_source_name text,
ADD COLUMN IF NOT EXISTS sheet_source_description text;

COMMENT ON COLUMN public.leads.state IS 'Estado (UF) do lead';
COMMENT ON COLUMN public.leads.ies IS 'Instituição de Ensino Superior do lead';
COMMENT ON COLUMN public.leads.sheet_source_name IS 'Nome da planilha de origem da importação';
COMMENT ON COLUMN public.leads.sheet_source_description IS 'Descrição da planilha de origem da importação';

