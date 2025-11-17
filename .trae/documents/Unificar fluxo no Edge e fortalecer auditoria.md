## Objetivo
Concentrar processamento no Supabase Edge (`cakto`) e usar a rota Next.js apenas como proxy, além de fortalecer logs e idempotência em todos os eventos.

## Implementações
- Rota Next.js `/api/webhooks/cakto`: transformar em proxy para `https://<project_ref>.functions.supabase.co/cakto`, repassando corpo e cabeçalhos, retornando o status/JSON da função Edge.
- Função Edge `cakto`:
  - Adicionar `logTransaction` em `refund` e `subscription_cancelled` no início (processing), em sucesso, e em caminhos de erro/USER_NOT_FOUND.
  - Manter `markEventProcessed` e `upsertPaymentHistory` como já existentes.

## Validações
- Produto já validado na Edge contra `CAKTO_PRODUCT_ID`.
- Assinatura HMAC (strict) na Edge; Next passa headers para a Edge.

## Teste E2E
- Enviar novo `purchase_approved` com `transaction_id` único e produto correspondente a `CAKTO_PRODUCT_ID`.
- Verificar `auth.users`, `profiles`, `payment_history`, `webhook_events`, `transaction_logs` pelo `transaction_id` e e-mail.

## Observabilidade
- Checar logs da função Edge após envio.

Se aprovado, aplico as mudanças e preparo para testes.