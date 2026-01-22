---
status: pending
progress: 100
generated: 2026-01-22
priority: high
agents:
  - type: "frontend-specialist"
    role: "Implementar interface Netflix-style com animações e transições"
  - type: "architect-specialist"
    role: "Integrar com sistema de cursos existente e garantir consistência"
  - type: "code-reviewer"
    role: "Revisar qualidade do código e padrões de design"
lastUpdated: "2026-01-22T19:00:05.191Z"
---

# OdontoFlix - Sistema de Cursos Estilo Netflix

## 📋 Resumo Executivo

Criar uma experiência premium de navegação de cursos inspirada na Netflix, chamada **OdontoFlix**, que substituirá a aba atual de cursos. A página será acessível em `http://localhost:3000/newdashboard/odontoflix` e se integrará perfeitamente ao sistema de administração de cursos existente.

### Objetivos Principais
- ✅ Criar interface visual premium estilo Netflix
- ✅ Integrar com sistema de cursos existente (Supabase)
- ✅ Implementar navegação por categorias e carrosséis
- ✅ Adicionar animações e transições fluidas
- ✅ Manter compatibilidade com sistema de progresso do usuário
- ✅ Substituir rota `/newdashboard/cursos` por `/newdashboard/odontoflix`

## 🎯 Escopo e Metas

### O que SERÁ implementado
1. **Nova Página OdontoFlix** (`/newdashboard/odontoflix`)
   - Hero section com curso em destaque
   - Carrosséis horizontais por categoria
   - Hover effects com preview expandido
   - Indicadores de progresso visual
   - Badges de status (Novo, Em Breve, Concluído)

2. **Componentes Reutilizáveis**
   - `OdontoFlixHero`: Banner principal com curso destaque
   - `CourseCarouselRow`: Carrossel horizontal de cursos
   - `CourseCard`: Card individual estilo Netflix
   - `CategoryFilter`: Filtro de categorias/áreas

3. **Integrações**
   - Conexão com tabela `courses` do Supabase
   - Sincronização com `user_courses` para progresso
   - Suporte a `live_events` para lives agendadas
   - Integração com sistema de thumbnails existente

4. **Funcionalidades**
   - Navegação por categorias (Ortodontia, Implantodontia, etc.)
   - Busca e filtros avançados
   - Indicadores de progresso em tempo real
   - Transições suaves entre estados
   - Responsividade completa

### O que NÃO será implementado (nesta fase)
- Sistema de recomendações por IA
- Player de vídeo inline (mantém navegação para página de curso)
- Download de cursos offline
- Sistema de avaliações e comentários

## 📐 Arquitetura e Design

### Estrutura de Arquivos
```
app/
  newdashboard/
    odontoflix/
      page.tsx              # Página principal
      loading.tsx           # Loading state
      
components/
  odontoflix/
    hero-section.tsx        # Hero banner com curso destaque
    course-carousel-row.tsx # Carrossel horizontal
    course-card.tsx         # Card individual Netflix-style
    category-filter.tsx     # Filtro de categorias
    progress-indicator.tsx  # Indicador de progresso visual
    
lib/
  odontoflix/
    helpers.ts              # Funções auxiliares
    types.ts                # TypeScript types
```

### Fluxo de Dados
```
Supabase (courses, user_courses, live_events)
    ↓
Server Component (page.tsx)
    ↓
Fetch de dados com joins otimizados
    ↓
Componentes Client (carrosséis, cards)
    ↓
Renderização com animações
```

### Design System
- **Cores**: Gradientes escuros (slate-950, slate-900) + acentos cyan/emerald
- **Tipografia**: Font-bold para títulos, font-medium para metadados
- **Espaçamento**: Sistema de grid 4px base (p-4, p-6, p-8)
- **Animações**: Transições 300-500ms com easing suave
- **Hover Effects**: Scale 1.05, translate-y-1, shadow-xl

## 🔄 Fases de Implementação

### **Fase 1: Preparação e Estrutura** (PLAN)
**Objetivo**: Configurar estrutura base e tipos

**Passos**:
1. Criar estrutura de diretórios
   ```bash
   mkdir -p app/newdashboard/odontoflix
   mkdir -p components/odontoflix
   mkdir -p lib/odontoflix
   ```

2. Definir tipos TypeScript em `lib/odontoflix/types.ts`
   ```typescript
   export type OdontoFlixCourse = {
     id: string
     title: string
     description: string
     thumbnail_url: string
     area: string
     difficulty: string
     lessons_count: number
     duration_minutes: number
     progress: number
     is_published: boolean
     coming_soon: boolean
     available_at: string | null
   }
   
   export type CategoryRow = {
     title: string
     courses: OdontoFlixCourse[]
     priority: number
   }
   ```

3. Criar helpers em `lib/odontoflix/helpers.ts`
   - `groupCoursesByCategory()`
   - `calculateProgress()`
   - `formatDuration()`
   - `getProgressColor()`

**Agentes**: `architect-specialist`, `frontend-specialist`

**Critérios de Sucesso**:
- ✅ Estrutura de pastas criada
- ✅ Tipos TypeScript definidos
- ✅ Helpers implementados e testados

---

### **Fase 2: Componentes Base** (REVIEW → EXECUTE)
**Objetivo**: Implementar componentes reutilizáveis

**Passos**:
1. **CourseCard Component** (`components/odontoflix/course-card.tsx`)
   - Card com aspect ratio 16:9
   - Thumbnail com gradiente overlay
   - Hover effect com scale e shadow
   - Badge de status (Novo, Em Breve, Concluído)
   - Progress bar na parte inferior
   - Metadados (aulas, duração)

2. **CourseCarouselRow Component** (`components/odontoflix/course-carousel-row.tsx`)
   - Scroll horizontal suave
   - Botões de navegação esquerda/direita
   - Snap scroll para alinhamento
   - Lazy loading de cards
   - Título da categoria

3. **HeroSection Component** (`components/odontoflix/hero-section.tsx`)
   - Banner full-width com gradiente
   - Curso em destaque com descrição
   - CTA "Continuar Assistindo" ou "Começar Agora"
   - Background com thumbnail do curso
   - Overlay escuro para legibilidade

4. **CategoryFilter Component** (`components/odontoflix/category-filter.tsx`)
   - Pills horizontais para categorias
   - Estado ativo/inativo
   - Scroll horizontal em mobile
   - Filtro "Todos", "Ortodontia", "Implantodontia", etc.

**Agentes**: `frontend-specialist`, `code-reviewer`

**Critérios de Sucesso**:
- ✅ Todos os componentes renderizam corretamente
- ✅ Animações suaves e responsivas
- ✅ Acessibilidade (ARIA labels, keyboard navigation)
- ✅ TypeScript sem erros

---

### **Fase 3: Página Principal** (EXECUTE)
**Objetivo**: Integrar componentes e conectar com dados

**Passos**:
1. **Criar `app/newdashboard/odontoflix/page.tsx`**
   ```typescript
   export default async function OdontoFlixPage() {
     const supabase = await createClient()
     const { data: { user } } = await supabase.auth.getUser()
     
     // Fetch courses com progresso do usuário
     const { data: courses } = await supabase
       .from('courses')
       .select(`
         *,
         user_courses!left(progress, user_id)
       `)
       .eq('is_published', true)
       .order('created_at', { ascending: false })
     
     // Agrupar por categoria
     const categories = groupCoursesByCategory(courses)
     
     // Curso em destaque (último acessado ou novo)
     const featuredCourse = getFeaturedCourse(courses, user.id)
     
     return (
       <div className="min-h-screen bg-slate-950">
         <HeroSection course={featuredCourse} />
         
         <div className="space-y-8 px-4 py-8">
           {categories.map(category => (
             <CourseCarouselRow
               key={category.title}
               title={category.title}
               courses={category.courses}
             />
           ))}
         </div>
       </div>
     )
   }
   ```

2. **Criar `app/newdashboard/odontoflix/loading.tsx`**
   - Skeleton loaders para hero e carrosséis
   - Animação de pulse

3. **Atualizar Sidebar** (`components/newdashboard/sidebar.tsx`)
   - Mudar rota de `/newdashboard/cursos` para `/newdashboard/odontoflix`
   - Atualizar label para "OdontoFlix"
   - Adicionar ícone especial (Clapperboard ou Film)

**Agentes**: `frontend-specialist`, `architect-specialist`

**Critérios de Sucesso**:
- ✅ Página carrega dados corretamente
- ✅ Categorias agrupadas e ordenadas
- ✅ Hero section exibe curso relevante
- ✅ Loading states funcionam
- ✅ Navegação atualizada

---

### **Fase 4: Refinamentos e Otimizações** (VERIFY)
**Objetivo**: Polir experiência e performance

**Passos**:
1. **Otimizações de Performance**
   - Lazy loading de imagens com Next.js Image
   - Prefetch de rotas de cursos
   - Memoização de cálculos pesados
   - Debounce em filtros

2. **Animações Avançadas**
   - Framer Motion para transições suaves
   - Stagger animation nos cards
   - Parallax no hero section
   - Micro-interações em hover

3. **Acessibilidade**
   - ARIA labels em todos os elementos interativos
   - Navegação por teclado (Tab, Enter, Arrows)
   - Focus visible com ring-2
   - Screen reader friendly

4. **Responsividade**
   - Mobile: 1 card visível, scroll horizontal
   - Tablet: 2-3 cards visíveis
   - Desktop: 4-5 cards visíveis
   - 4K: 6+ cards visíveis

**Agentes**: `frontend-specialist`, `performance-optimizer`, `code-reviewer`

**Critérios de Sucesso**:
- ✅ Lighthouse score > 90 (Performance, Accessibility)
- ✅ Sem layout shifts (CLS < 0.1)
- ✅ Animações a 60fps
- ✅ Funciona em todos os breakpoints

---

### **Fase 5: Testes e Validação** (VERIFY → COMPLETE)
**Objetivo**: Garantir qualidade e integração

**Passos**:
1. **Testes Manuais**
   - Testar todos os fluxos de navegação
   - Verificar estados de loading
   - Testar com diferentes quantidades de cursos
   - Validar progresso do usuário

2. **Testes de Integração**
   - Verificar conexão com Supabase
   - Testar atualização de progresso
   - Validar filtros e categorias
   - Confirmar redirecionamentos

3. **Testes de Regressão**
   - Garantir que `/dashboard/cursos` ainda funciona
   - Verificar admin de cursos não foi afetado
   - Testar sistema de lives
   - Validar materiais de curso

4. **Documentação**
   - Atualizar README com nova rota
   - Documentar componentes OdontoFlix
   - Criar guia de estilo visual
   - Adicionar screenshots

**Agentes**: `test-writer`, `code-reviewer`, `documentation-writer`

**Critérios de Sucesso**:
- ✅ Todos os testes passam
- ✅ Sem erros no console
- ✅ Documentação completa
- ✅ Aprovação de stakeholders

## 🔗 Integrações com Sistema Existente

### Tabelas Supabase Utilizadas
1. **courses**
   - `id`, `title`, `description`, `thumbnail_url`
   - `area`, `difficulty`, `lessons_count`, `duration_minutes`
   - `is_published`, `coming_soon`, `available_at`

2. **user_courses**
   - `user_id`, `course_id`, `progress`
   - `last_accessed_at`, `completed_at`

3. **live_events**
   - `id`, `title`, `thumbnail_url`, `start_at`
   - `status`, `duration_minutes`

### APIs Reutilizadas
- `app/actions/courses.ts` - CRUD de cursos
- `app/api/courses/lessons/complete` - Marcar aula como completa
- `lib/supabase/server.ts` - Cliente Supabase

### Componentes Reutilizados
- `CourseThumbnail` - Thumbnails otimizados
- `Badge` - Badges de status
- `Card` - Base de cards
- `DashboardScrollArea` - Scroll customizado

## 🎨 Especificações de Design

### Paleta de Cores
```css
/* Backgrounds */
--bg-primary: #020617 (slate-950)
--bg-secondary: #0f172a (slate-900)
--bg-card: rgba(15, 23, 42, 0.4) (slate-900/40)

/* Acentos */
--accent-primary: #06b6d4 (cyan-500)
--accent-secondary: #10b981 (emerald-500)
--accent-warning: #f59e0b (amber-500)

/* Texto */
--text-primary: #ffffff
--text-secondary: #94a3b8 (slate-400)
--text-muted: #64748b (slate-500)
```

### Tipografia
```css
/* Títulos */
h1: text-4xl font-bold (36px)
h2: text-2xl font-bold (24px)
h3: text-lg font-bold (18px)

/* Corpo */
body: text-sm font-medium (14px)
caption: text-xs font-medium (12px)
```

### Espaçamentos
```css
/* Containers */
padding-x: 1rem (mobile), 2rem (desktop)
padding-y: 1.5rem (mobile), 2rem (desktop)

/* Cards */
gap: 1rem (mobile), 1.5rem (desktop)
padding: 1.25rem
```

### Animações
```css
/* Transições */
transition: all 300ms ease-out
hover-scale: scale(1.05)
hover-translate: translateY(-4px)

/* Durações */
fast: 200ms
normal: 300ms
slow: 500ms
```

## 📊 Métricas de Sucesso

### Performance
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Cumulative Layout Shift < 0.1
- ✅ Largest Contentful Paint < 2.5s

### Usabilidade
- ✅ Taxa de clique em cursos > 40%
- ✅ Tempo médio na página > 2min
- ✅ Taxa de conclusão de cursos aumenta 20%
- ✅ NPS (Net Promoter Score) > 8/10

### Técnicas
- ✅ Zero erros TypeScript
- ✅ 100% componentes com PropTypes
- ✅ Cobertura de testes > 80%
- ✅ Lighthouse score > 90

## 🚨 Riscos e Mitigações

### Risco 1: Performance com muitos cursos
**Impacto**: Alto  
**Probabilidade**: Média  
**Mitigação**:
- Implementar virtualização de listas
- Lazy loading de imagens
- Paginação server-side
- Cache de queries

### Risco 2: Incompatibilidade com sistema antigo
**Impacto**: Alto  
**Probabilidade**: Baixa  
**Mitigação**:
- Manter rota `/dashboard/cursos` funcionando
- Testes de regressão extensivos
- Deploy gradual (feature flag)
- Rollback plan documentado

### Risco 3: Animações causando jank
**Impacto**: Médio  
**Probabilidade**: Média  
**Mitigação**:
- Usar `will-change` com cuidado
- Preferir `transform` e `opacity`
- Throttle/debounce de eventos
- Testes em dispositivos low-end

## 📝 Rollback Plan

### Triggers de Rollback
- Erros críticos afetando > 10% dos usuários
- Performance degradada (LCP > 5s)
- Bugs de integração com admin
- Feedback negativo massivo

### Procedimento de Rollback
1. **Fase 1** (< 5min)
   - Reverter mudança na sidebar
   - Redirecionar `/newdashboard/odontoflix` → `/newdashboard/cursos`

2. **Fase 2** (< 30min)
   - Reverter commits da feature
   - Rebuild e redeploy
   - Validar rollback em staging

3. **Fase 3** (< 1h)
   - Comunicar usuários
   - Post-mortem da falha
   - Planejar correções

## 📚 Documentação e Recursos

### Documentação a Criar
- [ ] README da feature OdontoFlix
- [ ] Guia de componentes (Storybook)
- [ ] API documentation (JSDoc)
- [ ] Guia de contribuição

### Recursos Externos
- [Netflix UI Clone Tutorial](https://www.youtube.com/watch?v=example)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Next.js Image Optimization](https://nextjs.org/docs/api-reference/next/image)
- [Supabase Joins](https://supabase.com/docs/guides/database/joins)

## ✅ Checklist de Conclusão

### Desenvolvimento
- [ ] Todos os componentes implementados
- [ ] Integração com Supabase funcionando
- [ ] Animações suaves e performáticas
- [ ] Responsividade em todos os breakpoints
- [ ] Acessibilidade validada

### Qualidade
- [ ] Zero erros TypeScript
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Code review aprovado
- [ ] Lighthouse score > 90

### Deploy
- [ ] Build de produção sem erros
- [ ] Testes em staging aprovados
- [ ] Documentação atualizada
- [ ] Rollback plan testado
- [ ] Stakeholders aprovaram

---

**Status Atual**: 🟡 Pendente  
**Última Atualização**: 2026-01-22  
**Próxima Ação**: Iniciar Fase 1 - Preparação e Estrutura

## Execution History

> Last updated: 2026-01-22T19:00:05.191Z | Progress: 100%

### E [DONE]
- Started: 2026-01-22T19:00:04.858Z
- Completed: 2026-01-22T19:00:05.191Z

- [x] Step 1: Step 1 *(2026-01-22T19:00:04.858Z)*
- [x] Step 2: Step 2 *(2026-01-22T19:00:05.067Z)*
- [x] Step 3: Step 3 *(2026-01-22T19:00:05.191Z)*

### P [DONE]
- Started: 2026-01-22T18:57:03.216Z
- Completed: 2026-01-22T18:57:03.216Z

- [x] Step 1: Step 1 *(2026-01-22T18:57:03.216Z)*
