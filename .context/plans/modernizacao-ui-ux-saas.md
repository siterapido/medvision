---
status: completed
generated: 2026-01-20
agents:
  - type: "frontend-specialist"
    role: "Lead the implementation of Design System and Components"
  - type: "architect-specialist"
    role: "Define layout structure and navigation (Sidebar/Mobile)"
  - type: "code-reviewer"
    role: "Ensure adherence to accessibility and design standards"
docs:
  - "UI_UX_GUIDE.md"
  - "app/globals.css"
  - "components/dashboard/sidebar.tsx"
phases:
  - id: "phase-1"
    name: "Design System Foundations (Typography & Color)"
    prevc: "P"
  - id: "phase-2"
    name: "Shell Architecture (Blue Sidebar & Mobile)"
    prevc: "E"
  - id: "phase-3"
    name: "Agent Interfaces & UX"
    prevc: "E"
  - id: "phase-4"
    name: "Polish & Micro-interactions"
    prevc: "V"
---

# Modernização UI/UX SaaS Tech - Odonto GPT Plan

> Plano de reformulação completa do frontend para estilo SaaS Tech Moderno, focado em alta usabilidade (Mobile First), identidade visual forte (Sidebar Azul Profundo) e distinção funcional entre agentes.

## Objetivo
Transformar a interface do Odonto GPT em uma experiência "Premium SaaS", eliminando a sensação genérica de dashboard e criando um ambiente de trabalho profissional, focado e esteticamente agradável. A interface deve inspirar confiança técnica e clareza científica.

## 🚫 Restrição Importante (Escopo)
**IMPORTANTE:** Este plano de modernização aplica-se **EXCLUSIVAMENTE** ao ambiente autenticado (`app/dashboard/*` e seus componentes).
A **Landing Page** (`app/page.tsx`, `components/marketing/*`, etc.) **NÃO DEVE** ser alterada. Sua estrutura, estilos e otimização de conversão devem ser preservados integralmente.

## Análise UX & Diretrizes de Estilo
Baseado na análise do estado atual e nos requisitos:

### 1. Paleta de Cores & Tema (SaaS Blue)
*   **Sidebar (Navegação):** Mudança radical do claro/branco para um **Azul Profundo/Navy** (`bg-slate-900` ou `bg-[#0f172a]` com um toque de ciano). Isso cria hierarquia visual imediata, separando "Controle" de "Conteúdo".
*   **Conteúdo (Canvas):** Manter branco (`#ffffff`) ou off-white muito sutil (`#f8fafc`) para garantir legibilidade máxima de textos longos (papers, resumos).
*   **Sem Degradês:** Estilo "Flat 2.0". Cores sólidas, bordas sutis (`border-zinc-200`) e sombras difusas para profundidade apenas quando necessário (modais, dropdowns).

### 2. Tipografia (Tech & Modern)
*   **Adeus Inter/Roboto:** Substituir por fontes com mais personalidade tecnológica e geométrica.
    *   *Primária:* **Plus Jakarta Sans** ou **Geist Sans** (Vercel). Elas possuem excelente legibilidade em tamanhos pequenos e um ar "digital native".
*   **Hierarquia:** Títulos em `Semibold` com *letter-spacing* levemente reduzido (-0.02em). Textos de corpo com altura de linha generosa (1.6) para leitura confortável.

### 3. Layout Mobile-First
*   **Navegação:** No mobile, a Sidebar deve ser um **Drawer Deslizante** de alta performance, não empurrando o conteúdo.
*   **Área de Toque:** Inputs e Botões com altura mínima de `44px` (touch target).
*   **Grids:** Cards de Resumos/Pesquisas devem colapsar de 3 colunas (desktop) para 1 coluna (mobile) fluidamente.

### 4. Personalidade dos Agentes (Context-Aware UI)
Cada agente deve ter uma "assinatura visual" sutil na interface de chat:
*   **Odonto Research:** Foco em *Citação e Veracidade*. Balões de chat mais estruturados, com ícones de "fonte" proeminentes. Cor de destaque: **Azul Ciano**.
*   **Escritor Acadêmico:** Foco em *Texto e Estrutura*. Interface mais limpa, menos distrações, talvez um modo "Focus" onde a sidebar colapsa. Cor de destaque: **Roxo/Indigo**.
*   **Materiais/Resumos:** Foco em *Visual e Organização*. Cards com ícones grandes, badges coloridas. Cor de destaque: **Verde/Esmeralda**.

---

## Fases de Execução

### Phase 1 — Fundamentos do Design System
**Foco:** Preparar o terreno visual sem quebrar a funcionalidade.
1.  **Tipografia:** Instalar `next/font/google` com **Plus Jakarta Sans**. Configurar no `layout.tsx` raiz (com cuidado para não afetar a LP se ela usar outra fonte, ou unificar se for seguro).
2.  **Variáveis CSS:** Refatorar `app/globals.css`.
    *   Definir `--sidebar-bg` como o novo Azul Profundo.
    *   Ajustar `--radius` para `0.5rem` (8px) ou `0.75rem` (12px) para um look mais amigável mas tech.
    *   Limpar sombras antigas e criar novas sombras "soft".
3.  **Tailwind Config:** Garantir que as cores estendidas utilizem as variáveis CSS para suportar ajustes finos sem rebuild.

### Phase 2 — Arquitetura da Shell (Sidebar & Mobile)
**Foco:** A estrutura principal de navegação.
1.  **Sidebar Refactor (`components/dashboard/sidebar.tsx`):**
    *   Aplicar o fundo escuro.
    *   Ajustar os itens de menu: Texto branco/cinza claro, hover com fundo branco/10 (glass effect sutil) ou azul mais claro.
    *   Ícones ativos devem ter a cor de destaque da marca (Ciano).
2.  **Mobile Header:**
    *   Garantir que o botão de "Menu" (Hambúrguer) esteja sempre acessível e alinhado.
    *   Melhorar a transição do Drawer (slide-in suave).

### Phase 3 — Interfaces de Agentes & UX
**Foco:** A experiência de chat e dashboard.
1.  **Refatoração de Cards:**
    *   Remover sombras pesadas. Usar bordas sutis (`border border-zinc-200`) e hover effect (`hover:border-blue-500` ou sombra suave).
    *   Padronizar o "Header" dos cards (Ícone + Título + Ação).
2.  **Chat UI (`app/dashboard/chat/page.tsx`):**
    *   Diferenciar visualmente as mensagens do Usuário vs. IA.
    *   Usuário: Fundo cinza claro ou brand color suave.
    *   IA: Fundo branco com borda, ou transparente.
    *   **Inputs:** O campo de digitação deve ser "flutuante" e moderno, com sombra de elevação, e não apenas uma caixa na parte inferior.

### Phase 4 — Polimento & Micro-interações
**Foco:** O "feel" da aplicação.
1.  **Empty States:** As telas de "Em breve" (como Escritor) devem ter ilustrações vetoriais simples ou ícones grandes com opacidade reduzida, mantendo a elegância.
2.  **Transições:** Adicionar `Framer Motion` ou classes `transition-all` para hovers, aberturas de modal e trocas de rota.
3.  **Feedback Visual:** Toasts e loaders devem seguir a nova paleta de cores.

## Critérios de Sucesso
*   [ ] Sidebar é Azul Profundo e legível.
*   [ ] Fonte mudada para Plus Jakarta Sans (ou similar).
*   [ ] Navegação Mobile funciona sem "jumps" de layout.
*   [ ] Agentes possuem cores de destaque distintas (indicadores visuais).
*   [ ] Dashboards (Resumos, Pesquisas) usam o novo estilo de Cards "Flat Tech".
*   [ ] **Landing Page permanece inalterada.**
