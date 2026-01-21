---
status: in_progress
generated: 2026-01-20
agents:
  - type: "frontend-specialist"
    role: "Lead Developer - UI/UX Implementation"
  - type: "architect-specialist"
    role: "System Design - Theme Architecture"
  - type: "code-reviewer"
    role: "Quality Assurance - Code Standards"
docs:
  - "UI_UX_GUIDE.md"
  - "app/globals.css"
phases:
  - id: "phase-1"
    name: "Fundação & Design Tokens"
    prevc: "P"
  - id: "phase-2"
    name: "Implementação de Componentes & Personas"
    prevc: "E"
  - id: "phase-3"
    name: "Refatoração Mobile & Otimização"
    prevc: "V"
---

# Plano de Refatoração de UI/UX do Dashboard

> Plano abrangente para refatorar o Front-end do Dashboard, alinhando-o visualmente à Landing Page, implementando temas Claro/Escuro robustos, personificação de agentes e otimização Mobile-First.

## Task Snapshot
- **Primary goal:** Transformar o Dashboard em uma experiência visual premium, consistente com a LP, com suporte total a temas e identidade forte para cada agente.
- **Success signal:** Dashboard com tema Claro (Branco/Azul) e Escuro (Deep Space) funcionais, transições de agentes fluidas, e nota 100 em performance/acessibilidade no Lighthouse.
- **Key references:**
  - `app/page.tsx` (Referência Visual)
  - `app/globals.css` (Design Tokens)

## Codebase Context
O projeto usa Next.js 16 App Router com Tailwind CSS e Shadcn UI. A LP possui uma identidade visual forte ("Deep Space" / "Medical Teal") que não está refletida no Dashboard atual (que usa um tema "Slate" padrão).

## Working Phases

### Phase 1 — Fundação & Design Tokens
**Objective:** Estabelecer a base visual e estrutural para suportar temas e identidades de agentes.

**Steps**
1. **Refatorar `app/globals.css`:**
   - Definir variáveis CSS semânticas para Light Mode (Branco/Azul Médico) e Dark Mode (Deep Space).
   - Portar animações da LP (`fade-in`, `scale-in`, `shimmer`) para uso global.
2. **Criar Sistema de Tokens de Agentes:**
   - Criar `lib/agent-themes.ts` mapeando cada ID de agente para cores (primary, accent, glow), ícones e gradientes.
3. **Refatoração Estrutural Inicial:**
   - Atualizar `app/dashboard/layout.tsx` e `components/dashboard/shell.tsx` para remover cores hardcoded e usar variáveis CSS (`bg-background`, `text-foreground`).

**Deliverables:**
- `app/globals.css` atualizado com sistema de temas completo.
- `lib/agent-themes.ts` criado.
- Layout base do dashboard consumindo o tema.

### Phase 2 — Implementação de Componentes & Personas
**Objective:** Construir a interface rica e personificada.

**Steps**
1. **Componente `AgentIdentity`:**
   - Criar componente visual que exibe o avatar/ícone do agente com o "glow" da cor temática dele.
2. **Header Dinâmico:**
   - Refatorar `DashboardHeader` para mostrar a identidade do agente ativo (ex: "Odonto Flow" em Azul, "Escritor" em Roxo) com transições suaves.
3. **Sidebar Otimizada:**
   - Atualizar `DashboardSidebar` para destacar o item ativo com a cor do agente correspondente (não apenas azul genérico).
   - Adicionar micro-interações (hover, active) baseadas no tema.
4. **Glassmorphism & Cards:**
   - Refatorar `Card` e containers principais para usar o efeito "glass" sutil da LP, garantindo legibilidade.

**Deliverables:**
- Componentes de identidade do agente.
- Header e Sidebar dinâmicos e temáticos.
- Cards com visual modernizado.

### Phase 3 — Refatoração Mobile & Otimização
**Objective:** Garantir UX impecável em telas pequenas e performance de ponta.

**Steps**
1. **Drawer Mobile Premium:**
   - Transformar o menu mobile em uma experiência fluida (animações de entrada/saída, backdrop blur).
2. **Chat Mobile Experience:**
   - Otimizar área de input e lista de mensagens para mobile (evitar layout shifts com teclado virtual).
3. **Performance Tuning:**
   - Verificar carregamento de fontes e ícones.
   - Otimizar imagens e animações para dispositivos low-end (respeitar `prefers-reduced-motion`).

**Deliverables:**
- Experiência mobile validada e polida.
- Relatório de performance (Lighthouse) verde.

## Risk Assessment
- **Risco:** Quebrar a consistência com Shadcn UI.
  - **Mitigação:** Manter a estrutura de classes utilitárias e apenas ajustar as variáveis CSS base.
- **Risco:** Cores de agentes conflitarem com o modo escuro/claro.
  - **Mitigação:** Testar todas as cores de agentes em ambos os modos e definir variantes se necessário em `lib/agent-themes.ts`.

## Rollback Plan
- Reverter commit da fase caso haja regressão visual crítica.
- Manter backup de `globals.css` antigo se necessário.
