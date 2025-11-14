#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL do webhook - API Route do Next.js (recomendado) ou Edge Function
WEBHOOK_URL="http://localhost:3000/api/webhooks/cakto"
WEBHOOK_URL_PROD="https://odontogpt.com/api/webhooks/cakto"
SECRET="25031965-ab73-495c-84c0-affd56d5d531"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Teste do Webhook Cakto${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Payload do webhook (baseado no exemplo fornecido)
PAYLOAD='{
  "data": {
    "id": "ef8f3c89-ad6d-406d-85c9-b3407d906fa3",
    "amount": 90,
    "status": "paid",
    "paymentMethod": "credit_card",
    "paidAt": "2025-11-14T12:53:19.513865+00:00",
    "createdAt": "2025-11-14T12:53:19.513865+00:00",
    "customer": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "34999999999",
      "docType": "cpf",
      "docNumber": "12345678909"
    },
    "product": {
      "id": "ff3fdf61-e88f-43b5-982a-32d50f112414",
      "name": "Plano Anual Pro",
      "short_id": "AckhQ75"
    },
    "subscription": {
      "id": "3385bc20-6e05-4db3-a838-d72968d44302",
      "status": "active",
      "next_payment_date": "2025-12-14T12:53:19.513865+00:00"
    }
  },
  "event": "purchase_approved",
  "secret": "'"$SECRET"'"
}'

echo -e "${YELLOW}Testando local (localhost:3000)${NC}"
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
  echo "1. Verifique se CAKTO_PRODUCT_ID está correto"
  echo "2. Product ID deve ser: ff3fdf61-e88f-43b5-982a-32d50f112414"
elif [ "$HTTP_CODE" = "000" ] || [ -z "$HTTP_CODE" ]; then
  echo -e "${RED}✗ Erro de conexão${NC}"
  echo -e "${YELLOW}Resposta:${NC}"
  echo "$BODY"
  echo -e "\n${YELLOW}Dicas:${NC}"
  echo "1. Verifique se o servidor está rodando em localhost:3000"
  echo "2. Execute: npm run dev"
  echo "3. Para produção, use: $WEBHOOK_URL_PROD"
else
  echo -e "${RED}✗ Erro ${HTTP_CODE}${NC}"
  echo -e "${YELLOW}Resposta:${NC}"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}URLs de Webhook:${NC}"
echo -e "Local:       ${BLUE}$WEBHOOK_URL${NC}"
echo -e "Produção:    ${BLUE}$WEBHOOK_URL_PROD${NC}\n"

echo -e "${YELLOW}Para configurar no Cakto:${NC}"
echo "1. Acesse https://cakto.com.br/dashboard"
echo "2. Vá em Configurações > Webhooks"
echo "3. Configure a URL correta (local ou produção)"
echo "4. Secret: $SECRET"
echo "5. Eventos: purchase_approved, refund, subscription_cancelled\n"
