## Diagnóstico
- Respostas do endpoint indicam processamento e idempotência, porém o projeto Supabase consultado não registra `webhook_events`, `transaction_logs`, `payment_history` nem criação/atualização de `profiles`.
- Forte indício de divergência de ambiente/credenciais na função Edge (usa outro `SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY`).
- O produto do payload não corresponde ao `CAKTO_PRODUCT_ID` atual; a Edge hoje não bloqueia por produto, a rota Next.js bloqueia.

## Objetivos
1) Garantir que a Edge escreva no projeto correto (mesmo `project_ref` do URL) e registre idempotência/auditoria.
2) Validar produto e assinatura de forma consistente (Edge e Next.js).
3) Confirmar RLS/políticas e migrações no projeto correto.
4) Criar um fluxo de testes E2E reproduzível.

## Passo 1: Credenciais e Ambiente (Edge)
- Conferir/ajustar variáveis na função Edge (Dashboard → Functions → Environment):
  - `SUPABASE_URL`: `https://qphofwxpmmhfplylozsh.supabase.co`.
  - `SUPABASE_SERVICE_ROLE_KEY`: service role do mesmo projeto (não usar anon).
  - `CAKTO_WEBHOOK_SECRET`: `25031965-ab73-495c-84c0-affd56d5d531`.
  - `APP_URL`: URL de redirecionamento do magic link.
- Redeploy da função `cakto` com env correto; validar via logs do Supabase.
- Código de referência: `supabase/functions/cakto/index.ts:4-10`, `15-20`.

## Passo 2: Validação de Produto
- Harmonizar a Edge com a rota Next:
  - Extrair/normalizar `CAKTO_PRODUCT_ID` (já existe): `supabase/functions/cakto/index.ts:22-43`.
  - Antes do switch de eventos, validar `data.product.id` ou `data.product.short_id` contra `CAKTO_PRODUCT_ID`; retornar `404` se não corresponder.
- Alternativa: atualizar `CAKTO_PRODUCT_ID` para o produto vigente do Cakto se o ID correto for diferente de `3263gsd_647430`.
- Rota Next já valida: `app/api/webhooks/cakto/route.ts:103-111`.

## Passo 3: Assinatura e Segurança
- Edge: manter HMAC SHA-256 (strict) e payload `secret` como fallback:
  - HMAC: `supabase/functions/cakto/index.ts:78-99`, `132-146`.
- Next.js: remover tolerância que aceita `secret` sem HMAC válido para alinhar rigor:
  - Remover o bloco permissivo: `app/api/webhooks/cakto/route.ts:79-83`.

## Passo 4: Persistência, Idempotência e RLS
- Garantir que tabelas existem no projeto correto:
  - `webhook_events`, `transaction_logs`, `payment_history`, campos de assinatura em `profiles`.
- Se necessário, aplicar migrações equivalentes às locais.
- Verificar RLS/políticas para permitir inserts com service role.
- Código de referência de writes:
  - Idempotência: `supabase/functions/cakto/index.ts:481-508`.
  - Logs: `supabase/functions/cakto/index.ts:640-669`.
  - Histórico: `supabase/functions/cakto/index.ts:452-479`.
  - Perfil: `supabase/functions/cakto/index.ts:441-449`.

## Passo 5: Observabilidade
- Ativar/consultar logs da função Edge após cada teste.
- Consultas de verificação (após envio):
  - `webhook_events` por `event_id`.
  - `transaction_logs` por `transaction_id`.
  - `payment_history` por `transaction_id`.
  - `profiles`/`auth.users` por e-mail.

## Passo 6: Testes E2E
- Enviar `purchase_approved` com:
  - `email` real (opcional, agora `example.com` já cria usuário).
  - `product` correspondente a `CAKTO_PRODUCT_ID`.
  - Novo `transaction_id`.
- Esperado:
  - `auth.users` criado (se inexistente), `profiles` atualizado para `premium/active` (+1 ano), `payment_history` inserido, `webhook_events` marcado, `transaction_logs` com eventos.

## Passo 7: Unificação de Fluxo (opcional)
- Definir Edge como ponto único de entrada.
- Rota Next.js pode apenas reencaminhar para Edge ou replicar idempotência/auditoria se precisa operar isolada.

## Passo 8: Alerta e Monitoramento
- Configurar alertas por falhas em logs.
- Revisar `Supabase Advisors` para segurança/performance.

## Entregáveis
- Função Edge com env correto e validação de produto.
- Persistência funcionando e verificável via consultas.
- Guia de teste E2E com critérios claros de sucesso.
