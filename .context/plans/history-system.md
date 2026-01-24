---
status: ready
generated: 2026-01-24
agents:
  - type: "feature-developer"
    role: "Implementar componentes React e hooks"
  - type: "frontend-specialist"
    role: "Garantir aderência ao design system"
  - type: "test-writer"
    role: "Criar testes no terminal com ai-context MCP"
phases:
  - id: "phase-1"
    name: "API & Database Layer"
    prevc: "P"
  - id: "phase-2"
    name: "Sidebar History Enhancement"
    prevc: "E"
  - id: "phase-3"
    name: "Dashboard History Page"
    prevc: "E"
  - id: "phase-4"
    name: "Integration & Testing"
    prevc: "V"
docs:
  - "architecture.md"
  - "development-workflow.md"
---

# Sistema de Historico de Conversas Integrado

> Implementar sistema de historico de conversas na sidebar e /dashboard/historico, usando AI SDK v6, seguindo design system Odonto GPT e com testes no terminal

## Task Snapshot

- **Primary goal:** Sistema completo de historico que permite visualizar, buscar, filtrar e gerenciar conversas passadas tanto na sidebar quanto em pagina dedicada
- **Success signal:** Usuario consegue acessar historico de 3 formas: sidebar (quick access), pagina /dashboard/historico (full view), e busca funcional
- **Key references:**
  - Design System: `.interface-design/system.md`
  - AI SDK v6: useChat, DefaultChatTransport, UIMessage
  - Existing: `components/sidebar/sidebar-chats.tsx` (infinite scroll)

## Arquitetura Atual

### Database Schema (Supabase)
```sql
-- agent_sessions
id (uuid, primary key)
user_id (uuid -> auth.users)
agent_type (text)
title (text)
status (text: 'active', 'deleted')
metadata (jsonb)
created_at, updated_at

-- agent_messages
id (uuid, primary key)
session_id (uuid -> agent_sessions)
agent_id (text)
role (text: 'user', 'assistant', 'system')
content (text)
tool_calls, tool_results (jsonb)
created_at
```

### Componentes Existentes
| Componente | Arquivo | Status |
|------------|---------|--------|
| Sidebar History | `components/sidebar/sidebar-chats.tsx` | Infinite scroll com SWRInfinite |
| History Item | `components/sidebar/sidebar-history-item.tsx` | Delete individual |
| Chat Page | `app/dashboard/chat/page.tsx` | Carrega mensagens via searchParams.id |
| History API | `app/api/history/route.ts` | GET paginated, DELETE all |
| DB Queries | `lib/db/queries.ts` | getChatsPaginated, deleteChat |

### Gaps Identificados
1. Pagina /dashboard/historico nao existe
2. Busca na sidebar nao funciona (UI existe, fetch nao)
3. Filtros por data/agente nao implementados
4. Preview de mensagens no historico

---

## Phase 1 - API & Database Layer

### 1.1 Endpoint de Busca
**Arquivo:** `app/api/history/search/route.ts`

```typescript
// GET /api/history/search?q=termo&agent=odonto-gpt&from=2026-01-01&to=2026-01-24
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')
  const agentId = searchParams.get('agent')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limit = parseInt(searchParams.get('limit') || '20')

  // Full-text search em agent_messages.content
  // Join com agent_sessions para metadata
  // Retorna sessions com snippet do match
}
```

### 1.2 Query Helper para Busca
**Arquivo:** `lib/db/queries.ts`

```typescript
export async function searchChats(
  userId: string,
  options: {
    query?: string
    agentId?: string
    from?: Date
    to?: Date
    limit?: number
    offset?: number
  }
): Promise<{ chats: ChatWithPreview[], total: number }>
```

### 1.3 Endpoint de Preview
**Arquivo:** `app/api/history/[id]/preview/route.ts`

```typescript
// GET /api/history/{id}/preview
// Retorna ultimas 3 mensagens da sessao para preview rapido
```

**Commit Checkpoint:** `feat(api): add history search and preview endpoints`

---

## Phase 2 - Sidebar History Enhancement

### 2.1 Search Input Funcional
**Arquivo:** `components/sidebar/sidebar-search.tsx`

```tsx
'use client'
import { useState, useDeferredValue } from 'react'
import useSWR from 'swr'

export function SidebarSearch({ onResults }: { onResults: (chats: Chat[]) => void }) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  const { data, isLoading } = useSWR(
    deferredQuery.length >= 2 ? `/api/history/search?q=${deferredQuery}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Debounce + resultados inline
}
```

### 2.2 History Item com Preview
**Arquivo:** `components/sidebar/sidebar-history-item.tsx`

Adicionar:
- Hover state com preview das ultimas mensagens
- Badge de agente (se diferente do padrao)
- Indicador de nova mensagem

### 2.3 Design System Compliance

```css
/* Seguindo .interface-design/system.md */
.history-item {
  background: var(--surface-100);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md); /* 8px */
  padding: var(--space-3); /* 12px */
}

.history-item:hover {
  border-color: var(--border-strong);
  background: var(--surface-200);
}

.history-item-active {
  border-color: var(--brand);
  box-shadow: 0 0 0 1px var(--brand), 0 0 20px var(--brand-glow);
}
```

**Commit Checkpoint:** `feat(sidebar): implement functional search and preview`

---

## Phase 3 - Dashboard History Page

### 3.1 Page Structure
**Arquivo:** `app/dashboard/historico/page.tsx`

```tsx
export default async function HistoricoPage() {
  const user = await getUser()
  const initialChats = await getChatsPaginated(user.id, { limit: 20 })

  return (
    <div className="flex flex-col h-full">
      <HistoricoHeader />
      <HistoricoFilters />
      <HistoricoList initialChats={initialChats} />
    </div>
  )
}
```

### 3.2 Componentes da Pagina

#### HistoricoHeader
```tsx
// Titulo + botao "Nova Conversa" + contador total
<div className="flex items-center justify-between p-6 border-b border-border-default">
  <div>
    <h1 className="text-2xl font-semibold text-text-primary">Historico</h1>
    <p className="text-sm text-text-tertiary">{total} conversas</p>
  </div>
  <Button onClick={() => router.push('/dashboard/chat')}>
    <Plus className="w-4 h-4 mr-2" />
    Nova Conversa
  </Button>
</div>
```

#### HistoricoFilters
```tsx
// Busca + filtros por periodo + filtro por agente
<div className="flex gap-4 p-4 border-b border-border-subtle">
  <SearchInput placeholder="Buscar conversas..." />
  <DateRangePicker />
  <AgentFilter />
</div>
```

#### HistoricoList
```tsx
// Lista com infinite scroll + agrupamento por data
// Reutiliza logica de sidebar-chats.tsx com useSWRInfinite
// Cards maiores com preview de mensagens
```

### 3.3 Card de Conversa Expandido

```tsx
interface HistoricoCardProps {
  chat: ChatWithPreview
}

function HistoricoCard({ chat }: HistoricoCardProps) {
  return (
    <Link href={`/dashboard/chat?id=${chat.id}`}>
      <Card className="p-4 hover:border-brand transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-text-primary">{chat.title}</h3>
            <p className="text-sm text-text-tertiary">{formatDate(chat.created_at)}</p>
          </div>
          <Badge variant="outline">{chat.agent_type}</Badge>
        </div>

        {/* Preview das ultimas mensagens */}
        <div className="mt-3 space-y-2">
          {chat.preview?.map((msg) => (
            <div key={msg.id} className="text-sm text-text-secondary truncate">
              <span className="font-medium">{msg.role === 'user' ? 'Voce' : 'AI'}:</span>
              {msg.content.slice(0, 100)}...
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border-subtle">
          <span className="text-xs text-text-muted">
            {chat.message_count} mensagens
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  )
}
```

**Commit Checkpoint:** `feat(dashboard): add /dashboard/historico page`

---

## Phase 4 - Integration & Testing

### 4.1 Testes no Terminal (ai-context MCP)

#### Test 1: API Search
```bash
# Testar endpoint de busca
curl -X GET "http://localhost:3000/api/history/search?q=dente" \
  -H "Cookie: $AUTH_COOKIE" | jq
```

#### Test 2: Paginacao
```bash
# Testar infinite scroll
curl -X GET "http://localhost:3000/api/history?limit=5" | jq '.chats | length'
curl -X GET "http://localhost:3000/api/history?limit=5&ending_before=<last_id>" | jq
```

#### Test 3: Database Queries
```typescript
// lib/db/queries.test.ts
import { searchChats, getChatsPaginated } from './queries'

describe('searchChats', () => {
  it('returns matching sessions by content', async () => {
    const result = await searchChats(userId, { query: 'carie' })
    expect(result.chats.length).toBeGreaterThan(0)
    expect(result.chats[0].preview).toContain('carie')
  })

  it('filters by date range', async () => {
    const result = await searchChats(userId, {
      from: new Date('2026-01-01'),
      to: new Date('2026-01-15')
    })
    result.chats.forEach(chat => {
      expect(new Date(chat.created_at)).toBeWithin(from, to)
    })
  })
})
```

### 4.2 Script de Teste Integrado

**Arquivo:** `scripts/test-history.ts`

```typescript
#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'

async function testHistorySystem() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('Testing History System...\n')

  // Test 1: Listar sessoes
  console.log('1. Listing sessions...')
  const { data: sessions } = await supabase
    .from('agent_sessions')
    .select('id, title, created_at')
    .eq('status', 'active')
    .limit(5)
  console.log(`   Found ${sessions?.length} sessions`)

  // Test 2: Buscar mensagens
  console.log('\n2. Searching messages...')
  const { data: messages } = await supabase
    .from('agent_messages')
    .select('id, content')
    .textSearch('content', 'dente')
    .limit(3)
  console.log(`   Found ${messages?.length} matches`)

  // Test 3: Join com preview
  console.log('\n3. Testing preview join...')
  const { data: preview } = await supabase
    .from('agent_sessions')
    .select(`
      id,
      title,
      agent_messages!inner(id, role, content)
    `)
    .eq('status', 'active')
    .limit(1)
  console.log(`   Preview loaded: ${preview?.[0]?.title}`)

  console.log('\n All tests passed!')
}

testHistorySystem().catch(console.error)
```

**Executar:** `npx tsx scripts/test-history.ts`

### 4.3 Validacao de UI

```
Checklist de validacao visual:
[ ] Sidebar search responde em < 300ms
[ ] Cards usam cores do design system
[ ] Hover states funcionam
[ ] Infinite scroll carrega mais items
[ ] Delete mostra confirmacao
[ ] Empty state quando sem resultados
[ ] Loading skeleton durante fetch
[ ] Responsive no mobile
```

**Commit Checkpoint:** `test(history): add terminal tests and validation scripts`

---

## Arquivos a Criar/Modificar

### Novos Arquivos
| Arquivo | Descricao |
|---------|-----------|
| `app/api/history/search/route.ts` | Endpoint de busca full-text |
| `app/api/history/[id]/preview/route.ts` | Preview de mensagens |
| `app/dashboard/historico/page.tsx` | Pagina principal de historico |
| `components/historico/historico-header.tsx` | Header da pagina |
| `components/historico/historico-filters.tsx` | Filtros de busca |
| `components/historico/historico-list.tsx` | Lista com infinite scroll |
| `components/historico/historico-card.tsx` | Card de conversa expandido |
| `scripts/test-history.ts` | Testes no terminal |

### Arquivos a Modificar
| Arquivo | Mudanca |
|---------|---------|
| `lib/db/queries.ts` | Adicionar searchChats, getChatWithPreview |
| `components/sidebar/sidebar-search.tsx` | Implementar fetch de busca |
| `components/sidebar/sidebar-history-item.tsx` | Adicionar hover preview |

---

## Rollback Plan

### Triggers
- Erro de performance no full-text search
- Quebra da sidebar existente
- Incompatibilidade com AI SDK v6

### Procedimento
1. Reverter commits da feature branch
2. Manter endpoints existentes inalterados
3. API /api/history original nao foi modificada

---

## Success Criteria

- [ ] Busca retorna resultados em < 500ms
- [ ] Pagina /dashboard/historico carrega < 2s
- [ ] Infinite scroll funciona sem erros
- [ ] Preview mostra ultimas 3 mensagens
- [ ] Testes no terminal passam 100%
- [ ] Design system 100% aplicado
- [ ] Mobile responsive
