---
status: active
generated: 2026-01-28
agents:
  - type: "frontend-specialist"
    role: "Implementar melhorias visuais no Kanban e componentes do pipeline"
  - type: "feature-developer"
    role: "Implementar novas funcionalidades de automação e tracking"
  - type: "architect-specialist"
    role: "Definir estrutura de dados para métricas e webhooks"
phases:
  - id: "phase-1"
    name: "Reestruturação Visual do Pipeline"
    prevc: "P"
  - id: "phase-2"
    name: "Automações e Gatilhos"
    prevc: "E"
  - id: "phase-3"
    name: "Métricas e Dashboard"
    prevc: "V"
---

# Pipeline Trial → Pro: Melhorias UI/UX e Funcionalidades

> Plano de melhorias visuais e funcionais para o pipeline de conversão Trial → Pro do Odonto GPT, baseado no funil SPIM e gatilhos de comportamento do usuário.

## Task Snapshot

- **Primary goal:** Transformar o pipeline atual em um CRM visual inteligente que guia a conversão de dentistas de Trial para Pro.
- **Success signal:** Taxa de conversão Trial → Pro aumentada em 20%, com visibilidade clara do status de cada lead e automações funcionando.
- **Key references:**
  - Componentes atuais: `components/admin/pipeline/`
  - Design system: `lib/design-tokens.ts`
  - Actions: `app/actions/pipeline.ts`

---

## Análise do Codebase Atual

### Estrutura de Componentes

```
components/admin/pipeline/
├── pipeline-kanban-board.tsx   # Board principal (Trial) - 345 linhas
├── cold-leads-kanban-board.tsx # Board de prospecção - 634 linhas
├── pipeline-tabs.tsx           # Tabs entre boards - 92 linhas
├── lead-card.tsx               # Card individual - 353 linhas
├── lead-details-dialog.tsx     # Modal de detalhes - 373 linhas
├── lead-actions-bar.tsx        # Ações rápidas
├── lead-timeline.tsx           # Timeline de eventos
├── followup-scheduler.tsx      # Agendamento de follow-up
├── notes-modal.tsx             # Notas do lead
├── import-leads-modal.tsx      # Import CSV
├── bulk-actions-bar.tsx        # Ações em lote
└── pipeline-filters.tsx        # Filtros avançados
```

### Etapas Atuais (Metodologia SPIM)

| Stage ID | Nome | Trigger Atual |
| --- | --- | --- |
| `novo_usuario` | Novo Usuário | Sem trial iniciado |
| `situacao` | Situação (S) | Manual |
| `problema` | Problema (P) | Trial iniciado |
| `implicacao` | Implicação (I) | >50% do trial |
| `motivacao` | Motivação (M) | ≤2 dias restantes |
| `convertido` | Convertido | Plano pago ativo |
| `nao_convertido` | Não Convertido | Manual |

### Design System Aplicado

O pipeline já usa tokens do `lib/design-tokens.ts`:
- Canvas: `bg-[#020617]`
- Surface: `bg-[#0f172a]`
- Brand: `#06b6d4` (cyan)
- Borders: `rgba(148,163,184,0.08)`
- Glow: `shadow-[0_0_20px_rgba(6,182,212,0.15)]`

---

## Novo Funil Comportamental Proposto

O funil atual é conceitual (SPIM). Propomos alinhar com **gatilhos comportamentais reais**:

### Mapeamento de Etapas

| Etapa | Trigger Comportamental | Automação |
| --- | --- | --- |
| 📥 **Cadastro** | Webhook signup | WhatsApp: prompt exemplo |
| 🧪 **Primeira Consulta** | `queries_count > 0` | Mover automaticamente |
| 🧠 **Usou Vision** | `vision_used_at IS NOT NULL` | Badge "Explorou PRO" |
| 🔄 **Uso Recorrente** | `queries_count > 3` ou `active_days > 1` | Nenhuma (deixar usar) |
| 🚧 **Barreira do Plano** | Limite de mensagens atingido | WhatsApp: link upgrade |
| 👻 **Risco de Churn** | Inativo há 3+ dias | WhatsApp: caso diferente |
| 💳 **Convertido** | Webhook Asaas confirmado | Boas-vindas PRO |
| ❌ **Perdido** | Manual ou trial expirado | Análise de motivo |

---

## Phase 1 — Reestruturação Visual do Pipeline

### 1.1 Redesign dos Cards (LeadCard)

**Problemas identificados:**
- Cards densos, difícil priorizar visualmente
- Falta indicadores de urgência claros
- Ações requerem menu dropdown

**Melhorias propostas:**

```tsx
// Novo layout do LeadCard
<div className="group relative">
  {/* Indicador de urgência - borda esquerda */}
  <div className={cn(
    "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
    urgency === "critical" && "bg-red-500",
    urgency === "high" && "bg-amber-500",
    urgency === "medium" && "bg-cyan-500",
    urgency === "low" && "bg-slate-600"
  )} />

  {/* Header com avatar */}
  <div className="flex items-center gap-3">
    <Avatar className="h-8 w-8">
      <span className="text-xs font-bold">{initials}</span>
    </Avatar>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-sm truncate">{name}</h4>
      <p className="text-xs text-muted-foreground">{profession}</p>
    </div>
    <QuickActions /> {/* Visível no hover */}
  </div>

  {/* Barra de progresso do trial inline */}
  <TrialProgressBar
    daysRemaining={daysRemaining}
    totalDays={7}
  />

  {/* Badges de comportamento */}
  <div className="flex gap-1 flex-wrap">
    {usedVision && <Badge variant="purple">Usou Vision</Badge>}
    {highEngagement && <Badge variant="green">Alto Engajamento</Badge>}
    {isExpiring && <Badge variant="red">Expira Hoje</Badge>}
  </div>

  {/* Última atividade */}
  <p className="text-[10px] text-muted-foreground">
    {lastActiveLabel} {/* "Ativo há 2h" ou "Inativo há 3d" */}
  </p>
</div>
```

**Elementos a implementar:**

- [ ] Avatar circular com iniciais coloridas por profissão
- [ ] Barra de progresso do trial (7 dias) inline
- [ ] Badges de comportamento: "Usou Vision", "Alto Engajamento", "Expirando"
- [ ] Quick actions no hover: WhatsApp, Email, Agendar
- [ ] Indicador de última atividade
- [ ] Borda esquerda colorida por urgência

### 1.2 Colunas com Métricas Expandidas

**Atual:** Apenas contador simples (`12 leads`)

**Proposto:**

```tsx
<ColumnHeader stage={stage}>
  <div className="flex items-center justify-between">
    <h3 className="text-xs font-semibold uppercase">{stage.title}</h3>
    <div className="flex items-center gap-2">
      <span className="text-xs bg-surface-200 px-1.5 py-0.5 rounded">
        {leads.length}
      </span>
      {urgentCount > 0 && (
        <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
          ⚡{urgentCount}
        </span>
      )}
    </div>
  </div>

  {/* Métricas secundárias (opcional, colapsável) */}
  <div className="text-[10px] text-muted-foreground mt-1">
    <span>MRR potencial: {formatCurrency(potentialMRR)}</span>
  </div>
</ColumnHeader>
```

### 1.3 Nova Paleta de Cores por Etapa

| Etapa | Cor Atual | Nova Cor | Classe Tailwind |
| --- | --- | --- | --- |
| Cadastro | `slate-400` | `emerald-400` | `border-t-emerald-400` |
| Primeira Consulta | `cyan-400` | `sky-400` | `border-t-sky-400` |
| Usou Vision | N/A | `violet-400` | `border-t-violet-400` |
| Uso Recorrente | `violet-400` | `blue-400` | `border-t-blue-400` |
| Barreira | `fuchsia-400` | `amber-400` | `border-t-amber-400` |
| Risco Churn | N/A | `orange-400` | `border-t-orange-400` |
| Convertido | `green-400` | `green-400` | `border-t-green-400` |
| Perdido | `red-400` | `red-400` | `border-t-red-400` |

### 1.4 Sticky Header com Dashboard

```tsx
<PipelineHeader className="sticky top-0 z-10 bg-canvas/95 backdrop-blur">
  <div className="flex items-center justify-between px-6 py-3 border-b">
    <h1 className="text-lg font-semibold">Pipeline de Conversão</h1>

    <div className="flex items-center gap-6">
      <Stat
        label="Trials Ativos"
        value={activeTrials}
        trend={`+${newThisWeek} esta semana`}
      />
      <Stat
        label="Expirando Hoje"
        value={expiringToday}
        urgent={expiringToday > 0}
      />
      <Stat
        label="Taxa Conversão"
        value={`${conversionRate}%`}
        trend={conversionTrend}
      />
      <Stat
        label="MRR Potencial"
        value={formatCurrency(potentialMRR)}
      />
    </div>
  </div>
</PipelineHeader>
```

---

## Phase 2 — Automações e Gatilhos

### 2.1 Sistema de Eventos Comportamentais

**Novo arquivo:** `lib/events/pipeline-events.ts`

```typescript
export const PIPELINE_EVENTS = {
  // === Signup ===
  USER_CREATED: 'user.created',
  TRIAL_STARTED: 'trial.started',

  // === Engagement ===
  FIRST_QUERY: 'engagement.first_query',
  VISION_USED: 'engagement.vision_used',
  RECURRING_USE: 'engagement.recurring', // 3+ queries ou 2+ dias

  // === Barriers ===
  DAILY_LIMIT_REACHED: 'limit.daily_reached',
  PRO_FEATURE_BLOCKED: 'limit.pro_blocked',

  // === Churn Signals ===
  INACTIVE_3_DAYS: 'churn.inactive_3d',
  TRIAL_EXPIRING_2D: 'churn.trial_expiring',
  TRIAL_EXPIRED: 'churn.trial_expired',

  // === Conversion ===
  PAYMENT_CONFIRMED: 'conversion.paid',
  SUBSCRIPTION_CANCELED: 'conversion.canceled',
} as const

export type PipelineEventType = typeof PIPELINE_EVENTS[keyof typeof PIPELINE_EVENTS]
```

### 2.2 Regras de Auto-Movimentação

**Novo arquivo:** `lib/pipeline/auto-stage-rules.ts`

```typescript
export const AUTO_STAGE_RULES: AutoStageRule[] = [
  {
    event: PIPELINE_EVENTS.FIRST_QUERY,
    condition: (lead) => lead.pipeline_stage === 'cadastro',
    action: {
      moveTo: 'primeira_consulta',
      notify: false,
    },
  },
  {
    event: PIPELINE_EVENTS.VISION_USED,
    condition: (lead) => !['convertido', 'perdido'].includes(lead.pipeline_stage),
    action: {
      moveTo: 'usou_vision',
      notify: false,
    },
  },
  {
    event: PIPELINE_EVENTS.RECURRING_USE,
    condition: (lead) => lead.queries_count >= 3 || lead.active_days >= 2,
    action: {
      moveTo: 'uso_recorrente',
      notify: false,
    },
  },
  {
    event: PIPELINE_EVENTS.DAILY_LIMIT_REACHED,
    action: {
      moveTo: 'barreira_plano',
      notify: true,
      notifyTemplate: 'LIMIT_REACHED',
    },
  },
  {
    event: PIPELINE_EVENTS.INACTIVE_3_DAYS,
    action: {
      moveTo: 'risco_churn',
      notify: true,
      notifyTemplate: 'REENGAGEMENT',
    },
  },
  {
    event: PIPELINE_EVENTS.PAYMENT_CONFIRMED,
    action: {
      moveTo: 'convertido',
      notify: true,
      notifyTemplate: 'WELCOME_PRO',
    },
  },
]
```

### 2.3 Integração WhatsApp (Z-API)

**Templates de mensagem:**

```typescript
export const WHATSAPP_TEMPLATES = {
  WELCOME_TRIAL: {
    id: 'welcome_trial',
    message: `Olá, Doutor(a) {name}! 👋

Bem-vindo ao Odonto GPT! Para começar, tente perguntar:

*"Qual o protocolo atual para profilaxia antibiótica em pacientes cardíacos?"*

Estamos aqui para ajudar! 🦷`,
  },

  LIMIT_REACHED: {
    id: 'limit_reached',
    message: `Doutor(a) {name}, você atingiu seu limite diário de consultas. 📊

Para liberar consultas *ilimitadas* e acesso ao Odonto Vision PRO:

👉 {upgrade_link}

Dúvidas? Estamos aqui!`,
  },

  REENGAGEMENT: {
    id: 'reengagement',
    message: `Doutor(a) {name}, sentimos sua falta! 👋

Já experimentou perguntar sobre:
• Dosagens de medicamentos por peso
• Protocolos de emergência
• Interpretação de exames

Seu trial ainda está ativo. Aproveite! 🦷`,
  },

  WELCOME_PRO: {
    id: 'welcome_pro',
    message: `🎉 Bem-vindo ao Odonto GPT PRO, Doutor(a) {name}!

Você agora tem acesso a:
✅ Consultas ilimitadas
✅ Odonto Vision PRO (análise de imagens)
✅ Agentes especializados
✅ Suporte prioritário

Bom uso! 🦷`,
  },
}
```

### 2.4 Melhorias no Follow-up Scheduler

**Melhorias no `followup-scheduler.tsx`:**

- [ ] Templates pré-definidos de mensagem
- [ ] Seleção de canal (WhatsApp / Email)
- [ ] Preview da mensagem antes de enviar
- [ ] Histórico de follow-ups enviados
- [ ] Status de entrega (enviado, entregue, lido)
- [ ] Agendamento recorrente (diário, semanal)

---

## Phase 3 — Métricas e Dashboard

### 3.1 Dashboard de Conversão

**Nova rota:** `app/admin/pipeline/dashboard/page.tsx`

```tsx
export default function ConversionDashboard() {
  return (
    <div className="grid gap-6">
      {/* Funil Visual */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelChart stages={stages} />
        </CardContent>
      </Card>

      {/* Métricas Chave */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Tempo Médio de Conversão"
          value="4.2 dias"
          trend="-0.5 dias"
        />
        <MetricCard
          label="Taxa de Conversão Geral"
          value="12%"
          trend="+2%"
        />
        <MetricCard
          label="Churn Rate Trial"
          value="45%"
          trend="-5%"
          invertTrend
        />
        <MetricCard
          label="MRR"
          value="R$ 8.400"
          trend="+R$ 1.200"
        />
      </div>

      {/* Conversão por Origem */}
      <Card>
        <CardHeader>
          <CardTitle>Conversão por Origem</CardTitle>
        </CardHeader>
        <CardContent>
          <SourceConversionTable sources={sources} />
        </CardContent>
      </Card>

      {/* Leads em Risco */}
      <Card>
        <CardHeader>
          <CardTitle>Leads em Risco de Churn</CardTitle>
        </CardHeader>
        <CardContent>
          <ChurnRiskList leads={atRiskLeads} />
        </CardContent>
      </Card>
    </div>
  )
}
```

### 3.2 Métricas por Etapa

| Métrica | Descrição | Query |
| --- | --- | --- |
| Tempo médio na etapa | Quantos dias leads ficam em cada etapa | `AVG(next_stage_at - entered_at)` |
| Taxa de conversão por etapa | % que avança para próxima | `COUNT(advanced) / COUNT(*)` |
| Gargalos | Etapas com maior abandono | `ORDER BY drop_rate DESC` |
| Valor potencial | MRR potencial por etapa | `COUNT(*) * plan_price` |

### 3.3 Alertas Inteligentes

```tsx
<PipelineAlerts className="mb-4">
  {expiringToday > 0 && (
    <Alert variant="destructive">
      <Clock className="h-4 w-4" />
      <AlertTitle>Urgente</AlertTitle>
      <AlertDescription>
        {expiringToday} trial(s) expira(m) hoje.
        <Button variant="link" size="sm">Ver leads</Button>
      </AlertDescription>
    </Alert>
  )}

  {limitReached.length > 0 && (
    <Alert variant="warning">
      <Zap className="h-4 w-4" />
      <AlertTitle>Oportunidade</AlertTitle>
      <AlertDescription>
        {limitReached.length} leads atingiram o limite - momento de contatar!
        <Button variant="link" size="sm">Ver leads</Button>
      </AlertDescription>
    </Alert>
  )}

  {inactive.length > 0 && (
    <Alert>
      <Ghost className="h-4 w-4" />
      <AlertTitle>Risco de Churn</AlertTitle>
      <AlertDescription>
        {inactive.length} leads inativos há 3+ dias.
        <Button variant="link" size="sm">Ver leads</Button>
      </AlertDescription>
    </Alert>
  )}
</PipelineAlerts>
```

---

## Migration Plan (Banco de Dados)

### Alterações na tabela `profiles`

```sql
-- Nova migration: add_behavioral_tracking.sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  first_query_at TIMESTAMPTZ,
  vision_first_used_at TIMESTAMPTZ,
  queries_count INT DEFAULT 0,
  active_days INT DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  limit_reached_at TIMESTAMPTZ,
  pipeline_auto_stage TEXT,
  pipeline_entered_at TIMESTAMPTZ; -- Quando entrou na etapa atual

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_pipeline_stage
  ON profiles(pipeline_stage) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends
  ON profiles(trial_ends_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_last_active
  ON profiles(last_active_at) WHERE deleted_at IS NULL;
```

### Nova tabela `pipeline_events`

```sql
CREATE TABLE IF NOT EXISTS pipeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) -- NULL = sistema
);

CREATE INDEX idx_pipeline_events_user ON pipeline_events(user_id);
CREATE INDEX idx_pipeline_events_type ON pipeline_events(event_type);
CREATE INDEX idx_pipeline_events_created ON pipeline_events(created_at DESC);
```

### Nova tabela `pipeline_metrics_daily`

```sql
CREATE TABLE IF NOT EXISTS pipeline_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  stage TEXT NOT NULL,
  leads_count INT DEFAULT 0,
  entered_count INT DEFAULT 0,
  exited_count INT DEFAULT 0,
  converted_count INT DEFAULT 0,
  avg_time_in_stage INTERVAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, stage)
);
```

---

## Arquivos a Modificar/Criar

### Modificar

| Arquivo | Modificação |
| --- | --- |
| `pipeline-kanban-board.tsx` | Novas etapas, métricas por coluna, header com stats |
| `lead-card.tsx` | Avatar, badges, barra de progresso, quick actions |
| `lead-details-dialog.tsx` | Timeline de eventos comportamentais |
| `pipeline-tabs.tsx` | Sticky stats header, link para dashboard |
| `lib/design-tokens.ts` | Novas cores para etapas |

### Criar

| Arquivo | Descrição |
| --- | --- |
| `lib/events/pipeline-events.ts` | Definição de eventos |
| `lib/pipeline/auto-stage-rules.ts` | Regras de automação |
| `lib/pipeline/whatsapp-templates.ts` | Templates de mensagem |
| `app/admin/pipeline/dashboard/page.tsx` | Dashboard de métricas |
| `components/admin/pipeline/pipeline-alerts.tsx` | Alertas inteligentes |
| `components/admin/pipeline/funnel-chart.tsx` | Gráfico de funil |
| `supabase/migrations/xxx_behavioral_tracking.sql` | Migration |

---

## Priorização

### Sprint 1 - Quick Wins (Esta semana)

1. [ ] Indicadores visuais de urgência no card (borda colorida)
2. [ ] Barra de progresso do trial inline
3. [ ] Quick actions no hover (WhatsApp, Email)
4. [ ] Stats no header (trials ativos, expirando hoje, taxa)
5. [ ] Nova paleta de cores por etapa

### Sprint 2 - Core Features (Próximas 2 semanas)

1. [ ] Sistema de eventos comportamentais
2. [ ] Auto-movimentação entre etapas
3. [ ] Templates de WhatsApp
4. [ ] Migration do banco de dados
5. [ ] Badges de comportamento nos cards

### Sprint 3 - Analytics (Mês seguinte)

1. [ ] Dashboard de conversão
2. [ ] Métricas por etapa
3. [ ] Alertas inteligentes
4. [ ] Funil visual
5. [ ] Relatórios exportáveis

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Integração Z-API instável | Medium | High | Retry com fallback, logging |
| Performance com muitos leads | Low | Medium | Paginação, virtualization |
| Regras de auto-move incorretas | Medium | Medium | Feature flag, rollback fácil |
| Spam de WhatsApp | Low | High | Rate limiting, opt-out |

---

## Commit Checkpoints

```bash
# Phase 1
git commit -m "feat(pipeline): redesign lead cards with urgency indicators"
git commit -m "feat(pipeline): add column metrics and stats header"
git commit -m "feat(pipeline): update stage colors and add new stages"

# Phase 2
git commit -m "feat(pipeline): implement behavior tracking events"
git commit -m "feat(pipeline): add auto-stage movement rules"
git commit -m "feat(pipeline): integrate whatsapp notification templates"

# Phase 3
git commit -m "feat(pipeline): add conversion dashboard page"
git commit -m "feat(pipeline): implement funnel chart and metrics"
git commit -m "feat(pipeline): add smart alerts component"
```

---

## Evidence & Follow-up

- [ ] Screenshot do novo design dos cards
- [ ] Video demo da auto-movimentação
- [ ] Relatório de taxa de conversão antes/depois
- [ ] Logs de eventos capturados
- [ ] Feedback dos vendedores usando o pipeline
