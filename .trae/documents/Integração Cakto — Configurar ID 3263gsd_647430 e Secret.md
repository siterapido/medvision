## Visão Geral
- Configurar credenciais Cakto com ID de produto e secret, validar autenticidade, revisar endpoints existentes, reforçar segurança, testar via sandbox e documentar.
- O projeto já possui integração Cakto com rotas Next.js e uma Edge Function Supabase para webhooks.

## Credenciais e Extração do ID
- Extrair o ID de produto da URL `https://pay.cakto.com.br/3263gsd_647430` → ID: `3263gsd_647430`.
- Definir `NEXT_PUBLIC_CAKTO_PRODUCT_ID=3263gsd_647430` (frontend) e `CAKTO_PRODUCT_ID=3263gsd_647430` (server/Edge Function).
- Definir `CAKTO_WEBHOOK_SECRET=25031965-ab73-495c-84c0-affd56d5d531` apenas no ambiente server (Supabase Functions/CI), nunca no cliente.
- Onde é usado:
  - `app/lib/cakto.ts:3-6` usa `NEXT_PUBLIC_CAKTO_PRODUCT_ID` ou `CAKTO_PRODUCT_ID` para `CAKTO_BASE_URL`.
  - `supabase/functions/cakto/index.ts:7,21` usa `CAKTO_PRODUCT_ID` para `CHECKOUT_BASE_URL`.
  - Webhook secret validado em `supabase/functions/cakto/index.ts:6,58-79,112-139`.

## Validação de Autenticidade
- Produto ativo: fazer GET/HEAD em `https://pay.cakto.com.br/3263gsd_647430` e validar status 200 e ausência da mensagem conhecida “Produto não encontrado! Produto não disponível, inativo ou bloqueado.”.
- Secret válido: acionar “Enviar evento de teste” no painel Cakto para o webhook; confirmar:
  - Assinatura HMAC `x-cakto-signature` confere (`computeHmac` + `safeCompareHex`).
  - Fallback por `payload.secret === CAKTO_WEBHOOK_SECRET` (se header ausente).
- Opcional: se possuir OAuth (API oficial `https://api.cakto.com.br/`), criar/validar webhook via endpoint (`/public_api/webhook/`) com Bearer token.

## Endpoints Cakto (Conferência)
- Checkout URL:
  - `POST /api/cakto/checkout-url` gera `https://pay.cakto.com.br/3263gsd_647430?email=<email>&...` usando `generateCheckoutUrl` em `app/lib/cakto.ts:107-119`.
- Status de assinatura:
  - `GET /api/cakto/subscription` em `app/api/cakto/subscription/route.ts:5-18`, consulta `profiles` e retorna `{ success, user }`.
- Histórico de pagamentos:
  - `GET /api/cakto/payment-history` em `app/api/cakto/payment-history/route.ts:5-19` com RLS/administrativo.
- Webhooks (Supabase Edge Function):
  - `supabase/functions/cakto/index.ts` processa `purchase_approved`, `refund`, `subscription_cancelled`; atualiza `profiles` e registra `payment_history` (`index.ts:146-351,398-436`).

## Segurança da Chave Secreta
- Armazenar `CAKTO_WEBHOOK_SECRET` apenas em variáveis de ambiente do Supabase Functions/produção; nunca expor em `NEXT_PUBLIC_*`.
- Não logar o secret; manter validação com HMAC (`index.ts:112-126`) e comparação constante (`index.ts:128-139`).
- Rotacionar secret quando necessário e invalidar antigos; garantir TLS (HTTPS) nos webhooks.

## Testes em Sandbox
- Rodar a função local: `supabase functions serve cakto --port 54322` e expor com `ngrok http 54322`.
- Configurar o webhook no painel Cakto para a URL ngrok; enviar eventos de teste.
- Validar atualizações:
  - Plano premium: `purchase_approved` atualiza `profiles` (`plan_type=premium`, `subscription_status=active`) e insere em `payment_history`.
  - Cancelamento e reembolso: retornam para `free` e registram em histórico.

## Tratamento de Erros
- Assinatura inválida → `400` com `{ error: 'Assinatura inválida' }` (`index.ts:77-79`).
- Payload inválido → `400` (`index.ts:69-71`).
- Usuário não encontrado → `404` nas rotas Next (`subscription`: `app/api/cakto/subscription/route.ts:16-18`; `payment-history`: `app/api/cakto/payment-history/route.ts:16-18`).
- Produto inativo/ID incorreto no checkout → detectar mensagem “Produto não encontrado! …” e orientar suporte.
- Idempotência: garantir `transaction_id` único (`upsertPaymentHistory` `onConflict: 'transaction_id'` em `index.ts:418-436`).

## Documentação
- Consolidar na documentação existente:
  - `docs/guia-integracao-cakto-local.md` (variáveis e fluxo local) e `public/Guia_Completo_Integracao_Cakto.md` (guia completo).
- Adicionar seção com as credenciais específicas (ID e secret), checklist de validação e links para endpoints.

## Verificação do Uso do ID
- Confirmar que `3263gsd_647430` aparece em:
  - `app/lib/cakto.ts:3-6` (`CAKTO_BASE_URL`).
  - `supabase/functions/cakto/index.ts:21` (`CHECKOUT_BASE_URL`).
  - Respostas de `POST /api/cakto/checkout-url` retornam a URL com esse ID (`app/api/cakto/checkout-url/route.ts:38-39`).

## Checklist de Entrega
- Variáveis de ambiente definidas (frontend + server) com o novo ID e secret.
- Webhook Cakto apontando para a função com secret validado.
- Checkout gera URL com `3263gsd_647430` e e-mail do usuário.
- Testes de `purchase_approved`, `refund`, `subscription_cancelled` atualizam banco corretamente.
- Erros tratados e mensagens claras para produto inválido/inativo.
- Documentação atualizada com passos e referências.