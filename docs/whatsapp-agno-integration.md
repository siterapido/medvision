# Integração WhatsApp + Agno AI Service

Este documento descreve como configurar e usar a integração entre o WhatsApp (via Z-API) e o Agno AI Service para criar um bot de inteligência artificial odontológica.

## 🎯 Visão Geral

A integração permite que usuários enviem mensagens pelo WhatsApp e recebam respostas inteligentes dos agentes de IA do Odonto GPT:

- **Agente Q&A**: Responde perguntas sobre odontologia, procedimentos, teoria, etc.
- **Agente de Imagem**: Analisa radiografias e imagens clínicas (em breve)
- **Sessões Contextuais**: Mantém o histórico da conversa para respostas mais contextuais

## 🏗️ Arquitetura

Existem **duas formas** de usar a integração:

### Opção 1: Webhook Next.js (Recomendado para Produção)

```
WhatsApp → Z-API → Webhook Next.js → Agno Service → Resposta → Next.js → Z-API → WhatsApp
```

**Vantagens:**
- ✅ Centraliza a lógica no Next.js
- ✅ Fácil debugging e logging
- ✅ Permite adicionar validações customizadas
- ✅ Já está configurado no projeto

**Arquivos envolvidos:**
- `app/api/webhooks/zapi/route.ts` - Webhook que recebe mensagens
- `lib/ai/agent.ts` - Processa mensagens e chama Agno
- `lib/ai/agno-service.ts` - Cliente do Agno service
- `lib/zapi.ts` - Cliente Z-API para enviar respostas

### Opção 2: Endpoint Direto Agno (Alternativa)

```
WhatsApp → Z-API → Agno Service /whatsapp → Resposta → Z-API → WhatsApp
```

**Vantagens:**
- ✅ Mais rápido (menos hops)
- ✅ Menos dependências
- ✅ Melhor para testes

**Arquivos envolvidos:**
- `odonto-gpt-agno-service/app/api.py` - Endpoint `/whatsapp`
- `odonto-gpt-agno-service/app/tools/whatsapp.py` - Cliente Z-API em Python

## 📋 Pré-requisitos

1. **Conta Z-API**: Cadastre-se em https://www.z-api.io/
2. **Instância Z-API**: Crie uma instância e obtenha as credenciais
3. **WhatsApp**: Conecte seu WhatsApp na Z-API
4. **Agno Service**: Service rodando em `http://localhost:8000` (ou URL de produção)

## 🔧 Configuração

### 1. Configurar Variáveis de Ambiente

#### No Next.js (`.env.local` ou `.env`):

```bash
# Z-API Credentials
Z_API_INSTANCE_ID=seu-instance-id
Z_API_TOKEN=seu-token
Z_API_CLIENT_TOKEN=seu-client-token
Z_API_WEBHOOK_SECRET=seu-secret-opcional  # Recomendado para produção

# Agno Service URL
AGNO_SERVICE_URL=http://localhost:8000/api/v1
```

#### No Agno Service (`odonto-gpt-agno-service/.env`):

```bash
# Z-API Credentials (mesmos do Next.js)
Z_API_INSTANCE_ID=seu-instance-id
Z_API_TOKEN=seu-token
Z_API_CLIENT_TOKEN=seu-client-token

# OpenRouter (para agentes de IA)
OPENROUTER_API_KEY=sk-or-v1-sua-chave
OPENROUTER_MODEL_QA=openai/gpt-4o-mini
OPENROUTER_MODEL_IMAGE=openai/gpt-4o
```

### 2. Configurar Webhook Z-API

#### Opção A: Webhook Next.js (Produção)

1. Acesse o painel Z-API: https://www.z-api.io/
2. Vá em **"Minha Instância"** → **"Webhooks"**
3. Configure o URL:
   ```
   Produção: https://v0-odonto-gpt-ui.vercel.app/api/webhooks/zapi
   Local: http://localhost:3000/api/webhooks/zapi (use ngrok)
   ```
4. Configure o **Webhook Secret** (opcional mas recomendado):
   - Escolha um secret seguro
   - Adicione a mesma valor em `Z_API_WEBHOOK_SECRET`

#### Opção B: Webhook Direto Agno (Alternativa)

Configure o URL:
```
Produção: https://seu-agno-service.com/api/v1/whatsapp
Local: http://localhost:8000/api/v1/whatsapp (use ngrok)
```

### 3. Testar Localmente com Ngrok

Para testar o webhook localmente:

```bash
# Instale ngrok: brew install ngrok (macOS) ou https://ngrok.com/download

# Expor Next.js local
ngrok http 3000

# Expor Agno service local
ngrok http 8000
```

Use a URL do ngrok na configuração do webhook Z-API.

## 🧪 Testando a Integração

### Teste 1: Verificar Webhook Ativo

```bash
# Testar webhook Next.js
curl http://localhost:3000/api/webhooks/zapi

# Resposta esperada:
# {
#   "status": "active",
#   "service": "Odonto GPT WhatsApp Webhook",
#   "timestamp": "2025-01-13T..."
# }
```

### Teste 2: Endpoint Direto Agno

```bash
curl -X POST http://localhost:8000/api/v1/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5511999999999",
    "message": "O que é periodontite?",
    "userId": "test-user-123"
  }'

# Resposta esperada:
# {
#   "success": true,
#   "message": "Resposta do agente...",
#   "phone": "+5511999999999",
#   "agentType": "qa",
#   "sessionId": "wa_5511999999999_abc12345"
# }
```

### Teste 3: Mensagem Real WhatsApp

1. Envie uma mensagem do seu WhatsApp para o número conectado na Z-API
2. Aguarde a resposta do bot
3. Verifique os logs:
   ```bash
   # Logs Next.js
   npm run dev

   # Logs Agno Service (em outro terminal)
   cd odonto-gpt-agno-service
   source venv/bin/activate
   python -m uvicorn app.main:app --reload
   ```

## 📊 Monitoramento e Logs

### Logs do Webhook Next.js

O webhook loga todas as mensagens recebidas:

```bash
[Webhook] Recebido: { type: 'ReceivedCallback', phone: '5511999999999' }
[Webhook] Processando mensagem de 5511999999999
[Webhook] Resposta enviada para 5511999999999
```

### Logs do Agno Service

O Agno service loga o processamento:

```bash
[AgnoService] Iniciando requisição: /chat
[AgnoService] Response recebido: { status: 200, ok: true }
```

### Logs de Erro

Se algo der errado, verifique:

```bash
# Webhook secret inválido
[Z-API Webhook] Secret inválido

# Agno service fora
[AgnoService] Failed to connect: Connection refused

# Z-API erro
[Z-API] Error sending message: 401 Unauthorized
```

## 🛠️ Troubleshooting

### Problema: "Secret inválido"

**Causa:** Webhook secret não configurado ou incorreto

**Solução:**
1. Verifique se `Z_API_WEBHOOK_SECRET` está definido
2. Certifique-se que o header `x-webhook-secret` está sendo enviado pela Z-API

### Problema: "Agro service não responde"

**Causa:** Agno service não está rodando ou URL incorreta

**Solução:**
1. Verifique se o serviço está rodando: `lsof -i :8000`
2. Teste health check: `curl http://localhost:8000/health`
3. Verifique `AGNO_SERVICE_URL` no `.env`

### Problema: "Mensagem não enviada via WhatsApp"

**Causa:** Credenciais Z-API incorretas ou sem permissão

**Solução:**
1. Verifique credenciais Z-API: `Z_API_INSTANCE_ID`, `Z_API_TOKEN`, `Z_API_CLIENT_TOKEN`
2. Teste manualmente com cURL:
   ```bash
   curl -X POST "https://api.z-api.io/instances/$INSTANCE_ID/token/$TOKEN/send-text" \
     -H "Content-Type: application/json" \
     -H "Client-Token: $CLIENT_TOKEN" \
     -d '{"phone":"5511999999999","message":"Teste"}'
   ```
3. Verifique se a instância Z-API está ativa

### Problema: "Resposta vazia ou erro genérico"

**Causa:** OpenRouter API key inválida ou quota esgotada

**Solução:**
1. Verifique `OPENROUTER_API_KEY` no Agno service `.env`
2. Teste a chave: https://openrouter.ai/keys
3. Verifique quota em https://openrouter.ai/usage

## 🚀 Deploy em Produção

### 1. Deploy do Agno Service

**Opções:**
- **Railway** (recomendado): `railway up`
- **Render**: Connect repo do GitHub
- **AWS/GCP/Azure**: Deploy com Docker

**Variáveis de Ambiente (produção):**
```bash
Z_API_INSTANCE_ID=...
Z_API_TOKEN=...
Z_API_CLIENT_TOKEN=...
OPENROUTER_API_KEY=...
SUPABASE_DB_URL=...
PORT=8000
ENVIRONMENT=production
```

### 2. Atualizar Webhook Z-API

Mude o URL para produção:

```
https://seu-agno-service.com/api/v1/whatsapp
```

ou

```
https://v0-odonto-gpt-ui.vercel.app/api/webhooks/zapi
```

### 3. Testar Produção

```bash
# Verificar health
curl https://seu-agno-service.com/health

# Testar endpoint
curl -X POST https://seu-agno-service.com/api/v1/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5511999999999",
    "message": "Teste produção",
    "userId": "prod-test"
  }'
```

## 📚 Uso Avançado

### Personalizar Respostas do Bot

Edite o system prompt do agente em `odonto-gpt-agno-service/app/agents/qa_agent.py`:

```python
instructions=[
    "Você é um assistente odontológico especialista...",
    "Responda de forma clara e objetiva...",
    "Seja cordial e profissional..."
]
```

### Adicionar Novos Agentes

1. Crie novo agente em `odonto-gpt-agno-service/app/agents/`
2. Adicione endpoint em `app/api.py`
3. Atualize lógica de roteamento no webhook

### Suporte a Imagens (Futuro)

Para adicionar análise de imagens no WhatsApp:

1. Configure webhook para receber mensagens com imagem
2. Extraia URL da imagem do payload Z-API
3. Chame endpoint `/image/analyze` do Agno service
4. Envie resposta via WhatsApp

## 🔒 Segurança

### Best Practices

1. **Sempre use Webhook Secret** em produção
2. **Nunca commit** credenciais no repositório
3. **Use variáveis de ambiente** para secrets
4. **Limite rate** de mensagens por usuário
5. **Valide** números de telefone
6. **Log** todas as mensagens para auditoria

### Rate Limiting

Adicione rate limiting no webhook (recomendado):

```typescript
// app/api/webhooks/zapi/route.ts
import { ratelimit } from '@/lib/rate-limit'

const { success } = await ratelimit.limit(phone)
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
}
```

## 📞 Suporte

- **Documentação Z-API**: https://docs.z-api.io/
- **Documentação Agno**: `odonto-gpt-agno-service/README.md`
- **Issues**: Abra issue no GitHub

## 🎉 Pronto!

Sua integração WhatsApp + Agno está configurada! Envie uma mensagem pelo WhatsApp e veja a mágica acontecer. 🚀
