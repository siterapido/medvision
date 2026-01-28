# Interface UI/UX Completa - Odonto GPT

## Design System

### Paleta de Cores

```css
/* Primary Colors */
--primary-50: #f0f9ff;
--primary-100: #e0f2fe;
--primary-500: #0ea5e9;  /* Main brand */
--primary-600: #0284c7;
--primary-700: #0369a1;
--primary-900: #0c4a6e;

/* Semantic Colors */
--success-500: #10b981;
--warning-500: #f59e0b;
--error-500: #ef4444;
--info-500: #3b82f6;

/* Neutrals */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-500: #6b7280;
--gray-700: #374151;
--gray-900: #111827;

/* Artifact Type Colors */
--research-color: #8b5cf6;     /* Roxo */
--flashcard-color: #3b82f6;    /* Azul */
--report-color: #10b981;       /* Verde */
--summary-color: #f59e0b;      /* Laranja */
--mindmap-color: #ec4899;      /* Rosa */
--quiz-color: #6366f1;         /* Indigo */
```

### Tipografia

```css
/* Font Family */
--font-display: 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Espaçamentos

```css
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
```

### Sombras

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

### Border Radius

```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-2xl: 1rem;     /* 16px */
--radius-full: 9999px;
```

---

## Layout Global

### Estrutura Principal

```
┌─────────────────────────────────────────────────────────┐
│  Header (60px fixed)                                     │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐ │
│  │ Logo        │  │ Navigation │  │ User + Settings  │ │
│  └─────────────┘  └────────────┘  └──────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐  ┌──────────────────────────────────┐  │
│  │            │  │                                   │  │
│  │  Sidebar   │  │      Main Content Area           │  │
│  │  (240px)   │  │      (fluid)                     │  │
│  │            │  │                                   │  │
│  │  • Home    │  │                                   │  │
│  │  • Studio  │  │                                   │  │
│  │  • Biblio. │  │                                   │  │
│  │  • Chat    │  │                                   │  │
│  │            │  │                                   │  │
│  │  Projects  │  │                                   │  │
│  │  • Proj 1  │  │                                   │  │
│  │  • Proj 2  │  │                                   │  │
│  │            │  │                                   │  │
│  └────────────┘  └──────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Header Component

**Visual**:
```
┌──────────────────────────────────────────────────────────┐
│ [🦷 Logo] [Studio] [Biblioteca] [Chat]     [🔍] [👤] [⚙️] │
└──────────────────────────────────────────────────────────┘
```

**Especificações**:
- Altura: 60px
- Background: branco (`--gray-50`)
- Border bottom: 1px solid `--gray-200`
- Sticky ao scroll
- Blur background quando scroll (backdrop-filter: blur(8px))

**Animações**:
```css
/* Ao fazer scroll para baixo */
.header {
  transform: translateY(0);
  transition: all 0.3s ease;
}

.header.scrolled {
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(8px);
  background: rgba(249, 250, 251, 0.9);
}

/* Esconder header ao scroll down, mostrar ao scroll up */
.header.hidden {
  transform: translateY(-100%);
}
```

**Itens de Navegação**:
```jsx
<nav className="flex items-center gap-1">
  <NavItem 
    href="/studio"
    icon={<Sparkles />}
    label="Studio"
    active={pathname === '/studio'}
  />
  <NavItem 
    href="/biblioteca"
    icon={<Library />}
    label="Biblioteca"
    badge={12} // Número de novos artefatos
  />
  <NavItem 
    href="/chat"
    icon={<MessageSquare />}
    label="Chat"
  />
</nav>
```

**Hover States**:
```css
.nav-item {
  padding: 8px 12px;
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: var(--gray-100);
  transform: translateY(-1px);
}

.nav-item.active {
  background: var(--primary-100);
  color: var(--primary-700);
  font-weight: var(--font-semibold);
}
```

---

## 1. Odonto Studio - Página Inicial

### Layout

```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│     Odonto Studio                                         │
│     Crie artefatos profissionais com IA especializada    │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Filtros: [Todos] [Estudo] [Clínico] [🔍 Buscar]   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ [🔬]     │  │ [🎴]     │  │ [📄]     │              │
│  │ Pesquisa │  │ Flashcard│  │ Laudo    │              │
│  │ Científica│  │          │  │          │              │
│  │          │  │ Popular  │  │          │              │
│  │ ~15 min  │  │ ~2 min   │  │ ~5 min   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ [📝]     │  │ [🧠]     │  │ [✅]     │              │
│  │ Resumo   │  │ Mapa     │  │ Simulado │              │
│  │          │  │ Mental   │  │          │              │
│  │          │  │          │  │          │              │
│  │ ~3 min   │  │ ~4 min   │  │ ~8 min   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                           │
│  Artefatos Recentes                                      │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 🎴 Flashcards - Anatomia Dental    │  há 2 horas   ││
│  │ 📝 Resumo - Artigo sobre Implantes │  há 5 horas   ││
│  │ 🔬 Pesquisa - Biomateriais         │  ontem        ││
│  └─────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### Artifact Type Card

**Estrutura Visual**:
```
┌─────────────────────────┐
│      [Grande Ícone]      │ ← 64x64px, cor temática
│                          │
│   Nome do Artefato       │ ← text-xl, font-semibold
│   Descrição curta        │ ← text-sm, gray-600
│                          │
│   ⏱️ ~X min              │ ← Estimativa de tempo
│   ━━━━━━━━━━━━━ 85%     │ ← Barra de popularidade
│                          │
│   [ Criar → ]            │ ← Botão com hover effect
└─────────────────────────┘
```

**Especificações**:
```css
.artifact-card {
  width: 280px;
  height: 320px;
  padding: 24px;
  background: white;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-xl);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.artifact-card:hover {
  border-color: var(--primary-500);
  box-shadow: var(--shadow-xl);
  transform: translateY(-8px);
}

/* Ícone animado no hover */
.artifact-card:hover .icon {
  transform: scale(1.1) rotate(5deg);
  transition: transform 0.3s ease;
}
```

**Badge "Popular"**:
```jsx
<span className="absolute top-4 right-4 px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
  Popular 🔥
</span>
```

**Animação de Entrada** (cards aparecem em sequência):
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.artifact-card {
  animation: fadeInUp 0.5s ease-out forwards;
}

.artifact-card:nth-child(1) { animation-delay: 0ms; }
.artifact-card:nth-child(2) { animation-delay: 100ms; }
.artifact-card:nth-child(3) { animation-delay: 200ms; }
.artifact-card:nth-child(4) { animation-delay: 300ms; }
.artifact-card:nth-child(5) { animation-delay: 400ms; }
.artifact-card:nth-child(6) { animation-delay: 500ms; }
```

---

## 2. Formulário de Criação (Exemplo: Flashcards)

### Layout - Desktop

```
┌──────────────────────────────────────────────────────────┐
│ ← Voltar    Criar Flashcards                             │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Passo 1 de 3: Configuração                      │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│  │  33%                                              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Sobre o que serão os flashcards? *                 │ │
│  │ ┌────────────────────────────────────────────────┐ │ │
│  │ │ Ex: Anatomia do Nervo Trigêmeo                 │ │ │
│  │ └────────────────────────────────────────────────┘ │ │
│  │                                                     │ │
│  │ Quantos cards deseja criar? *                      │ │
│  │ ┌──┐ ┌──┐ ┌──┐                                    │ │
│  │ │10│ │20│ │50│  ← Botões de quick select         │ │
│  │ └──┘ └──┘ └──┘                                    │ │
│  │ ou [____] (5-100)  ← Input customizado            │ │
│  │                                                     │ │
│  │ Nível de dificuldade *                             │ │
│  │ ( ) Iniciante  (•) Intermediário  ( ) Avançado    │ │
│  │                                                     │ │
│  │ Fonte do conteúdo                                  │ │
│  │ [Gerar do tópico] [Texto] [Upload PDF]            │ │
│  │                                                     │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ [Opcional] Cole um texto base ou PDF...      │  │ │
│  │ │                                               │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  [Cancelar]                          [Próximo →]         │
└──────────────────────────────────────────────────────────┘
```

### Progress Bar Animada

```css
.progress-bar {
  height: 8px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
  border-radius: var(--radius-full);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

/* Shimmer effect */
.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Input Fields com Animações

```css
.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--gray-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  transition: all 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px var(--primary-100);
}

/* Label flutuante animado */
.input-group {
  position: relative;
}

.floating-label {
  position: absolute;
  left: 16px;
  top: 14px;
  color: var(--gray-500);
  transition: all 0.2s ease;
  pointer-events: none;
  background: white;
  padding: 0 4px;
}

.input-field:focus ~ .floating-label,
.input-field:not(:placeholder-shown) ~ .floating-label {
  top: -8px;
  font-size: var(--text-sm);
  color: var(--primary-600);
}
```

### Botões de Quick Select

```css
.quick-select-btn {
  padding: 8px 16px;
  border: 2px solid var(--gray-300);
  border-radius: var(--radius-lg);
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-select-btn:hover {
  border-color: var(--primary-400);
  transform: scale(1.05);
}

.quick-select-btn.selected {
  border-color: var(--primary-500);
  background: var(--primary-500);
  color: white;
  font-weight: var(--font-semibold);
}

/* Efeito de "clique" */
.quick-select-btn:active {
  transform: scale(0.95);
}
```

---

## 3. Loading States - Geração de Artefatos

### Loading Especializado por Tipo

#### Flashcards Loading

```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│                   [Ícone de cards girando]                │
│                                                           │
│              Criando seus flashcards...                   │
│              Isso pode levar alguns segundos              │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ✓ Analisando o tópico                               ││
│  │ ⟳ Gerando perguntas inteligentes...                 ││
│  │ ○ Criando respostas detalhadas                      ││
│  │ ○ Organizando por dificuldade                       ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  Já criamos 8 de 20 cards                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 40%     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Animação do Ícone**:
```css
@keyframes cardShuffle {
  0% {
    transform: translateX(0) rotate(0deg);
  }
  25% {
    transform: translateX(10px) rotate(5deg);
  }
  50% {
    transform: translateX(-10px) rotate(-5deg);
  }
  75% {
    transform: translateX(5px) rotate(3deg);
  }
  100% {
    transform: translateX(0) rotate(0deg);
  }
}

.loading-icon {
  animation: cardShuffle 2s ease-in-out infinite;
}
```

**Steps com Check Animado**:
```css
.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.step-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-icon.complete {
  background: var(--success-500);
  animation: checkPop 0.3s ease-out;
}

.step-icon.active {
  border: 2px solid var(--primary-500);
  animation: spin 1s linear infinite;
}

@keyframes checkPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

#### Pesquisa Científica Loading

```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│              [Ícone de lupa + documentos]                 │
│                                                           │
│           Pesquisando evidências científicas...           │
│           Pode levar até 2 minutos                        │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ✓ Buscando artigos científicos                       ││
│  │ ⟳ Analisando 47 fontes encontradas...               ││
│  │ ○ Verificando níveis de evidência                   ││
│  │ ○ Extraindo citações relevantes                     ││
│  │ ○ Escrevendo relatório                              ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  Encontramos 12 estudos relevantes                        │
│  [⚪⚪⚪⚫⚫⚫⚫⚫]                                              │
│                                                           │
│  💡 Você pode fechar esta janela. Te avisaremos quando   │
│     estiver pronto!                                       │
│     [Continuar em background]                            │
└──────────────────────────────────────────────────────────┘
```

#### Mapa Mental Loading

```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│                [Ícone de nós conectando]                  │
│                                                           │
│              Mapeando conceitos...                        │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ✓ Identificando conceitos principais                 ││
│  │ ⟳ Organizando hierarquia...                         ││
│  │ ○ Conectando ideias relacionadas                    ││
│  │ ○ Aplicando layout visual                           ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  [Animação de nós aparecendo e se conectando]            │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Biblioteca de Artefatos

### Layout Principal

```
┌──────────────────────────────────────────────────────────┐
│  Biblioteca                          [+ Novo Artefato]    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 🔍 Buscar artefatos...              [Filtros ▾]     ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [Todos] [Pesquisas] [Flashcards] [Laudos] [...]    ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  Vista: [Grade] [Lista]    Ordenar: [Mais recentes ▾]   │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ [🎴]     │  │ [📝]     │  │ [🔬]     │              │
│  │          │  │          │  │          │              │
│  │ Anatomia │  │ Resumo   │  │ Pesquisa │              │
│  │ Dental   │  │ Implantes│  │ Bio...   │              │
│  │          │  │          │  │          │              │
│  │ há 2h    │  │ ontem    │  │ 3 dias   │              │
│  │ [︙]     │  │ [︙]     │  │ [︙]     │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ [🧠]     │  │ [✅]     │  │ [📄]     │              │
│  │          │  │          │  │          │              │
│  │ Mapa     │  │ Simulado │  │ Laudo    │              │
│  │ Perio... │  │ Endo...  │  │ Rx Pan...│              │
│  │          │  │          │  │          │              │
│  │ 1 sem    │  │ 2 sem    │  │ 1 mês    │              │
│  │ [︙]     │  │ [︙]     │  │ [︙]     │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                           │
│  [← Anterior]  1 2 3 4 5  [Próximo →]                   │
└──────────────────────────────────────────────────────────┘
```

### Artifact Card na Biblioteca

**Visual Detalhado**:
```
┌────────────────────────────┐
│ [Thumbnail/Ícone Grande]    │ ← Preview ou ícone
│                             │
│ 🎴 Flashcards              │ ← Tipo + Badge
│ Anatomia do Nervo Trigêmeo │ ← Título
│                             │
│ 20 cards • Intermediário    │ ← Metadados
│ ⭐⭐⭐⭐⭐ (85% completo)    │ ← Progresso (se aplicável)
│                             │
│ há 2 horas                  │ ← Timestamp
│                             │
│ [Abrir] [Editar] [︙]       │ ← Actions
└────────────────────────────┘
```

**Hover State**:
```css
.artifact-library-card {
  transition: all 0.3s ease;
  position: relative;
}

.artifact-library-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Overlay com ações rápidas */
.artifact-library-card:hover .quick-actions {
  opacity: 1;
  transform: translateY(0);
}

.quick-actions {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}
```

**Animação de Entrada** (grid de cards):
```css
.artifact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.artifact-library-card {
  animation: scaleIn 0.4s ease-out backwards;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Delay em cascata */
.artifact-library-card:nth-child(1) { animation-delay: 0ms; }
.artifact-library-card:nth-child(2) { animation-delay: 50ms; }
.artifact-library-card:nth-child(3) { animation-delay: 100ms; }
/* ... */
```

### Vista em Lista

```
┌──────────────────────────────────────────────────────────┐
│ 🎴 Anatomia do Nervo Trigêmeo             há 2 horas     │
│    Flashcards • 20 cards • Intermediário                 │
│    [Abrir] [Editar] [Compartilhar] [︙]                  │
├──────────────────────────────────────────────────────────┤
│ 📝 Resumo - Implantes Osseointegrados     ontem          │
│    Resumo • 5 páginas • 8 min de leitura                 │
│    [Abrir] [Editar] [Compartilhar] [︙]                  │
├──────────────────────────────────────────────────────────┤
│ 🔬 Pesquisa sobre Biomateriais            há 3 dias      │
│    Pesquisa • 12 citações • Meta-análise                 │
│    [Abrir] [Editar] [Compartilhar] [︙]                  │
└──────────────────────────────────────────────────────────┘
```

### Filtros Dropdown

```
┌──────────────────────────┐
│ Filtros                   │
├──────────────────────────┤
│ Tipo de Artefato          │
│ ☑ Todos                   │
│ ☐ Pesquisas               │
│ ☐ Flashcards              │
│ ☐ Laudos                  │
│ ☐ Resumos                 │
│ ☐ Mapas Mentais           │
│ ☐ Simulados               │
├──────────────────────────┤
│ Projeto                   │
│ ◉ Todos                   │
│ ○ Endodontia              │
│ ○ Periodontia             │
├──────────────────────────┤
│ Período                   │
│ ○ Última semana           │
│ ○ Último mês              │
│ ◉ Últimos 3 meses         │
│ ○ Este ano                │
├──────────────────────────┤
│ [Limpar] [Aplicar]        │
└──────────────────────────┘
```

**Animação do Dropdown**:
```css
.filter-dropdown {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  animation: dropdownOpen 0.2s ease-out forwards;
}

@keyframes dropdownOpen {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

---

## 5. Visualizadores de Artefatos

### 5.1. Flashcard Deck Viewer

**Layout**:
```
┌──────────────────────────────────────────────────────────┐
│ ← Voltar   Flashcards - Anatomia Dental    [︙ Menu]     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Progresso  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 65%    │
│  13 / 20 cards completos                                 │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │                                                      ││
│  │                   [3D Card Flip]                     ││
│  │                                                      ││
│  │           "Qual o maior nervo craniano?"             ││
│  │                                                      ││
│  │                                                      ││
│  │         Clique para ver a resposta                   ││
│  │                                                      ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  [ ← ]          13 / 20          [ → ]                   │
│                                                           │
│  [🔀 Embaralhar]  [⭐ Favoritar]  [📤 Compartilhar]     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Animação 3D de Flip**:
```css
.flashcard-container {
  perspective: 1000px;
  width: 600px;
  height: 400px;
}

.flashcard {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.flashcard.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: var(--radius-2xl);
  padding: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: var(--shadow-2xl);
}

.card-front {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-back {
  background: white;
  transform: rotateY(180deg);
  border: 2px solid var(--gray-200);
}
```

**Gesture Swipe (Mobile)**:
```javascript
// Swipe left/right para próximo/anterior
const swipeHandlers = useSwipeable({
  onSwipedLeft: () => nextCard(),
  onSwipedRight: () => previousCard(),
  onSwipedUp: () => flipCard(),
  trackMouse: true,
  preventScrollOnSwipe: true,
});
```

**Botão de Avaliação (após virar)**:
```
┌────────────────────────────────────┐
│ Como você avaliaria essa resposta? │
│                                    │
│ [😰 Difícil] [😐 Médio] [😊 Fácil] │
└────────────────────────────────────┘
```

---

### 5.2. Research Viewer

**Layout Split**:
```
┌──────────────────────────────────────────────────────────┐
│ ← Voltar   Pesquisa - Biomateriais em Implantes         │
├──────┬───────────────────────────────────────────┬───────┤
│      │                                            │       │
│ TOC  │          Conteúdo Principal               │ Refs  │
│      │                                            │       │
│ • Resumo                                          │  [1]  │
│ • Intro  ┌──────────────────────────────────────┐│  Smith│
│ • Metod. │                                       ││  2023 │
│ • Achados│ # Resumo Executivo                    ││       │
│   - Bio..│                                       ││  [2]  │
│   - Comp.│ Esta pesquisa investiga...            ││  Jones│
│ • Discus.│                                       ││  2024 │
│ • Concl. │ Os principais achados incluem [1]:   ││       │
│          │ - Melhora de 40% na osseointegração  ││  [3]  │
│          │ - Redução de complicações [2]        ││  Brown│
│          │                                       ││  2023 │
│          │ ## 1. Introdução                     ││       │
│          │                                       ││ [Ver  │
│          │ O uso de biomateriais tem...         ││ todas]│
│          │                                       ││       │
│          └──────────────────────────────────────┘│       │
│                                                            │
└──────┴───────────────────────────────────────────┴───────┘
```

**Citação Inline com Tooltip**:
```jsx
<span className="citation" data-citation-id="1">
  [1]
  <Tooltip>
    <TooltipContent>
      Smith et al. (2023). "Biomaterials in dental implants"
      Journal of Dentistry, 45(2), 123-145.
      DOI: 10.1234/jd.2023.001
      [Ver fonte completa →]
    </TooltipContent>
  </Tooltip>
</span>
```

**Animação de Scroll Sync** (TOC ativa baseado no scroll):
```css
.toc-item {
  padding: 8px 12px;
  border-left: 2px solid transparent;
  transition: all 0.2s ease;
}

.toc-item.active {
  border-left-color: var(--primary-500);
  background: var(--primary-50);
  font-weight: var(--font-semibold);
}
```

**Badge de Nível de Evidência**:
```jsx
<span className={cn(
  "evidence-badge",
  level === 'meta-analysis' && "bg-green-100 text-green-700",
  level === 'rct' && "bg-blue-100 text-blue-700",
  level === 'cohort' && "bg-yellow-100 text-yellow-700"
)}>
  Meta-análise 🏆
</span>
```

---

### 5.3. Mind Map Viewer

**Layout Full-Screen**:
```
┌──────────────────────────────────────────────────────────┐
│ [🏠] Mapa Mental - Antibioticoterapia   [Ferramentas▾]   │
├──────────────────────────────────────────────────────────┤
│                                                           │
│                    [Canvas Infinito]                      │
│                                                           │
│         ┌─────────────┐                                  │
│    ┌────│ Indicações  │────┐                             │
│    │    └─────────────┘    │                             │
│    │           │            │                             │
│ ┌──┴──┐        │         ┌──┴──┐                         │
│ │Infec│        │         │Profi│                         │
│ │ções │        │         │laxia│                         │
│ └─────┘        │         └─────┘                         │
│                │                                          │
│         ┌──────┴──────┐                                  │
│         │Antibióticos │  ← Nó Central                    │
│         │     em      │                                   │
│         │Odontologia  │                                   │
│         └──────┬──────┘                                  │
│                │                                          │
│         ┌──────┴──────┐                                  │
│         │Posologia    │                                   │
│         └─────────────┘                                  │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [−] [+] [⊕] [⟳] [↺]  [Salvar] [Exportar PNG]       │ │
│ └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Nó Customizado**:
```jsx
const CustomNode = ({ data }) => (
  <div className={cn(
    "mind-map-node",
    `type-${data.type}` // root, branch, leaf
  )}
  style={{
    borderColor: data.color,
  }}>
    {data.icon && <span className="node-icon">{data.icon}</span>}
    <div className="node-label">{data.label}</div>
    {data.description && (
      <div className="node-description">{data.description}</div>
    )}
  </div>
);
```

**Estilos de Nós**:
```css
.mind-map-node {
  min-width: 120px;
  padding: 16px;
  background: white;
  border: 3px solid;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.mind-map-node.type-root {
  min-width: 200px;
  padding: 24px;
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.mind-map-node.type-branch {
  background: var(--gray-50);
  font-weight: var(--font-semibold);
}

.mind-map-node:hover {
  box-shadow: var(--shadow-xl);
  transform: scale(1.05);
  z-index: 10;
}
```

**Animação de Conexão** (edges aparecem em sequência):
```css
.react-flow__edge-path {
  stroke: var(--gray-400);
  stroke-width: 2;
  stroke-dasharray: 5, 5;
  animation: dash 20s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -100;
  }
}

/* Edges pulsam ao hover no nó */
.react-flow__edge.highlighted {
  stroke: var(--primary-500);
  stroke-width: 3;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

### 5.4. Quiz Viewer

**Layout durante o Quiz**:
```
┌──────────────────────────────────────────────────────────┐
│ Simulado - Endodontia                        ⏱️ 45:32   │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Questão 5 de 30                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 17%  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │                                                      ││
│  │  Paciente de 45 anos apresenta dor intensa em       ││
│  │  molar inferior direito, que persiste após          ││
│  │  remoção de estímulo térmico. Teste de             ││
│  │  percussão negativo. Diagnóstico mais provável:    ││
│  │                                                      ││
│  │  [ ] A) Pulpite reversível                          ││
│  │  [•] B) Pulpite irreversível                        ││
│  │  [ ] C) Periodontite apical aguda                   ││
│  │  [ ] D) Abscesso periapical                         ││
│  │  [ ] E) Hipersensibilidade dentinária               ││
│  │                                                      ││
│  │  [💡 Dica] [🚩 Marcar p/ revisão]                  ││
│  │                                                      ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  [← Anterior]        [Pular]        [Próxima →]         │
│                                                           │
│  Respondidas: 4  |  Pendentes: 26  |  Marcadas: 1       │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Opção de Resposta**:
```css
.quiz-option {
  padding: 16px 20px;
  border: 2px solid var(--gray-300);
  border-radius: var(--radius-lg);
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 12px;
}

.quiz-option:hover {
  border-color: var(--primary-400);
  background: var(--primary-50);
  transform: translateX(4px);
}

.quiz-option.selected {
  border-color: var(--primary-500);
  background: var(--primary-100);
  font-weight: var(--font-semibold);
}

.quiz-option.correct {
  border-color: var(--success-500);
  background: var(--success-50);
}

.quiz-option.incorrect {
  border-color: var(--error-500);
  background: var(--error-50);
}

/* Animação de seleção */
.quiz-option.selected {
  animation: selectPulse 0.3s ease;
}

@keyframes selectPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}
```

**Modal de Revisão (após responder)**:
```
┌──────────────────────────────────────┐
│ ✅ Correto!                          │
│                                      │
│ Os sinais clínicos descritos (dor   │
│ intensa, espontânea, que persiste   │
│ após remoção do estímulo) são       │
│ característicos de pulpite          │
│ irreversível.                       │
│                                      │
│ **Ref:** Cohen & Hargreaves (2020)  │
│                                      │
│ [Continuar →]                        │
└──────────────────────────────────────┘
```

**Tela de Resultados Final**:
```
┌──────────────────────────────────────────────────────────┐
│            Parabéns! Você completou o simulado           │
│                                                           │
│                     ┌─────────┐                          │
│                     │   85%   │                          │
│                     │         │                          │
│                     │  ⭐⭐⭐  │                          │
│                     └─────────┘                          │
│                                                           │
│  Você acertou 25 de 30 questões                          │
│  Tempo total: 42 minutos                                 │
│                                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                           │
│  Desempenho por Categoria:                               │
│                                                           │
│  Diagnóstico      ━━━━━━━━━━━━━━━━━━━━━━━━━━━ 90%      │
│  Tratamento       ━━━━━━━━━━━━━━━━━━━━━━ 80%           │
│  Farmacologia     ━━━━━━━━━━━━━━━━━━━━━━━━━━ 85%       │
│                                                           │
│  [Ver Gabarito] [Refazer Simulado] [Salvar Resultado]   │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

### 5.5. Report Viewer (Laudos)

**Layout com Preview Profissional**:
```
┌──────────────────────────────────────────────────────────┐
│ ← Voltar   Laudo Radiográfico - Panorâmica  [Ferramentas]│
├──────────────────────────────────────────────────────────┤
│                                                           │
│  [👁️ Visualizar] [✏️ Editar] [🖨️ Imprimir] [📧 Enviar] │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │                  [Papel A4 Shadow]                   ││
│  │ ┌─────────────────────────────────────────────────┐ ││
│  │ │ ┌────────────┐                                  │ ││
│  │ │ │[Logo Clinic]                 CRO: 12345/SP    │ ││
│  │ │ └────────────┘                                  │ ││
│  │ │                                                 │ ││
│  │ │ LAUDO RADIOGRÁFICO                             │ ││
│  │ │                                                 │ ││
│  │ │ Paciente: Maria Silva Santos                   │ ││
│  │ │ Data: 28/01/2026                               │ ││
│  │ │                                                 │ ││
│  │ │ TÉCNICA                                        │ ││
│  │ │ Radiografia panorâmica digital...              │ ││
│  │ │                                                 │ ││
│  │ │ ACHADOS RADIOGRÁFICOS                          │ ││
│  │ │ 1. Estruturas ósseas...                        │ ││
│  │ │ 2. Elementos dentários...                      │ ││
│  │ │                                                 │ ││
│  │ │ CONCLUSÃO                                      │ ││
│  │ │ ...                                            │ ││
│  │ │                                                 │ ││
│  │ │ ─────────────────────                          │ ││
│  │ │ Dr. João Silva                                 │ ││
│  │ │ CRO-SP: 12345                                  │ ││
│  │ └─────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Modo de Edição com Tiptap**:
```
┌──────────────────────────────────────────────────────────┐
│ Toolbar: [B] [I] [U] [≡] [•] [1.] [🔗] [↶] [↷]         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  LAUDO RADIOGRÁFICO                                      │
│                                                           │
│  Paciente: Maria Silva Santos                            │
│  Data: 28/01/2026                                        │
│  ┃← Cursor editável                                      │
│  TÉCNICA                                                 │
│  Radiografia panorâmica digital realizada em             │
│  aparelho...                                             │
│                                                           │
│  [Menu flutuante aparece ao selecionar texto]            │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Bubble Menu (ao selecionar texto)**:
```css
.bubble-menu {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: var(--gray-900);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  animation: fadeInUp 0.2s ease;
}

.bubble-menu button {
  padding: 6px 10px;
  background: transparent;
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s ease;
}

.bubble-menu button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.bubble-menu button.active {
  background: var(--primary-600);
}
```

---

### 5.6. Summary Viewer

**Layout com Seções Colapsáveis**:
```
┌──────────────────────────────────────────────────────────┐
│ ← Voltar   Resumo - Implantes Osseointegrados           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ⏱️ 8 min de leitura  |  📉 15% do original  |  [⬇️ PDF] │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 📌 Pontos-Chave                                      ││
│  │ • Osseointegração depende de 4 fatores principais   ││
│  │ • Taxa de sucesso: 95-98% em 10 anos                ││
│  │ • Superfície tratada melhora integração em 20%      ││
│  │ • Carga imediata viável em casos selecionados       ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 📄 Resumo Executivo                                  ││
│  │                                                      ││
│  │ Este documento apresenta uma síntese sobre           ││
│  │ implantes dentários osseointegrados, abordando       ││
│  │ aspectos históricos, biomecânicos e clínicos...     ││
│  │                                                      ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  ▼ 1. Histórico e Evolução                     [+ Expand]│
│  ▶ 2. Biomecânica da Osseointegração           [+ Expand]│
│  ▶ 3. Técnicas Cirúrgicas                      [+ Expand]│
│  ▶ 4. Complicações e Manejo                    [+ Expand]│
│  ▼ 5. Perspectivas Futuras                     [− Collapse]
│  │  As novas tecnologias incluem...                      │
│  │  • Impressão 3D de implantes personalizados          │
│  │  • Nanotecnologia aplicada às superfícies            │
│  │                                                       │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 📖 Glossário                                         ││
│  │ **Osseointegração**: Conexão direta, estrutural...  ││
│  │ **Biocompatibilidade**: Capacidade de um material...││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Animação de Expansão**:
```css
.collapsible-section {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 12px;
}

.section-header {
  padding: 16px 20px;
  background: var(--gray-50);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s ease;
}

.section-header:hover {
  background: var(--gray-100);
}

.section-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out, padding 0.3s ease-out;
}

.section-content.expanded {
  max-height: 1000px;
  padding: 20px;
}

.chevron-icon {
  transition: transform 0.3s ease;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}
```

---

## 6. Microinterações e Animações Globais

### Toast Notifications

```jsx
// Sucesso
<Toast variant="success">
  <CheckCircle className="w-5 h-5" />
  <span>Flashcards criados com sucesso!</span>
</Toast>

// Erro
<Toast variant="error">
  <AlertCircle className="w-5 h-5" />
  <span>Erro ao gerar artefato. Tente novamente.</span>
</Toast>

// Info
<Toast variant="info">
  <Info className="w-5 h-5" />
  <span>Sua pesquisa está sendo processada em background.</span>
  <Button size="sm">Ver progresso</Button>
</Toast>
```

**Animação de Toast**:
```css
.toast {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast.exiting {
  animation: slideOutRight 0.3s ease-in;
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
```

### Button States

```css
.button {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* Ripple effect ao clicar */
.button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.button:active::after {
  width: 300px;
  height: 300px;
}

/* Loading state */
.button.loading {
  pointer-events: none;
  opacity: 0.7;
}

.button.loading .button-text {
  opacity: 0;
}

.button.loading .spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

### Skeleton Loading

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-200) 25%,
    var(--gray-300) 50%,
    var(--gray-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

### Modal Transitions

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.2s ease;
}

.modal-content {
  animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## 7. Responsividade

### Breakpoints

```css
/* Mobile First */
--mobile: 640px;    /* sm */
--tablet: 768px;    /* md */
--desktop: 1024px;  /* lg */
--wide: 1280px;     /* xl */
```

### Layout Adaptativo

**Desktop → Tablet**:
- Sidebar colapsa para ícones apenas
- Grid de artefatos: 3 colunas → 2 colunas
- Formulários mantêm largura, mas com menos padding

**Tablet → Mobile**:
- Sidebar vira bottom navigation
- Grid: 2 colunas → 1 coluna
- Cards ficam full-width
- Flashcards: orientação vertical
- Mapas mentais: zoom adaptado

**Exemplo de Media Query**:
```css
/* Desktop */
.artifact-grid {
  grid-template-columns: repeat(3, 1fr);
}

/* Tablet */
@media (max-width: 1024px) {
  .artifact-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .sidebar {
    width: 60px;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .artifact-grid {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    display: none;
  }
  
  .bottom-nav {
    display: flex;
  }
}
```

---

## 8. Acessibilidade (a11y)

### Focus States

```css
*:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.button:focus-visible {
  box-shadow: 0 0 0 4px var(--primary-100);
}
```

### Screen Reader

```jsx
<button
  aria-label="Próximo flashcard"
  aria-describedby="card-count"
>
  <ChevronRight aria-hidden="true" />
</button>

<span id="card-count" className="sr-only">
  Card 5 de 20
</span>
```

### Keyboard Navigation

```javascript
// Flashcards: Space = flip, Arrow keys = navigate
useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      toggleFlip();
    }
    if (e.key === 'ArrowRight') nextCard();
    if (e.key === 'ArrowLeft') previousCard();
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## 9. Performance

### Lazy Loading

```jsx
const FlashcardDeck = lazy(() => import('./FlashcardDeck'));
const MindMapViewer = lazy(() => import('./MindMapViewer'));

// Com Suspense
<Suspense fallback={<ArtifactSkeleton />}>
  <FlashcardDeck artifact={artifact} />
</Suspense>
```

### Image Optimization

```jsx
import Image from 'next/image';

<Image
  src="/artifacts/research-icon.png"
  alt="Ícone de pesquisa"
  width={64}
  height={64}
  loading="lazy"
/>
```

### Virtual Scrolling (para listas grandes)

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: artifacts.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 120,
});
```

---

**Versão**: 1.0  
**Última atualização**: Janeiro 2026  
**Responsável**: Equipe de Design & Frontend
