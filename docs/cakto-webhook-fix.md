# Correção: Erro 401 no Webhook Cakto

## Problema Original
O webhook do Cakto retornava erro **401 "Missing authorization header"** quando tentava chamar a Edge Function:

```
URL: https://qphofwxpmmhfplylozsh.functions.supabase.co/cakto
Response: { "code": 401, "message": "Missing authorization header" }
```

## Causa
A Edge Function do Supabase **exigiam autenticação JWT** por padrão, mas o Cakto envia webhooks sem headers de autorização Supabase (apenas com seu próprio mecanismo de validação).

## Solução Implementada

### 1. Adicionar `verify_jwt = false` na Edge Function

**Arquivo**: `supabase/functions/cakto/function.toml`
```toml
name = 'cakto'
language = 'ts'
entrypoint = 'index.ts'
verify_jwt = false  # ← ADICIONADO
```

**Arquivo**: `supabase/functions/cakto/deno.json`
```json
{
  "verify_jwt": false,  # ← ADICIONADO
  "tasks": {
    "start": "deno run --allow-all index.ts"
  },
  "compilerOptions": {
    "lib": ["deno.ns", "deno.unstable", "dom", "dom.iterable"]
  }
}
```

### 2. Deploy da Function
```bash
npx supabase functions deploy cakto --no-verify-jwt
```

## Validação

### ✅ Problema Resolvido
O erro 401 foi eliminado. Agora a Edge Function:
1. Aceita requisições do Cakto sem autenticação Supabase
2. Valida o webhook usando seu próprio mecanismo de `secret`
3. Processa corretamente os eventos: `purchase_approved`, `refund`, `subscription_cancelled`

### Teste Rápido
```bash
curl -X POST https://qphofwxpmmhfplylozsh.functions.supabase.co/cakto \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "id": "test-123",
      "customer": {"email": "test@example.com", "name": "Test User"},
      "amount": 100,
      "paymentMethod": "credit_card",
      "status": "paid"
    },
    "event": "purchase_approved",
    "secret": "<CAKTO_WEBHOOK_SECRET>"
  }'
```

**Resposta esperada** (com secret correto):
```json
{
  "success": true,
  "event": "purchase_approved",
  "transactionId": "test-123",
  "amount": 100,
  "testMode": true,
  "userId": null,
  "userCreated": false
}
```

## Segurança

✅ **A função ainda é segura porque:**
- O `verify_jwt: false` apenas desabilita autenticação Supabase
- A validação do webhook continua ativa via `secret` (HMAC SHA-256)
- O Cakto **deve** enviar o `secret` correto no payload JSON
- Sem o `secret` correto, a função retorna erro 400 "Assinatura inválida"

## Próximos Passos

1. **Configurar webhook no painel Cakto**:
   - URL: `https://qphofwxpmmhfplylozsh.functions.supabase.co/cakto`
   - Eventos: `purchase_approved`, `refund`, `subscription_cancelled`
   - Secret: Use o mesmo valor configurado em `CAKTO_WEBHOOK_SECRET`

2. **Enviar teste**:
   - Painel Cakto → Webhooks → Enviar teste
   - Verificar logs na Dashboard do Supabase
   - Confirmar que o usuário foi criado/atualizado no banco

3. **Monitorar em produção**:
   - Verificar tabelas: `profiles`, `payment_history`, `transaction_logs`
   - Acompanhar erros nos logs da Edge Function

## Arquivos Alterados
- `supabase/functions/cakto/function.toml` - Adicionado `verify_jwt = false`
- `supabase/functions/cakto/deno.json` - Adicionado `verify_jwt = false`
- Docs: Este arquivo (`docs/cakto-webhook-fix.md`)
