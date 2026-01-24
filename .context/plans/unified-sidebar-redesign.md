---
status: active
generated: 2026-01-24
agents:
  - type: "frontend-specialist"
    role: "Lead implementation of unified sidebar components"
  - type: "architect-specialist"
    role: "Design component architecture and state management"
  - type: "code-reviewer"
    role: "Review code quality and adherence to design system"
docs:
  - "project-overview.md"
  - "architecture.md"
phases:
  - id: "phase-1-foundation"
    name: "Foundation - Tokens & Base Structure"
    prevc: "P"
  - id: "phase-2-navigation"
    name: "Navigation Components"
    prevc: "E"
  - id: "phase-3-history"
    name: "Chat History Integration"
    prevc: "E"
  - id: "phase-4-polish"
    name: "Polish & Animations"
    prevc: "E"
  - id: "phase-5-integration"
    name: "Layout Integration & Cleanup"
    prevc: "V"
---

# Redesign da Sidebar Unificada - Estilo ChatGPT

> Criar sidebar unificada integrando navegacao + historico de chats com tema claro/escuro premium e design tech-forward inspirado em Linear/Vercel

## Task Snapshot

- **Primary goal:** Unificar a experiencia de navegacao consolidando a sidebar de dashboard com o historico de chats em um unico componente, seguindo o padrao visual do ChatGPT
- **Success signal:** Usuario navega entre secoes (Biblioteca, OdontoFlix, etc) e conversas de chat de forma fluida, sem mudanca de contexto visual
- **Key references:**
  - Design System: `/.interface-design/system.md`
  - Sidebar Base: `/components/ui/sidebar.tsx`
  - Chat Sidebar: `/components/chat/chat-sidebar.tsx`
  - Dashboard Sidebar: `/components/dashboard/sidebar.tsx`

---

## Codebase Context

### Arquitetura Atual (Dual Sidebar)

```
DASHBOARD ROUTES (/dashboard/*)
├── Sidebar: components/dashboard/sidebar.tsx
│   └── NAV_ITEMS: Home, Biblioteca, OdontoFlix, etc
└── Layout: app/dashboard/layout.tsx

CHAT ROUTES (/dashboard/chat)
├── Sidebar: components/chat/chat-sidebar.tsx
│   └── SidebarHistory (paginacao infinita)
└── Layout: app/dashboard/chat/layout.tsx
```

### Componentes Criticos Identificados

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| **SidebarProvider** | `components/ui/sidebar.tsx` | Context para estado aberto/fechado |
| **SidebarHistory** | `components/chat/sidebar-history.tsx` | Lista paginada de chats (useSWRInfinite) |
| **ChatItem** | `components/chat/sidebar-history-item.tsx` | Item de conversa com dropdown |
| **NAV_ITEMS** | `lib/constants/navigation.ts` | Definicao dos itens de navegacao |
| **Theme Toggle** | `components/dashboard/theme-toggle.tsx` | Alternador de tema |

### APIs Existentes

- `GET /api/history?limit=20&ending_before={id}` - Historico paginado
- `DELETE /api/chat?id={chatId}` - Deletar conversa
- `DELETE /api/history` - Deletar todas conversas

### Design System Ativo

- **Canvas Dark:** `#020617` (slate-950)
- **Brand:** `#06b6d4` (cyan-500)
- **Glass Morphism:** Implementado em `styles/globals.css`
- **Border-first approach:** Sem shadows pesadas em dark mode

---

## Nova Arquitetura Proposta

### Estrutura Visual Final

```
┌─────────────────────────────────────┐
│ [Logo] Odonto GPT          [─]     │  SidebarHeader
├─────────────────────────────────────┤
│ [+ Novo Chat]                       │  NewChatButton (CTA)
├─────────────────────────────────────┤
│ [Buscar conversas...]               │  SidebarSearch
├─────────────────────────────────────┤
│ NAVEGACAO                           │  SidebarNav
│   Biblioteca                        │
│   OdontoFlix                        │
│   Odonto Vision                     │
│   Certificados                      │
│   Notificacoes                      │
├─────────────────────────────────────┤
│ CONVERSAS                           │  SidebarChats
│ ─ Hoje ──────────────────────────   │
│   Anatomia dental basica            │
│   Protocolo endodontia              │
│ ─ Ontem ─────────────────────────   │
│   Duvida radiografia                │
│ ─ Ultimos 7 dias ────────────────   │
│   Materiais restauradores           │
│   [Carregar mais...]                │
├─────────────────────────────────────┤
│ [Avatar] Marcos Alexandre           │  SidebarUser
│     [Config] [Tema]                 │
└─────────────────────────────────────┘
```

### Hierarquia de Componentes

```
components/sidebar/
├── index.ts                    # Exports publicos
├── unified-sidebar.tsx         # Container principal
├── sidebar-header.tsx          # Logo + collapse toggle
├── sidebar-nav.tsx             # Links de navegacao
├── sidebar-search.tsx          # Busca de conversas
├── sidebar-chats.tsx           # Wrapper do historico
├── sidebar-user.tsx            # Perfil + settings + theme
├── new-chat-button.tsx         # CTA com glow effect
└── chat-item.tsx               # Item de conversa (refatorado)
```

---

## Design Tokens Refinados

### Dark Mode (Padrao - Tech Premium)

```css
:root {
  /* Canvas - Profundidade escalonada */
  --canvas: #0a0a0f;
  --canvas-subtle: #12121a;

  /* Surfaces - Hierarquia visual */
  --surface-1: #16161f;
  --surface-2: #1c1c28;
  --surface-3: #242432;

  /* Brand Cyan - Identidade Odonto GPT */
  --brand: #06b6d4;
  --brand-hover: #22d3ee;
  --brand-muted: #0891b2;
  --brand-glow: rgba(6, 182, 212, 0.15);
  --brand-glow-intense: rgba(6, 182, 212, 0.3);

  /* Texto - Hierarquia clara */
  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717a;

  /* Borders - Sutis */
  --border: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(255, 255, 255, 0.1);
  --border-active: rgba(6, 182, 212, 0.5);

  /* Sidebar especifico */
  --sidebar-width: 280px;
  --sidebar-width-collapsed: 72px;
  --sidebar-bg: var(--canvas);
  --sidebar-hover: rgba(255, 255, 255, 0.04);
  --sidebar-active: rgba(6, 182, 212, 0.1);
}
```

### Light Mode (Clean Premium)

```css
.light {
  --canvas: #fafafa;
  --canvas-subtle: #f4f4f5;
  --surface-1: #ffffff;
  --surface-2: #f4f4f5;
  --surface-3: #e4e4e7;

  --brand: #0891b2;
  --brand-hover: #0e7490;
  --brand-glow: rgba(8, 145, 178, 0.1);

  --text-primary: #18181b;
  --text-secondary: #52525b;
  --text-tertiary: #71717a;

  --border: rgba(0, 0, 0, 0.06);
  --sidebar-bg: var(--surface-1);
  --sidebar-hover: rgba(0, 0, 0, 0.04);
  --sidebar-active: rgba(8, 145, 178, 0.08);
}
```

---

## Agent Lineup

| Agent | Role | First Focus |
|-------|------|-------------|
| **Frontend Specialist** | Implementar componentes React | Criar `UnifiedSidebar` e sub-componentes |
| **Architect Specialist** | Definir estrutura e estado | Projetar integracao com SidebarProvider existente |
| **Code Reviewer** | Garantir qualidade | Validar aderencia ao design system |

---

## Working Phases

### Phase 1 — Foundation (Tokens & Base)

**Objetivo:** Estabelecer base de design e estrutura de arquivos

**Steps:**
1. Atualizar `styles/globals.css` com novos tokens CSS
2. Criar estrutura `components/sidebar/` com `index.ts`
3. Implementar `unified-sidebar.tsx` (shell com SidebarProvider)
4. Validar tokens em tema claro/escuro

**Arquivos a criar/modificar:**
- `styles/globals.css` - Adicionar novos tokens
- `components/sidebar/index.ts` - Exports
- `components/sidebar/unified-sidebar.tsx` - Container base

**Commit Checkpoint:** `feat(sidebar): setup foundation tokens and base structure`

---

### Phase 2 — Navigation Components

**Objetivo:** Implementar header, navegacao e CTA

**Steps:**
1. Criar `sidebar-header.tsx` (logo, collapse button)
2. Criar `new-chat-button.tsx` (CTA com glow effect)
3. Criar `sidebar-nav.tsx` (integrar NAV_ITEMS existente)
4. Implementar animacoes de hover e active states

**Arquivos a criar:**
- `components/sidebar/sidebar-header.tsx`
- `components/sidebar/new-chat-button.tsx`
- `components/sidebar/sidebar-nav.tsx`

**Commit Checkpoint:** `feat(sidebar): add navigation components with animations`

---

### Phase 3 — Chat History Integration

**Objetivo:** Integrar historico de chats com busca

**Steps:**
1. Criar `sidebar-search.tsx` (filtro local de conversas)
2. Criar `sidebar-chats.tsx` (wrapper que usa SidebarHistory existente)
3. Refatorar `chat-item.tsx` para novo estilo visual
4. Manter paginacao infinita existente (useSWRInfinite)

**Arquivos a criar/modificar:**
- `components/sidebar/sidebar-search.tsx` - Nova busca
- `components/sidebar/sidebar-chats.tsx` - Wrapper
- `components/chat/sidebar-history-item.tsx` - Refatorar estilo

**Commit Checkpoint:** `feat(sidebar): integrate chat history with search`

---

### Phase 4 — Footer & Polish

**Objetivo:** Completar footer e adicionar micro-interacoes

**Steps:**
1. Criar `sidebar-user.tsx` (avatar, nome, settings, theme toggle)
2. Implementar transicao suave de collapse/expand
3. Adicionar keyboard shortcuts (Ctrl+K busca, Ctrl+N novo chat)
4. Polir responsividade mobile (sheet drawer)

**Arquivos a criar/modificar:**
- `components/sidebar/sidebar-user.tsx` - Footer completo
- Micro-interacoes com Framer Motion

**Commit Checkpoint:** `feat(sidebar): complete footer and polish interactions`

---

### Phase 5 — Integration & Cleanup

**Objetivo:** Integrar nos layouts e remover codigo legado

**Steps:**
1. Atualizar `app/dashboard/layout.tsx` para usar UnifiedSidebar
2. Simplificar `app/dashboard/chat/layout.tsx` (remover ChatSidebar)
3. Marcar componentes legados como deprecated
4. Executar testes de regressao visual

**Arquivos a modificar:**
- `app/dashboard/layout.tsx` - Trocar sidebar
- `app/dashboard/chat/layout.tsx` - Simplificar
- `components/dashboard/sidebar.tsx` - Deprecar
- `components/chat/chat-sidebar.tsx` - Deprecar

**Commit Checkpoint:** `feat(sidebar): integrate unified sidebar and cleanup legacy`

---

## Risk Assessment

### Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Quebra de navegacao existente | Medium | High | Manter rotas inalteradas, so trocar componente |
| Regressao visual em mobile | Medium | Medium | Testar em viewport 375px antes de merge |
| Performance com muitos chats | Low | Medium | Manter virtualizacao existente do SWR |

### Dependencies

- **Internal:** Sistema de autenticacao Supabase (ja funcional)
- **External:** Nenhuma nova dependencia
- **Technical:** Manter compatibilidade com SidebarProvider existente

### Assumptions

- API `/api/history` permanece estavel
- Design system existente (`.interface-design/system.md`) e a fonte de verdade
- Usuarios acessam principalmente via desktop (mobile e secundario)

---

## Rollback Plan

### Rollback Triggers
- Navegacao quebrada entre secoes
- Historico de chats nao carrega
- Performance degradada (>2s para render inicial)

### Procedure
```bash
# Reverter para sidebar anterior
git revert --no-commit HEAD~{n}
# Restaurar imports antigos nos layouts
# Deploy imediato
```

---

## Evidence & Verification

### Checklist de Validacao

- [ ] Navegacao funciona: Dashboard, Biblioteca, OdontoFlix, etc
- [ ] Novo chat cria sessao e aparece no historico
- [ ] Busca filtra conversas corretamente
- [ ] Tema claro/escuro alterna suavemente
- [ ] Collapse/expand funciona com animacao
- [ ] Mobile: sidebar abre como drawer
- [ ] Keyboard: Ctrl+K abre busca, Ctrl+N novo chat
- [ ] Persistencia: estado de sidebar salvo em cookie
- [ ] Contraste: texto passa WCAG AA em ambos temas

### Artifacts

- [ ] PR com screenshots comparativos (antes/depois)
- [ ] Screencast de interacoes (hover, collapse, theme toggle)
- [ ] Lighthouse score (performance, accessibility)
