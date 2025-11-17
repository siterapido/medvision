## Diagnóstico
- O código atual utiliza `profiles.plan_type` em leituras/atualizações (função `cakto`, libs). Não há referências a `profiles.plan` no repositório.
- No seu banco, existe também a coluna `profiles.plan` e você deseja manter apenas `plan_type` para evitar confusão.

## Migração (DDL + backfill)
1. Backfill seguro:
   - Atualizar `plan_type` onde estiver nulo com o valor de `plan` normalizado (`free`/`premium`):
   - `UPDATE public.profiles SET plan_type = LOWER(plan) WHERE plan IS NOT NULL AND (plan_type IS NULL OR plan_type = '' );`
   - Opcional: mapear valores fora do conjunto esperado para `free`.
2. Remoção da coluna legada:
   - `ALTER TABLE public.profiles DROP COLUMN IF EXISTS plan;`
3. Arquivo de migração: `supabase/migrations/0xx_drop_profiles_plan.sql` contendo `BEGIN;` + backfill + `DROP COLUMN` + `COMMIT;`.

## Validação
- Consultas de verificação:
  - `SELECT plan_type, COUNT(*) FROM public.profiles GROUP BY 1;`
  - Confirmar inexistência de `plan`: `SELECT column_name FROM information_schema.columns WHERE table_name='profiles' AND column_name='plan';`
- Fluxo webhook `purchase_approved`: confirmar que continua atualizando `plan_type`.

## Impacto em código
- Não há referências a `profiles.plan` no repositório; nenhuma mudança de código é necessária.
- Tipagens/consultas já usam `plan_type`.

## Rollback (se necessário)
- Recriar coluna: `ALTER TABLE public.profiles ADD COLUMN plan text;`
- Repopular: `UPDATE public.profiles SET plan = plan_type;`

## Resultado Esperado
- `profiles` fica somente com `plan_type` como fonte da verdade.
- Nenhuma quebra no webhook ou no front-end, já que o código usa `plan_type`. 