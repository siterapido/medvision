---
status: completed
generated: 2026-01-21
agents:
  - type: "frontend-specialist"
    role: "Liderar a implementação da nova interface React/Tailwind"
  - type: "code-reviewer"
    role: "Garantir que o código siga os padrões do projeto (shadcn/ui, tipagem)"
  - type: "test-writer"
    role: "Verificar se a navegação e a responsividade funcionam corretamente"
docs:
  - "UI_UX_GUIDE.md"
  - "app/globals.css"
phases:
  - id: "phase-1"
    name: "Componentes UI Base"
    prevc: "C"
  - id: "phase-2"
    name: "Refatoração de Layout e Routing"
    prevc: "C"
  - id: "phase-3"
    name: "Polimento e Validação"
    prevc: "C"
---

# Dashboard Odonto GPT - Estilo Perplexity Plan

> Redesign completo do dashboard inspirado na interface limpa e centrada em busca do Perplexity AI. O objetivo é reduzir o ruído visual, centralizar a experiência na busca/chat e modernizar a navegação lateral.

## Task Snapshot
- **Primary goal:** Transformar a dashboard atual em uma interface minimalista onde a barra de busca é o elemento central, similar ao Perplexity.
- **Success signal:** Acesso à `/dashboard` renderiza uma tela de busca limpa (sem redirecionar para `/chat`), sidebar colapsada mostrando ícones, e a navegação flui sem recargas.
- **Key references:**
  - `components/dashboard/shell.tsx` (Layout atual)
  - `components/dashboard/sidebar.tsx` (Sidebar atual)
  - `app/dashboard/page.tsx` (Rota raiz)

## Codebase Context
- **Estrutura Atual:** `DashboardLayoutShell` controla uma sidebar de 200px fixa ou hidden.
- **Navegação:** Mapeada em `components/dashboard/sidebar.tsx` (array `dashboardNavigation`).
- **Página Inicial:** Atualmente faz redirect para `/chat`.

## Working Phases

### Phase 1 — Componentes UI Base (Perplexity Style)
**Steps**
1. **Criar `components/dashboard/new-sidebar.tsx`:**
   - [x] Desenvolver uma sidebar minimalista.
   - [x] Estado padrão: Estreita (apenas ícones).
   - [x] Botão "Novo Chat" (Sinal de +) destacado no topo.
   - [x] Ícones de navegação centralizados verticalmente ou no topo.
   - [x] Área de rodapé (Config/Perfil) compacta.
   - [x] Suporte a tooltip nos ícones para acessibilidade.
2. **Criar `components/dashboard/search-home.tsx`:**
   - [x] Componente para a rota `/dashboard` (Home).
   - [x] Layout centralizado verticalmente e horizontalmente.
   - [x] Logo "Odonto GPT" grande centralizada.
   - [x] Barra de input de busca larga e proeminente (estilo Perplexity).
   - [x] Sugestões de perguntas abaixo da barra (pílulas ou cards simples).

**Commit Checkpoint**
- `feat(ui): create perplexity-style sidebar and search home components`

### Phase 2 — Refatoração de Layout e Routing
**Steps**
1. **Atualizar `components/dashboard/shell.tsx`:**
   - [x] Substituir a lógica de `DashboardSidebar` pela `NewSidebar`.
   - [x] Remover o `DashboardHeader` fixo do topo para ganhar área útil.
   - [x] Ajustar o container principal para centralizar o conteúdo quando estiver na rota `/dashboard`.
   - [x] Adicionar Header Mobile.
2. **Atualizar `app/dashboard/page.tsx`:**
   - [x] Remover o `redirect("/dashboard/chat")`.
   - [x] Renderizar o componente `SearchHome`.
3. **Ajustar `app/dashboard/chat/page.tsx`:**
   - [x] Garantir que a interface de chat continue funcionando (nenhuma alteração necessária pois o layout cuida disso).

**Commit Checkpoint**
- `feat(dashboard): implement new perplexity layout and home route`

### Phase 3 — Polimento e Validação
**Steps**
1. **Responsividade:**
   - [x] Testar sidebar em mobile (drawer/overlay).
   - [x] Ajustar tamanhos de fonte e espaçamentos da home (Tailwind classes).
2. **Temas:**
   - [x] Garantir que o dark mode funcione perfeitamente (usando variáveis CSS globais e classes Shadcn).

**Commit Checkpoint**
- `style(dashboard): polish responsiveness and dark mode`

## Risk Assessment
- **Risco:** Usuários perdidos sem o menu completo expandido.
- **Mitigação:** Tooltips claros e opção de expandir a sidebar se necessário, ou manter ícones intuitivos.
- **Risco:** Quebra de layouts internos (ex: `/dashboard/cursos`).
- **Mitigação:** Testar todas as rotas para garantir que o container principal (`flex-1`) se comporte bem sem o header fixo.

## Resource Estimation
- **Tempo:** 1-2 dias.
- **Complexidade:** Média (principalmente CSS/Layout).
