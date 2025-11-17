-- Remover coluna legada `plan` de `public.profiles` e padronizar uso de `plan_type`
-- Safe backfill + drop

BEGIN;

-- Executar backfill e remoção apenas se a coluna `plan` existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan'
  ) THEN
    -- Backfill: mover valores plausíveis de `plan` para `plan_type` apenas quando `plan_type` estiver vazio/nulo
    UPDATE public.profiles
    SET plan_type = CASE
      WHEN plan IS NULL THEN plan_type
      WHEN LOWER(TRIM(plan)) IN ('premium','pro','paid') THEN 'premium'
      WHEN LOWER(TRIM(plan)) IN ('free','basic') THEN 'free'
      ELSE COALESCE(plan_type, 'free')
    END
    WHERE (plan_type IS NULL OR plan_type = '');

    -- Remover coluna legada
    ALTER TABLE public.profiles DROP COLUMN plan;
  END IF;
END
$$;

COMMIT;