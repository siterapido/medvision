## Objetivo
- Criar/atualizar automaticamente o usuário no Supabase quando o webhook Cacto enviar `purchase_approved` com `status=paid`, vinculando o Plano Anual ao produto e registrando assinatura e pagamento com segurança e idempotência.

## Fluxo do Webhook
1. Receber POST na função de borda (`supabase/functions/cakto/index.ts`).
2. Validar segredo do webhook (`secret`) com comparação em tempo constante e origem do produto.
3. Verificar evento: `event === 'purchase_approved'` e `data.status === 'paid'`.
4. Aplicar idempotência usando `data.id` ou `refId` (não processar duas vezes o mesmo pedido).
5. Criar/atualizar usuário via `auth.admin` com email do cliente e `email_confirm=true`.
6. Atualizar `profiles` com Plano Anual e dados essenciais do cliente.
7. Registrar/atualizar `subscriptions` e `payment_history` com dados do pedido.
8. Retornar 200 em sucesso; tratar e responder erros com mensagens claras.

## Validações e Segurança
- Segredo: comparar `secret` do payload com `CAKTO_WEBHOOK_SECRET` usando comparação segura.
- Produto: validar `product.id` ou `product.short_id` contra `CAKTO_PRODUCT_ID`. Se não corresponder ou estiver inativo/bloqueado, responder 404 com: "Produto não encontrado! Produto não disponível, inativo ou bloqueado. Contate o suporte para mais informações.".
- Idempotência: tabela `webhook_events` com chave única em `event_id` (`data.id` ou `refId`). Se já existe, encerrar com 200.
- Princípio do mínimo necessário: não armazenar dados sensíveis além do necessário (p.ex., mascarar `docNumber`).
- Sem logs de segredos/PII; logs apenas de IDs e estados.

## Mapeamento dos Campos
- Usuário (`auth.admin`): `email`, `user_metadata` com `name`, `phone`, `docType`, `product_id`, `refId`.
- Perfil (`profiles`): `user_id`, `name`, `phone`, `doc_type`, `plan_type='annual'`, `subscription_status='active'`, `plan_expires_at=paidAt + 365 dias`, `product_id`.
- Assinatura (`subscriptions`): `subscription_id` (do `data.subscription.id`), `user_id`, `product_id`, `status`, `payment_method`, `current_period`, `next_payment_date`, `recurrence_period`, `trial_days`.
- Pagamento (`payment_history`): `order_id` (`data.id`), `amount`, `base_amount`, `discount`, `fees`, `status`, `paid_at`, `payment_method`, `installments`, `parent_order`, `checkout_url`.
- Idempotência (`webhook_events`): `event_id`, `type='purchase_approved'`, `received_at`, `raw_payload` (opcional, sem PII).

## Ações no Banco e RLS
- Confirmar/ajustar migrations (já existem bases como `profiles`, `subscriptions`, `payment_history`). Caso faltem:
  - Criar `webhook_events` com RLS restrito ao serviço (apenas Service Role insere/seleciona).
  - Garantir RLS:
    - `profiles`: `auth.uid() = user_id` para SELECT/UPDATE; INSERT via backend/Service Role.
    - `subscriptions` e `payment_history`: `auth.uid() = user_id` para SELECT; INSERT/UPDATE via backend.
- Índices: em `event_id` (único), `user_id`, `subscription_id`.

## Erros, Reembolsos e Chargebacks
- Reembolso: se `refundedAt` presente, marcar `subscriptions.status='canceled'` e `profiles.subscription_status='canceled'`; ajustar `plan_expires_at` para `paidAt`.
- Chargeback: se `chargedbackAt` presente, mesmo tratamento de cancelamento com razão de chargeback.
- Recusa de cartão: se `reason` presente e `status != 'paid'`, registrar em `payment_history` como falha e não criar plano.

## Testes e Observabilidade
- Teste local com `supabase functions serve` e cURL contendo o payload fornecido.
- Casos de teste: sucesso idempotente, produto inválido, segredo inválido, reembolso, chargeback.
- Logs: usar `console.log` mínimos no Edge (IDs, estados) e monitorar via painel de logs do Supabase.

## Pré‑requisitos de Configuração
- Variáveis de ambiente:
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Edge Admin).
  - `CAKTO_WEBHOOK_SECRET` (comparação segura).
  - `CAKTO_PRODUCT_ID` (ID ou `short_id` do produto anual).
  - `CAKTO_PLAN_TYPE=annual` e `CAKTO_PLAN_DURATION_DAYS=365` (parametrização de plano).
  - `APP_URL` (links de onboarding se necessário).
- Clients já existentes:
  - Admin: `lib/supabase/admin.ts`.
  - Server/Client: `lib/supabase/server.ts`, `lib/supabase/client.ts`.
  - Função Cakto: `supabase/functions/cakto/index.ts` (expandir para cobrir mapeamento acima).

## Entregáveis
- Função de borda robusta que:
  - Valida `secret` e produto.
  - Cria/atualiza usuário (idempotente).
  - Atualiza `profiles` com Plano Anual e expiração.
  - Persiste `subscriptions` e `payment_history`.
  - Garante idempotência em `webhook_events`.
  - Responde erros com mensagens consistentes.

## Próximos Passos
1. Ajustar/estender `supabase/functions/cakto/index.ts` para o mapeamento completo e cenários de erro.
2. Verificar/ajustar migrations e RLS para `webhook_events`, `subscriptions`, `payment_history` conforme políticas.
3. Configurar variáveis de ambiente no projeto Supabase.
4. Executar bateria de testes com o payload de exemplo e casos de reembolso/chargeback.
5. Integrar UI (se aplicável) para refletir `profiles.plan_type`, `subscription_status` e expiração do plano.