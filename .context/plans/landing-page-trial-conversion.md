---
status: ready
generated: 2026-01-27
agents:
  - type: "frontend-specialist"
    role: "Implementar alterações de UI/UX com foco mobile-first"
  - type: "code-reviewer"
    role: "Revisar mudanças garantindo consistência com design system"
docs:
  - "project-overview.md"
  - "tooling.md"
phases:
  - id: "phase-1"
    name: "Remoção de Preços e CTAs Trial"
    prevc: "E"
  - id: "phase-2"
    name: "Foco Agentes GPT + Vision"
    prevc: "E"
  - id: "phase-3"
    name: "Seção Roniery + Mobile UX"
    prevc: "E"
  - id: "phase-4"
    name: "Validação Visual"
    prevc: "V"
---

# Landing Page - Conversão Trial

> Atualizar landing page focando em conversão para trial: remover preços, destacar Odonto GPT (base de conhecimento) e Odonto Vision (análise/laudo), marcar outros agentes como "em breve", atualizar frase do Roniery e garantir UX mobile-first.

## Task Snapshot

- **Primary goal:** Converter visitantes em usuários trial, removendo fricção de preço e destacando valor dos agentes principais.
- **Success signal:** Landing page sem seção de preços, CTAs claros para trial, agentes secundários como "em breve", UX mobile otimizada.
- **Key references:**
  - [Frontend Design Skill](./../skills/frontend-design.md) - Design system oficial
  - [Landing Page](../../app/page.tsx) - Página principal
  - [Componentes Landing](../../components/landing/) - Componentes reutilizáveis

## Codebase Context

### Arquivos a Modificar

| Arquivo | Linhas | Alteração |
| --- | --- | --- |
| `app/page.tsx` | 802-963 | Remover seção `#planos` (pricing) |
| `app/page.tsx` | 719-800 | Atualizar seção Roniery |
| `components/landing/specialists-grid.tsx` | 7-62 | Marcar agentes como "Em Breve" |
| `components/landing/ai-vision-section.tsx` | 52-68 | Ajustar copy para laudo |
| `components/landing/agent-demo-gpt.tsx` | 61-69 | Enfatizar base científica |

### Restrições de Design

- **NÃO usar** degradê azul→roxo
- **NÃO modificar** ícones dos agentes
- **USAR** cores do design system: Cyan (#0891b2, #06b6d4)
- **PRIORIZAR** mobile-first (seguir /interface-design)

## Agent Lineup

| Agent | Role | Foco |
| --- | --- | --- |
| Frontend Specialist | Implementação | UI/UX, responsividade mobile |
| Code Reviewer | Validação | Aderência ao design system |

---

## Working Phases

### Phase 1 — Remoção de Preços e CTAs Trial

**Objetivo:** Eliminar seção de pricing e focar em conversão trial.

**Arquivo:** `app/page.tsx`

**Steps:**

1. **Remover seção `#planos`** (linhas 802-963)
   - Deletar completamente os cards de pricing
   - Remover imports não utilizados (Lock, etc)

2. **Atualizar CTAs** em toda a página:
   - Manter texto "Testar Grátis Agora"
   - Garantir todos apontam para `/register`

3. **Ajustar CTA Footer** (linhas 968-1001):
   - Manter copy focada em trial
   - Texto: "Teste grátis por 7 dias. Sem compromisso."

**Commit:** `refactor(landing): remove pricing section for trial focus`

---

### Phase 2 — Foco nos Agentes Principais (GPT + Vision)

**Objetivo:** Destacar Odonto GPT e Vision, outros como "em breve".

#### 2.1 Atualizar `specialists-grid.tsx`

**Modificar array `specialists`:**

```tsx
const specialists = [
  {
    icon: Brain,
    title: "Odonto GPT",
    desc: "Base de conhecimento com livros e artigos científicos. Seu consultor 24/7.",
    color: "text-cyan-400",
    isActive: true,
    badge: null,
  },
  {
    icon: Eye,
    title: "Odonto Vision",
    desc: "Analisa radiografias e imagens clínicas. Gera laudos automáticos.",
    color: "text-purple-400",
    isActive: true,
    badge: null,
  },
  // Demais agentes:
  {
    icon: BookOpen,
    title: "Pesquisador",
    desc: "Busca na literatura científica (PubMed, Scielo).",
    isActive: false,
    badge: "Em Breve",
  },
  // ... outros com isActive: false
]
```

**Renderização condicional:**
- `isActive: true` → estilo normal
- `isActive: false` → opacity-50, badge "Em Breve"

#### 2.2 Atualizar `ai-vision-section.tsx`

**Copy principal (linhas 52-68):**

```tsx
<h2>
  Analisa e Lauda <span className="...">Radiografias</span>
</h2>
<p>
  Envie radiografias odontológicas e receba laudos automáticos
  com sugestões diagnósticas baseadas em IA.
</p>
<p className="font-medium ...">
  Já imaginou enviar uma radiografia e a IA laudar para você?
</p>
```

#### 2.3 Atualizar `agent-demo-gpt.tsx`

**Copy (linhas 61-69):**

```tsx
<p className="text-lg text-slate-300">
  Respostas baseadas em <strong>livros e artigos científicos</strong>.
  Seu consultor versátil para dúvidas do dia a dia.
</p>
```

**Features list:**
- "Base de conhecimento científica atualizada"
- "Citações de literatura confiável"
- "Disponível 24/7"

**Commit:** `feat(landing): highlight GPT and Vision, mark others as coming soon`

---

### Phase 3 — Seção Roniery + Mobile UX

**Objetivo:** Atualizar copy do Roniery e otimizar mobile.

#### 3.1 Seção Roniery (`app/page.tsx` linhas 719-800)

**REMOVER frase (linhas 766-769):**
```tsx
// REMOVER COMPLETAMENTE:
"Criei a Odonto GPT para ser o consultor que eu gostaria de ter tido
durante minha formação - acessível 24/7, sem julgamentos, e com
respostas fundamentadas na literatura que realmente importa."
```

**MANTER e DESTACAR (linhas 791-795):**
```tsx
// MOVER PARA POSIÇÃO PRINCIPAL:
<p className="text-lg font-medium text-slate-200 leading-relaxed">
  <span className="text-6xl absolute -top-6 -left-4 text-[#2399B4]/20">"</span>
  Cada resposta que você recebe passa pela minha curadoria técnica,
  garantindo que esteja sempre alinhada com as melhores práticas
  da odontologia moderna.
</p>
```

#### 3.2 Mobile UX Checklist

Seguindo `/interface-design` skill:

- [ ] Touch targets mínimo 44px
- [ ] Sticky CTA mobile visível após scroll do hero
- [ ] Espaçamento adequado (py-16 mobile, py-32 desktop)
- [ ] Tipografia legível (min 16px body)
- [ ] Cards com padding suficiente em mobile
- [ ] Botões full-width em mobile (`w-full sm:w-auto`)

**Commit:** `fix(landing): update Roniery copy, improve mobile UX`

---

### Phase 4 — Validação Visual

**Objetivo:** Garantir consistência e funcionamento.

**Checklist:**

1. **Responsividade**
   - [ ] 320px (iPhone SE)
   - [ ] 375px (iPhone 12)
   - [ ] 768px (iPad)
   - [ ] 1024px+ (Desktop)

2. **Design System**
   - [ ] Cores: apenas cyan/teal (#0891b2, #06b6d4)
   - [ ] SEM gradiente azul→roxo
   - [ ] Ícones originais mantidos

3. **Navegação**
   - [ ] CTAs → `/register`
   - [ ] Âncoras funcionando (#como-funciona)
   - [ ] Sticky CTA mobile

4. **Performance**
   - [ ] Lighthouse > 90

**Commit:** `test(landing): validate visual consistency`

---

## Resumo das Alterações

### Remover
- [ ] Seção `#planos` (linhas 802-963)
- [ ] Frase longa Roniery sobre criação
- [ ] Gradientes azul→roxo (se existirem)

### Modificar
- [ ] CTAs para trial
- [ ] Copy Odonto GPT → base de conhecimento
- [ ] Copy Odonto Vision → análise e laudo
- [ ] 4 agentes → badge "Em Breve"
- [ ] Frase Roniery → apenas curadoria técnica

### Manter
- [ ] Ícones dos agentes
- [ ] Estrutura geral
- [ ] Design system (cores cyan/teal)

---

## Rollback Plan

- **Trigger:** Bugs visuais críticos
- **Action:** `git revert` dos commits
- **Time:** < 30 min

## Evidence

- [ ] Screenshots antes/depois
- [ ] Link do PR
- [ ] Teste em dispositivo real
