---
status: active
generated: 2026-01-26
priority: high
agents:
  - type: "bug-fixer"
    role: "Corrigir CHECK constraint e RLS policies"
  - type: "backend-specialist"
    role: "Ajustar API routes e persistencia"
  - type: "frontend-specialist"
    role: "Corrigir sincronizacao de estado no cliente"
  - type: "test-writer"
    role: "Validar correcoes com testes"
docs:
  - "architecture.md"
  - "security.md"
phases:
  - id: "phase-1"
    name: "Corrigir Schema e RLS"
    prevc: "P"
  - id: "phase-2"
    name: "Ajustar Backend e Frontend"
    prevc: "E"
  - id: "phase-3"
    name: "Validacao e Testes"
    prevc: "V"
---

# Corrigir Sistema de Historico de Conversas

> Resolver os problemas identificados no sistema de historico que impedem a listagem e persistencia correta das conversas.

## Task Snapshot

- **Primary goal:** Fazer o historico de conversas funcionar corretamente - listar, persistir e carregar conversas anteriores
- **Success signal:** Usuario consegue ver suas conversas na sidebar, clicar em uma conversa anterior e ver as mensagens, e novas conversas aparecem automaticamente
- **Key references:**
  - [Architecture](../docs/architecture.md)
  - [Security](../docs/security.md)

## Problemas Identificados

### 1. CHECK Constraint Incompativel (CRITICO)

**Arquivo:** `supabase/migrations/20260113000000_add_agent_sessions.sql:14`

```sql
status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'error'))
```

**Problema:** O codigo usa `'deleted'` para soft-delete, mas esse valor NAO existe no CHECK constraint.

**Arquivos afetados:**
- `app/api/chat/route.ts:598` - `.update({ status: 'deleted' })`
- `lib/db/queries.ts:40,74,197,218` - `.neq('status', 'deleted')`

### 2. Inconsistencia RLS vs Admin Client

**Criacao de sessao:** Usa `adminSupabase` (bypassa RLS)
```typescript
// app/api/chat/route.ts:345
const { data: session } = await adminSupabase
  .from('agent_sessions')
  .insert({...})
```

**Leitura de historico:** Usa client com RLS
```typescript
// lib/db/queries.ts:67
const supabase = await createClient() // anon key + RLS
```

**Problema:** Se o `user_id` nao estiver correto ou RLS mal configurado, usuario nao ve suas conversas.

### 3. sessionId Nao Propagado ao Cliente

**No hook:** `useBlockingChat` recebe `sessionId` inicial mas nao atualiza quando servidor cria nova sessao.

```typescript
// lib/hooks/use-blocking-chat.ts:166
const data: BlockingChatResponse = await response.json()
// data.sessionId existe mas nao e usado para atualizar estado
```

### 4. Sidebar Nao Revalida Apos Nova Mensagem

**No componente:** `SidebarChats` usa SWR mas nao ha trigger de revalidacao apos enviar mensagem.

```typescript
// components/sidebar/sidebar-chats.tsx:129
useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
  fallbackData: [],
})
// Nenhum mutate() e chamado apos nova conversa
```

## Codebase Context

### Arquivos Principais

| Arquivo | Responsabilidade |
| --- | --- |
| `app/api/chat/route.ts` | API de chat - cria sessoes e mensagens |
| `app/api/history/route.ts` | API de historico - lista conversas |
| `lib/db/queries.ts` | Queries Supabase para historico |
| `lib/hooks/use-blocking-chat.ts` | Hook de chat no cliente |
| `components/sidebar/sidebar-chats.tsx` | Lista de conversas na sidebar |
| `components/chat/chat.tsx` | Componente principal de chat |
| `supabase/migrations/20260113000000_add_agent_sessions.sql` | Schema das tabelas |

### Fluxo de Dados Atual

```
[Usuario envia mensagem]
       |
       v
[useBlockingChat.sendMessage()]
       |
       v
[POST /api/chat]
       |
       +--> [adminSupabase.insert(agent_sessions)] (se nova conversa)
       |
       +--> [adminSupabase.insert(agent_messages)]
       |
       v
[Response: { message, sessionId }]
       |
       v
[Cliente adiciona mensagem ao estado local]
       |
       X--> [Sidebar NAO e notificada]
```

## Agent Lineup

| Agent | Role in this plan | First responsibility |
| --- | --- | --- |
| Bug Fixer | Corrigir CHECK constraint no Supabase | Criar migration para adicionar 'deleted' ao enum |
| Backend Specialist | Ajustar API routes | Garantir user_id correto e retornar sessionId |
| Frontend Specialist | Sincronizar estado | Propagar sessionId e revalidar sidebar |
| Test Writer | Validar correcoes | Rodar `scripts/test-history.ts` e criar testes E2E |

## Risk Assessment

### Identified Risks

| Risk | Probability | Impact | Mitigation Strategy |
| --- | --- | --- | --- |
| Migration falhar em producao | Medium | High | Testar em staging primeiro, backup antes |
| Dados existentes com status invalido | Low | Medium | Migration deve tratar dados existentes |
| RLS bloquear usuarios legados | Low | High | Verificar policies antes de deploy |

### Dependencies

- **Internal:** Acesso ao Supabase Dashboard para rodar migrations
- **External:** Nenhuma
- **Technical:** Migration SQL deve ser idempotente

### Assumptions

- Todas as sessoes existentes tem `user_id` valido
- Nenhuma sessao existente tem status diferente de 'active', 'completed', 'error'

## Working Phases

### Phase 1 — Corrigir Schema e RLS

**Steps:**

1. **Criar migration para CHECK constraint**
   ```sql
   -- supabase/migrations/20260127100000_fix_session_status_constraint.sql

   -- Remover constraint antigo
   ALTER TABLE public.agent_sessions
   DROP CONSTRAINT IF EXISTS agent_sessions_status_check;

   -- Adicionar constraint com 'deleted'
   ALTER TABLE public.agent_sessions
   ADD CONSTRAINT agent_sessions_status_check
   CHECK (status IN ('active', 'completed', 'error', 'deleted'));
   ```

2. **Verificar RLS policies**
   - Confirmar que `auth.uid() = user_id` funciona corretamente
   - Testar com usuario real

3. **Verificar dados existentes**
   ```sql
   SELECT status, COUNT(*) FROM agent_sessions GROUP BY status;
   ```

**Commit Checkpoint:**
```bash
git commit -m "fix(db): add 'deleted' status to agent_sessions CHECK constraint"
```

### Phase 2 — Ajustar Backend e Frontend

**Steps:**

1. **Atualizar useBlockingChat para propagar sessionId**

   ```typescript
   // lib/hooks/use-blocking-chat.ts
   const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId)

   // Apos resposta:
   if (data.sessionId && data.sessionId !== sessionId) {
     setSessionId(data.sessionId)
     // Notificar sidebar via evento ou context
   }
   ```

2. **Adicionar revalidacao da sidebar**

   ```typescript
   // Criar contexto ou evento para notificar sidebar
   // components/sidebar/sidebar-chats.tsx

   // Expor mutate ou usar useSWRConfig
   const { mutate: globalMutate } = useSWRConfig()

   // Apos nova mensagem:
   globalMutate((key) => typeof key === 'string' && key.startsWith('/api/history'))
   ```

3. **Garantir user_id na criacao de sessao**

   ```typescript
   // app/api/chat/route.ts:345
   const { data: session } = await adminSupabase
     .from('agent_sessions')
     .insert({
       user_id: currentUserId, // GARANTIR que esta correto
       agent_type: dbAgentType,
       title: sessionTitle,
     })
   ```

**Commit Checkpoint:**
```bash
git commit -m "fix(chat): propagate sessionId and revalidate sidebar on new chat"
```

### Phase 3 — Validacao e Testes

**Steps:**

1. **Rodar script de teste**
   ```bash
   npx tsx scripts/test-history.ts
   ```

2. **Teste manual E2E**
   - Login como usuario
   - Enviar nova mensagem
   - Verificar se conversa aparece na sidebar
   - Clicar na conversa
   - Verificar se mensagens carregam
   - Deletar conversa
   - Verificar se some da sidebar

3. **Verificar logs**
   ```typescript
   console.log('[History API] Returning chats:', { userId, count, firstChat })
   console.log('[Chat] Session created:', { sessionId, userId, title })
   ```

**Commit Checkpoint:**
```bash
git commit -m "test(history): validate chat history system fixes"
```

## Rollback Plan

### Rollback Triggers

- Usuarios nao conseguem criar novas conversas
- Historico retorna vazio para todos usuarios
- Erros de constraint no banco

### Rollback Procedures

#### Phase 1 Rollback
- **Action:** Reverter migration
  ```sql
  ALTER TABLE public.agent_sessions DROP CONSTRAINT agent_sessions_status_check;
  ALTER TABLE public.agent_sessions ADD CONSTRAINT agent_sessions_status_check
  CHECK (status IN ('active', 'completed', 'error'));
  ```
- **Data Impact:** Sessoes com status 'deleted' ficarao invalidas
- **Estimated Time:** 5 minutos

#### Phase 2 Rollback
- **Action:** `git revert` dos commits de frontend/backend
- **Data Impact:** Nenhum (apenas codigo)
- **Estimated Time:** 10 minutos

### Post-Rollback Actions

1. Verificar logs de erro
2. Identificar causa raiz
3. Corrigir e re-testar antes de novo deploy

## Evidence & Follow-up

### Artifacts to Collect

- [ ] Screenshot da sidebar com conversas listadas
- [ ] Log do `[History API]` mostrando chats retornados
- [ ] Resultado do `scripts/test-history.ts` com todos testes passando
- [ ] Query SQL mostrando sessoes com status correto

### Follow-up Actions

| Action | Owner | Due |
| --- | --- | --- |
| Monitorar erros no Sentry apos deploy | Dev | +1 dia |
| Verificar metricas de uso do historico | Dev | +1 semana |
| Documentar fluxo de persistencia | Dev | +2 semanas |
