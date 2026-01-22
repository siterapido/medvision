---
status: active
priority: high
generated: 2026-01-22
agents:
  - type: "frontend-specialist"
    role: "Design e implementação do novo design system com estética Perplexity/ultra-moderna"
  - type: "refactoring-specialist"
    role: "Refatorar componentes existentes para o novo design system"
  - type: "code-reviewer"
    role: "Revisar código para garantir qualidade e consistência"
  - type: "performance-optimizer"
    role: "Otimizar animações e transições para performance suave"
docs:
  - docs/design-system.md
  - docs/component-patterns.md
---

# Refatoração do Frontend Dashboard - Design SaaS Ultra Moderno (Perplexity-Style)

## Sumário Executivo

**Objetivo:** Transformar completamente o frontend da dashboard e chat da aplicação Odonto GPT para uma estética de SaaS ultra moderno e tech, inspirada no Perplexity AI - priorizando minimalismo sofisticado, glassmorphism sutil, tipografia premium e micro-animações elegantes.

**Escopo:** 
- Dashboard principal (`/dashboard`)
- Interface de Chat (`/dashboard/chat`)
- Sidebar de navegação
- Layout base e design system

**Resultado Esperado:** Uma interface que transmita inovação, confiança tecnológica e profissionalismo premium - impressionando usuários à primeira vista.

---

## 1. Análise do Estado Atual

### 1.1 Componentes Afetados

| Caminho | Descrição | Status Atual |
|---------|-----------|--------------|
| `app/dashboard/layout.tsx` | Layout principal com sidebar | Funcional, básico |
| `app/dashboard/page.tsx` | Página inicial da dashboard | Design genérico |
| `app/dashboard/chat/page.tsx` | Página de chat | Wrapper simples |
| `components/dashboard/sidebar.tsx` | Sidebar de navegação | Design tradicional |
| `components/dashboard/odonto-ai-chat.tsx` | Interface de chat completa | Funcional, design básico |
| `app/globals.css` | Estilos globais e design tokens | Base existente |

### 1.2 Problemas Identificados no Design Atual

- ❌ Estética genérica - não se diferencia de templates padrão
- ❌ Tipografia usando fontes comuns (system fonts)
- ❌ Paleta de cores sem personalidade marcante
- ❌ Ausência de efeitos visuais modernos (glassmorphism, gradients mesh)
- ❌ Micro-animações limitadas
- ❌ Layout previsível e sem surpresas visuais
- ❌ Cards e componentes com aparência "flat" demais

---

## 2. Direção Estética: Perplexity App Style (Mobile First)

### 2.1 Conceito de Design

**Principal:** Interface de "App Nativo em Browser".
**Mobile First:** Toda a interface deve ser pensada primeiro para o toque e telas verticais.
**Estilo Visual:**
- **Monocromático Sofisticado:** Ícones e UI elements em tons de cinza (Slate 400/500 -> Slate 100). Cores SOMENTE em ações primárias (botões CTA) ou status críticos.
- **Sem Ícones Coloridos:** Ícones devem ser minimalistas, stroke fino, cor neutra.
- **Espaçamento:** Padding generoso em desktop, compacto mas tocável em mobile.
- **Glassmorphism Refinado:** Uso sutil para separar camadas sem poluir.

### 2.2 Paleta de Cores Atualizada (Estrita)

```css
/* Dark Theme */
--bg-primary: #0A0F1C;        /* Background Profundo */
--card-bg: rgba(255,255,255,0.03); /* Surface MUITO sutil */
--icon-default: #94A3B8;      /* Slate 400 - Default Icon */
--icon-active: #F8FAFC;       /* Slate 50 - Active Icon */
--border-subtle: rgba(255,255,255,0.06);

/* Acentos - APENAS para interações */
--primary-glow: rgba(6,182,212,0.15); /* Cyan glow sutil */
```

### 2.3 Mobile UX Guidelines
- **Input Area:** Sempre visível e fixado na parte inferior em telas mobile ("Thumb zone").
- **Navegação:** Sidebar vira Bottom Sheet ou Menu Minimalista em mobile.
- **Touch Targets:** Mínimo 44px para qualquer interação.
- **Scroll:** Scroll infinito suave, esconder chrome do navegador onde possível.

---

## 3. Plano de Implementação Revisado

### Fase 1: Fundação & Ajuste Visual (P/E)
**Objetivo:** Remover cores vibrantes e ajustar base para mobile.
- [x] Atualizar Globals CSS (Done)
- [ ] Refatorar Dashboard Home: Remover ícones coloridos, usar design "Clean Slate".
- [ ] Refatorar Sidebar: Tornar monocromática e otimizada para mobile.

### Fase 2: Chat Interface - Mobile App Feel (E)
**Objetivo:** A "joia da coroa" - chat fluido e responsivo.
- [ ] Layout Mobile: Input fixo embaixo, lista de mensagens com scroll.
- [ ] Estética: Balões de mensagem minimalistas, sem cores de fundo fortes.
- [ ] Input: Textarea auto-expanding com botões de anexo integrados (estilo iMessage/Perplexity).

### Fase 3: Páginas Secundárias (Bibliotecas, Cursos) (E)
- [ ] Padronizar headers e grids.
- [ ] Cards de cursos/arquivos em estilo lista minimalista para mobile.

### Fase 4: Polish & Performance (V)
- [ ] Verificar "layout shift" ao abrir teclado virtual.
- [ ] Otimizar tamanho de imagens e assets.


---

### Fase 2: Sidebar Redesign (R - Refinamento)

**Objetivo:** Transformar a sidebar em uma navegação premium

#### Referência Visual:
- Sidebar estilo Perplexity: minimalista, com ícones elegantes
- Efeito de hover com glow sutil
- Avatar do usuário com anel gradiente

#### Tarefas:

1. **Redesign do `components/dashboard/sidebar.tsx`**
   - [ ] Background com gradiente vertical dark
   - [ ] Logo com efeito glow sutil
   - [ ] Navegação com ícones + labels animados
   - [ ] Item ativo com background glass + borda cyan
   - [ ] Hover states com transições suaves (150ms)
   - [ ] Seção do usuário com avatar + anel gradiente

2. **Melhorias de Micro-Animações**
   - [ ] Staggered reveal ao carregar
   - [ ] Tooltip animado ao recolher
   - [ ] Ícone animado no hover

3. **Responsividade**
   - [ ] Mobile: drawer overlay com glass backdrop
   - [ ] Desktop: transição suave expand/collapse

#### Código de Referência:
```tsx
// Estilo do item de navegação ativo
className={cn(
  "group relative flex items-center gap-3 px-3 py-2.5",
  "rounded-xl transition-all duration-200",
  active
    ? "bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 text-white"
    : "text-slate-400 hover:text-white hover:bg-white/5"
)}
```

---

### Fase 3: Dashboard Page Redesign (E - Execução)

**Objetivo:** Redesenhar a página principal da dashboard

#### Referência Visual:
- Layout limpo com hierarquia clara
- Cards com glassmorphism e borders sutis
- Animações de entrada orquestradas

#### Tarefas:

1. **Header Section**
   - [ ] Saudação personalizada com tipografia Outfit
   - [ ] Data/hora em formato elegante
   - [ ] Animação fade-in + slide-up no load

2. **Quick Actions Grid**
   - [ ] Cards com glassmorphism
   - [ ] Ícones com gradiente no hover
   - [ ] Badge "IA" com glow effect
   - [ ] Hover scale sutil (1.02) + glow border

3. **Continue Learning Section**
   - [ ] Card maior com background gradient mesh
   - [ ] CTA com gradiente animado
   - [ ] Ilustração/pattern decorativo

4. **Progress Stats Section**
   - [ ] Cards menores com glass effect
   - [ ] Números com animação de contagem
   - [ ] Barras de progresso com gradiente

5. **Skeleton Loading States**
   - [ ] Skeleton shimmer effect personalizado
   - [ ] Transição suave skeleton -> conteúdo

---

### Fase 4: Chat Interface Redesign (E - Execução)

**Objetivo:** Transformar o chat em uma experiência premium estilo Perplexity

#### Referência Visual:
- Input central proeminente (estilo search engine)
- Mensagens com avatares distintos
- Artifacts com cards glass especiais
- Source cards para citações

#### Tarefas:

1. **Empty State (Welcome Screen)**
   - [ ] Logo/ícone central com animação orbital
   - [ ] Input de busca grande e centralizado (Perplexity-style)
   - [ ] Suggestions como chips com hover effect
   - [ ] Background com gradient mesh + noise

2. **Input Area**
   - [ ] Container glass com borda glow ao focar
   - [ ] Botão de envio com gradiente + pulse quando pronto
   - [ ] Agent selector integrado com design aprimorado
   - [ ] Altura auto-expansiva com animação suave

3. **Message Bubbles**
   - [ ] Avatar do usuário: iniciais + background gradiente
   - [ ] Avatar da IA: ícone Sparkles + anel animado
   - [ ] Bubbles com background diferenciado user vs assistant
   - [ ] Markdown com estilização premium

4. **Artifacts Display**
   - [ ] Cards glass com header distintivo por tipo
   - [ ] Animação de entrada slide-up + fade
   - [ ] Botões de ação com hover states

5. **Loading States**
   - [ ] Typing indicator com animação pulsante
   - [ ] Tool execution com progress visual
   - [ ] Skeleton para artifacts

#### Código de Referência (Input):
```tsx
<div className={cn(
  "relative rounded-2xl",
  "bg-gradient-to-b from-slate-800/50 to-slate-900/50",
  "border border-white/10",
  "shadow-xl shadow-black/20",
  "transition-all duration-300",
  isFocused && "border-cyan-500/40 shadow-cyan-500/10"
)}>
```

---

### Fase 5: Polish & Optimization (V - Validação)

**Objetivo:** Refinamentos finais e otimizações

#### Tarefas:

1. **Performance**
   - [ ] Auditar animações (prefer 60fps)
   - [ ] Lazy load componentes pesados
   - [ ] Otimizar fontes (font-display: swap)
   - [ ] Reduzir blur em mobile (performance)

2. **Acessibilidade**
   - [ ] Contrast ratios (WCAG AA mínimo)
   - [ ] Focus states visíveis
   - [ ] Reduced motion support

3. **Testing Visual**
   - [ ] Screenshots em diferentes viewports
   - [ ] Dark mode consistency check
   - [ ] Cross-browser testing

4. **Documentação**
   - [ ] Atualizar component patterns
   - [ ] Documentar novos tokens

---

## 4. Arquivos a Modificar/Criar

### 4.1 Arquivos Existentes a Modificar

| Arquivo | Modificações |
|---------|-------------|
| `app/globals.css` | Novos tokens, utilitários, keyframes |
| `app/layout.tsx` | Configurar novas fontes |
| `app/dashboard/layout.tsx` | Ajustar para novo design |
| `app/dashboard/page.tsx` | Redesign completo |
| `app/dashboard/chat/page.tsx` | Wrapper atualizado |
| `components/dashboard/sidebar.tsx` | Redesign completo |
| `components/dashboard/odonto-ai-chat.tsx` | Redesign completo |

### 4.2 Novos Arquivos a Criar

| Arquivo | Propósito |
|---------|-----------|
| `components/ui/glass-card.tsx` | Componente card glassmorphism |
| `components/ui/gradient-text.tsx` | Texto com gradiente |
| `components/ui/glow-border.tsx` | Borda com efeito glow |
| `components/ui/animated-icon.tsx` | Wrapper para ícones animados |
| `components/dashboard/chat-input.tsx` | Input de chat isolado |
| `components/dashboard/message-bubble.tsx` | Bubble de mensagem |
| `components/dashboard/welcome-screen.tsx` | Tela inicial do chat |

---

## 5. Estimativas

| Fase | Duração Estimada | Complexidade |
|------|------------------|--------------|
| Fase 1: Design System | 2-3 horas | Média |
| Fase 2: Sidebar | 2-3 horas | Média |
| Fase 3: Dashboard | 3-4 horas | Alta |
| Fase 4: Chat | 4-5 horas | Alta |
| Fase 5: Polish | 2-3 horas | Média |
| **Total** | **13-18 horas** | - |

---

## 6. Critérios de Sucesso

### 6.1 Visual
- [ ] Design claramente diferenciado de templates genéricos
- [ ] Estética consistente com referências Perplexity
- [ ] Hierarquia visual clara e navegação intuitiva

### 6.2 Técnico
- [ ] Performance de animações (target: 60fps)
- [ ] First Contentful Paint < 1.5s
- [ ] Cumulative Layout Shift < 0.1

### 6.3 UX
- [ ] Feedback visual claro para todas as interações
- [ ] Loading states para todas as operações async
- [ ] Responsividade em todos os breakpoints

---

## 7. Rollback Plan

### Triggers para Rollback
- Performance degradada significativamente (>30% slower)
- Bugs críticos afetando funcionalidade core
- Incompatibilidade cross-browser grave

### Procedimento
1. Revert commits da fase atual via git
2. Restaurar versão anterior dos arquivos modificados
3. Documentar problemas encontrados para análise

---

## 8. Próximos Passos

1. **Imediato:** Iniciar Fase 1 - Design System Foundation
2. **Validação:** Revisar mockup/screenshot após cada fase
3. **Iteração:** Ajustar baseado em feedback visual

---

## Referências Visuais

- [Perplexity AI](https://perplexity.ai) - Inspiração principal
- [Vercel Dashboard](https://vercel.com/dashboard) - Referência de design system
- [Linear App](https://linear.app) - Referência de micro-animações
- [Raycast](https://raycast.com) - Referência de input/search UX
