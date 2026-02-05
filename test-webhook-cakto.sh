#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL do webhook - Edge Function do Supabase
WEBHOOK_URL="https://fjcbowphcbnvuowsjvbz.supabase.co/functions/v1/cakto"
WEBHOOK_URL_LOCAL="http://localhost:54321/functions/v1/cakto"
SECRET="05cbcfb3-c526-4863-ad12-b2d395035f8b"

# IDs dos produtos Cakto (Nova conta - 2026-02)
CAKTO_BASIC_ANNUAL_PLAN_ID="pdjvzs7_751299"
CAKTO_PRO_ANNUAL_PLAN_ID="76x6iou_751311"
CAKTO_CERTIFICATE_ID="pi6xasc_754503"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Teste do Webhook Cakto${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Payload do webhook (baseado no exemplo fornecido)
PAYLOAD='{
  "data": {
    "id": "test-tx-'"$(date +%s)"'",
    "amount": 597,
    "status": "paid",
    "paymentMethod": "credit_card",
    "paidAt": "'"$(date -u +%Y-%m-%dT%H:%M:%S.000000+00:00)"'",
    "createdAt": "'"$(date -u +%Y-%m-%dT%H:%M:%S.000000+00:00)"'",
    "customer": {
      "name": "Usuario Teste",
      "email": "teste@odontogpt.com",
      "phone": "11999999999",
      "docType": "cpf",
      "docNumber": "12345678909"
    },
    "product": {
      "id": "'"$CAKTO_PRO_ANNUAL_PLAN_ID"'",
      "name": "Plano Pro Anual",
      "short_id": "'"$CAKTO_PRO_ANNUAL_PLAN_ID"'"
    },
    "subscription": {
      "id": "sub-'"$(date +%s)"'",
      "status": "active",
      "next_payment_date": "'"$(date -u -v+1y +%Y-%m-%dT%H:%M:%S.000000+00:00 2>/dev/null || date -u -d '+1 year' +%Y-%m-%dT%H:%M:%S.000000+00:00)"'"
    }
  },
  "event": "purchase_approved",
  "secret": "'"$SECRET"'"
}'

echo -e "${YELLOW}Testando Edge Function Supabase${NC}"
echo -e "${BLUE}$WEBHOOK_URL${NC}\n"

echo -e "${YELLOW}Payload:${NC}"
echo "$PAYLOAD" | jq . 2>/dev/null || echo "$PAYLOAD"
echo ""

# Fazer a requisição
echo -e "${YELLOW}Fazendo requisição...${NC}\n"
RESPONSE=$(curl -X POST \
  "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\n%{http_code}" \
  -s 2>&1)

# Separar resposta e código HTTP
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${YELLOW}Status HTTP:${NC} ${HTTP_CODE}"
echo ""

# Interpretar resposta
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Webhook processado com sucesso!${NC}"
  echo -e "${YELLOW}Resposta:${NC}"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" = "401" ]; then
  echo -e "${RED}✗ Erro 401 - Assinatura inválida${NC}"
  echo -e "${YELLOW}Resposta:${NC}"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  echo -e "\n${YELLOW}Dicas:${NC}"
  echo "1. Verifique se CAKTO_WEBHOOK_SECRET está correto"
  echo "2. A secret no payload deve ser: $SECRET"
elif [ "$HTTP_CODE" = "404" ]; then
  echo -e "${RED}✗ Erro 404 - Produto não encontrado${NC}"
  echo -e "${YELLOW}Resposta:${NC}"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  echo -e "\n${YELLOW}Dicas:${NC}"
  echo "1. Verifique se o Product ID está correto"
  echo "2. IDs válidos: $CAKTO_BASIC_ANNUAL_PLAN_ID, $CAKTO_PRO_ANNUAL_PLAN_ID, $CAKTO_CERTIFICATE_ID"
elif [ "$HTTP_CODE" = "000" ] || [ -z "$HTTP_CODE" ]; then
  echo -e "${RED}✗ Erro de conexão${NC}"
  echo -e "${YELLOW}Resposta:${NC}"
  echo "$BODY"
  echo -e "\n${YELLOW}Dicas:${NC}"
  echo "1. Verifique sua conexão com a internet"
  echo "2. Verifique se a Edge Function está ativa no Supabase"
  echo "3. URL: $WEBHOOK_URL"
else
  echo -e "${RED}✗ Erro ${HTTP_CODE}${NC}"
  echo -e "${YELLOW}Resposta:${NC}"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}URLs de Webhook:${NC}"
echo -e "Produção:    ${BLUE}$WEBHOOK_URL${NC}"
echo -e "Local:       ${BLUE}$WEBHOOK_URL_LOCAL${NC}\n"

echo -e "${YELLOW}Para configurar no Cakto:${NC}"
echo "1. Acesse https://app.cakto.com.br/dashboard/apps"
echo "2. Vá em Webhook > Adicionar"
echo "3. URL: $WEBHOOK_URL"
echo "4. Secret: $SECRET"
echo "5. Eventos: purchase_approved, refund, subscription_cancelled"
echo "6. Tipo: Disparo individual\n"

echo -e "${YELLOW}IDs dos Produtos:${NC}"
echo "Basico Anual:  $CAKTO_BASIC_ANNUAL_PLAN_ID"
echo "Pro Anual:     $CAKTO_PRO_ANNUAL_PLAN_ID"
echo "Certificado:   $CAKTO_CERTIFICATE_ID\n"
