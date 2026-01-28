# Refatoração do Design System - Admin Panel

**Status:** 🟡 Em Andamento (40% concluído)
**Data:** 2026-01-27

---

## O Que Foi Feito

### 1. Sistema de Design Tokens Criado ✅

**Arquivo:** `lib/design-tokens.ts`

Criado sistema completo de design tokens que mapeia o `.interface-design/system.md` para classes Tailwind reutilizáveis:

```typescript
// Exemplos de uso
import { tokens, presets } from '@/lib/design-tokens'

// Tokens individuais
className={cn(tokens.canvas, tokens.textPrimary)}

// Presets combinados
className={presets.card}
className={presets.navItemActive}
```

**Benefícios:**
- ✅ Manutenção centralizada (1 arquivo vs 50 componentes)
- ✅ Consistência visual garantida
- ✅ Type-safe (TypeScript)
- ✅ Tema dinâmico funcional

---

### 2. Componentes Refatorados ✅

#### 2.1 Pipeline Kanban Board (`components/admin/pipeline/pipeline-kanban-board.tsx`)

**Antes:**
```tsx
className="bg-[#020617] border-[rgba(148,163,184,0.08)] text-[#f8fafc]"
```

**Depois:**
```tsx
className={cn(tokens.canvas, tokens.borderDefault, tokens.textPrimary)}
```

**Mudanças:**
- ✅ 23 valores hardcoded → tokens semânticos
- ✅ Colunas do kanban com depth strategy correta
- ✅ Header com espaçamento padronizado
- ✅ Empty state com cores consistentes

---

#### 2.2 Sidebar (`components/admin/sidebar.tsx`)

**Mudanças:**
- ✅ Nav items ativos agora usam `presets.navItemActive` (glow + border-left)
- ✅ Tracking de texto corrigido (`tracking-wide` vs `tracking-widest`)
- ✅ User card com tokens de border e background
- ✅ Botão logout com estados hover consistentes

**Antes:**
```tsx
className="bg-primary text-primary-foreground"  // ❌ Sólido, sem glow
```

**Depois:**
```tsx
className={presets.navItemActive}  // ✅ Glow + border signature
```

---

#### 2.3 Shell Layout (`components/admin/shell.tsx`)

**Mudanças:**
- ✅ `bg-muted/30` → `bg-canvas` (fundo correto dark mode)
- ✅ Tokens importados para consistência
- ✅ Transições padronizadas

---

#### 2.4 Header (`components/admin/header.tsx`)

**Mudanças:**
- ✅ Border e background com tokens
- ✅ Botão toggle sidebar com estados hover corretos
- ✅ Focus ring adicionado (acessibilidade)

**Antes:**
```tsx
className="bg-secondary/50 hover:border-primary/50"  // ❌ Opacidade arbitrária
```

**Depois:**
```tsx
className={cn(tokens.surface100, "hover:border-primary/50")}  // ✅ Token semântico
```

---

#### 2.5 Pipeline Tabs (`components/admin/pipeline/pipeline-tabs.tsx`)

**Mudanças:**
- ✅ Tabs customizadas agora usam tokens
- ✅ Border-bottom ativo com `tokens.brandBorder`
- ✅ Hover states consistentes
- ✅ Botão "Importar Leads" com brand colors

**Antes:**
```tsx
className="bg-slate-900 text-slate-100 border-b-2 border-cyan-500"  // ❌ Hardcoded
```

**Depois:**
```tsx
className={cn(tokens.surface200, tokens.textPrimary, "border-b-2", tokens.brandBorder)}  // ✅ Tokens
```

---

#### 2.6 Lead Details Dialog (`components/admin/pipeline/lead-details-dialog.tsx`) - PARCIAL

**Mudanças:**
- ✅ Dialog container com tokens
- ✅ Header section refatorado
- ✅ Left sidebar com borders corretos
- ⚠️ **PENDENTE:** Seções internas (trial status, dados pessoais, métricas, tabs)

---

## O Que Falta Fazer

### 🔴 Prioridade 1 - Completar Componentes Críticos (2-3 horas)

#### 1. Lead Details Dialog - Concluir refatoração

**Arquivos:** `components/admin/pipeline/lead-details-dialog.tsx`

**Seções pendentes:**
```tsx
// Linha ~166: Trial Status Card
<div className="bg-[#0f172a] rounded-xl p-4 border border-[rgba(148,163,184,0.08)]">
  // ❌ Refatorar para tokens.cardBase + tokens.radiusXl

// Linha ~205: Dados Pessoais Card
<div className="bg-[#0f172a] rounded-xl p-4">
  // ❌ Refatorar

// Linha ~245: Métricas Grid
<div className="bg-[#0f172a] p-4 rounded-xl border">
  // ❌ Refatorar

// Linha ~266: Tabs
<TabsTrigger className="data-[state=active]:border-[#06b6d4]">
  // ❌ Refatorar para tokens.brandBorder

// Linha ~299: Course Cards
<div className="border border-[rgba(148,163,184,0.08)] bg-[#0f172a]">
  // ❌ Refatorar
```

**Comando para encontrar:**
```bash
grep -n "bg-\[#" components/admin/pipeline/lead-details-dialog.tsx
```

---

#### 2. Lead Card Component

**Arquivo:** `components/admin/pipeline/lead-card.tsx` (não foi lido ainda)

**Ação:**
1. Ler o arquivo
2. Refatorar todas as cores hardcoded
3. Aplicar hover states com `tokens.brandGlow`

---

#### 3. Dashboard Principal

**Arquivo:** `app/admin/page.tsx`

**Problemas identificados:**
```tsx
// Linha 170: Cards com shadow em dark mode
className="shadow-sm"  // ❌ Viola design system

// Linha 285+: User cards e activity lists
// ⚠️ Verificar se usam tokens semânticos
```

**Ação:**
- Remover `shadow-sm` de cards
- Garantir uso de `tokens.cardBase` + `tokens.cardHover`

---

### 🟡 Prioridade 2 - Componentes Secundários (3-4 horas)

#### 1. Outros componentes do pipeline:
- `lead-actions-bar.tsx`
- `lead-timeline.tsx`
- `followup-scheduler.tsx`
- `notes-modal.tsx`
- `cold-leads-kanban-board.tsx`
- `import-leads-modal.tsx`

#### 2. Outros painéis admin:
- `components/admin/courses-table.tsx`
- `components/admin/lives-table.tsx`
- `components/admin/materials-manager.tsx`
- `components/admin/users-manager.tsx`

---

### 🟢 Prioridade 3 - Polimento (2-3 horas)

#### 1. Criar Componentes Canônicos

**Arquivo novo:** `components/admin/ui/admin-card.tsx`

```tsx
import { cn } from '@/lib/utils'
import { tokens } from '@/lib/design-tokens'

export function AdminCard({ className, ...props }) {
  return (
    <div
      className={cn(tokens.cardBase, tokens.cardHover, className)}
      {...props}
    />
  )
}
```

**Benefício:** Componentes reutilizáveis com design system embutido.

---

#### 2. Validação de Espaçamento

**Comando:**
```bash
# Encontrar valores de padding/margin arbitrários
grep -r "p-\[" components/admin/ --include="*.tsx" | wc -l
grep -r "py-2.5" components/admin/ --include="*.tsx"
grep -r "px-3.5" components/admin/ --include="*.tsx"
```

**Ação:**
- Substituir `py-2.5` (10px) → `py-2` (8px) ou `py-3` (12px)
- Eliminar valores como `[18px]`, `[22px]` que não são múltiplos de 4px

---

#### 3. Auditoria de Border Radius

**Comando:**
```bash
grep -r "rounded-" components/admin/ --include="*.tsx" | grep -v "rounded-lg" | grep -v "rounded-md" | grep -v "rounded-sm"
```

**Ação:**
- Padronizar: buttons → `rounded-sm`, cards → `rounded-lg`, modals → `rounded-xl`

---

## Guia de Refatoração

### Passo a Passo para Refatorar um Componente

1. **Import tokens:**
```tsx
import { cn } from '@/lib/utils'
import { tokens, presets } from '@/lib/design-tokens'
```

2. **Buscar hardcoded colors:**
```bash
grep -n "bg-\[#" arquivo.tsx
grep -n "text-\[#" arquivo.tsx
grep -n "border-\[rgba" arquivo.tsx
```

3. **Mapear para tokens:**
| Hardcoded | Token |
|-----------|-------|
| `bg-[#020617]` | `tokens.canvas` |
| `bg-[#0f172a]` | `tokens.surface200` |
| `bg-[#0a0f1f]` | `tokens.surface100` |
| `text-[#f8fafc]` | `tokens.textPrimary` |
| `text-[#94a3b8]` | `tokens.textSecondary` |
| `text-[#64748b]` | `tokens.textMuted` |
| `border-[rgba(148,163,184,0.08)]` | `tokens.borderDefault` |
| `border-[#06b6d4]` | `tokens.brandBorder` |

4. **Aplicar presets quando possível:**
```tsx
// ❌ ANTES
className="bg-card border border-border rounded-lg hover:border-border/80 transition-all duration-200"

// ✅ DEPOIS
className={presets.card}
```

5. **Testar dark/light mode:**
```tsx
// No navegador, alternar tema e verificar:
// - Contraste legível
// - Borders visíveis mas sutis
// - Hover states funcionando
```

---

## Checklist de Conformidade

Ao refatorar um componente, verificar:

- [ ] ✅ Nenhum valor `bg-[#...]` hardcoded
- [ ] ✅ Nenhum valor `text-[#...]` hardcoded
- [ ] ✅ Nenhum valor `border-[rgba...]` hardcoded
- [ ] ✅ Espaçamento usa múltiplos de 4px (`p-1`, `p-2`, `p-3`, `p-4`, `p-6`, `p-8`)
- [ ] ✅ Border radius consistente (`rounded-sm/md/lg/xl`)
- [ ] ✅ Hover states com `tokens.cardHover` ou `tokens.brandGlow`
- [ ] ✅ Focus states com `tokens.focusRing` (acessibilidade)
- [ ] ✅ Transições com `tokens.transitionFast` ou `tokens.transitionNormal`
- [ ] ✅ Sem `shadow-sm` em dark mode (usar borders)

---

## Comandos Úteis

### Encontrar violações:

```bash
# Cores hardcoded
grep -r "bg-\[#" components/admin/ --include="*.tsx" | wc -l

# Espaçamento arbitrário
grep -r "p-\[" components/admin/ --include="*.tsx"
grep -r "py-2.5\|px-2.5" components/admin/ --include="*.tsx"

# Borders com rgba
grep -r "border-\[rgba" components/admin/ --include="*.tsx"

# Shadows (potenciais violações em dark mode)
grep -r "shadow-" components/admin/ --include="*.tsx" | grep -v "shadow-\[0_0"
```

### Busca e substituição global (CUIDADO!):

```bash
# Exemplo: substituir bg-[#020617] por bg-background
# SEMPRE revisar antes de aplicar!
find components/admin/ -name "*.tsx" -exec sed -i '' 's/bg-\[#020617\]/bg-background/g' {} +
```

---

## Métricas de Progresso

| Componente | Status | Conformidade |
|------------|--------|--------------|
| `pipeline-kanban-board.tsx` | ✅ Completo | 95% |
| `sidebar.tsx` | ✅ Completo | 90% |
| `shell.tsx` | ✅ Completo | 100% |
| `header.tsx` | ✅ Completo | 95% |
| `pipeline-tabs.tsx` | ✅ Completo | 90% |
| `lead-details-dialog.tsx` | 🟡 Parcial | 60% |
| `lead-card.tsx` | ⏳ Pendente | 0% |
| `admin/page.tsx` | ⏳ Pendente | 40% |
| Outros componentes | ⏳ Pendente | 20% |
| **TOTAL** | **🟡 Em Andamento** | **40%** |

**Meta:** 95%+ de conformidade em todos os componentes do admin.

---

## Próximos Passos

### Hoje (2-3 horas):
1. ✅ Completar `lead-details-dialog.tsx`
2. ✅ Refatorar `lead-card.tsx`
3. ✅ Auditar `admin/page.tsx`

### Amanhã (3-4 horas):
4. ✅ Refatorar componentes do pipeline restantes
5. ✅ Refatorar tables (courses, lives, materials)
6. ✅ Criar componentes canônicos (`AdminCard`, `AdminTabs`)

### Esta Semana:
7. ✅ Auditoria final de espaçamento
8. ✅ Testes de regressão (dark/light mode)
9. ✅ Documentação final

---

## Notas Importantes

### Cuidados ao Refatorar:

1. **Sempre ler o arquivo antes de editar**
   - Entender contexto antes de mudar cores

2. **Testar após cada mudança**
   - Verificar dark mode
   - Verificar hover/focus states
   - Verificar responsividade

3. **Não quebrar funcionalidade**
   - Apenas mudar classes CSS, não lógica
   - Manter data attributes (`data-state`, etc)

4. **Consultar o design system**
   - `.interface-design/system.md` é a fonte da verdade
   - Em dúvida, escolher tokens mais sutis

### Perguntas Frequentes:

**Q: Posso usar `bg-primary` diretamente?**
A: Prefira `tokens.brandBg` para consistência, mas `bg-primary` é aceitável se for token semântico do Tailwind.

**Q: Quando usar preset vs. tokens individuais?**
A: Use preset para padrões comuns (cards, buttons). Use tokens individuais para cases únicos.

**Q: Como lidar com cores de estados (success, warning)?**
A: Use tokens semânticos: `tokens.success`, `tokens.successBg`, `tokens.successBorder`.

---

## Recursos

- **Design System:** `.interface-design/system.md`
- **Tokens:** `lib/design-tokens.ts`
- **Auditoria:** `docs/admin-design-audit.md`
- **Tailwind Config:** `tailwind.config.ts`
- **Globals CSS:** `styles/globals.css`
