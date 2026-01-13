# 🚀 Guia Rápido: Configurar WhatsApp + Agno

## Pré-requisitos

- ✅ Agno service rodando na porta 8000 (JÁ ESTÁ!)
- ✅ Next.js configurado (JÁ ESTÁ!)
- ⚠️ Credenciais Z-API (PRECISA CONFIGURAR)

## Passo 1: Obter Credenciais Z-API

1. Acesse: https://www.z-api.io/
2. Crie uma conta
3. Crie uma instância WhatsApp
4. Copie as credenciais:
   - `Instance ID`
   - `Token`
   - `Client Token`

## Passo 2: Configurar Variáveis de Ambiente

### No Next.js (`.env.local`):

```bash
# Z-API Credentials
Z_API_INSTANCE_ID=seu-instance-id-aqui
Z_API_TOKEN=seu-token-aqui
Z_API_CLIENT_TOKEN=seu-client-token-aqui
Z_API_WEBHOOK_SECRET=um-secret-seguro-aqui
```

### Opcional: No Agno Service (`odonto-gpt-agno-service/.env`):

```bash
# Z-API Credentials (mesmos valores)
Z_API_INSTANCE_ID=seu-instance-id-aqui
Z_API_TOKEN=seu-token-aqui
Z_API_CLIENT_TOKEN=seu-client-token-aqui
```

## Passo 3: Testar Localmente

### Opção A: Webhook Next.js (Recomendado)

```bash
# 1. Iniciar Next.js
npm run dev

# 2. Expor localhost com ngrok (em outro terminal)
ngrok http 3000

# 3. Configurar webhook Z-API com URL do ngrok:
# https://seu-ngrok-url.ngrok-free.app/api/webhooks/zapi
```

### Opção B: Endpoint Direto Agno

```bash
# 1. Testar endpoint direto
curl -X POST http://localhost:8000/api/v1/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5511999999999",
    "message": "O que é periodontite?",
    "userId": "test-user"
  }'
```

## Passo 4: Testar com WhatsApp Real

1. Envie uma mensagem do seu WhatsApp
2. Aguarde a resposta do bot
3. Verifique os logs no terminal

## Deploy Produção

### Vercel (Next.js)

```bash
# Configure variáveis no dashboard Vercel:
# - Z_API_INSTANCE_ID
# - Z_API_TOKEN
# - Z_API_CLIENT_TOKEN
# - Z_API_WEBHOOK_SECRET
# - AGNO_SERVICE_URL (URL do Agno service em produção)

# Deploy
npm run deploy
```

### Z-API Webhook URL

Configure no painel Z-API:
```
https://v0-odonto-gpt-ui.vercel.app/api/webhooks/zapi
```

## Problemas Comuns

### "Z-API credentials not configured"
→ Configure as variáveis Z_API_* no .env

### "Connection refused" no Agno service
→ Certifique-se que o Agno service está rodando: `npm run agno:dev`

### "401 Unauthorized" da Z-API
→ Verifique se Instance ID, Token e Client Token estão corretos

## Suporte

📖 Documentação completa: `docs/whatsapp-agno-integration.md`

🐛 Issues: Abra uma issue no GitHub

---

**Status da Integração:**
- ✅ Cliente Z-API Python criado
- ✅ Endpoint `/whatsapp` no Agno service
- ✅ Webhook Next.js configurado
- ✅ Documentação completa
- ⚠️ Credenciais Z-API necessárias (usuário deve configurar)
