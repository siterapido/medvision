#!/bin/bash

# Script de teste para validar webhook Cakto
# Uso: ./scripts/test-cakto-webhook.sh

set -e

echo "🧪 Testando webhook Cakto..."
echo ""

# Valores que precisam ser configurados
WEBHOOK_URL="${WEBHOOK_URL:-https://qphofwxpmmhfplylozsh.functions.supabase.co/cakto}"
CAKTO_SECRET="${CAKTO_WEBHOOK_SECRET:-}"

if [ -z "$CAKTO_SECRET" ]; then
  echo "❌ Erro: CAKTO_WEBHOOK_SECRET não configurado"
  echo ""
  echo "Configure com:"
  echo "  export CAKTO_WEBHOOK_SECRET=seu_secret_aqui"
  exit 1
fi

# Teste 1: Webhook com evento de pagamento aprovado
echo "📝 Teste 1: Evento purchase_approved"
echo "URL: $WEBHOOK_URL"
echo ""

RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"id\": \"test-$(date +%s)\",
      \"customer\": {
        \"name\": \"Test User\",
        \"email\": \"test-$(date +%s)@example.com\",
        \"phone\": \"11999999999\",
        \"docType\": \"cpf\",
        \"docNumber\": \"12345678909\"
      },
      \"amount\": 100,
      \"status\": \"paid\",
      \"paymentMethod\": \"credit_card\",
      \"product\": {
        \"id\": \"product-id\",
        \"name\": \"Test Product\"
      }
    },
    \"event\": \"purchase_approved\",
    \"secret\": \"$CAKTO_SECRET\"
  }")

echo "Resposta:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Verificar se foi sucesso
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Webhook processado com sucesso!"
else
  echo "⚠️  Verificar resposta acima"
fi

echo ""
echo "Próximos passos:"
echo "1. Verifique se o usuário foi criado/atualizado no banco"
echo "2. Consulte a tabela 'transaction_logs' para ver o histórico"
echo "3. Verifique os logs da Edge Function no Supabase Dashboard"
