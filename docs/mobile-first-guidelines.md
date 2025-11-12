# Mobile-First Technical Guide

Este documento oficializa a abordagem **mobile-first** adotada em todo o projeto Odonto GPT e consolida as decisões técnicas necessárias para manter consistência, acessibilidade e performance no dashboard, landing page e rotas administrativas.

## 1. Princípios de design responsivo aplicados

- **Content-first para telas pequenas**: todas as páginas iniciam com estruturas empilhadas (`flex-col`, `stack`, `gap`) e só depois expandem para layouts em colunas maiores. O dashboard e a página de materiais, por exemplo, usam `w-full max-w-6xl` e `lg:flex-row` para crescer horizontalmente apenas a partir de `lg`.
- **Progressão de decoração**: backgrounds, gradientes e texturas surgem com `@media (min-width: ...)` e `lg:` em vez de estarem ativos desde o início. Isso evita repinturas e mantém o foco claro em dispositivos móveis.
- **Componentes fluidos**: cards, botões e menus usam `min-w-0`, `overflow-hidden` e `clamp()` (quando disponível) para evitar estouros em viewports estreitas. Tanto o `app/dashboard/materiais/page.tsx` quanto o `app/dashboard/page.tsx` selecionam `gap` e `px` responsivos (`px-4 sm:px-6`) antes de aplicar paddings maiores.
- **Pai visível antes do filho**: elementos críticos (CTA, estatísticas, filtros) aparecem antes de extensões visuais (carrossel, cards adicionais) na marcação HTML, o que garante carregamento rápido em mobile e melhora o LCP.

## 2. Estratégias de media queries utilizadas

- Padrão: utilizar classes utilitárias Tailwind no sentido mobile-first (`<classe base> md:<ajuste>`), evitando `lg:` como única definição.
- Media queries explícitas em código: `components/dashboard/shell.tsx` usa `window.matchMedia("(min-width: 768px)")` para detectar quando a viewport já não é mobile.
- Breakpoints definidos (ver seção 5), mas o ponto central é garantir que cada componente funcione sozinho em 320–375px antes de adicionar variantes de `768px`, `1024px` e `1280px`.
- Para detectar orientação, relies no `resize` natural do browser e no re-render do layout; o estado persistido do menu (`localStorage`) protege contra mudanças de orientação que recarregam o componente.

## 3. Padrões de componentes mobile-first

- **Menu lateral**: `components/dashboard/shell.tsx` mantém a navegação oculta por padrão no mobile e disponibiliza um overlay com tradução suave (`transition-transform duration-300`). No desktop, o mesmo estado controla a largura visível/collapsed e é armazenado usando o storage key `dashboard-sidebar-visible`.
- **Toggle acessível**: `components/dashboard/header.tsx` usa um botão com `aria-expanded`, `aria-controls="dashboard-sidebar"`, tooltip e foco claro. Ele responde a clique, teclado (enter/space) e segue o mesmo comportamento tanto no modo overlay mobile quanto no modo docked desktop.
- **Cards e filtros**: `FilterMenu` em `app/dashboard/materiais/page.tsx` é horizontal scrollable no mobile (`overflow-x-auto`) e se transforma em um menu vertical sticky no desktop. Todos os botões usam `focus-visible` para manter acessibilidade.
- **Layout de canal principal**: `main` sempre ocupa `flex-1` com `overflow-y-auto`, garantindo que o conteúdo role sem quebrar o fluxo, enquanto o sidebar usa `md:pointer-events-none` quando escondido.
- **Persistência**: o menu lateral lembra o último estado em `localStorage` e reabre automaticamente (desktop) quando o usuário retorna, simplificando o fluxo de navegação.

## 4. Boas práticas de performance para dispositivos móveis

- **Hydration mínima**: apenas componentes que exigem DOM (sidebar/drawer, toggle) são marcados como `'use client'`; o restante permanece server components.
- **Lazy loading**: vídeos e seções pesadas carregam com `next/dynamic` (ex.: `YouTubePlayer` e `LazyVideoWrapper` no `app/page.tsx`), garantindo carregamento prioritário do conteúdo móvel.
- **Images e assets**: `next/image` é usado sempre que possível, mas há avisos pendentes em áreas não críticas (componentes de admin/ai) já documentados nos warnings do `npm run lint`.
- **Overlay leve**: a camada escura do menu usa `opacity-0/100` com `pointer-events` controlados para não bloquear interações quando o menu está fechado.
- **Gestos e acessibilidade**: os swipes de fechamento (`touchstart`, `touchmove`, `touchend`) reduzem ciclos de teclado/mouse e aceleram o uso em telas com toque.

## 5. Guia de breakpoints e adaptações para desktop

| Breakpoint | Sigla Tailwind | Comportamento principal |
|------------|---------------|-------------------------|
| 0–479px | base | cards empilhados, menus escondidos, CTAs full-width |
| 480–767px | `sm` | grades 2 colunas leves, filtros horizontais scrollables |
| 768–1023px | `md` | menu lateral visível por padrão, padding aumentado, header reforçado |
| 1024–1279px | `lg` | layout em duas colunas (hero + cards), sidebar sticky com `top-0`, menus `mx-auto` |
| ≥1280px | `xl` | grade tripla, dashboard em container centralizado (`max-w-6xl`), CTAs lado a lado |

A cada nível acima, os componentes adicionam detalhes visuais (sombra, background gradient, cards extras) com `lg:`/`xl:` — jamais reduzindo a legibilidade do mobile.

## 6. Documentação e decisões registradas

- Esta página registra as decisões de mobile-first. Para detalhes de UX/CDP, consulte `UI_UX_GUIDE.md`. Sempre atualize ambos ao mudar layout ou quebra de responsive.
- O toggle desktop/mobile está em `components/dashboard/shell.tsx`, o menu centralizado no mobile ao `app/dashboard/materiais/page.tsx` e as fontes e gradientes em `app/globals.css`.
- Capturas obrigatórias: substitua os placeholders em `docs/screenshots/desktop-dashboard.png` e `docs/screenshots/mobile-dashboard.png` por imagens reais (veja `docs/screenshots/README.md`) e mantenha os nomes fixos para não quebrar os links abaixo.

## 7. Testes e acessibilidade

- Teste manualmente nos seguintes device profiles (versão mobile, portrait + landscape):
  1. iPhone SE (320×568)
  2. Pixel 5 (393×851)
  3. iPad mini + 13'' (768×1024)
  4. Desktop 1440×900 (para toggles)
- Inclua testes no buscador de `npm run lint` e faça checagem visual do toggle (mouse e teclado).
- Use emuladores/real devices e capture logs de performance (Chrome DevTools Mobile emulation e simuladores de iOS/Android).
- Garanta contraste mínimo 4.5:1 (botões brancos sobre gradientes) e focos visíveis nos filtros e toggle (`focus-visible:outline`).

## 8. Capturas (placeholders)

![Dashboard desktop com sidebar](./screenshots/desktop-dashboard.png)

![Dashboard mobile com overlay](./screenshots/mobile-dashboard.png)

> Substitua os arquivos acima por capturas reais antes da entrega final.
