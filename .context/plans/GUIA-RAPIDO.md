# ⚡ GUIA RÁPIDO - Corrigir Chat em Produção

**Chat Stack**: AI SDK (Vercel) + OpenRouter  
**Status**: 🔴 **CRÍTICO - Configuração Faltando na Vercel**

---

## 🎯 O Problema

O chat em `https://www.odontogpt.com/dashboard/chat` não funciona porque faltam variáveis de ambiente na **Vercel**.

### O que o Chat Precisa:

1. ✅ **API `/api/newchat`** - Código OK
2. ✅ **AI SDK + OpenRouter** - Implementado corretamente
3. ❌ **Variáveis na Vercel** - **FALTANDO**

---

## ⚡ Solução Rápida (10 minutos)

### 1️⃣ Variáveis OBRIGATÓRIAS na Vercel

Acesse: **Vercel Dashboard → Settings → Environment Variables**

Adicione estas variáveis para `Production`:

```env
# === OpenRouter (CRÍTICO!) ===
OPENROUTER_API_KEY=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

# === Supabase (persistência de mensagens) ===
NEXT_PUBLIC_SUPABASE_URL=https://fjcbowphcbnvuowsjvbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqY2Jvd3BoY2JudnVvd3NqdmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjA1MzYsImV4cCI6MjA3NzkzNjUzNn0.VX_17s04sNvSW-0Tf54EZE-KhF15wkMqBtUMKIZLUpY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqY2Jvd3BoY2JudnVvd3NqdmJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM2MDUzNiwiZXhwIjoyMDc3OTM2NTM2fQ.CzUb2pLZAOCabBnCNZJaDyL33o3ihzTDJ5cTieZbPxk

# === URLs (corrigir localhost!) ===
NEXT_PUBLIC_SITE_URL=https://www.odontogpt.com
APP_URL=https://www.odontogpt.com
```

**IMPORTANTE**: Marque `Production`, `Preview` e `Development` para cada variável.

---

### 2️⃣ Commit das Correções Locais

```bash
cd /Users/marcosalexandre/Library/CloudStorage/GoogleDrive-marckexpert1@gmail.com/Meu\ Drive/Mac_Sync/Projetos/v0-odonto-gpt-ui

# Add página de notificações
git add app/dashboard/notificacoes/page.tsx

# Commit
git commit -m "fix: adicionar página de notificações faltante"

# Push
git push origin main
```

---

### 3️⃣ Aguardar Deploy Automático

A Vercel fará deploy automático após o push. Acompanhe:

```bash
vercel logs --follow
```

**OU** via Dashboard: vercel.com/dashboard → Deployments

---

### 4️⃣ Testar em Produção

1. Acesse: `https://www.odontogpt.com/dashboard/chat`
2. Abra Console (F12)
3. Envie uma mensagem
4. Verifique:
   - ✅ Sem erros 404
   - ✅ Resposta do AI recebida
   - ✅ Mensagens salvas no Supabase

---

## 🔍 Diagnóstico Detalhado

### O que já está CORRETO:

✅ **Código da API** (`/app/api/newchat/route.ts`):
- Edge Runtime configurado
- `streamText` do AI SDK
- OpenRouter integrado
- ChatService para persistência

✅ **Cliente** (`components/dashboard/odonto-ai-chat.tsx`):
- `useChat` do AI SDK
- Endpoint correto: `/api/newchat`
- Tratamento de erros
- UI moderna

✅ **Agentes** (`lib/ai/agents/config.ts`):
- Configurações OK
- Tools definidos
- System prompts

### O que estava FALTANDO:

❌ **Variáveis de Ambiente** na Vercel:
- `OPENROUTER_API_KEY` - **SEM ISSO O CHAT NÃO FUNCIONA**
- URLs apontando para localhost
- Possível falta de variáveis do Supabase

❌ **Página de Notificações**:
- ✅ **RESOLVIDO** - criada em `app/dashboard/notificacoes/page.tsx`

---

## 🧪 Como Testar Localmente (Edge Runtime)

Para simular o ambiente de produção:

```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Rodar em modo Edge (igual produção)
vercel dev

# Testar chat
open http://localhost:3000/dashboard/chat
```

---

## 📊 Verificação de Variáveis

### No Browser (DevTools Console):

```javascript
// Estas variáveis devem aparecer:
console.log({
  site: process.env.NEXT_PUBLIC_SITE_URL,
  supabase: process.env.NEXT_PUBLIC_SUPABASE_URL,
})
```

**Produção deve mostrar**:
```javascript
{
  site: "https://www.odontogpt.com",
  supabase: "https://fjcbowphcbnvuowsjvbz.supabase.co"
}
```

**❌ Se mostrar `localhost`, a variável NÃO foi configurada!**

### No Servidor (Logs):

Adicione temporariamente em `/app/api/newchat/route.ts`:

```typescript
console.log('[ENV CHECK]', {
  hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
  hasSupabase: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
})
```

Nos logs da Vercel deve aparecer:
```
[ENV CHECK] { hasOpenRouter: true, hasSupabase: true }
```

---

## 🚨 Troubleshooting

### Chat não responde após configurar variáveis:

1. **Verificar OpenRouter API**:
   ```bash
   curl https://openrouter.ai/api/v1/chat/completions \
     -H "Authorization: Bearer sk-or-v1-..." \
     -H "Content-Type: application/json" \
     -d '{
       "model": "google/gemini-2.0-flash-001",
       "messages": [{"role": "user", "content": "test"}]
     }'
   ```

2. **Verificar Logs da Vercel**:
   ```bash
   vercel logs | grep "Error"
   vercel logs | grep "newchat"
   ```

3. **Verificar Supabase**:
   - Tables `chat_sessions` e `chat_messages` existem?
   - RLS policies permitem INSERT/SELECT?

### Erro "Edge Runtime not compatible":

- Verifique imports em `/app/api/newchat/route.ts`
- `ChatService` deve usar apenas APIs Edge-safe
- Não usar `fs`, `path`, ou outros Node.js built-ins

### Timeout (60s):

Se respostas muito longas:
```typescript
// Aumentar em /app/api/newchat/route.ts
export const maxDuration = 60 // já está configurado
```

---

## ✅ Checklist Final

### Antes:
- [ ] Variáveis configuradas na Vercel
- [ ] OPENROUTER_API_KEY presente
- [ ] URLs sem localhost
- [ ] Código committed e pushed

### Durante Deploy:
- [ ] Build sem erros
- [ ] Deploy concluído
- [ ] Logs sem erros críticos

### Após:
- [ ] Chat envia mensagem
- [ ] AI responde
- [ ] Sem erros 404 (notificações)
- [ ] Persistência funcionando

---

## 📝 Resumo

**Root Cause**: Falta de `OPENROUTER_API_KEY` e outras variáveis na Vercel

**Solução**: Adicionar variáveis no dashboard da Vercel

**ETA**: 10-15 minutos

**Prioridade**: 🔴 MÁXIMA

---

**Próximo Passo**: Configurar variáveis na Vercel conforme seção 1️⃣ acima
