## Escopo
- Validar o webhook do Cakto pela função Edge `cakto` e, se necessário, pela rota Next.js `POST /api/webhooks/cakto`.
- Usar os logs e tabelas do Supabase para confirmar processamento, idempotência e atualizações de perfil/histórico.

## Preparação
- Endpoint preferido para o teste: `https://<project_ref>.functions.supabase.co/cakto` (função Edge).
- Variáveis exigidas (ambiente de execução): `CAKTO_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CAKTO_PRODUCT_ID` (ou `NEXT_PUBLIC_CAKTO_PRODUCT_ID`).
- Produto esperado: normalizado via extrator de ID (curinga `3263gsd_647430` se faltante).

## Execução de verificação
- Assim que você enviar o teste, vou:
  - Capturar logs recentes da Edge Function (últimos 60s) e verificar status da resposta HTTP.
  - Consultar (modo leitura) as tabelas: `webhook_events` (idempotência), `transaction_logs` (auditoria), `payment_history` (histórico) e `profiles` (perfil), filtrando por `transaction_id` e `email` do cliente.
  - Validar HMAC/secret, produto, evento e efeitos colaterais (perfil premium/free, histórico e-mail/magic link quando aplicável).
  - Consolidar um relatório com critérios de sucesso e pontos de falha.

## Critérios de sucesso
- Assinatura válida: `x-cakto-signature` (HMAC SHA-256) ou `payload.secret` igual a `CAKTO_WEBHOOK_SECRET`.
- Registro criado em `webhook_events` para o `transaction_id` do evento.
- Linha correspondente em `transaction_logs` com `status` compatível (processing/success/error).
- Upsert em `payment_history` por `transaction_id` (sem duplicidade).
- Atualização de `profiles` coerente com o evento (`premium/active` em compra; `free/refunded` em reembolso; `free/canceled` em cancelamento).

## Correções planejadas (se necessário)
- Rota Next.js: corrigir `generateSecurePassword`, que hoje usa `crypto.getRandomValues` (não disponível no módulo Node `crypto`), para `crypto.randomBytes` ou `crypto.webcrypto.getRandomValues`. Referência: `app/api/webhooks/cakto/route.ts:359-369`.
- Incluir idempotência e auditoria na rota Next.js, espelhando `webhook_events` e `transaction_logs` usados na função Edge.
- Harmonizar validação de produto e assinatura entre a rota e a função (remover tolerâncias excessivas; garantir comparação constante e mensagens claras).
- Aprimorar logs de erro e mensagens de retorno para facilitar troubleshooting.

## Observabilidade (referências de código)
- Next.js: `app/api/webhooks/cakto/route.ts:33` (POST); `52-71` (HMAC); `73-83` (fallback secret); `103-111` (produto); `140-250` (purchase_approved); `265-310` (refund); `312-357` (subscription_cancelled); `359-369` (senha temporária).
- Edge Function: `supabase/functions/cakto/index.ts:56-118` (fluxo); `132-146` (HMAC Web Crypto); `166-316` (purchase_approved); `318-356` (refund); `358-394` (subscription_cancelled); `497-508` (idempotência); `640-669` (logs); `590-602` (senha temporária).

## O que preciso de você
- Enviar o teste para o endpoint da função Edge `cakto`.
- Compartilhar o `email` e o `transaction_id` usados no teste (para filtragem precisa em logs/tabelas).

Confirmando, sigo com a verificação em tempo real pelos logs do Supabase e apresento o relatório com possíveis correções.