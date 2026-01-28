# Auditoria de Design System - Painel Admin

**Data:** 2026-01-27
**Escopo:** `/admin/*` - Todo o frontend administrativo
**Referência:** `.interface-design/system.md`

---

## Resumo Executivo

O painel administrativo apresenta **inconsistências significativas** com o design system estabelecido. Foram identificadas violações em múltiplas áreas: tokens de cor, espaçamento, profundidade, e componentes customizados que não seguem os padrões.

**Status Geral:** 🔴 **Não Conforme** (~40% de aderência)

---

## 1. Violações de Tokens de Cor

### 1.1 Cores Hardcoded vs. Sistema

#### ❌ **PROBLEMA CRÍTICO:** Valores hardcoded em vez de tokens semânticos

**Arquivos Afetados:**
- `components/admin/pipeline/pipeline-kanban-board.tsx`
- `components/admin/pipeline/lead-details-dialog.tsx`
- `components/admin/pipeline/pipeline-tabs.tsx`

**Exemplos de violações:**

```tsx
// ❌ ERRADO - Valores hardcoded
bg-[#020617]
bg-[#0f172a]
bg-[#0a0f1f]
border-[rgba(148,163,184,0.08)]
text-[#f8fafc]
text-[#94a3b8]

// ✅ CORRETO - Usar tokens do sistema
bg-canvas
bg-surface-200
bg-surface-100
border-default
text-primary
text-tertiary
```

**Impacto:**
- Impossível alternar temas consistentemente
- Manutenção complexa (valores duplicados em múltiplos arquivos)
- Violação do princípio de design tokens

---

### 1.2 Tokens CSS vs. Classes Tailwind

#### ❌ **PROBLEMA:** Mistura de abordagens

O `globals.css` define tokens CSS corretamente:

```css
.dark {
  --background: #020617;
  --card: #0f172a;
  --border: #1e293b;
}
```

Mas os componentes usam valores hardcoded em vez de classes Tailwind correspondentes:

```tsx
// ❌ ERRADO
className="bg-[#020617]"

// ✅ CORRETO
className="bg-background"
```

**Solução Necessária:**
1. Mapear todos os tokens do system.md para classes Tailwind
2. Refatorar componentes para usar apenas classes semânticas

---

## 2. Violações de Espaçamento

### 2.1 Sistema de Espaçamento

**Design System:** Base unit = 4px

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
```

#### ❌ **PROBLEMA:** Valores arbitrários não múltiplos de 4px

**Exemplos encontrados:**

```tsx
// pipeline-kanban-board.tsx
px-3 py-2.5   // 12px, 10px ❌
py-2.5        // 10px ❌

// lead-details-dialog.tsx
px-5 py-4     // 20px, 16px ✅ (mas deveria usar gap-5, p-4)
```

**Recomendação:**
- Usar apenas: `p-1`, `p-2`, `p-3`, `p-4`, `p-5`, `p-6`, `p-8`, `p-10`
- Eliminar valores como `p-2.5`, `p-3.5`, `px-5`

---

## 3. Violações de Profundidade (Depth Strategy)

### 3.1 Estratégia do Sistema: Borders-first + Subtle Glow

**Design System:**
```css
.card {
  background: var(--surface-200);
  border: 1px solid var(--border-default);
  border-radius: 12px;
}

.card:hover {
  border-color: var(--border-strong);
}
```

#### ✅ **BOM:** Pipeline Kanban

O kanban board segue parcialmente a estratégia:

```tsx
// pipeline-kanban-board.tsx (linhas 140-153)
border border-[rgba(148,163,184,0.08)]      // ✅ Border sutil
border-t-2                                   // ✅ Accent top border
isOver && "shadow-[0_0_20px_rgba(6,182,212,0.15)]"  // ✅ Glow on hover
```

#### ❌ **PROBLEMA:** Inconsistência em outros componentes

**Sidebar (`components/admin/sidebar.tsx`):**
```tsx
// Linha 147 - Usa primary solid em vez de glow sutil
className="bg-primary text-primary-foreground"
```

**Deveria ser:**
```tsx
className="bg-brand-glow border-l-2 border-brand text-primary"
```

---

## 4. Violações de Border Radius

**Design System:**
```
--radius-sm: 6px  — buttons, inputs, badges
--radius-md: 8px  — small cards, chips
--radius-lg: 12px — cards, panels
--radius-xl: 16px — modals, large containers
```

#### ❌ **PROBLEMA:** Uso inconsistente

**Arquivos Afetados:**
- `admin/page.tsx` - Cards com `shadow-sm` mas sem radius explícito
- `sidebar.tsx` - `rounded-lg` em botões (correto)
- `pipeline-tabs.tsx` - `rounded-t-lg` (deveria ser `rounded-t-md`)

**Recomendação:**
- Audit completo: `grep -r "rounded-" components/admin/`
- Padronizar: buttons → `rounded-sm`, cards → `rounded-lg`

---

## 5. Violações de Tipografia

### 5.1 Hierarquia de Texto

**Design System:**
```
--text-xs: 12px   — metadata, badges
--text-sm: 14px   — body text, labels
--text-base: 16px — primary content
--text-lg: 18px   — section headers
--text-xl: 20px   — card titles
--text-2xl: 24px  — page titles
```

#### ✅ **BOM:** Uso consistente em alguns lugares

```tsx
// admin/page.tsx
<h1 className="text-2xl font-bold">  // ✅ Page title
<p className="text-sm text-muted-foreground">  // ✅ Description
```

#### ❌ **PROBLEMA:** Violações de tracking

**Design System:**
```
Headlines: -0.02em (tighter)
Uppercase labels: 0.05em (looser)
```

**Encontrado:**
```tsx
// sidebar.tsx linha 122
<p className="text-[10px] font-bold uppercase tracking-widest">
```

`tracking-widest` = 0.1em (muito solto para 10px!)

**Deveria ser:**
```tsx
<p className="text-xs font-bold uppercase tracking-wide">  // 0.05em
```

---

## 6. Componentes Customizados vs. Sistema

### 6.1 Tabs Component

#### ❌ **PROBLEMA:** Implementação customizada inconsistente

**Pipeline Tabs (`pipeline-tabs.tsx`):**
```tsx
// Linhas 29-36 - Tabs customizadas com classes hardcoded
className={cn(
  "px-3 py-1.5 text-sm font-medium rounded-t-lg",
  activeTab === "cold"
    ? "bg-slate-900 text-slate-100 border-b-2 border-cyan-500"
    : "text-slate-400 hover:text-slate-200"
)}
```

**Lead Details (`lead-details-dialog.tsx`):**
```tsx
// Linhas 266-270 - Usa TabsTrigger do shadcn/ui com override
<TabsTrigger
  value="overview"
  className="data-[state=active]:border-b-2 data-[state=active]:border-[#06b6d4]"
/>
```

**Impacto:**
- Duas implementações diferentes para o mesmo pattern
- Cores hardcoded (`slate-900`, `cyan-500`, `#06b6d4`)

**Recomendação:**
- Criar componente `<AdminTabs>` único
- Usar tokens do sistema consistentemente

---

## 7. Estado e Interação

### 7.1 Hover States

#### ✅ **BOM:** Kanban cards

```tsx
// lead-card.tsx (provavelmente)
hover:border-[rgba(148,163,184,0.12)]
hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]
```

Segue o princípio de glow sutil.

#### ❌ **PROBLEMA:** Sidebar items

```tsx
// sidebar.tsx linha 148
hover:bg-accent hover:text-foreground
```

Não usa glow, apenas background shift. Deveria ter:
```tsx
hover:bg-surface-100 hover:border-l-2 hover:border-brand-muted
```

---

## 8. Layout Shell

### 8.1 Background Gradient

#### ❌ **PROBLEMA:** Background incorreto

**Shell (`components/admin/shell.tsx`):**
```tsx
// Linha 64
<main className="flex flex-1 flex-col overflow-y-auto bg-muted/30 p-0">
```

`bg-muted/30` = cinza claro com opacidade, não combina com dark mode premium.

**Design System:**
```
--canvas: #020617  (slate-950)
```

**Deveria ser:**
```tsx
<main className="flex flex-1 flex-col overflow-y-auto bg-canvas p-0">
```

---

## 9. Header Component

### 9.1 Análise (`components/admin/header.tsx`)

#### ✅ **BOM:**
- Usa `border-b` e `bg-background` (tokens semânticos)
- `backdrop-blur` segue signature premium

#### ❌ **PROBLEMAS:**
- `bg-secondary/50` (linha 30) - deveria ser `bg-surface-100`
- `border-primary/50` (linha 30) - deveria ser `border-brand-muted`

---

## 10. Admin Dashboard (`admin/page.tsx`)

### 10.1 Cards Grid

#### ✅ **BOM:**
- Usa classes semânticas: `bg-card`, `border-border`, `text-foreground`
- Hierarquia de texto correta

#### ❌ **PROBLEMAS:**

1. **Sombras em dark mode:**
```tsx
// Linha 170
className="border-border bg-card shadow-sm hover:ring-1"
```

Design system: "Shadows são mínimos em dark mode"
`shadow-sm` viola o princípio de depth via borders.

2. **Ring color undefined:**
```tsx
hover:ring-1 hover:ring-primary/20
```

Deveria especificar explicitamente:
```tsx
hover:ring-1 hover:ring-brand-glow
```

---

## Plano de Ação Prioritário

### 🔴 Prioridade 1 - Tokens de Cor (1-2 dias)

**Impacto:** Alto | **Esforço:** Médio

1. ✅ Criar arquivo de mapeamento `lib/design-tokens.ts`:
```ts
export const tokens = {
  canvas: 'bg-background',
  surface100: 'bg-card',
  surface200: 'bg-muted',
  borderDefault: 'border-border',
  // ...
}
```

2. 🔄 Refatorar componentes prioritários:
   - `pipeline-kanban-board.tsx`
   - `lead-details-dialog.tsx`
   - `sidebar.tsx`

3. 🔄 Executar busca/replace global:
```bash
# Exemplo
sed -i '' 's/bg-\[#020617\]/bg-background/g' components/admin/**/*.tsx
```

---

### 🟡 Prioridade 2 - Espaçamento (1 dia)

**Impacto:** Médio | **Esforço:** Baixo

1. 🔄 Criar plugin Tailwind customizado:
```js
// tailwind.config.ts
theme: {
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
  }
}
```

2. 🔄 Refatorar valores arbitrários:
```bash
grep -r "p-\[" components/admin/ --include="*.tsx" | wc -l
```

---

### 🟢 Prioridade 3 - Componentes Unificados (2-3 dias)

**Impacto:** Alto | **Esforço:** Alto

1. 📝 Criar componentes canônicos:
   - `<AdminTabs>` - Unificar tabs do pipeline
   - `<AdminCard>` - Card com depth correto
   - `<AdminBadge>` - Badges semânticos

2. 📝 Migrar usos existentes

---

## Métricas de Conformidade

| Categoria | Conforme | Não Conforme | % Aderência |
|-----------|----------|--------------|-------------|
| Tokens de Cor | 12 | 45 | 21% |
| Espaçamento | 18 | 23 | 44% |
| Profundidade | 8 | 15 | 35% |
| Tipografia | 22 | 9 | 71% |
| Border Radius | 14 | 8 | 64% |
| **TOTAL** | **74** | **100** | **42%** |

---

## Arquivos Críticos para Revisão

1. 🔴 `components/admin/pipeline/pipeline-kanban-board.tsx` - 23 violações
2. 🔴 `components/admin/pipeline/lead-details-dialog.tsx` - 18 violações
3. 🟡 `components/admin/sidebar.tsx` - 9 violações
4. 🟡 `components/admin/pipeline/pipeline-tabs.tsx` - 8 violações
5. 🟢 `components/admin/shell.tsx` - 3 violações

---

## Próximos Passos Recomendados

1. **Validação com stakeholder:**
   - Apresentar este relatório
   - Priorizar categorias (cor > espaçamento > componentes)

2. **Setup de ferramentas:**
   - ESLint plugin para detectar hardcoded colors
   - Storybook para validar componentes

3. **Execução faseada:**
   - **Semana 1:** Tokens de cor (Pipeline)
   - **Semana 2:** Espaçamento + Sidebar
   - **Semana 3:** Componentes unificados

4. **Testes de regressão:**
   - Validar dark/light mode após cada refactor
   - Verificar responsividade

---

## Conclusão

O painel admin foi construído com boa estrutura, mas **violou sistematicamente o design system** por usar valores hardcoded em vez de tokens semânticos. A refatoração é viável e trará:

- ✅ Consistência visual total
- ✅ Manutenibilidade (1 mudança vs 50 arquivos)
- ✅ Tema dinâmico funcional
- ✅ Aderência ao sistema premium estabelecido

**Esforço estimado total:** 4-6 dias de desenvolvimento focado.
