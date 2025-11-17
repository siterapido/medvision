## Objetivo
Verificar se o webhook que retornou 200 efetivamente criou/atualizou o usuário e o perfil, registrou histórico e manteve idempotência.

## O que vou checar
- Logs da função Edge `cakto` para confirmar processamento e etapas.
- Tabelas: `webhook_events`, `transaction_logs`, `payment_history`, `profiles` e `auth.users` por `transaction_id` e `email`.
- Critérios: assinatura válida, idempotência registrada, histórico de pagamento inserido/atualizado, perfil marcado como `premium/active` com `expires_at` +1 ano e `last_payment_date` recente, usuário existente no Auth.

## Passos (somente leitura)
1) Capturar logs recentes da função Edge (últimos 60s) e identificar o evento.
2) Consultar:
- `SELECT * FROM public.webhook_events WHERE event_id = '<transaction_id>'`.
- `SELECT * FROM public.transaction_logs WHERE transaction_id = '<transaction_id>' ORDER BY created_at DESC`.
- `SELECT * FROM public.payment_history WHERE transaction_id = '<transaction_id>'`.
- `SELECT id,email,plan_type,subscription_status,expires_at,last_payment_date,payment_method FROM public.profiles WHERE email = '<email>'`.
- `SELECT id,email FROM auth.users WHERE email = '<email>'`.
3) Consolidar um relatório indicando se a conta foi criada/atualizada e se há inconsistências.

## Possíveis correções se algo falhar
- Se o fluxo foi pela rota Next.js e faltarem logs/idempotência: espelhar `webhook_events` e `transaction_logs` como na Edge (`supabase/functions/cakto/index.ts:481-508`, `640-669`) e harmonizar validação.
- Se houver falha na criação de usuário por client errado: confirmar uso do admin client e senha segura (já corrigido em `app/api/webhooks/cakto/route.ts:112`, `359-369`).
- Ajustar RLS/políticas se houver bloqueios nos inserts.

## Referências no código
- Next.js: `app/api/webhooks/cakto/route.ts:33-138` (entrada/validação); `140-250` (purchase_approved);
- Edge: `supabase/functions/cakto/index.ts:166-316` (purchase_approved), `497-508` (idempotência), `640-669` (logs).

## Precisarei dos filtros
Para precisão, compartilhe o `email` e o `transaction_id` usados no teste. Se não vierem, farei a checagem pelos logs e cruzarei pelos últimos registros inseridos em `payment_history` e `profiles` no intervalo do teste.