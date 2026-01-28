---
status: active
progress: 100
generated: 2026-01-27
agents:
  - type: "refactoring-specialist"
    role: "Simplificar arquitetura removendo complexidade desnecessaria"
  - type: "feature-developer"
    role: "Implementar funcoes essenciais do historico"
  - type: "bug-fixer"
    role: "Corrigir race conditions e inconsistencias"
docs:
  - "architecture.md"
  - "development-workflow.md"
phases:
  - id: "phase-1"
    name: "Analise e Definicao do Escopo Minimo"
    prevc: "P"
  - id: "phase-2"
    name: "Implementacao das Funcoes Essenciais"
    prevc: "E"
  - id: "phase-3"
    name: "Validacao e Testes"
    prevc: "V"
lastUpdated: "2026-01-28T11:32:39.460Z"
---

# Implementacao Minimalista do Historico de Conversas

> Refatorar o sistema de historico para manter APENAS 4 funcoes essenciais, removendo toda complexidade desnecessaria.

## Task Snapshot

- **Primary goal:** Reduzir o sistema de ~1800 linhas para ~440 linhas, mantendo apenas funcionalidades essenciais
- **Success signal:** Chat funciona com criar sessao, salvar mensagens, listar historico e carregar conversa
- **Key references:**
  - [Architecture](../docs/architecture.md)
  - [Development Workflow](../docs/development-workflow.md)

## Escopo Minimo Viavel (MVP)

### 4 Funcoes Essenciais

| # | Funcao | Descricao | Arquivo |
|---|--------|-----------|---------|
| 1 | **Criar sessao** | Quando usuario envia primeira mensagem | `route.ts` |
| 2 | **Salvar mensagens** | User e assistant messages no DB | `route.ts` |
| 3 | **Listar historico** | Sidebar com conversas agrupadas por data | `queries.ts` |
| 4 | **Carregar conversa** | Ao clicar em uma conversa existente | `queries.ts` |

### O QUE REMOVER

- [ ] Sistema de memorias (`agent_memories`, `memoryService`)
- [ ] Extracao automatica de informacoes pessoais
- [ ] Sistema de tools e artifacts
- [ ] Intent detection
- [ ] Analytics e telemetria
- [ ] Comandos slash
- [ ] Busca full-text em mensagens
- [ ] Preview de mensagens no historico
- [ ] Soft delete (usar hard delete)
- [ ] Reload de mensagens
- [ ] Normalize de mensagens legacy

## Arquitetura Simplificada

```
Frontend                          Backend                        Database
┌──────────────────┐    ┌─────────────────────┐    ┌────────────────────┐
│ useSimpleChat    │───>│ POST /api/chat      │───>│ agent_sessions     │
│ - messages[]     │    │ - createSession()   │    │ - id, user_id      │
│ - sendMessage()  │    │ - saveMessage()     │    │ - title            │
│ - isLoading      │    │ - callAI()          │    │ - created_at       │
└──────────────────┘    └─────────────────────┘    └────────────────────┘
                                                            │
┌──────────────────┐    ┌─────────────────────┐    ┌────────────────────┐
│ SimpleSidebar    │───>│ GET /api/history    │───>│ agent_messages     │
│ - chats[]        │    │ - getChats(limit)   │    │ - session_id       │
│ - loadMore()     │    │ - cursor pagination │    │ - role, content    │
│ - deleteChat()   │    └─────────────────────┘    │ - created_at       │
└──────────────────┘                               └────────────────────┘
```

## Codebase Context

### Arquivos Atuais vs Simplificados

| Arquivo | Linhas Atual | Linhas Target | Reducao |
|---------|--------------|---------------|---------|
| `/app/api/chat/route.ts` | 627 | ~80 | -87% |
| `/lib/hooks/use-blocking-chat.ts` | 277 | ~100 | -64% |
| `/lib/db/queries.ts` | 559 | ~80 | -86% |
| `/components/chat/sidebar-history.tsx` | 373 | ~150 | -60% |
| **TOTAL** | **1836** | **~410** | **-78%** |

### Dependencias a Remover

```
lib/ai/memory.ts           → REMOVER (sistema de memorias)
lib/ai/analytics.ts        → REMOVER (telemetria)
lib/ai/commands.ts         → REMOVER (slash commands)
lib/ai/intent-detection.ts → REMOVER (deteccao de intencao)
lib/ai/tools/              → REMOVER (todo o diretorio)
```

## Working Phases

### Phase 1 — Analise e Definicao (P)

**Objetivo:** Mapear codigo existente e validar escopo.

**Steps:**
1. [x] Analisar arquivos atuais e identificar dependencias
2. [x] Criar lista de funcoes a manter vs remover
3. [ ] Validar que tabelas `agent_sessions` e `agent_messages` sao suficientes
4. [ ] Confirmar que nao ha dados criticos em campos a remover

**Arquivos criticos analisados:**
- `/app/api/chat/route.ts` - Rota principal com 627 linhas
- `/lib/hooks/use-blocking-chat.ts` - Hook com 277 linhas
- `/lib/db/queries.ts` - Queries com 559 linhas
- `/components/chat/sidebar-history.tsx` - Sidebar com 373 linhas

**Problemas identificados:**
1. Race condition no estado de mensagens (refs desatualizadas)
2. Soft delete inconsistente (filtra so `status='active'`)
3. Ordenacao diferente entre endpoints (`created_at` vs `updated_at`)

**Commit Checkpoint:** `chore(plan): complete phase 1 - chat history minimal analysis`

---

### Phase 2 — Implementacao (E)

**Objetivo:** Criar versao simplificada dos componentes essenciais.

#### Step 2.1: Criar `/lib/db/simple-queries.ts` (~80 linhas) [x]
...
#### Step 2.2: Simplificar `/app/api/chat/route.ts` (~80 linhas) [x]
...
#### Step 2.3: Simplificar `/lib/hooks/use-simple-chat.ts` (~100 linhas) [x]
...
#### Step 2.4: Simplificar `/components/chat/simple-sidebar.tsx` (~150 linhas) [x]

**Commit Checkpoint:** `feat(chat): implement minimal chat history system`

---

### Phase 3 — Validacao (V)

**Objetivo:** Garantir que funcoes essenciais funcionam corretamente.

**Testes manuais:**
| # | Cenario | Esperado | Status |
|---|---------|----------|--------|
| 1 | Criar nova conversa | Sessao criada no DB | [ ] |
| 2 | Enviar mensagem | User + Assistant salvos | [ ] |
| 3 | Recarregar pagina | Historico aparece na sidebar | [ ] |
| 4 | Clicar em conversa antiga | Mensagens carregadas | [ ] |
| 5 | Deletar conversa | Removida do DB e sidebar | [ ] |
| 6 | Multiplas abas | Sem conflitos de estado | [ ] |

**Criterios de sucesso:**
- [ ] Latencia < 500ms para listar historico
- [ ] Zero erros de console em uso normal
- [ ] Hard delete funciona corretamente (cascade)

**Commit Checkpoint:** `test(chat): validate minimal chat history functionality`

---

## Risk Assessment

### Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Perda de memorias existentes | Media | Medio | Manter tabela mas nao usar |
| Usuarios esperam soft delete | Baixa | Baixo | Confirmacao antes de deletar |
| Performance com muitas msgs | Media | Medio | Limitar 100 msgs/sessao |
| Quebra de compatibilidade | Alta | Alto | Manter formato de resposta da API |

### Dependencies

- **Internal:** Supabase client, AI SDK, OpenRouter
- **External:** OpenRouter API (Gemini 2.0 Flash)
- **Technical:** Tabelas `agent_sessions` e `agent_messages` existentes

### Assumptions

- Tabelas existentes tem todos os campos necessarios
- Nenhum outro componente depende das funcoes removidas
- Usuarios nao dependem do sistema de memorias

## Rollback Plan

### Rollback Triggers
- Falha ao criar/salvar sessoes
- Historico nao carrega
- Perda de dados de usuarios

### Rollback Procedures

**Phase 2 Rollback:**
- `git revert` dos commits da branch
- Nenhuma migration de banco necessaria
- Restaurar arquivos originais

**Tempo estimado:** < 30 minutos

## Arquivos Finais

```
lib/
├── hooks/
│   └── use-simple-chat.ts      (~100 linhas)  ← NOVO
├── db/
│   └── simple-queries.ts       (~80 linhas)   ← NOVO
app/
├── api/
│   └── chat/
│       └── route.ts            (~80 linhas)   ← SIMPLIFICADO
│   └── history/
│       └── route.ts            (~30 linhas)   ← MANTIDO
components/
└── chat/
    └── simple-sidebar.tsx      (~150 linhas)  ← NOVO

TOTAL: ~440 linhas (reducao de 78%)
```

## Execution History

> Last updated: 2026-01-28T11:32:39.460Z | Progress: 100%

### phase-2 [DONE]
- Started: 2026-01-28T11:32:39.460Z
- Completed: 2026-01-28T11:32:39.460Z

- [x] Step 1: Step 1 *(2026-01-28T11:32:39.460Z)*
  - Notes: Arquivos simple-queries.ts, route.ts (simplificado), use-simple-chat.ts e simple-sidebar.tsx criados/atualizados.


## Evidence & Follow-up

### Artefatos a coletar
- [ ] PR link com code review
- [ ] Screenshots do historico funcionando
- [ ] Logs de console limpos
- [ ] Metricas de latencia

### Follow-up
- Documentar API simplificada
- Atualizar testes E2E se existirem
- Monitorar erros em producao por 48h
