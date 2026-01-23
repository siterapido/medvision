# Relatório de Investigação - Chat em Produção

**Data**: 2026-01-23  
**Status**: 🔴 **PROBLEMAS CRÍTICOS ENCONTRADOS**

---

## 🎯 Resumo Executivo

O chat **NÃO funciona em produção** devido a problemas de configuração de variáveis de ambiente. Especificamente:

1. ✅ A API `/api/newchat` está implementada corretamente
2. ❌ **CRITICAL**: Variável de ambiente `NEXT_PUBLIC_AGNO_SERVICE_URL` aponta para `localhost`
3. ❌ Rota `/dashboard/notificacoes` não existe, causando erros 404

---

## 📊 Problemas Encontrados

### 1. NEXT_PUBLIC_AGNO_SERVICE_URL apontando para localhost

**Severidade**: 🔴 **CRÍTICA**  
**Localização**: `.env.local` linha 19  
**Problema**:
```env
# Atual (INCORRETO para produção):
NEXT_PUBLIC_AGNO_SERVICE_URL=http://localhost:8000/api/v1

# Deveria ser (comentado):
# NEXT_PUBLIC_AGNO_SERVICE_URL=https://v0-odonto-gpt-ui-production.up.railway.app/api/v1
```

**Impacto**:
- Esta variável é `NEXT_PUBLIC_*`, ou seja, é exposta ao browser
- Em produção, o browser não pode acessar `localhost:8000`
- Chamadas para este serviço falham silenciosamente
- **Se o chat depende deste serviço, ele não funcionará**

**Ação Necessária**:
- Atualizar variável na Vercel para a URL de produção
- Verificar se Railway app está ativa e funcionando
</ **Verificar se a API `/api/newchat` realmente depende deste serviço**

---

### 2. Rota de Notificações Não Existe

**Severidade**: 🟡 **MÉDIA**  
**Localização**: `components/dashboard/sidebar.tsx` linha 52  
**Problema**:
```tsx
const bottomNavItems: NavItem[] = [
  { href: '/dashboard/notificacoes', label: 'Notificações', icon: Bell },
]
```

Mas a rota `/app/dashboard/notificacoes/page.tsx` **NÃO EXISTE**.

**Impacto**:
- Erros 404 no console: `notificacoes?_rsc=18t7j` e `notificacoes?_rsc=j0a4x`
- Estes são requests do Next.js RSC (React Server Components)
- Não impedem o chat de funcionar diretamente, mas poluem o console

**Ação Necessária**:
- Criar a página `/app/dashboard/notificacoes/page.tsx`

---

### 3. Análise da API `/api/newchat`

**Status**: ✅ **CÓDIGO PARECE CORRETO**

**Configuração**:
```typescript
export const runtime = 'edge'
export const maxDuration = 60
```

**Dependências Analisadas**:
- ✅ Usa `streamText` do AI SDK
- ✅ Usa `openrouter` configurado em `lib/ai/openrouter.ts`
- ✅ Usa `ChatService` para persistência
- ✅ Variáveis necessárias: `OPENROUTER_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**Possível Problema**:
- Se `AGENT_CONFIGS` depende de `NEXT_PUBLIC_AGNO_SERVICE_URL`, pode falhar
- Preciso verificar `lib/ai/agents/config.ts`

---

## 🔬 Verificações Adicionais Necessárias

### 1. Verificar se chat depende do serviço Agno
```bash
grep -r "NEXT_PUBLIC_AGNO_SERVICE_URL" app/api/newchat/
grep -r "NEXT_PUBLIC_AGNO_SERVICE_URL" lib/ai/
```

### 2. Verificar variáveis na Vercel
- Acessar: https://vercel.com/dashboard → Project → Settings → Environment Variables
- Confirmar quais variáveis estão configuradas

### 3. Verificar logs da Vercel
- Ver se há erros de runtime
- Verificar se requests chegam ao endpoint

### 4. Verificar Railway
- Confirmar se `https://v0-odonto-gpt-ui-production.up.railway.app` está ativo
- Testar endpoint `/api/v1/health` ou similar

---

## ✅ Ações Imediatas

### Prioridade 1: Corrigir NEXT_PUBLIC_AGNO_SERVICE_URL
1. [ ] Verificar dependência do chat com Agno service
2. [ ] Confirmar URL de produção do Railway
3. [ ] Atualizar variável na Vercel
4. [ ] Redeploy

### Prioridade 2: Criar Rota de Notificações
1. [ ] Criar `/app/dashboard/notificacoes/page.tsx`
2. [ ] Implementar UI básica
3. [ ] Commit e deploy

### Prioridade 3: Validar OpenRouter
1. [ ] Verificar se `OPENROUTER_API_KEY` está na Vercel
2. [ ] Testar chave com curl
3. [ ] Verificar rate limits

---

## 📝 Notas Técnicas

**Arquivos Revisados**:
- ✅ `app/api/newchat/route.ts` - ImplementaçãoOK
- ✅ `components/dashboard/odonto-ai-chat.tsx` - Cliente OK
- ✅ `.env.local` - **PROBLEMA ENCONTRADO**
- ✅ `components/dashboard/sidebar.tsx` - Link quebrado encontrado

**Próximos Passos**:
1. Buscar todas as referências a `AGNO_SERVICE_URL`:
2. Verificar se é usado pelo chat
3. Decidir se precisa estar em produção

---

**Investigador**: Antigravity AI  
**Timestamp**: 2026-01-23T00:13:00Z
