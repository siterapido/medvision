# Comparação de Variáveis de Ambiente: Local vs. Produção

**Última Atualização**: 2026-01-23  
**Status**: 🔴 **AÇÃO NECESSÁRIA**

---

## 📋 Checklist de Configuração na Vercel

### Variáveis Críticas (OBRIGATÓRIAS)

#### 1. Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://fjcbowphcbnvuowsjvbz.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### 2. OpenRouter (CRÍTICO PARA CHAT)
- [ ] `OPENROUTER_API_KEY` = `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`

#### 3. URLs de Produção
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://www.odontogpt.com` **⚠️ NÃO PODE SER LOCALHOST**
- [ ] `APP_URL` = `https://www.odontogpt.com` **⚠️ NÃO PODE SER LOCALHOST**

---

### Variáveis Opcionais (mas recomendadas)

#### 4. Bunny CDN
- [ ] `BUNNY_STORAGE_ZONE` = `odontogptstorage`
- [ ] `BUNNY_STORAGE_API_KEY` = `208019f8-6a9d-4af9-9e5bd323be05-2bba-412d`
- [ ] `BUNNY_CDN_BASE_URL` = `https://odonto-gpt.b-cdn.net/`
- [ ] `BUNNY_STORAGE_HOST` = `storage.bunnycdn.com`
- [ ] `NEXT_PUBLIC_MAX_ATTACHMENT_MB` = `1500`

#### 5. Z-API (WhatsApp)
- [ ] `Z_API_INSTANCE_ID` = `3E4157D6898E807F27B95E3E11E99CA6`
- [ ] `Z_API_TOKEN` = `118950DF335320200B3A0483`
- [ ] `Z_API_CLIENT_TOKEN` = `Ff4ebdad5696348ca84ca912f96d6ee6aS`

#### 6. Agno Service (se usado)
- [ ] `NEXT_PUBLIC_AGNO_SERVICE_URL` = ❓ **VERIFICAR URL DE PRODUÇÃO**
  - Possível valor: `https://v0-odonto-gpt-ui-production.up.railway.app/api/v1`
  - **Não deve ser `localhost`!**

---

## 🚨 Problemas Identificados

### 1. NEXT_PUBLIC_AGNO_SERVICE_URL - LOCALHOST EM PRODUÇÃO ❌

**Problema Atual**:
```env
# .env.local (desenvolvimento)
NEXT_PUBLIC_AGNO_SERVICE_URL=http://localhost:8000/api/v1
```

**Como deve estar na Vercel**:
```env
# Vercel (produção) - DEVE SER URL PÚBLICA
NEXT_PUBLIC_AGNO_SERVICE_URL=https://v0-odonto-gpt-ui-production.up.railway.app/api/v1
```

**Impacto**:
- ⚠️ Componentes que usam este serviço **falharão em produção**
- ❌ Browser não pode acessar `localhost` do servidor

**Componentes Afetados**:
- `/components/research/research-agent-chat.tsx`
- `/lib/hooks/useAgnoAgents.ts`
- `/lib/hooks/useAgentChat.ts  `/app/api/copilotkit/chat/[[...slug]]/route.ts`

**Ação**:
1. Verificar se a URL do Railway está ativa
2. Atualizar variável na Vercel
3. Redeploy

---

### 2. NEXT_PUBLIC_SITE_URL - localhost ❌

**Problema Atual**:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Como deve estar na Vercel**:
```env
NEXT_PUBLIC_SITE_URL=https://www.odontogpt.com
```

**Impacto**:
- URLs de callback podem falhar
- Links compartilháveis apontam para localhost
- OAuth redirects podem quebrar

---

## ✅ Como Configurar na Vercel

### Método 1: Via Dashboard (Recomendado)

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione o projeto `v0-odonto-gpt-ui`
3. Vá em **Settings** → **Environment Variables**
4. Para cada variável:
   - **Key**: Nome da variável (ex: `OPENROUTER_API_KEY`)
   - **Value**: Valor da variável
   - **Environments**: Selecione `Production`, `Preview`, `Development`
5. Clique em **Save**

### Método 2: Via CLI

```bash
# Definir uma variável
vercel env add OPENROUTER_API_KEY production

# Listar variáveis
vercel env ls

# Pull variáveis de produção (para conferir)
vercel env pull .env.production
```

### Método 3: Via `.env` (Local)

Criar `.env.production` e fazer push:
```bash
# Criar arquivo
cp .env.local .env.production

# Editar variáveis para produção
# ...

# Push para Vercel
vercel env pull
```

---

## 🔍 Verificação Pós-Deploy

### Teste 1: Verificar Variáveis no Runtime

Adicione temporariamente em alguma API route:

```typescript
// app/api/debug/route.ts
export async function GET() {
  return Response.json({
    hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    agnoUrl: process.env.NEXT_PUBLIC_AGNO_SERVICE_URL,
  })
}
```

Acessar: `https://www.odontogpt.com/api/debug`

**⚠️ REMOVER APÓS VERIFICAÇÃO (segurança)**

---

### Teste 2: Console do Browser

No chat em produção, abra DevTools e execute:

```javascript
console.log({
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  agnoUrl: process.env.NEXT_PUBLIC_AGNO_SERVICE_URL,
})
```

**Valores esperados**:
```javascript
{
  siteUrl: "https://www.odontogpt.com",
  supabaseUrl: "https://fjcbowphcbnvuowsjvbz.supabase.co",
  agnoUrl: "https://v0-odonto-gpt-ui-production.up.railway.app/api/v1"
}
```

**❌ Se aparecer `localhost`, a variável NÃO foi configurada!**

---

### Teste 3: Logs da Vercel

```bash
# Ver logs em tempo real
vercel logs --follow

# Buscar por erros específicos
vercel logs | grep "OPENROUTER"
vercel logs | grep "Error"
```

---

## 📝 Template Completo para Vercel

Copie e cole este bloco diretamente na Vercel (ajuste valores se necessário):

```env
# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=https://fjcbowphcbnvuowsjvbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqY2Jvd3BoY2JudnVvd3NqdmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjA1MzYsImV4cCI6MjA3NzkzNjUzNn0.VX_17s04sNvSW-0Tf54EZE-KhF15wkMqBtUMKIZLUpY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqY2Jvd3BoY2JudnVvd3NqdmJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM2MDUzNiwiZXhwIjoyMDc3OTM2NTM2fQ.CzUb2pLZAOCabBnCNZJaDyL33o3ihzTDJ5cTieZbPxk

# === URLs ===
NEXT_PUBLIC_SITE_URL=https://www.odontogpt.com
APP_URL=https://www.odontogpt.com

# === Bunny CDN ===
BUNNY_STORAGE_ZONE=odontogptstorage
BUNNY_STORAGE_API_KEY=208019f8-6a9d-4af9-9e5bd323be05-2bba-412d
BUNNY_CDN_BASE_URL=https://odonto-gpt.b-cdn.net/
BUNNY_STORAGE_HOST=storage.bunnycdn.com
NEXT_PUBLIC_MAX_ATTACHMENT_MB=1500

# === Z-API (WhatsApp) ===
Z_API_INSTANCE_ID=3E4157D6898E807F27B95E3E11E99CA6
Z_API_TOKEN=118950DF335320200B3A0483
Z_API_CLIENT_TOKEN=Ff4ebdad5696348ca84ca912f96d6ee6aS

# === Agno Service === 
# VERIFICAR URL DE PRODUÇÃO! NÃO USAR LOCALHOST!
NEXT_PUBLIC_AGNO_SERVICE_URL=https://v0-odonto-gpt-ui-production.up.railway.app/api/v1

# === OpenRouter (CRÍTICO!) ===
OPENROUTER_API_KEY=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
```

---

## 🎯 Próximos Passos

1. [ ] **Verificar Railway**
   - Acessar dashboard do Railway
   - Confirmar que a app está online
   - Testar endpoint: `https://v0-odonto-gpt-ui-production.up.railway.app/api/v1/health`

2. [ ] **Configurar Variáveis na Vercel**
   - Seguir checklist acima
   - Para TODAS as variáveis marcadas

3. [ ] **Force Redeploy**
   ```bash
   vercel --prod --force
   ```

4. [ ] **Testar Chat em Produção**
   - Acessar: `https://www.odontogpt.com/dashboard/chat`
   - Enviar mensagem de teste
   - Verificar console (sem erros 404)
   - Confirmar resposta do AI

5. [ ] **Monitorar Logs**
   ```bash
   vercel logs --follow
   ```

6. [ ] **Documentar Resultado**
   - Atualizar `.context/plans/investigation-report.md`
   - Marcar como resolvido se funcionar

---

**Autor**: Antigravity AI  
**Data**: 2026-01-23  
**Prioridade**: 🔴 **URGENTE**
