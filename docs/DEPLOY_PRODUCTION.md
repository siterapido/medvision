# Guia Completo de Deploy em Produção

Este guia fornece instruções detalhadas para fazer deploy da aplicação Odonto GPT UI completa, incluindo o frontend Next.js, o serviço AI Agno (Python), e todas as integrações necessárias.

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Checklist Pré-Deploy](#checklist-pré-deploy)
3. [Configuração do Supabase](#configuração-do-supabase)
4. [Deploy do Frontend Next.js (Vercel)](#deploy-do-frontend-next-js-vercel)
5. [Deploy do Agno AI Service](#deploy-do-agno-ai-service)
6. [Configuração de Serviços Externos](#configuração-de-serviços-externos)
7. [Testes Pós-Deploy](#testes-pós-deploy)
8. [Monitoramento e Manutenção](#monitoramento-e-manutenção)
9. [Troubleshooting](#troubleshooting)
10. [Rollback e Recuperação](#rollback-e-recuperação)

---

## 🏗️ Visão Geral da Arquitetura

A aplicação consiste em três componentes principais:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Next.js 16    │  HTTP   │  Agno AI Service │  HTTP   │   OpenRouter    │
│   (Vercel)      │ ──────► │   (Python/FastAPI)│ ──────► │   (LLM API)     │
│   Frontend      │         │  (Railway/Render)│         │                 │
└────────┬────────┘         └────────┬─────────┘         └─────────────────┘
         │                           │
         │                           │
         │                           ▼
         │                  ┌─────────────────┐
         │                  │   Supabase DB   │
         └──────────────────►│  (PostgreSQL)   │
            Supabase SDK     └─────────────────┘
                              + Storage + Auth
```

**Componentes:**
- **Frontend:** Next.js 16 (Vercel)
- **AI Service:** Python FastAPI com Agno (Railway/Render/Fly.io)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Bunny CDN (imagens/vídeos)
- **Payments:** Cakto Gateway
- **Messaging:** Z-API (WhatsApp)
- **Email:** Resend
- **Monitoring:** Sentry

---

## ✅ Checklist Pré-Deploy

### 1. Verificação Local

```bash
# 1. Verificar variáveis de ambiente
npm run validate:env

# 2. Verificar status das migrations
npm run db:status

# 3. Build de produção local
npm run build

# 4. Executar testes (se disponíveis)
npm run test

# 5. Testar configuração do Bunny CDN
npm run test:bunny
```

### 2. Backup e Segurança

- [ ] Fazer backup do banco de dados atual
- [ ] Salvar todas as chaves API em um gerenciador de senhas
- [ ] Documentar versões atuais de dependências
- [ ] Verificar que não há segredos no repositório
- [ ] Revisar políticas RLS do Supabase

### 3. Serviços Externos

- [ ] **Supabase:** Projeto criado e configurado
- [ ] **Bunny CDN:** Storage Zone e Pull Zone configurados
- [ ] **OpenRouter:** Chave API obtida
- [ ] **Cakto:** Webhook configurado (se aplicável)
- [ ] **Z-API:** Instância configurada (se aplicável)
- [ ] **Resend:** API key configurada (se aplicável)
- [ ] **Sentry:** DSN e auth token configurados
- [ ] **Vercel:** Projeto conectado ao repositório

---

## 🗄️ Configuração do Supabase

### 1. Criar Projeto Supabase

```bash
# Via CLI (opcional)
npx supabase projects create

# Ou via dashboard: https://app.supabase.com
```

### 2. Configurar API Keys

No dashboard do Supabase, vá em **Settings → API** e copie:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **IMPORTANTE:** Nunca exponha a `service_role` no frontend!

### 3. Configurar Autenticação

Vá em **Authentication → Settings**:

**Site URL:**
```
https://seu-dominio.com
```

**Redirect URLs:**
```
https://seu-dominio.com/auth/callback
https://seu-dominio.com/*
```

**Email Templates (opcional):**
- Customizar templates de confirmação e reset
- Configurar SMTP customizado (ou usar padrão Supabase)

### 4. Aplicar Migrations

**Opção A: Via Supabase Dashboard**
1. Vá em **SQL Editor**
2. Execute cada migration em `supabase/migrations/` em ordem
3. Verifique se todas as tabelas foram criadas

**Opção B: Via Supabase CLI**
```bash
# Linkar ao projeto
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npx supabase db push

# Verificar status
npx supabase db remote changes
```

### 5. Configurar Row Level Security (RLS)

Verificar políticas em **Database → Policies**:
- [ ] `profiles`: usuários só acessam próprio profile
- [ ] `courses`: clientes só veem cursos publicados
- [ ] `subscriptions`: usuarios só veem próprias subscriptions
- [ ] `agent_sessions`: usuários só vejam próprias sessões
- [ ] `agent_messages`: usuários só veem mensagens de próprias sessões

### 6. Ativar Extensões

Vá em **Database → Extensions** e ative:
- `pgvector` (para RAG knowledge base)
- `pg_stat_statements` (para monitoring)
- `uuid-ossp` (se não ativa por padrão)

### 7. Verificar Security Advisors

No dashboard: **Database → Advisors**
- Executar **Security Advisors**
- Executar **Performance Advisors**
- Corrigir todas as recomendações críticas

---

## 🚀 Deploy do Frontend Next.js (Vercel)

### Opção 1: Via Vercel Dashboard (Recomendado)

1. **Conectar Repositório**
   - Acesse https://vercel.com/new
   - Importe do GitHub
   - Selecione o repositório

2. **Configurar Build**
   - Framework Preset: **Next.js** (detecta automaticamente)
   - Build Command: `npm run build` ou `next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Configurar Variáveis de Ambiente**

   Vá em **Settings → Environment Variables** e adicione:

   **Variáveis Públicas (Available: All):**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
   NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx  # opcional
   ```

   **Variáveis Privadas (Environment: Production, Type: Encrypted):**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Service role key
   BUNNY_STORAGE_ZONE=nome-da-storage-zone
   BUNNY_STORAGE_API_KEY=sua-chave-api
   BUNNY_CDN_BASE_URL=https://seu-pull-zone.b-cdn.net
   BUNNY_STORAGE_HOST=storage.bunnycdn.com  # opcional

   # Integrações opcionais
   CAKTO_WEBHOOK_SECRET=seu-webhook-secret
   ZAPI_SECRET=seu-zapi-secret
   RESEND_API_KEY=re_xxxxx
   N8N_WEBHOOK_URL=https://seu-n8n-webhook.com
   SENTRY_AUTH_TOKEN=suasentrytoken  # opcional
   ```

4. **Deploy Inicial**
   - Clique em **Deploy**
   - Aguarde o build (primeiro build pode levar 3-5 minutos)
   - Receba URL: `https://seu-projeto.vercel.app`

5. **Configurar Domínio Customizado**
   - Vá em **Settings → Domains**
   - Adicione seu domínio: `seudominio.com`
   - Configure DNS conforme instruções:
     - **Opção A (Recomendada):** CNAME apontando para `cname.vercel-dns.com`
     - **Opção B:** A records apontando para IPs da Vercel

### Opção 2: Via Vercel CLI

```bash
# 1. Instalar Vercel CLI (se não instalado)
npm i -g vercel

# 2. Login
vercel login

# 3. Linkar projeto
vercel link

# 4. Adicionar variáveis de ambiente
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... repita para todas as variáveis

# 5. Deploy de produção
vercel deploy --prod

# 6. Verificar deployment
vercel ls
```

### 6. Configurar Health Checks

Vercel faz health checks automaticamente. Configure webhooks para notificações:

**Settings → Git → Deploy Hooks:**
- URL para notificações no Slack/Discord
- Notificar em: deployment success, failure, warning

---

## 🤖 Deploy do Agno AI Service

O serviço Agno (Python/FastAPI) pode ser deployado em várias plataformas. Recomendamos Railway, Render, ou Fly.io.

### Opção 1: Railway (Recomendado - Mais Fácil)

**Pré-requisitos:**
- Conta no Railway (https://railway.app)
- Repositório GitHub com o código Agno

**Passos:**

1. **Preparar Repositório** (opcional - pode ser subdiretório)
   ```bash
   # Se o serviço estiver em subdiretório, crie um repo separado
   # ou use configuração do Railway para apontar para odonto-gpt-agno-service/
   ```

2. **Criar Projeto no Railway**
   - Acesse https://railway.app/new
   - Selecione **Deploy from GitHub repo**
   - Escolha o repositório
   - Railway detecta automaticamente Python/FastAPI

3. **Configurar Build**
   - No arquivo `odonto-gpt-agno-service/railway.json` (ou via dashboard):
   ```json
   {
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "pip install -r requirements.txt",
       "watchPatterns": ["**/*.py"]
     },
     "deploy": {
       "startCommand": "python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT",
       "healthcheckPath": "/health"
     }
   }
   ```

4. **Configurar Variáveis de Ambiente**

   No dashboard Railway → **Variables**:
   ```bash
   # obrigatórias
   PORT=8000
   ENVIRONMENT=production
   OPENROUTER_API_KEY=sk-or-v1-xxxxx
   SUPABASE_DB_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

   # modelos (opcionais - tem defaults)
   OPENROUTER_MODEL_QA=openai/gpt-4o-mini
   OPENROUTER_MODEL_IMAGE=openai/gpt-4o
   OPENROUTER_MODEL_EMBEDDING=openai/text-embedding-3-small

   # CORS
   ALLOWED_ORIGINS=https://seu-dominio.com,https://seu-projeto.vercel.app
   ```

5. **Configurar Domínio Customizado**
   - Vá em **Settings → Domains**
   - Adicione: `api.seudominio.com` ou `agno.seudominio.com`
   - Configure DNS CNAME para `railway.app`

6. **Verificar Deploy**
   ```bash
   # Health check
   curl https://seu-agno-service.railway.app/health

   # Testar API
   curl -X POST https://seu-agno-service.railway.app/api/v1/qa/chat \
     -H "Content-Type: application/json" \
     -d '{"question":"Teste","userId":"test"}'
   ```

**Custos estimados Railway:** ~$5-20/mês (dependendo do uso)

---

### Opção 2: Render (Alternativa)

**Pré-requisitos:**
- Conta no Render (https://render.com)

**Passos:**

1. **Criar Web Service**
   - Vá em **Dashboard → New → Web Service**
   - Connect GitHub repo
   - Selecione branch `main`

2. **Configurar Build**
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

3. **Variáveis de Ambiente** (mesmas do Railway)

4. **Deploy**
   - Render faz deploy automático ao detectar mudanças no GitHub
   - URL: `https://seu-projeto.onrender.com`

**Custos estimados Render:** ~$7/mês (Free tier tem limitações)

---

### Opção 3: Fly.io (Performance/Customização)

**Pré-requisitos:**
- Conta no Fly.io (https://fly.io)
- Fly CLI instalado

**Passos:**

1. **Instalar CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

2. **Configurar Aplicação**
   Crie `odonto-gpt-agno-service/fly.toml`:
   ```toml
   app = "odonto-agno-service"
   primary_region = "gru"

   [build]
   [build.build]
   command = "pip install -r requirements.txt"

   [[services]]
   http_checks = []
   internal_port = 8000
   protocol = "tcp"

   [[services.ports]]
   force_https = true
   handlers = ["http"]
   port = 80

   [[services.ports]]
   handlers = ["tls", "http"]
   port = 443

   [env]
   PORT = "8000"
   ENVIRONMENT = "production"
   ```

3. **Deploy**
   ```bash
   cd odonto-gpt-agno-service
   fly launch
   fly secrets set OPENROUTER_API_KEY=sk-or-v1-xxxxx
   fly secrets set SUPABASE_DB_URL=postgresql://...
   fly deploy
   ```

**Custos estimados Fly.io:** ~$2-5/mês + uso

---

### Opção 4: Docker (Self-hosted / Cloud)

Para deployments em Kubernetes, AWS ECS, Google Cloud Run, etc.:

1. **Criar Dockerfile** (`odonto-gpt-agno-service/Dockerfile`):
   ```dockerfile
   FROM python:3.11-slim

   WORKDIR /app

   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt

   COPY . .

   EXPOSE 8000

   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **Build e Push**
   ```bash
   docker build -t odonto-agno-service .
   docker tag odonto-agno-service registry.seudominio.com/odonto-agno-service
   docker push registry.seudominio.com/odonto-agno-service
   ```

3. **Deploy na plataforma escolhida** (Kubernetes, ECS, Cloud Run, etc.)

---

### Verificação do Serviço Agno

Após deploy, verifique:

```bash
# 1. Health check
curl https://seu-agno-service.com/health
# Resposta esperada: {"status":"healthy"}

# 2. OpenAPI docs
# Acesse: https://seu-agno-service.com/docs

# 3. Testar endpoint QA
curl -X POST https://seu-agno-service.com/api/v1/qa/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "O que é periodontite?",
    "userId": "test-user",
    "specialty": "periodontia"
  }'

# 4. Verificar logs na plataforma escolhida (Railway/Render/Fly.io)
```

---

## 🔧 Configuração de Serviços Externos

### 1. Bunny CDN

Consulte guia completo em **docs/bunny-cdn-setup.md**.

**Resumo rápido:**
```bash
# Testar configuração
npm run test:bunny

# Verificar conexão
curl -I https://seu-pull-zone.b-cdn.net/test.jpg
```

### 2. Cakto Payment Gateway

**Webhook Configuration:**
- URL do Webhook: `https://seu-dominio.com/api/webhooks/cakto`
- Secret: Configure em `CAKTO_WEBHOOK_SECRET`
- Eventos: subscription.created, payment.updated, subscription.canceled

**Testar localmente:**
```bash
# Veja docs/guia-integracao-cakto-local.md
```

### 3. Z-API WhatsApp

**Instância Z-API:**
- Criar conta em https://z-api.io
- Obter Instance ID e Token
- Configurar Webhook (opcional): `https://seu-agno-service.com/api/v1/webhooks/whatsapp`

**Variáveis de ambiente:**
```bash
ZAPI_INSTANCE_ID=sua-instance-id
ZAPI_TOKEN=seu-token
ZAPI_SECRET=seu-webhook-secret  # para webhook verification
```

### 4. Resend Email

```bash
# Instalar SDK (já está em package.json)
npm install resend

# Configurar
RESEND_API_KEY=re_xxxxx

# Testar
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "usuario@exemplo.com",
    "subject": "Teste",
    "html": "<strong>Email de teste</strong>"
  }'
```

### 5. Sentry Error Tracking

**Frontend (Next.js):**
```bash
# Configurado em @sentry/nextjs
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_AUTH_TOKEN=seu-auth-token
```

**Backend (Agno Service - Opcional):**
```python
# No requirements.txt (já incluído)
sentry-sdk[fastapi]

# No app/main.py
import sentry_sdk
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    traces_sample_rate=1.0,
)
```

---

## 🧪 Testes Pós-Deploy

### Checklist de Testes

#### 1. Frontend Next.js
```bash
# Acessar URL
https://seu-dominio.com

# Testar páginas principais
- [ ] Homepage carrega
- [ ] Login funciona (/login)
- [ ] Registro funciona (/register)
- [ ] Dashboard redireciona corretamente por role
- [ ] Chat interface aparece
- [ ] Upload de imagem funciona
```

#### 2. Autenticação
```bash
# [ ] Criar novo usuário
- Registro completo
- Email de confirmação recebido
- Login funciona

# [ ] Testar roles
- Admin access /admin
- Cliente access /dashboard
- Vendedor access /dashboard/vendas

# [ ] Testar proteção de rotas
- Acessar /dashboard sem auth → redirect /login
- Token refresh automático funciona
```

#### 3. Database Operations
```bash
# [ ] Criar curso
# [ ] Inscrever usuário
# [ ] Criar subscription
# [ ] Testar RLS policies
# [ ] Verificar agent_sessions
```

#### 4. Chat AI Features
```bash
# [ ] Testar QA chat
- Enviar pergunta "O que é periodontite?"
- Resposta streaming funciona
- Session criada no banco

# [ ] Testar imagem upload
- Upload imagem (X-ray/foto)
- Análise retorna
- Imagem armazenada no Bunny CDN

# [ ] Testar session history
- Sessão aparece em /dashboard/chat/history
- Conversa carregada corretamente
```

#### 5. Integrações
```bash
# [ ] Bunny CDN upload
- Upload imagem → URL Bunny
- Imagem acessível via CDN

# [ ] Cakto webhook (se configurado)
- Criar subscription
- Webhook recebe
- Database atualizado

# [ ] WhatsApp (se configurado)
- Enviar mensagem
- Mensagem entregue
```

#### 6. Performance
```bash
# [ ] Lighthouse score
- Desktop > 90
- Mobile > 85

# [ ] Vercel Analytics
- Web Vitals verdes
- Sem erros JS

# [ ] Database
- Queries < 100ms
- Sem N+1 queries
```

### Testes Automatizados (Opcional)

```bash
# Configurar Playwright para E2E tests
npm install -D @playwright/test

# Criar testes em tests/e2e/
# Exemplo: tests/e2e/chat.spec.ts

# Rodar testes
npx playwright test
```

---

## 📊 Monitoramento e Manutenção

### 1. Vercel Dashboard

**Metrics para monitorar:**
- **Build Time:** < 3 minutos
- **Deployment Success Rate:** > 99%
- **Page Load:** < 2s (p75)
- **Error Rate:** < 0.1%

**Alertas:**
- Configurar alertas no Slack/Email para:
  - Deployment failures
  - Error rate spike
  - Performance degradation

### 2. Supabase Monitoring

**Dashboard → Reports:**
- **API Requests:** Monitorar volume
- **Database Size:** Growth trends
- **Auth Events:** Signups, logins
- **Storage:** Bunny CDN usage

**Alertas:**
- Configurar alertas para:
  - High CPU usage
  - Slow queries (> 1s)
  - Connection pool exhaustion

### 3. Agno Service Monitoring

**Railway/Render/Fly.io Dashboards:**
- **CPU Usage:** < 70% (média)
- **Memory Usage:** < 80%
- **Response Time:** < 2s (p95)
- **Error Rate:** < 1%

**Logs:**
```bash
# Railway
railway logs

# Render
# Dashboard → Logs

# Fly.io
fly logs
```

### 4. Sentry Error Tracking

**Monitorar:**
- **Error Rate:** Trends e spikes
- **Unhandled Rejections:** JS errors
- **API Errors:** Failed requests
- **Performance:** Slow transactions

**Alertas:**
- Configurar para notificar em:
  - Novos erros críticos
  - Error rate > X%
  - Performance degradation

### 5. Health Checks Agendados

```bash
# Configurar cron job ou GitHub Actions
# Exemplo: .github/workflows/health-check.yml

name: Health Check
on:
  schedule:
    - cron: '0 */6 * * *'  # A cada 6 horas
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check Frontend
        run: curl -f https://seu-dominio.com || exit 1

      - name: Check Agno Service
        run: curl -f https://seu-agno-service.com/health || exit 1

      - name: Check Supabase
        run: curl -f ${{ secrets.SUPABASE_URL }}/health || exit 1
```

### 6. Backup Automático

**Supabase:**
- Backup automático incluído (7 dias retention)
- Upgrade para backup point-in-time (se necessário)

**Database Export:**
```bash
# Backup semanal
npx supabase db dump -f backup-$(date +%Y%m%d).sql

# Enviar para S3/Backblaze/etc.
```

---

## 🚨 Troubleshooting

### Build Failures

**Erro: Font download failed**
```
Next.js couldn't download Google Fonts during build
```
**Solução:**
- Vercel tem acesso à rede (normal)
- Ou migrar para `next/font/local`

**Erro: Module not found**
```
Module not found: Can't resolve '@/components/...'
```
**Solução:**
```bash
# Verificar imports relativos
# Build localmente primeiro
npm run build
```

### Runtime Errors

**401 Unauthorized no Supabase**
```
JwtError: Invalid token
```
**Causas:**
1. `NEXT_PUBLIC_SUPABASE_ANON_KEY` incorreta
2. Service role key expirada
3. RLS policies bloqueando

**Solução:**
```bash
# Verificar variáveis
vercel env ls

# Testar via dashboard
# Supabase → SQL Editor
SELECT * FROM auth.users;

# Verificar RLS
# Database → Policies
```

**Bunny CDN Upload Falhando**
```
UploadError: Bunny storage failed
```
**Solução:**
```bash
# Testar configuração
npm run test:bunny

# Verificar credenciais
vercel env rm BUNNY_STORAGE_API_KEY production
vercel env add BUNNY_STORAGE_API_KEY production

# Verificar permissões na Storage Zone
# Bunny Dashboard → Permissions
```

### Agno Service Issues

**Service not responding**
```
Connection refused to Agno service
```
**Solução:**
```bash
# Verificar se service está rodando
curl https://seu-agno-service.com/health

# Verificar logs (Railway)
railway logs --tail

# Verificar variáveis de ambiente
railway variables list

# Verificar CORS
# No Agno service .env:
ALLOWED_ORIGINS=https://seu-dominio.com
```

**OpenRouter API errors**
```
OpenRouterError: Authentication failed
```
**Solução:**
```bash
# Verificar API key
railway variables set OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Testar via curl
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"

# Verificar quota/billing em openrouter.ai
```

### Performance Issues

**Slow page loads**
```
First Contentful Paint: 3.5s
```
**Soluções:**
1. Verificar Vercel Edge Network
2. Otimize imagens (next/image)
3. Implementar ISR/SSG onde possível
4. Verificar database queries

**Database slow queries**
```
Query took 2.5s
```
**Solução:**
```sql
-- No Supabase SQL Editor
-- Identificar queries lentas
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Adicionar índices
CREATE INDEX CONCURRENTLY idx_name ON table(column);

-- Ativar pg_stat_statements se não ativo
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### Webhook Issues

**Cakto webhook not working**
```
Webhook signature verification failed
```
**Solução:**
```bash
# Verificar secret
vercel env ls | grep CAKTO

# Testar localmente
# Veja docs/guia-integracao-cakto-local.md

# Verificar logs
# Vercel → Functions → /api/webhooks/cakto
```

---

## 🔄 Rollback e Recuperação

### Rollback no Vercel

**Via Dashboard:**
1. Vá em **Deployments**
2. Encontre deployment anterior estável
3. Clique **... → Promote to Production**

**Via CLI:**
```bash
# Listar deployments
vercel ls

# Rollback para deployment específico
vercel rollback <deployment-url>
```

### Rollback Database

**Via Supabase:**
```bash
# Backup antes de mudanças
npx supabase db dump -f backup-pre-migration.sql

# Se migration falhar
npx supabase db reset --db-url "postgresql://..."

# Restore de backup
npx supabase db restore -f backup-xxx.sql
```

### Rollback Agno Service

**Railway:**
1. Vá em **Deployments**
2. Encontre deployment estável
3. Click **Redeploy**

**Render:**
```bash
# Via Git: revert commit
git revert HEAD
git push
# Render auto-deploy
```

### Recuperação de Desastre

**Se Vercel estiver down:**
- Status page: https://www.vercel-status.com
- Tempo típico de resolução: < 1 hora

**Se Supabase estiver down:**
- Status page: https://status.supabase.com
- Backup automático em múltiplas regiões

**Se OpenRouter estiver down:**
- Fallback para modelo alternativo
- Configurar retry com exponential backoff

---

## 📚 Recursos Adicionais

### Documentação
- **Vercel:** https://vercel.com/docs
- **Supabase:** https://supabase.com/docs
- **Railway:** https://docs.railway.app
- **OpenRouter:** https://openrouter.ai/docs
- **Bunny CDN:** docs/bunny-cdn-setup.md

### Guias Específicos do Projeto
- **Guia Bunny CDN:** docs/bunny-cdn-setup.md
- **Guia WhatsApp:** docs/WHATSAPP_SETUP_GUIDE.md
- **Guia Agno Service:** odonto-gpt-agno-service/QUICKSTART.md
- **Guia RAG:** odonto-gpt-agno-service/RAG_GUIDE.md
- **Guia Cakto Local:** docs/guia-integracao-cakto-local.md

### Comandos Úteis

```bash
# Frontend
npm run build          # Build de produção
npm run start          # Start production server
npm run db:status      # Ver migrations
npm run validate:env   # Validar config

# Agno Service
cd odonto-gpt-agno-service
python -m uvicorn app.main:app --reload  # Dev
python playground.py  # Playground interativo

# Database
npx supabase db push   # Push migrations
npx supabase db dump   # Backup
npx supabase links list  # Ver connections
```

---

## ✨ Conclusão

Seguindo este guia, você terá uma aplicação completa em produção com:
- ✅ Frontend Next.js escalável na Vercel
- ✅ AI Service Python rodando em Railway/Render
- ✅ Database Supabase com RLS configurado
- ✅ CDN Bunny para imagens/vídeos
- ✅ Monitoramento e alertas ativos
- ✅ Backup e estratégias de rollback

**Próximos passos:**
1. Configurar CI/CD para testes automatizados
2. Implementar staging environment
3. Adicionar analytics avançado (PostHog/Mixpanel)
4. Otimizar SEO e performance
5. Configurar CDN global adicional se necessário

**Suporte:**
- GitHub Issues: https://github.com/siterapido/v0-odonto-gpt-ui/issues
- Documentation: /docs
- Agno Service: /odonto-gpt-agno-service/README.md

---

**Versão:** 1.0
**Última atualização:** 2025-01-13
**Autores:** Odonto GPT UI Team
