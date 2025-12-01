# Odonto GPT - UI/UX Design Guide

**Versão:** 1.0
**Última atualização:** 06/11/2025

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Paleta de Cores](#paleta-de-cores)
3. [Tipografia](#tipografia)
4. [Gradientes e Backgrounds](#gradientes-e-backgrounds)
5. [Espaçamento](#espaçamento)
6. [Componentes](#componentes)
7. [Texturas e Efeitos](#texturas-e-efeitos)
8. [Animações](#animações)
9. [Responsividade](#responsividade)
10. [Acessibilidade](#acessibilidade)

---

## Navegação e Padrões

- Admin (fundo claro, painéis escuros): a rota `app/admin` usa `bg-slate-50` com painéis em degradê azul claro (`from-sky-800 via-sky-700 to-sky-800`) e glows `sky`.
- O blocão “Central de cursos” é azul: use painel com degradê azul escuro (`linear-gradient(135deg, #0f3a63 0%, #124a78 100%)`) e textos claros; botões principais podem ser brancos para alto contraste.
- Cadastro de cursos: o painel em `app/admin/cursos` lista os cursos existentes e o botão “Novo Curso” abre um dialog em etapas com área escura e cards colapsáveis (“acordeão”).
- Cabeçalho fixo da landing page: a nova barra superior usa `backdrop-blur`, borda clara e mantém links âncora (`#como-funciona`, `#beneficios`, `#planos`, `#faq`) + CTA “Garantir Acesso” visíveis independentemente da rolagem.
- Cards de estatísticas são claros (`bg-white` + `border-slate-200`) para não “escurecer tudo”. Detalhes (badges, ícones, headers) mantêm acentos teal.
- Trials: rota `/admin/trials` exibe cards escuros com badges ciano para copiar links dos formulários de 1, 3, 7 e 30 dias (padrão LP segue 7 dias).

### Acentos com degradês azul escuro (vida/ênfase)

- Botões principais: use `Button` com `variant="blue"` (gradiente teal do dashboard: `#0891b2 → #06b6d4`) em CTAs como “Novo Curso” e “Publicar curso”.
- Ícones em métricas/charts: use fundo com leve gradiente `bg-[linear-gradient(135deg,rgba(8,145,178,0.12)_0%,rgba(6,182,212,0.06)_100%)]`.
- Gráficos/visualizações: adote traços/fills `#0f3a63 → #124a78` para linhas/áreas e use superfícies claras.
- Regra: aplique degradê apenas em elementos de foco (CTAs, pontos de dados, indicadores) para preservar o minimalismo no restante da UI.

### Números e blocos de “roteiros de cursos”

- Números (métricas do painel): use `text-[#0891b2]` (ou `text-primary`) para valores principais.
- Blocos de roteiros/etapas (cards do cadastro de cursos, módulos e aulas): bordas `border-[#0891b2]/20` e headings `text-[#0e7490]`.
- Painel “Central de cursos”: gradiente teal do dashboard `linear-gradient(135deg,#0891b2,#06b6d4)` com botões brancos para contraste.

---

## Visão Geral

O design do Odonto GPT segue uma estética **profissional médica** com tons de **ciano/teal** que transmitem:
- Confiabilidade e profissionalismo
- Tecnologia e inovação (IA)
- Ambiente clínico moderno
- Seriedade científica

O sistema utiliza **tema escuro predominante** em todas as seções da landing page para criar uma experiência premium e moderna, com toques de IA através de texturas sutis e gradientes animados.

A visão geral também precisa refletir o conteúdo real que os alunos encontram assim que chegam à plataforma, especialmente nos principais blocos de destaque do hero e do dashboard:

- **Últimos cursos liberados** — O catálogo concentra atualmente os lançamentos "Implantodontia Básica", "Endodontia Avançada" e "Ortodontia Digital", cada um com trilhas práticas e videoaulas comentadas (cf. `supabase/migrations/002_courses_and_chat.sql`). Esses títulos estão posicionados como painéis hero que destacam procedimentos e protocolos imediatos.
- **Lives ao vivo** — A agenda apresenta sessões semanais todas as quartas-feiras, às 20h (horário de Brasília), com perguntas e respostas ao vivo, certificado mensal e foco em protocolos de segurança clínica (ideal complementar dos módulos do hero; veja os bullets de planos na landing page `app/page.tsx`).
- **Materiais complementares** — A biblioteca centralizada oferece e-books como `gestao-clinica.pdf`, `marketing-clinico.pdf` e `protocolos-seguranca.pdf` (armazenados em `public/ebooks`), além de checklists e templates que aparecem nos painéis do dashboard de materiais (`app/dashboard/materiais/page.tsx`).

### Visão Geral do Dashboard

- **Aulas Disponíveis** — Cards em grid exibem thumbnail, título, duração, nível e progresso, mantendo badges “Novo” e “Concluído” com contraste mínimo de WCAG AA; filtros por especialidade (campo `area`), nível (`difficulty`) e status (não iniciado / em andamento / concluído) ficam acima da grid para facilitar descobertas.
- **Lives Próximas** — Lista horizontal com imagens, nome da live, horários em formato `pt-BR`, professor e CTA “Lembrete”; lives iniciando em menos de 24h recebem borda/emissão verde e indicação textual para chamar atenção sem depender só de cor.
- **Agenda de Lives** — Calendário mensal mostra marcadores nos dias com eventos, com alternância para visualização semanal e diária. O card de sincronização oferece download `.ics` e links para Google/Outlook, além de garantir foco e contraste nos controles de navegação.
- **Interações e animações** — Transições suaves (`transition-all duration-300`, hover com `scale` leve) reforçam o feeling premium enquanto mantém estados focus-visible bem definidos e indicadores de conteúdo novo/não visto através de glow azul-teal ou badges claras.
- **Atualização em tempo real** — A seção de lives consome websockets/Supabase Realtime, exibindo “Atualização em tempo real” (badge) e respondendo instantaneamente a mudanças de status em `live_events` sem comprometer acessibilidade.

---

## Paleta de Cores

### Cores Primárias

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| **Primary** | `#0891b2` | `rgb(8, 145, 178)` | Botões principais, links, ícones destacados |
| **Primary Hover** | `#0e7490` | `rgb(14, 116, 144)` | Estado hover de elementos primary |
| **Accent** | `#06b6d4` | `rgb(6, 182, 212)` | Destaques, badges, elementos secundários |
| **Special Gradient** | `#2399B4` | `rgb(35, 153, 180)` | Glows, texturas de IA, efeitos especiais |

### Cores de Background (Dark Theme)

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| **Dark Base** | `#0F192F` | `rgb(15, 25, 47)` | Background principal escuro |
| **Dark Mid** | `#131D37` | `rgb(19, 29, 55)` | Variações intermediárias |
| **Dark Accent** | `#1A2847` | `rgb(26, 40, 71)` | Destaques em backgrounds |
| **Dark Card** | `#16243F` | `rgb(22, 36, 63)` | Background de cards em seções escuras |
| **Dark Footer** | `#131F38` | `rgb(19, 31, 56)` | Background do footer |
| **Dark Footer Deep** | `#0B1627` | `rgb(11, 22, 39)` | Sombras profundas do footer |

### Cores de Texto

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| **White** | `#ffffff` | `rgb(255, 255, 255)` | Títulos e headings em seções escuras |
| **Slate 200** | `#e2e8f0` | `rgb(226, 232, 240)` | Parágrafos e texto secundário |
| **Slate 300** | `#cbd5e1` | `rgb(203, 213, 225)` | Texto muted, descrições |
| **Slate 600** | `#475569` | `rgb(71, 85, 105)` | Texto menos importante |
| **Card Foreground** | `#E6EDF7` | `rgb(230, 237, 247)` | Texto em cards de seções escuras |

### Cores de Status

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| **Success** | `#10b981` | `rgb(16, 185, 129)` | Sucesso, validações, check marks |
| **Destructive** | `#ef4444` | `rgb(239, 68, 68)` | Erros, avisos, cards negativos |
| **Warning** | `#f59e0b` | `rgb(245, 158, 11)` | Alertas, avisos importantes |

### Cores de Border

| Nome | Hex | Uso |
|------|-----|-----|
| **Border Primary** | `rgba(8, 145, 178, 0.3)` | Bordas sutis com primary |
| **Border Dark** | `#24324F` | Bordas em seções escuras |
| **Border Glow** | `#2399B4` | Bordas com efeito de destaque |

---

## Tipografia

### Famílias de Fonte

```css
--font-sans: "Inter", "Inter Fallback"
--font-mono: "Geist Mono", "Geist Mono Fallback"
--font-serif: "Source Serif 4", "Source Serif 4 Fallback"
```

### Hierarquia de Headings

#### Desktop
```css
h1: 4rem - 7rem (64px - 112px)
h2: 2.5rem - 3.5rem (40px - 56px)
h3: 1.5rem - 2rem (24px - 32px)
h4: 1.25rem (20px)
h5: 1.125rem (18px)
h6: 1rem (16px)
```

#### Mobile
```css
h1: 2.25rem - 2.5rem (36px - 40px)
h2: 1.875rem - 2.25rem (30px - 36px)
h3: 1.5rem (24px)
h4: 1.125rem (18px)
```

### Tamanhos de Texto

| Classe | Desktop | Mobile | Uso |
|--------|---------|--------|-----|
| `.text-xs` | 12px | 12px | Legendas, metadados |
| `.text-sm` | 14px | 14px | Texto secundário, descrições |
| `.text-base` | 16px | 16px | Corpo de texto padrão |
| `.text-lg` | 18px | 18px | Texto destacado |
| `.text-xl` | 20px | 20px | Subtítulos |
| `.text-2xl` | 24px | 24px | Subtítulos grandes |

### Line Height

```css
Headings: 1.2 - 1.4
Body text: 1.5 - 1.7
Descriptions: 1.7 (relaxed)
```

### Font Weight

```css
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
--font-extrabold: 800
```

---

## Gradientes e Backgrounds

### 1. Hero Section

```css
background:
  radial-gradient(ellipse at top, #1A2847 0%, transparent 60%),
  linear-gradient(135deg, #0F192F 0%, #131D37 35%, #1A2847 65%, #131D37 100%)

/* Glow overlay (::before) */
background:
  radial-gradient(ellipse 80% 55% at 50% -15%, rgba(8, 145, 178, 0.08) 0%, transparent 65%),
  radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.06) 0%, transparent 50%)

/* Textura de IA (::after) - ver seção Texturas */
```

**Uso:** Seção principal da landing page com vídeo VSL e CTA primário.

---

### 1.1 Gradientes claros (UI interna)

Recomendação para elementos de UI em páginas claras (admin, cards, painéis):

```css
/* Painéis escuros com azul mais claro */
background: linear-gradient(135deg, #0f3a63 0%, #124a78 45%, #0f3a63 100%);
/* Alternativa Tailwind */
bg-gradient-to-br from-sky-800 via-sky-700 to-sky-800

/* Cards claros com leve degradê azul */
background: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%);
/* Alternativa Tailwind */
bg-gradient-to-b from-white to-sky-50

/* Glows / overlays em páginas claras */
radial-gradient(circle at top, rgba(56, 189, 248, 0.22), transparent 62%),
radial-gradient(circle at bottom, rgba(186, 230, 253, 0.35), transparent 70%)
```

Use estes gradientes para “clarear” os tons de azul sem perder o contraste esperado para conteúdo e ícones.

---

### 2. How It Works Section

```css
background:
  radial-gradient(ellipse at center, #16243F 0%, transparent 60%),
  linear-gradient(145deg, #131D37 0%, #0F192F 25%, #1A2847 55%, #131F38 80%, #0F192F 100%)

/* Glows #2399B4 (::before) */
background:
  radial-gradient(circle at 30% 20%, rgba(35, 153, 180, 0.12) 0%, transparent 65%),
  radial-gradient(ellipse 75% 60% at 70% 80%, rgba(35, 153, 180, 0.10) 0%, transparent 70%),
  radial-gradient(circle at 50% 50%, rgba(35, 153, 180, 0.06) 0%, transparent 50%)
```

**Uso:** Explicação do processo em 3 passos.

---

### 3. Benefits Section

```css
background:
  radial-gradient(ellipse at top right, #1A2847 0%, transparent 68%),
  linear-gradient(125deg, #0F192F 0%, #131F38 40%, #16243F 65%, #131D37 85%, #0F192F 100%)

/* Glows #2399B4 flutuantes (::before) */
background:
  radial-gradient(circle at 15% 30%, rgba(35, 153, 180, 0.11) 0%, transparent 60%),
  radial-gradient(ellipse 70% 60% at 85% 70%, rgba(35, 153, 180, 0.09) 0%, transparent 65%),
  radial-gradient(circle at 50% 90%, rgba(35, 153, 180, 0.07) 0%, transparent 50%)
animation: float 22s ease-in-out infinite

/* Linhas diagonais (::after) */
background: repeating-linear-gradient(
  -45deg,
  transparent,
  transparent 50px,
  rgba(35, 153, 180, 0.03) 50px,
  rgba(35, 153, 180, 0.03) 51px
)
```

**Uso:** Grid de benefícios/features.

---

### 4. Testimonials Section

```css
background:
  radial-gradient(ellipse at top left, #1A2847 0%, transparent 65%),
  radial-gradient(ellipse at bottom right, #16243F 0%, transparent 70%),
  linear-gradient(135deg, #0F192F 0%, #131D37 30%, #1A2847 50%, #131F38 70%, #0F192F 100%)

/* Glows intensos #2399B4 (::before) */
background:
  radial-gradient(ellipse 85% 65% at 50% 10%, rgba(35, 153, 180, 0.14) 0%, transparent 70%),
  radial-gradient(circle at 20% 80%, rgba(35, 153, 180, 0.10) 0%, transparent 55%),
  radial-gradient(circle at 80% 50%, rgba(35, 153, 180, 0.08) 0%, transparent 50%)
animation: float 20s ease-in-out infinite

/* Grid tech (::after) */
background:
  repeating-linear-gradient(0deg, rgba(35, 153, 180, 0.04) 0px, rgba(35, 153, 180, 0.04) 1px, transparent 1px, transparent 50px),
  repeating-linear-gradient(90deg, rgba(35, 153, 180, 0.04) 0px, rgba(35, 153, 180, 0.04) 1px, transparent 1px, transparent 50px)
```

**Uso:** Depoimentos em vídeo (3 colunas no desktop, verticais).

---

### 5. Pricing Section

```css
background:
  radial-gradient(ellipse at top right, #1A2847 0%, transparent 60%),
  radial-gradient(ellipse at bottom left, #16243F 0%, transparent 65%),
  linear-gradient(135deg, #0F192F 0%, #131F38 50%, #0F192F 100%)

/* Spotlight effect (::before) */
background:
  radial-gradient(ellipse 90% 60% at 50% 50%, rgba(8, 145, 178, 0.12) 0%, transparent 70%),
  radial-gradient(circle at 50% -10%, rgba(6, 182, 212, 0.08) 0%, transparent 60%)
animation: float 18s ease-in-out infinite
```

**Uso:** Card de plano anual centralizado.

---

### 6. Final CTA Section

```css
background:
  radial-gradient(ellipse at center, #1A2847 0%, transparent 55%),
  linear-gradient(135deg, #131D37 0%, #152241 45%, #1A2847 55%, #131F38 100%)

/* Pulsing glow (::before) */
background:
  radial-gradient(ellipse 80% 60% at 50% 30%, rgba(8, 145, 178, 0.14) 0%, transparent 70%),
  radial-gradient(circle at 50% 70%, rgba(6, 182, 212, 0.10) 0%, transparent 60%)
animation: pulseScale 6s ease-in-out infinite
```

**Uso:** Último CTA antes do FAQ.

---

### 7. FAQ Section

```css
background:
  radial-gradient(ellipse at bottom center, #16243F 0%, transparent 65%),
  linear-gradient(165deg, #0F192F 0%, #131D37 45%, #1A2847 60%, #131F38 75%, #0F192F 100%)

/* Glows concêntricos #2399B4 (::before) */
background:
  radial-gradient(ellipse 75% 60% at 50% 40%, rgba(35, 153, 180, 0.10) 0%, transparent 70%),
  radial-gradient(circle at 90% 15%, rgba(35, 153, 180, 0.08) 0%, transparent 55%),
  radial-gradient(circle at 10% 85%, rgba(35, 153, 180, 0.06) 0%, transparent 50%)

/* Wave pattern (::after) */
background: repeating-linear-gradient(
  90deg,
  transparent,
  transparent 70px,
  rgba(35, 153, 180, 0.025) 70px,
  rgba(35, 153, 180, 0.025) 72px
)
```

**Uso:** Accordion com perguntas frequentes.

---

### 8. Dentista Section (Comparação)

```css
background:
  radial-gradient(ellipse at center, #16243F 0%, transparent 70%),
  linear-gradient(135deg, #0F192F 0%, #131F38 40%, #1A2847 60%, #131F38 100%)

/* Dual glow (::before) */
background:
  radial-gradient(ellipse 85% 60% at 50% -20%, rgba(8, 145, 178, 0.10) 0%, transparent 70%),
  radial-gradient(circle at 50% 100%, rgba(6, 182, 212, 0.06) 0%, transparent 60%)

/* Contrasting glows (::after) */
background:
  radial-gradient(circle at 75% 25%, rgba(8, 145, 178, 0.08) 0%, transparent 50%),
  radial-gradient(circle at 25% 75%, rgba(239, 68, 68, 0.05) 0%, transparent 50%)
```

**Uso:** Comparação "Sem Odonto GPT" vs "Com Odonto GPT".

---

### 9. Expert Section (Responsabilidade Técnica)

```css
background:
  radial-gradient(ellipse at center, #1A2847 0%, transparent 55%),
  linear-gradient(155deg, #131D37 0%, #0F192F 35%, #16243F 60%, #131F38 85%, #0F192F 100%)

/* Spotlight #2399B4 (::before) */
background:
  radial-gradient(ellipse 80% 70% at 50% 50%, rgba(35, 153, 180, 0.15) 0%, transparent 75%),
  radial-gradient(circle at 25% 20%, rgba(35, 153, 180, 0.08) 0%, transparent 55%),
  radial-gradient(circle at 75% 80%, rgba(35, 153, 180, 0.06) 0%, transparent 50%)
animation: pulseScale 8s ease-in-out infinite

/* Hexagonal pattern (::after) */
background: radial-gradient(circle, rgba(35, 153, 180, 0.06) 2px, transparent 2px)
background-size: 50px 50px
```

**Uso:** Seção com foto e credenciais do Roniery Costa.

---

### 10. Footer

```css
background: linear-gradient(135deg, #0F192F 0%, #131F38 55%, #0B1627 100%)

/* Top glow (::before) */
background: radial-gradient(ellipse 70% 45% at 50% -10%, rgba(19, 31, 56, 0.16) 0%, transparent 70%)
```

**Uso:** Footer com links e informações legais.

---

### 11. Gradiente de Botões CTA

```css
/* Button CTA gradient */
background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)

/* Hover state */
background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%)
```

---

### 12. Section Dividers (Opcional)

```css
/* Divider padrão */
background: linear-gradient(90deg,
  transparent 0%,
  rgba(8, 145, 178, 0.3) 50%,
  transparent 100%
)
height: 1px

/* Divider com contraste */
background: linear-gradient(90deg,
  transparent 0%,
  rgba(8, 145, 178, 0.4) 30%,
  rgba(6, 182, 212, 0.4) 70%,
  transparent 100%
)
height: 2px
box-shadow: 0 0 20px rgba(8, 145, 178, 0.2)
```

---

## Espaçamento

### Sistema de Spacing (Tailwind)

```css
/* Base unit: 0.25rem = 4px */
px-1  = 0.25rem = 4px
px-2  = 0.5rem  = 8px
px-3  = 0.75rem = 12px
px-4  = 1rem    = 16px
px-6  = 1.5rem  = 24px
px-8  = 2rem    = 32px
px-10 = 2.5rem  = 40px
px-12 = 3rem    = 48px
```

### Padding de Seções

| Contexto | Horizontal | Vertical |
|----------|------------|----------|
| **Mobile** | `px-4` (16px) | `py-16` (64px) |
| **Tablet** | `px-6` (24px) | `py-20` (80px) |
| **Desktop** | `px-6` (24px) | `py-32` (128px) |

### Padding de Cards

| Contexto | Padding |
|----------|---------|
| **Mobile** | `p-6` (24px) |
| **Desktop** | `p-8` a `p-10` (32px a 40px) |

### Gaps

```css
/* Grid gaps */
gap-4  = 1rem   = 16px   (mobile)
gap-6  = 1.5rem = 24px   (tablet)
gap-8  = 2rem   = 32px   (desktop)
gap-12 = 3rem   = 48px   (large screens)

/* Flex gaps */
gap-2 = 0.5rem  = 8px
gap-3 = 0.75rem = 12px
gap-4 = 1rem    = 16px
```

### Margin Vertical (Espaçamento entre elementos)

```css
space-y-4  = 1rem   = 16px   (pequeno)
space-y-6  = 1.5rem = 24px   (médio)
space-y-8  = 2rem   = 32px   (grande)
space-y-10 = 2.5rem = 40px   (extra-grande)
space-y-12 = 3rem   = 48px   (título + conteúdo)
```

---

## Componentes

### 1. Buttons

#### Primary CTA Button
```css
/* Classes */
.variant-cta
background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)
color: white
padding: 0.75rem 2rem (mobile) | 1rem 2.5rem (desktop)
border-radius: 0.5rem
font-weight: 600
box-shadow: 0 10px 40px rgba(8, 145, 178, 0.25)

/* Hover */
transform: scale(1.02)
background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%)

/* Active */
transform: scale(0.98)
```

#### Outline Button
```css
background: transparent
border: 2px solid rgba(8, 145, 178, 0.5)
color: white
padding: 0.75rem 2rem

/* Hover */
background: rgba(8, 145, 178, 0.1)
border-color: #0891b2
```

#### Button Sizes
```css
size="sm"  = px-4 py-2    (small)
size="md"  = px-6 py-2.5  (default)
size="lg"  = px-8 py-3    (large)
size="xl"  = px-10 py-4   (extra-large, hero CTAs)
```

---

### 2. Cards

#### Interactive Card
```css
.interactive-card
background: transparent or #16243F (dark sections)
border: 2px solid rgba(8, 145, 178, 0.2)
border-radius: 1rem (16px)
padding: 1.5rem - 2.5rem
transition: all 300ms

/* Hover */
transform: translateY(-2px)
box-shadow: 0 10px 40px rgba(8, 145, 178, 0.15)
border-color: rgba(35, 153, 180, 0.6)
```

#### Pricing Card (Anual - Featured)
```css
background: gradient from primary/10 to transparent
border: 3px solid #2399B4
border-radius: 1rem
padding: 2rem - 2.5rem
box-shadow: 0 20px 60px rgba(35, 153, 180, 0.3)
scale: 1.04 (desktop only)

/* Ribbon "Oferta Especial" */
position: absolute
top: 24px
right: -56px
rotate: 45deg
background: #06b6d4
color: white
padding: 4px 64px
font-size: 12px
font-weight: 600
```

#### Comparison Cards (Dentista Section)

**Card Negativo (Sem Odonto GPT):**
```css
/* Glow vermelho (hover) */
background: radial-gradient(ellipse, rgba(239, 68, 68, 0.35) 0%, transparent 90%)
opacity: 0 → 0.85 (hover)
blur: 140px

/* Border e sombra */
border: 2px solid rgba(239, 68, 68, 0.2)
hover: border-destructive/50
hover: shadow-destructive/20

/* Animation */
hover: animate-wobble (invalidWobble 420ms)
hover: scale(0.95)
```

**Card Positivo (Com Odonto GPT):**
```css
/* Glow intenso #2399B4 */
background: radial-gradient(ellipse, rgba(35, 153, 180, 0.6) 0%, rgba(35, 153, 180, 0.2) 60%, transparent 100%)
opacity: 0.9 → 1 (hover)
blur: 140px
scale: 1 → 1.1 (hover)

/* Edge glow */
background: gradient from #2399B4/40 via #2399B4/20 to transparent
blur: 48px

/* Border */
border: 3px solid #2399B4

/* Hover */
scale: 1.05
box-shadow: 0 10px 40px rgba(35, 153, 180, 0.2)
```

---

### 3. Badges

```css
.badge-default
background: rgba(8, 145, 178, 0.1)
color: #2399B4
border: 1px solid rgba(8, 145, 178, 0.4)
padding: 0.25rem 0.75rem
border-radius: 9999px (full)
font-size: 12px
font-weight: 600
text-transform: uppercase
```

---

### 4. Section Headers

```css
/* Label (badge acima do título) */
background: primary/10
color: white
padding: 4px 12px
border-radius: full
font-size: 12px
font-weight: 600
display: inline-flex
align-items: center
gap: 8px

/* Icon */
color: primary (#0891b2)
size: 16px

/* Title (h2) */
font-size: 2.5rem - 3.5rem (desktop) | 1.875rem - 2.25rem (mobile)
font-weight: 700
color: white
text-align: center
margin-bottom: 1rem

/* Description */
font-size: 1.125rem - 1.25rem
color: #cbd5e1
text-align: center
max-width: 48rem (768px)
margin: 0 auto
```

---

### 5. Video Players (YouTube)

#### Landscape (16:9) - VSL Hero
```css
aspect-ratio: 16/9
border-radius: 1rem
border: 2px solid rgba(8, 145, 178, 0.3)
box-shadow: 0 10px 40px rgba(8, 145, 178, 0.2)

/* Play button */
size: 112px (desktop) | 64px (mobile)
background: rgba(8, 145, 178, 0.9)
hover: rgba(8, 145, 178, 1)
border-radius: full
icon: 48px (desktop) | 32px (mobile)
```

#### Portrait (9:16) - Depoimentos
```css
aspect-ratio: 9/16
max-width: 300px
border-radius: 1.5rem (24px)
border: 2px solid #2399B4
box-shadow: 0 10px 30px rgba(35, 153, 180, 0.15)

/* Hover */
border-color: #2399B4
transform: scale(1.02)
```

---

### 6. Accordion (FAQ)

```css
.accordion-item
border: 2px solid rgba(8, 145, 178, 0.2)
border-radius: 0.75rem (12px)
background: transparent
margin-bottom: 1rem

/* Trigger (pergunta) */
padding: 1rem
font-size: 1.125rem
font-weight: 700
color: white
cursor: pointer

/* Hover */
background: rgba(8, 145, 178, 0.05)

/* Content (resposta) */
padding: 0 1rem 1rem 1rem
color: #cbd5e1
font-size: 1rem
```

---

### 7. Icons

```css
/* Sizes */
sm: 16px (1rem)
md: 20px (1.25rem)
lg: 24px (1.5rem)
xl: 32px (2rem)
2xl: 40px (2.5rem)

/* Colors */
Primary icons: #0891b2
Accent icons: #06b6d4
Success icons: #10b981
Destructive icons: #ef4444
Muted icons: #cbd5e1
```

---

## Texturas e Efeitos

### 1. Hero AI Background

#### Tech Grid (hero-ai-grid)
```css
background-size: 40px 40px
background-image:
  repeating-linear-gradient(0deg, rgba(6, 182, 212, 0.18) 0px, rgba(6, 182, 212, 0.18) 1px, transparent 1px, transparent 40px),
  repeating-linear-gradient(90deg, rgba(6, 182, 212, 0.12) 0px, rgba(6, 182, 212, 0.12) 1px, transparent 1px, transparent 40px)
mask-image: radial-gradient(ellipse 80% 60% at 50% 45%, black 0%, transparent 75%)
opacity: 0.25
animation: gridDrift 22s linear infinite
```

#### Aurora Beams (hero-ai-beam)
```css
width: min(48vw, 720px)
height: min(48vh, 520px)
opacity: 0.38
filter: blur(80px)
background: radial-gradient(circle at 50% 50%, var(--beam-color) 0%, transparent 60%)
animation: beamFloat 18s ease-in-out infinite

/* 3 camadas recomendadas */
Beam 1: top: -10%, left: -6%, accent 45%, duration: 20s
Beam 2: bottom: -8%, right: -4%, primary 40%, duration: 22s
Beam 3: top: 30%, right: 35%, secondary 35%, duration: 24s
```

---

### 2. Texturas de IA por Seção

#### Hero Section (::after)
```css
/* Tech grid + AI beams + glows */
background-image:
  /* Grid 100px x 100px */
  linear-gradient(90deg, rgba(35, 153, 180, 0.02) 1px, transparent 1px),
  linear-gradient(0deg, rgba(35, 153, 180, 0.02) 1px, transparent 1px),

  /* Beam diagonal 1 (135deg) */
  linear-gradient(135deg,
    transparent 0%, transparent 35%,
    rgba(35, 153, 180, 0.08) 45%,
    rgba(35, 153, 180, 0.12) 50%,
    rgba(35, 153, 180, 0.08) 55%,
    transparent 65%, transparent 100%
  ),

  /* Beam diagonal 2 (-135deg) */
  linear-gradient(-135deg,
    transparent 0%, transparent 40%,
    rgba(6, 182, 212, 0.06) 48%,
    rgba(6, 182, 212, 0.10) 52%,
    rgba(6, 182, 212, 0.06) 56%,
    transparent 64%, transparent 100%
  ),

  /* Glow orbs */
  radial-gradient(ellipse 600px 400px at 20% 30%, rgba(35, 153, 180, 0.15) 0%, transparent 50%),
  radial-gradient(ellipse 500px 350px at 80% 70%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
  radial-gradient(ellipse 800px 600px at 50% 50%, rgba(35, 153, 180, 0.08) 0%, transparent 60%)

background-size: 100px 100px, 100px 100px, 100%, 100%, 100%, 100%, 100%
filter: blur(1px)
mask-image: radial-gradient(ellipse 95% 80% at 50% 50%, black 0%, transparent 85%)
opacity: 0.6
animation: heroBeamPulse 8s ease-in-out infinite
```

#### Benefits Section (::after) - Data Matrix
```css
background-image:
  /* Linhas diagonais -45deg */
  repeating-linear-gradient(-45deg,
    transparent, transparent 50px,
    rgba(35, 153, 180, 0.025) 50px,
    rgba(35, 153, 180, 0.025) 52px
  ),

  /* Pontos de dados */
  radial-gradient(circle at 20% 30%, rgba(35, 153, 180, 0.06) 2px, transparent 2px),
  radial-gradient(circle at 60% 50%, rgba(35, 153, 180, 0.06) 2px, transparent 2px),
  radial-gradient(circle at 80% 80%, rgba(35, 153, 180, 0.06) 2px, transparent 2px)

background-size: 100% 100%, 150px 150px, 150px 150px, 150px 150px
mask-image: radial-gradient(ellipse 90% 80% at 50% 50%, black 0%, transparent 85%)
opacity: 0.5
```

#### Expert Section (::after) - Neural Network
```css
background-image:
  /* Nó central */
  radial-gradient(circle at 50% 50%, rgba(35, 153, 180, 0.12) 4px, transparent 4px),

  /* Nós periféricos */
  radial-gradient(circle at 30% 40%, rgba(35, 153, 180, 0.08) 3px, transparent 3px),
  radial-gradient(circle at 70% 40%, rgba(35, 153, 180, 0.08) 3px, transparent 3px),
  radial-gradient(circle at 40% 70%, rgba(35, 153, 180, 0.08) 3px, transparent 3px),
  radial-gradient(circle at 60% 70%, rgba(35, 153, 180, 0.08) 3px, transparent 3px),

  /* Ondas concêntricas */
  repeating-radial-gradient(circle at 50% 50%,
    transparent 0px, transparent 40px,
    rgba(35, 153, 180, 0.03) 40px,
    rgba(35, 153, 180, 0.03) 42px
  )

mask-image: radial-gradient(ellipse 85% 75% at 50% 50%, black 0%, transparent 70%)
opacity: 0.5
```

#### Testimonials Section (::after) - Data Flow
```css
background-image:
  /* Grid vertical */
  repeating-linear-gradient(90deg,
    transparent, transparent 100px,
    rgba(35, 153, 180, 0.04) 100px,
    rgba(35, 153, 180, 0.04) 102px
  ),

  /* Grid horizontal */
  repeating-linear-gradient(0deg,
    transparent, transparent 100px,
    rgba(35, 153, 180, 0.04) 100px,
    rgba(35, 153, 180, 0.04) 102px
  ),

  /* Nós nos cruzamentos */
  radial-gradient(circle at 25% 25%, rgba(35, 153, 180, 0.06) 2px, transparent 2px),
  radial-gradient(circle at 75% 25%, rgba(35, 153, 180, 0.06) 2px, transparent 2px),
  radial-gradient(circle at 25% 75%, rgba(35, 153, 180, 0.06) 2px, transparent 2px),
  radial-gradient(circle at 75% 75%, rgba(35, 153, 180, 0.06) 2px, transparent 2px)

background-size: 100%, 100%, 200px 200px, 200px 200px, 200px 200px, 200px 200px
mask-image: radial-gradient(ellipse 90% 75% at 50% 50%, black 0%, transparent 80%)
opacity: 0.4
```

#### FAQ Section (::after) - Tech Grid
```css
background-image:
  /* Grid fino */
  linear-gradient(90deg, rgba(35, 153, 180, 0.025) 1px, transparent 1px),
  linear-gradient(0deg, rgba(35, 153, 180, 0.025) 1px, transparent 1px),

  /* Nós nas bordas */
  radial-gradient(circle at 50% 0%, rgba(35, 153, 180, 0.08) 3px, transparent 3px),
  radial-gradient(circle at 0% 50%, rgba(35, 153, 180, 0.08) 3px, transparent 3px),
  radial-gradient(circle at 100% 50%, rgba(35, 153, 180, 0.08) 3px, transparent 3px),
  radial-gradient(circle at 50% 100%, rgba(35, 153, 180, 0.08) 3px, transparent 3px)

background-size: 60px 60px, 60px 60px, 100%, 100%, 100%, 100%
mask-image: radial-gradient(ellipse 95% 85% at 50% 50%, black 0%, transparent 85%)
opacity: 0.5
```

---

### 3. Login Page Grid Pattern

```css
.bg-grid-pattern
background-image:
  linear-gradient(90deg, rgba(35, 153, 180, 0.03) 1px, transparent 1px),
  linear-gradient(0deg, rgba(35, 153, 180, 0.03) 1px, transparent 1px)
background-size: 50px 50px
animation: gridFloat 20s ease-in-out infinite

@keyframes gridFloat {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(10px, 10px); }
}
```

---

## Animações

### 1. Keyframes Principais

#### gradientShift
```css
@keyframes gradientShift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    filter: hue-rotate(0deg) saturate(1);
  }
  50% {
    transform: translate3d(2%, -2%, 0) scale(1.02);
    filter: hue-rotate(10deg) saturate(1.1);
  }
  100% {
    transform: translate3d(-2%, 2%, 0) scale(1);
    filter: hue-rotate(-10deg) saturate(1);
  }
}
duration: 12s
timing: ease-in-out
iteration: infinite
```

#### float
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
duration: 6s (elementos) | 20s (backgrounds)
timing: ease-in-out
iteration: infinite
```

#### gridDrift
```css
@keyframes gridDrift {
  0% {
    background-position: 0px 0px, 0px 0px;
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    background-position: 80px 40px, 80px 40px;
    transform: translate3d(1%, -1%, 0) scale(1.01);
  }
  100% {
    background-position: 0px 0px, 0px 0px;
    transform: translate3d(-1%, 1%, 0) scale(1);
  }
}
duration: 22s
timing: linear
iteration: infinite
```

#### beamFloat
```css
@keyframes beamFloat {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
  }
  33% {
    transform: translate3d(-2%, 3%, 0) rotate(6deg) scale(1.05);
  }
  66% {
    transform: translate3d(3%, -2%, 0) rotate(-4deg) scale(1.03);
  }
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
  }
}
duration: 18s
timing: ease-in-out
iteration: infinite
```

#### invalidWobble
```css
@keyframes invalidWobble {
  0% { transform: translateX(0) rotate(0deg); }
  15% { transform: translateX(-2px) rotate(-0.3deg); }
  30% { transform: translateX(2px) rotate(0.3deg); }
  45% { transform: translateX(-1px) rotate(-0.2deg); }
  60% { transform: translateX(1px) rotate(0.2deg); }
  100% { transform: translateX(0) rotate(0deg); }
}
duration: 420ms
timing: ease
iteration: 1 (on hover card negativo)
```

#### pulseScale
```css
@keyframes pulseScale {
  0% { transform: scale(1); }
  35% { transform: scale(1.06); }
  60% { transform: scale(1.02); }
  100% { transform: scale(1); }
}
duration: 1.8s (buttons) | 6s (CTA) | 8s (expert)
timing: cubic-bezier(0.22, 1, 0.36, 1) ou ease-in-out
iteration: infinite
```

#### heroBeamPulse
```css
@keyframes heroBeamPulse {
  0%, 100% {
    opacity: 0.6;
    filter: blur(1px);
  }
  50% {
    opacity: 0.75;
    filter: blur(2px);
  }
}
duration: 8s
timing: ease-in-out
iteration: infinite
```

---

### 2. Classes de Animação

```css
.animate-float
animation: float 6s ease-in-out infinite

.animate-scale-pulse
animation: pulseScale 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite
will-change: transform

.animate-wobble
animation: invalidWobble 420ms ease

.bg-animated-gradient
background-image: [multiple radial gradients]
animation: gradientShift 12s ease-in-out infinite
```

---

### 3. Micro-interações

#### Interactive Button
```css
.interactive-button
transition: transform 200ms

hover: scale(1.02)
active: scale(0.98)
```

#### Interactive Card
```css
.interactive-card
transition: all 300ms

hover: translateY(-2px)
hover: shadow-xl
```

---

### 4. Respecting Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .animate-scale-pulse { animation: none; }
  .hero-ai-grid { animation: none; }
  .hero-ai-beam { animation: none; }
  .bg-animated-gradient { animation: none; }
}
```

---

## Responsividade

### Breakpoints (Tailwind)

```css
sm:  640px   (small tablets)
md:  768px   (tablets)
lg:  1024px  (small desktops)
xl:  1280px  (desktops)
2xl: 1536px  (large desktops)
```

### Containers

```css
.container
max-width: responsive
padding-left: 1rem (mobile) | 1.5rem (tablet+)
padding-right: 1rem (mobile) | 1.5rem (tablet+)
margin: 0 auto
```

### Grid Layouts

#### 2 Colunas (Desktop) → 1 Coluna (Mobile)
```css
grid-cols-1 md:grid-cols-2
gap-8 md:gap-12
```

#### 3 Colunas (Desktop) → 1 Coluna (Mobile)
```css
grid-cols-1 md:grid-cols-3
gap-6 md:gap-8
```

#### Hero Layout
```css
Mobile:
- Logo (top)
- Video
- Text + CTA
- Feature badges (horizontal center)

Desktop:
- Grid 2 cols
- Left: Logo + Text + CTA
- Right: Video
- Feature badges below (full width)
```

---

### Mobile-Specific Adjustments

#### Hero Video Play Button
```css
/* Desktop */
width: 112px
height: 112px
icon: 48px

/* Mobile */
width: 64px
height: 64px
icon: 32px
```

#### Section Padding
```css
/* Mobile */
py-16 (64px vertical)
px-4 (16px horizontal)

/* Desktop */
py-32 (128px vertical)
px-6 (24px horizontal)
```

#### Text Sizes
```css
/* Hero H1 */
Mobile: text-4xl (2.25rem / 36px)
Desktop: text-7xl (4.5rem / 72px)

/* Section H2 */
Mobile: text-2xl (1.5rem / 24px)
Desktop: text-4xl (2.25rem / 36px)
```

#### Button Widths
```css
/* Mobile - Full width */
w-full sm:w-auto

/* Desktop - Auto width */
w-auto
```

#### Card Spacing
```css
/* Mobile */
margin-bottom: 1rem
padding: 1.5rem

/* Desktop */
margin-bottom: auto (grid handles it)
padding: 2rem - 2.5rem
```

---

## Acessibilidade

### Admin – Cadastro de Cursos (Atualizado)
- O formulário de cadastro de cursos agora abre em um modal (popup) com fluxo em etapas.
- Campos obrigatórios são sinalizados com `*` e possuem validação por etapa antes de avançar.
- O modal utiliza `Dialog` (shadcn) e mantém o conteúdo navegável e rolável em telas menores.
- Botão de entrada: "Novo Curso" na página `app/admin/cursos` abre o modal.

### 1. Contraste de Cores

Todas as combinações de texto/background atendem **WCAG AAA** (7:1) para texto normal:

```css
✅ White (#ffffff) on Dark (#0F192F) = 16.5:1
✅ Slate 200 (#e2e8f0) on Dark (#0F192F) = 14.8:1
✅ Primary (#0891b2) on Dark (#0F192F) = 5.2:1
✅ White (#ffffff) on Primary (#0891b2) = 3.8:1 (large text only)
```

### 2. Touch Targets

```css
/* Minimum touch target size */
min-height: 44px (buttons)
min-width: 44px (icon buttons)

/* Mobile button padding */
padding: 0.75rem (12px vertical minimum)
```

### 3. Focus States

```css
:focus-visible
outline: 2px solid var(--ring) /* #0891b2 */
outline-offset: 2px
```

### 4. ARIA Labels

```html
<!-- Buttons com ações -->
<Button aria-label="Assinar agora" ... >

<!-- Elementos decorativos -->
<div aria-hidden="true" ... >

<!-- Links externos -->
<a rel="noopener noreferrer" target="_blank" ... >

<!-- Screen reader only -->
<span className="sr-only">Descrição para leitores de tela</span>
```

### 5. Semantic HTML

```html
<header> - Cabeçalho do site
<main> - Conteúdo principal
<section> - Seções temáticas
<footer> - Rodapé
<nav> - Navegação
<h1> - <h6> - Hierarquia de títulos
<button> - Ações interativas
<a> - Links e navegação
```

### 6. Keyboard Navigation

```css
/* Tab order lógico seguindo layout visual */
/* Todos os elementos interativos acessíveis via teclado */
/* Escape fecha modais e accordions */
/* Enter/Space ativa botões */
```

---

## Boas Práticas

### 1. Performance

```css
/* Use will-change com moderação */
will-change: transform (only on animated elements)

/* Use contain para otimizar repaints */
contain: paint (on animated overlays)

/* Evite animações em propriedades custosas */
✅ transform, opacity
❌ width, height, top, left
```

### 2. Consistência

- **Sempre use as classes Tailwind** definidas neste guia
- **Não crie cores/gradientes customizados** fora da paleta
- **Mantenha espaçamentos consistentes** (múltiplos de 4px/0.25rem)
- **Use os componentes reutilizáveis** (SectionHeader, Logo, YouTubePlayer)

### 3. Dark Theme Only

- Todas as seções da landing page são **dark theme**
- Logo branca (`logo-odonto-gpt-branca.png`) é **sempre usada**
- Textos principais são **brancos** (#ffffff)
- Textos secundários são **slate 200-300** (#e2e8f0, #cbd5e1)

### 4. Gradientes e Glows

- Use **#2399B4** para glows e texturas de IA
- Use **#0891b2** e **#06b6d4** para botões e elementos UI
- Combine **radial-gradient** (glows) + **linear-gradient** (base)
- Sempre aplique **mask-image** para suavizar bordas

### 5. Texturas

- **Sempre use ::after** para texturas (z-index: 1)
- **Sempre use ::before** para glows (z-index: -1 ou auto)
- **Sempre aplique mask-image** para fade nas bordas
- **Sempre use pointer-events: none** para não interferir em cliques

---

## Ferramentas e Recursos

### Design Tokens (CSS Variables)

```css
/* Em globals.css, todas as variáveis estão definidas em :root */
var(--primary)
var(--accent)
var(--background)
var(--foreground)
var(--border)
var(--shadow-color)
```

### Tailwind Config

```typescript
// Cores customizadas estão mapeadas via CSS variables
// Ver app/globals.css para definições completas
```

### Figma / Design Files

**Nota:** Este projeto não possui arquivos de design. Este documento serve como fonte única de verdade para o design system.

---

## Changelog

**v1.0 - 06/11/2025**
- Criação inicial do guia UI/UX
- Documentação completa de cores, gradientes e componentes
- Definição de texturas de IA para todas as seções
- Sistema de espaçamento e tipografia
- Animações e micro-interações
- Guidelines de acessibilidade

---

## Contato

Para dúvidas ou sugestões sobre este design system, entre em contato com o time de desenvolvimento.

**Desenvolvido para Odonto GPT** 🦷

## Mini-chat Flutuante (UI Interna)

```
/* Botão flutuante (toggle) */
size: 60px (desktop) | 50px (mobile)
shape: circular (full)
background: #0F192F (Dark Base)
border: 2px solid rgba(8, 145, 178, 1)
icon/logo: versão branca

/* States */
hover: background #131D37 (Dark Mid)
focus-visible: outline 2px #0891b2; outline-offset: 2px
active: scale(0.95)

/* Painel do chat */
container: 300x400 (desktop) | 280x380 (mobile)
background: linear-gradient(135deg, #0F192F 0%, #131D37 35%, #1A2847 65%, #131D37 100%)
border: 1px solid #24324F
radius: 12px (rounded-xl)
shadow: 2xl

/* Header */
background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)
text: white
divider: 1px #24324F

/* Área de mensagens */
text-default: white
scroll: thin; scrollbar-color: #24324F #0F192F
gap: space-y-3; padding: 16px

/* Bubbles */
user: background linear-gradient(135deg, #0891b2 → #06b6d4); text white; padding 8px–12px
assistant: background #16243F; border #24324F; text white; padding 8px–12px

/* Input */
background: #131D37; text: white; placeholder: slate-300
border: #24324F; focus: ring 2px #0891b2
padding: 16px (p-4); gap ao redor: 12px (gap-3)

/* Interações & animações */
transition: opacity/transform (200ms ease-out)
open: opacity 100%, translateY(0), scale(1)
close: opacity 0, translateY(8px), scale(0.95)

/* Envio */
sem botão de enviar; pressionar Enter (sem Shift) dispara o envio
```

**Acessibilidade**
- `role="dialog"` no painel, `aria-expanded` no botão, `aria-live="polite"` nas mensagens.
- Contraste: texto branco em planos escuros; bolha do usuário mantém legibilidade.
- Navegável via teclado (Enter para envio, foco ring teal).

**Responsividade**
- Posicionamento fixo `bottom-right` consistente.
- Tamanhos e offsets adaptados em mobile/desktop.
