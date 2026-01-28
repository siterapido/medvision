# Roadmap de Implementação - Odonto GPT

## Visão Geral

Este documento define a estratégia de implementação faseada do sistema de artefatos do Odonto GPT, com marcos, decisões técnicas críticas e estimativas de esforço.

---

## Fases de Implementação

### Fase 0: Fundações (1-2 semanas)

**Objetivo**: Estabelecer infraestrutura base e escolhas técnicas fundamentais.

#### Tarefas
- [ ] Setup inicial do projeto Next.js 14
- [ ] Configuração do Prisma + PostgreSQL
- [ ] Setup de autenticação (NextAuth.js ou Clerk)
- [ ] Instalação e configuração de providers de AI
- [ ] Design system base (shadcn/ui + Tailwind)
- [ ] Estrutura de diretórios padronizada
- [ ] CI/CD básico (Vercel)

#### Entregáveis
- Projeto rodando localmente
- Database schema inicial
- Auth funcionando
- Primeira chamada de AI bem-sucedida
- UI kit básico

**Esforço Estimado**: 80-100 horas  
**Equipe Sugerida**: 2 desenvolvedores full-stack

---

### Fase 1: MVP - 2 Artefatos Piloto (3-4 semanas)

**Objetivo**: Validar arquitetura com implementação completa de 2 tipos de artefatos.

#### Artefatos Escolhidos
1. **Flashcards** - Complexidade média, valor imediato
2. **Resumos** - Input simples, útil para estudos

#### Tarefas

**Flashcards**
- [ ] Schema de dados (Prisma model)
- [ ] Formulário de criação
- [ ] Integração com GPT-4o
- [ ] Componente de visualização (flip card)
- [ ] Sistema de spaced repetition básico
- [ ] Export para Anki

**Resumos**
- [ ] Upload de PDF/texto
- [ ] Integração com Gemini 1.5 Pro
- [ ] Parser de markdown estruturado
- [ ] Componente colapsável de seções
- [ ] Export para Markdown/PDF

**Infraestrutura Compartilhada**
- [ ] Sistema de tipos TypeScript
- [ ] Schemas de validação (Zod)
- [ ] Wrapper genérico de AI
- [ ] Template system para prompts
- [ ] Error handling & retry logic
- [ ] Loading states & skeletons
- [ ] Toast notifications

#### Entregáveis
- 2 artefatos funcionais end-to-end
- Biblioteca listando artefatos criados
- Sistema de geração robusto
- UX responsiva e polida

**Esforço Estimado**: 150-200 horas  
**Equipe Sugerida**: 2-3 desenvolvedores

---

### Fase 2: Expansão - Mais 2 Artefatos (2-3 semanas)

**Objetivo**: Adicionar artefatos com features mais complexas.

#### Artefatos
3. **Mapas Mentais** - React Flow, auto-layout
4. **Simulados/Quiz** - Interatividade, tracking de progresso

#### Tarefas

**Mapas Mentais**
- [ ] Integração com Claude Sonnet (hierarquias)
- [ ] Setup React Flow
- [ ] Auto-layout com dagre
- [ ] Edição drag-and-drop
- [ ] Export para PNG/SVG
- [ ] Temas de cores

**Simulados**
- [ ] Geração de questões (GPT-4o)
- [ ] Componente de quiz interativo
- [ ] Timer e controles
- [ ] Sistema de tentativas (QuizAttempt)
- [ ] Estatísticas e analytics
- [ ] Modo prova vs modo revisão

**Melhorias Gerais**
- [ ] Sistema de tags
- [ ] Busca full-text
- [ ] Filtros avançados na biblioteca
- [ ] Projetos (organização)

**Esforço Estimado**: 120-150 horas

---

### Fase 3: Artefatos Profissionais (3-4 semanas)

**Objetivo**: Implementar artefatos de uso clínico.

#### Artefatos
5. **Laudos & Prescrições** - Tiptap, live preview
6. **Pesquisas Científicas** - Perplexity, citações

#### Tarefas

**Laudos**
- [ ] Templates pré-definidos (10+ tipos)
- [ ] Tiptap setup com extensões
- [ ] Live preview split-view
- [ ] Autocomplete CID-10
- [ ] Upload de assinatura digital
- [ ] Print CSS otimizado
- [ ] Export PDF profissional

**Pesquisas**
- [ ] Integração Perplexity Sonar
- [ ] Parser de citações
- [ ] Componente de referências
- [ ] Sistema de evidência (badges)
- [ ] Background jobs (para pesquisas longas)
- [ ] Notificações push

**Infraestrutura**
- [ ] Queue system (Upstash/Vercel Queue)
- [ ] WebSocket para updates em tempo real
- [ ] Storage de arquivos (S3)
- [ ] Email notifications

**Esforço Estimado**: 180-220 horas

---

### Fase 4: Features Avançadas (3-4 semanas)

**Objetivo**: Refinar UX e adicionar funcionalidades de colaboração.

#### Features
- [ ] Compartilhamento público de artefatos
- [ ] Colaboração (múltiplos editores)
- [ ] Comentários e anotações
- [ ] Histórico de versões (Git-like)
- [ ] Templates customizados por usuário
- [ ] Import/Export em massa
- [ ] Integração com Notion/Obsidian
- [ ] API pública para developers

**Esforço Estimado**: 150-180 horas

---

### Fase 5: Otimizações & Scale (2-3 semanas)

**Objetivo**: Preparar para escala e otimizar performance.

#### Tarefas
- [ ] Database indexing otimizado
- [ ] Edge caching estratégico
- [ ] Image optimization (Next.js Image)
- [ ] Code splitting agressivo
- [ ] SSR onde faz sentido
- [ ] Lazy loading de componentes pesados
- [ ] Performance monitoring (Sentry, Datadog)
- [ ] Load testing
- [ ] CDN para assets estáticos

**Esforço Estimado**: 80-100 horas

---

## Decisões Técnicas Críticas

### 1. React Flow vs Mermaid.js (Mapas Mentais)

**Decisão**: React Flow ✅

**Justificativa**:
- **Prós**:
  - Interatividade total (drag-and-drop)
  - Customização ilimitada de nós
  - Comunidade ativa
  - Performance com virtualização
- **Contras**:
  - Bundle size maior (~200kb)
  - Curva de aprendizado
  - Mais código inicial

**Alternativa**: Mermaid.js
- Mais simples, menor bundle
- Mas limitado para edição interativa

**Conclusão**: A experiência de usuário superior justifica o trade-off.

---

### 2. Tiptap vs Plate vs Lexical (Editor Rico)

**Decisão**: Tiptap ✅

**Justificativa**:
- **Prós**:
  - Baseado em ProseMirror (robusto)
  - Excelente documentação
  - Ecossistema de extensões
  - TypeScript first
- **Contras**:
  - Licença comercial para algumas features
  - Menos "moderno" que Lexical

**Alternativas**:
- **Plate**: Muito completo, mas complexo demais
- **Lexical**: Mais moderno, mas menos maduro

**Conclusão**: Tiptap tem o melhor balanço maturidade/features.

---

### 3. Spaced Repetition Algorithm

**Decisão**: SM-2 Simplificado (Anki) ✅

**Implementação**:
```typescript
function calculateNextReview(
  quality: 0 | 1 | 2 | 3 | 4 | 5, // Facilidade (0-5)
  interval: number, // Dias desde última revisão
  easeFactor: number, // Fator de facilidade (>= 1.3)
  reviews: number // Número de revisões
): { nextInterval: number; newEaseFactor: number } {
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }
  
  let nextInterval: number;
  
  if (quality < 3) {
    // Resetar se resposta ruim
    nextInterval = 1;
  } else {
    if (reviews === 0) {
      nextInterval = 1;
    } else if (reviews === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(interval * newEaseFactor);
    }
  }
  
  return { nextInterval, newEaseFactor };
}
```

---

### 4. Background Jobs

**Decisão**: Upstash QStash ✅ (para Vercel) ou BullMQ (para Docker)

**Justificativa**:
- Serverless-friendly
- Retry automático
- DLQ para jobs falhados
- Simples de configurar

**Uso**:
- Pesquisas científicas longas
- Geração de PDFs complexos
- Processamento de uploads grandes

---

### 5. Real-time Updates

**Decisão**: Polling + Optimistic Updates ✅ (curto prazo)

**Para Fase 4**: WebSockets (Pusher ou Ably)

**Justificativa**:
- Polling: Simples, sem infra adicional
- Optimistic updates: UX instantânea
- WebSockets: Necessário apenas para colaboração

---

## Estimativa de Custos (AI)

### Custos por Artefato (Médias)

| Artefato | Tokens Input | Tokens Output | Custo/Geração |
|----------|--------------|---------------|---------------|
| Flashcards (20 cards) | 500 | 2,000 | $0.025 |
| Resumo (5 páginas) | 3,000 | 1,500 | $0.025 |
| Mapa Mental | 400 | 800 | $0.012 |
| Quiz (10 questões) | 600 | 3,000 | $0.032 |
| Laudo | 800 | 600 | $0.016 |
| Pesquisa | 1,000 | 6,000 | $0.065 |

### Projeção Mensal (100 usuários ativos)

- 100 usuários × 20 artefatos/mês = 2,000 gerações
- Média de $0.03/geração
- **Custo total**: ~$60/mês
- Com 1,000 usuários: ~$600/mês

**Estratégia de Contenção**:
- Prompt caching (reduz 50% input tokens)
- Limites por plano (Free: 10/mês, Pro: 100/mês)
- Batch processing para otimização

---

## Métricas de Sucesso

### KPIs Técnicos
- ✅ 95%+ uptime
- ✅ P95 latency < 3s para gerações
- ✅ 0 vulnerabilidades críticas
- ✅ 90%+ test coverage (core)

### KPIs de Produto
- ✅ 70%+ dos artefatos gerados são editados (sinal de qualidade)
- ✅ 50%+ dos usuários retornam após 7 dias
- ✅ 40%+ dos usuários criam 3+ artefatos na primeira semana
- ✅ NPS > 50

### KPIs de UX
- ✅ Tempo médio de geração percebido < 10s
- ✅ 80%+ usuários completam primeiro artefato
- ✅ < 5% taxa de erro em gerações

---

## Riscos & Mitigações

### Risco 1: Latência de AI
**Impacto**: Alto  
**Probabilidade**: Média

**Mitigação**:
- Streaming de respostas
- Loading states informativos
- Background processing para itens lentos
- Fallback para modelos mais rápidos

---

### Risco 2: Qualidade Inconsistente
**Impacto**: Alto  
**Probabilidade**: Média

**Mitigação**:
- Prompt engineering rigoroso
- Validação de outputs com schemas
- Retry logic com temperatura ajustada
- Feedback loop dos usuários
- Human-in-the-loop para casos críticos (laudos)

---

### Risco 3: Custos de AI Explodem
**Impacto**: Alto  
**Probabilidade**: Baixa

**Mitigação**:
- Monitoring de custos em tempo real
- Rate limiting por usuário
- Alertas em $100, $500, $1000
- Prompt caching agressivo
- Modelos mais baratos para tarefas simples

---

### Risco 4: React Flow Performance
**Impacto**: Médio  
**Probabilidade**: Baixa

**Mitigação**:
- Limit de 50 nós por mapa
- Virtualização de nós fora da viewport
- Debouncing de updates
- Opção de simplificar mapa

---

## Stack Final Recomendado

```yaml
Frontend:
  - Framework: Next.js 14 (App Router)
  - Language: TypeScript
  - Styling: Tailwind CSS
  - Components: shadcn/ui + Radix UI
  - Forms: React Hook Form + Zod
  - State: Zustand (local) + React Query (server)
  - Charts: Recharts
  - Rich Text: Tiptap
  - Mind Maps: React Flow
  - PDF: react-pdf + jspdf

Backend:
  - Runtime: Next.js API Routes + Server Actions
  - Database: PostgreSQL (Neon ou Supabase)
  - ORM: Prisma
  - Auth: NextAuth.js
  - File Storage: S3 (AWS ou Cloudflare R2)
  - Jobs: Upstash QStash
  - Cache: Vercel KV (Redis)

AI:
  - SDK: Vercel AI SDK
  - Providers:
    - OpenAI (GPT-4o, GPT-4 Turbo)
    - Anthropic (Claude 3.5 Sonnet)
    - Google (Gemini 1.5 Pro)
    - Perplexity (Sonar Pro)

DevOps:
  - Hosting: Vercel
  - Monitoring: Sentry
  - Analytics: PostHog ou Mixpanel
  - Logs: Axiom
  - CI/CD: GitHub Actions + Vercel

Testing:
  - Unit: Vitest
  - Integration: Playwright
  - E2E: Playwright
```

---

## Próximos Passos Imediatos

### Sprint 1 (Semana 1-2)
1. [ ] Setup completo do projeto
2. [ ] Implementar auth
3. [ ] Criar schema base do Prisma
4. [ ] Primeira integração de AI (teste)
5. [ ] Design system inicial

### Sprint 2 (Semana 3-4)
1. [ ] Implementar Flashcards (form + geração)
2. [ ] Componente de visualização
3. [ ] Salvar no banco
4. [ ] Lista na biblioteca

### Sprint 3 (Semana 5-6)
1. [ ] Sistema de spaced repetition
2. [ ] Implementar Resumos
3. [ ] Refinar UX dos 2 artefatos

### Sprint 4 (Semana 7-8)
1. [ ] Polimento e testes
2. [ ] Deploy beta fechado
3. [ ] Coletar feedback
4. [ ] Planejar Fase 2

---

## Checklist de Launch

### Técnico
- [ ] Database backup automático configurado
- [ ] Rate limiting implementado
- [ ] Error tracking (Sentry) ativo
- [ ] Monitoring de performance
- [ ] Logs estruturados
- [ ] Alertas configurados (uptime, errors, costs)
- [ ] Security audit básico
- [ ] HTTPS + CSP headers
- [ ] GDPR compliance básico

### Produto
- [ ] Onboarding funcional
- [ ] Help/FAQ seção
- [ ] Feedback widgets
- [ ] Analytics events implementados
- [ ] Email notifications
- [ ] Terms of Service & Privacy Policy
- [ ] Página de status (status.odontogpt.com)

### UX
- [ ] Loading states polidos
- [ ] Error states informativos
- [ ] Empty states motivadores
- [ ] Responsivo testado (mobile, tablet, desktop)
- [ ] Acessibilidade básica (a11y)
- [ ] Performance (Lighthouse > 90)

---

**Versão**: 1.0  
**Última atualização**: Janeiro 2026  
**Responsável**: Equipe de Produto & Engenharia
