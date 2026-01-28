---
status: ready
generated: 2026-01-28
priority: high
phases:
  - id: "phase-1"
    name: "Correções Críticas"
    prevc: "E"
  - id: "phase-2"
    name: "Otimizações Básicas"
    prevc: "E"
  - id: "phase-3"
    name: "Validação"
    prevc: "V"
---

# Correções Minimalistas - Sistema de Conversas Recentes

> Foco: fazer funcionar corretamente com o mínimo de mudanças

## Objetivo

Corrigir os 4 problemas mais críticos do sistema de histórico de conversas, priorizando funcionalidade sobre features.

**Success signal**: Conversas ordenam por última atividade, preview mostra erro se falhar, delete só remove após confirmação.

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `lib/db/queries.ts` | Ordenação consistente por `updated_at` |
| `components/chat/sidebar-history.tsx` | useMemo + fix race condition |
| `components/chat/sidebar-history-item.tsx` | Tratamento de erro no preview |

---

## Phase 1 — Correções Críticas

### 1.1 Ordenação Consistente (CRÍTICO)

**Problema**: `getChatsPaginated` usa `created_at`, mas `getChats` usa `updated_at`. Conversas antigas com novas mensagens não sobem na lista.

**Arquivo**: `lib/db/queries.ts`

**Correção linhas 70-88**:
```typescript
let query = supabase
  .from('agent_sessions')
  .select('*')
  .eq('user_id', userId)
  .neq('status', 'deleted')
  .order('updated_at', { ascending: false })  // <-- MUDAR de created_at
  .limit(limit + 1)

if (options.endingBefore) {
  const { data: cursorChat } = await supabase
    .from('agent_sessions')
    .select('updated_at')  // <-- MUDAR de created_at
    .eq('id', options.endingBefore)
    .single()

  if (cursorChat) {
    query = query.lt('updated_at', cursorChat.updated_at)  // <-- MUDAR
  }
}
```

---

### 1.2 Tratamento de Erro no Preview

**Problema**: Se preview falhar, fica em "Carregando..." eternamente.

**Arquivo**: `components/chat/sidebar-history-item.tsx`

**Correção linha 67**:
```typescript
const { data: preview, error: previewError } = useSWR<ChatPreview>(
  isHovered ? `/api/history/${chat.id}/preview` : null,
  fetcher,
  {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  }
)
```

**Correção JSX (substituir bloco else final)**:
```tsx
) : previewError ? (
  <div className="text-xs text-[var(--text-muted)] italic">
    Erro ao carregar
  </div>
) : (
  <div className="text-xs text-[var(--text-muted)] italic">
    Carregando...
  </div>
)}
```

---

## Phase 2 — Otimizações Básicas

### 2.1 Memoizar Agrupamento por Data

**Problema**: `groupChatsByDate` recalcula em cada render.

**Arquivo**: `components/chat/sidebar-history.tsx`

**Correção**: Adicionar import e extrair lógica.

```typescript
// Adicionar ao import existente de useState
import { useState, useMemo } from 'react'

// Adicionar ANTES do return, dentro do componente SidebarHistory:
const groupedChats = useMemo(() => {
  if (!paginatedChatHistories) return null
  const chats = paginatedChatHistories.flatMap(p => p.chats)
  return groupChatsByDate(chats)
}, [paginatedChatHistories])

// No JSX, substituir a IIFE por uso direto de groupedChats
```

---

### 2.2 Fix Race Condition no Delete

**Problema**: Cache atualiza antes de confirmar sucesso no servidor.

**Arquivo**: `components/chat/sidebar-history.tsx`

**Substituir função handleDelete (linhas 132-165)**:
```typescript
const handleDelete = async () => {
  const chatToDelete = deleteId
  const isCurrentChat = id === chatToDelete
  setShowDeleteDialog(false)

  try {
    const res = await fetch(`/api/chat?id=${chatToDelete}`, {
      method: 'DELETE',
    })

    if (!res.ok) throw new Error('Delete failed')

    // Atualiza cache APÓS sucesso
    mutate((chatHistories) => {
      if (chatHistories) {
        return chatHistories.map((chatHistory) => ({
          ...chatHistory,
          chats: chatHistory.chats.filter(
            (chat) => chat.id !== chatToDelete
          ),
        }))
      }
    })

    if (isCurrentChat) {
      router.replace('/dashboard/chat')
      router.refresh()
    }

    toast.success('Conversa excluida')
  } catch {
    toast.error('Erro ao excluir conversa')
  }
}
```

---

## Phase 3 — Validacao

### Checklist de Testes Manuais

- [ ] Criar conversa nova → aparece no topo da lista
- [ ] Enviar mensagem em conversa antiga → sobe para o topo
- [ ] Hover em conversa → preview carrega ou mostra "Erro ao carregar"
- [ ] Deletar conversa → some da lista so apos confirmacao do servidor
- [ ] Scroll infinito → carrega mais conversas corretamente

### Verificacao de Console

Nao deve haver erros de:
- "Cannot read property of undefined"
- "Failed to fetch" sem tratamento
- Warnings de React sobre keys duplicadas

---

## Fora de Escopo

| Item | Motivo |
|------|--------|
| Supabase Realtime | Complexidade alta, nao critico |
| Busca SQL com tsvector | Requer migration |
| Remover duplicacao de titulo | Requer migration + data fix |

---

## Commits Sugeridos

```bash
# Phase 1
git commit -m "fix(history): use updated_at for consistent ordering"
git commit -m "fix(sidebar): handle preview fetch errors"

# Phase 2
git commit -m "perf(sidebar): memoize chat grouping"
git commit -m "fix(sidebar): wait for delete confirmation before cache update"
```

---

## Rollback

Se algo quebrar:
```bash
git revert HEAD~N  # onde N = numero de commits desta task
```

Nenhuma migration de banco foi feita, rollback e seguro.
