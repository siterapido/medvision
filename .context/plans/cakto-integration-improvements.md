---
status: completed
generated: 2026-01-27
priority: high
agents:
  - type: "performance-optimizer"
    role: "Otimizar queries e adicionar timeouts na Edge Function"
  - type: "feature-developer"
    role: "Implementar job de expiração de planos e dashboard de monitoramento"
  - type: "test-writer"
    role: "Criar testes de integração para cenários de webhook"
  - type: "devops-specialist"
    role: "Configurar alertas e monitoramento no Supabase"
docs:
  - "architecture.md"
  - "security.md"
phases:
  - id: "phase-1"
    name: "Otimizações de Performance"
    prevc: "P"
  - id: "phase-2"
    name: "Resiliência e Monitoramento"
    prevc: "E"
  - id: "phase-3"
    name: "Testes e Validação"
    prevc: "V"
---

# Melhorias na Integração Cakto

> Implementar melhorias de performance, resiliência e monitoramento na integração com a plataforma de pagamentos Cakto

## Task Snapshot

- **Primary goal:** Aumentar a resiliência e observabilidade da integração Cakto, garantindo que webhooks sejam processados de forma confiável e que planos expirados sejam tratados automaticamente.
- **Success signal:**
  - Tempo de resposta do webhook < 3s em 99% dos casos
  - Zero pagamentos perdidos por timeout
  - Alertas automáticos para falhas de webhook
  - Job de expiração rodando diariamente
- **Key references:**
  - [Edge Function Cakto](../../supabase/functions/cakto/index.ts)
  - [Lib Cakto](../../lib/cakto.ts)
  - [Webhook Route](../../app/api/webhooks/cakto/route.ts)

## Codebase Context

### Arquivos Principais
| Arquivo | Propósito | Linhas |
|---------|-----------|--------|
| `supabase/functions/cakto/index.ts` | Edge Function principal do webhook | ~800 |
| `lib/cakto.ts` | Helpers de checkout e consultas | ~200 |
| `app/api/webhooks/cakto/route.ts` | Proxy Next.js para Edge Function | ~30 |

### Tabelas Envolvidas
| Tabela | Uso |
|--------|-----|
| `profiles` | Dados do usuário e status do plano |
| `payment_history` | Histórico de transações |
| `transaction_logs` | Logs detalhados de auditoria |
| `webhook_events` | Controle de idempotência |
| `course_purchases` | Compras de cursos avulsos |

## Agent Lineup

| Agent | Role in this plan | First responsibility focus |
|-------|-------------------|---------------------------|
| Performance Optimizer | Otimizar `findUser` e adicionar timeouts | Substituir `listUsers()` por query direta |
| Feature Developer | Criar job de expiração e dashboard | Implementar Supabase scheduled function |
| Test Writer | Cobrir cenários críticos | Testes para timeout, duplicação, fallback |
| DevOps Specialist | Configurar alertas | Integrar com Supabase logs e alertas |

## Risk Assessment

### Identified Risks
| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Timeout em `listUsers()` com muitos usuários | Alta | Alto | Substituir por query direta em `auth.users` |
| Webhook timeout do Cakto (30s) | Média | Alto | Adicionar timeout de 25s e resposta early |
| Planos expirados não tratados | Alta | Médio | Criar scheduled function diária |
| Perda de contexto em erros | Média | Médio | Melhorar logs estruturados |

### Dependencies
- **Internal:** Supabase Edge Functions, tabela `profiles`
- **External:** API Cakto (webhook sender), Supabase Auth Admin API
- **Technical:** Deno runtime, `crypto.subtle` para HMAC

### Assumptions
- A API `auth.admin.listUsers()` continuará disponível (deprecation warning)
- O Cakto mantém timeout de 30s para webhooks
- O Supabase permite scheduled functions (pg_cron)

---

## Working Phases

### Phase 1 — Otimizações de Performance

**Objetivo:** Reduzir latência do webhook e evitar timeouts

#### 1.1 Substituir `listUsers()` por Query Direta

**Problema:** A função `findUser()` usa `supabase.auth.admin.listUsers()` que carrega TODOS os usuários em memória.

**Arquivo:** `supabase/functions/cakto/index.ts:540-561`

```typescript
// ANTES (lento com muitos usuários)
const { data: { users } } = await supabase.auth.admin.listUsers();
const user = users?.find(u => u.email?.toLowerCase() === email);

// DEPOIS (query direta)
const { data: authUser } = await supabase
  .from('auth.users')  // ou usar getUserByEmail quando disponível
  .select('id, email, raw_user_meta_data')
  .eq('email', email)
  .maybeSingle();
```

**Alternativa:** Usar `supabase.auth.admin.getUserByEmail(email)` se disponível na versão do SDK.

#### 1.2 Adicionar Timeout Global

**Problema:** Sem timeout, operações podem travar indefinidamente.

```typescript
// Adicionar no início do handler
const WEBHOOK_TIMEOUT = 25000; // 25s (Cakto timeout é 30s)

const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Webhook timeout')), WEBHOOK_TIMEOUT)
);

try {
  const result = await Promise.race([
    processWebhook(payload),
    timeoutPromise
  ]);
  return jsonResponse(result);
} catch (error) {
  if (error.message === 'Webhook timeout') {
    // Retornar 202 para Cakto não reenviar
    return jsonResponse({
      success: true,
      message: 'Processing async',
      transactionId
    }, 202);
  }
  throw error;
}
```

#### 1.3 Otimizar `createUserAccount`

**Problema:** Múltiplas queries sequenciais podem ser paralelizadas.

```typescript
// Paralelizar operações independentes
const [profileResult, linkResult] = await Promise.all([
  supabase.from('profiles').upsert(profileData),
  !existingUser ? supabase.auth.admin.generateLink({ type: 'magiclink', email }) : null
]);
```

**Commit Checkpoint**
```bash
git commit -m "perf(cakto): optimize findUser and add webhook timeout"
```

---

### Phase 2 — Resiliência e Monitoramento

**Objetivo:** Garantir que planos expirados sejam tratados e falhas sejam detectadas

#### 2.1 Job de Expiração de Planos

**Criar:** `supabase/functions/expire-subscriptions/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Buscar planos expirados
  const { data: expiredProfiles, error } = await supabase
    .from('profiles')
    .select('id, email, plan_type, expires_at')
    .not('plan_type', 'eq', 'free')
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Erro ao buscar planos expirados:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Atualizar para free
  for (const profile of expiredProfiles || []) {
    await supabase
      .from('profiles')
      .update({
        plan_type: 'free',
        subscription_status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    // Log da expiração
    await supabase.from('transaction_logs').insert({
      event_type: 'subscription_expired',
      user_id: profile.id,
      customer_email: profile.email,
      status: 'success',
      webhook_payload: { previous_plan: profile.plan_type, expires_at: profile.expires_at }
    });

    console.log(`Plano expirado: ${profile.email} (${profile.plan_type})`);
  }

  return new Response(JSON.stringify({
    success: true,
    expired_count: expiredProfiles?.length || 0
  }));
});
```

**Configurar cron:** `supabase/functions/expire-subscriptions/function.toml`

```toml
[function]
name = "expire-subscriptions"
verify_jwt = false

[schedule]
# Rodar diariamente às 3:00 AM UTC
cron = "0 3 * * *"
```

#### 2.2 Dashboard de Monitoramento (SQL Views)

**Migration:** `supabase/migrations/XXX_cakto_monitoring_views.sql`

```sql
-- View: Resumo de webhooks por dia
CREATE OR REPLACE VIEW webhook_daily_summary AS
SELECT
  DATE(created_at) as date,
  event_type,
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds
FROM transaction_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), event_type, status
ORDER BY date DESC, event_type;

-- View: Planos próximos de expirar (7 dias)
CREATE OR REPLACE VIEW subscriptions_expiring_soon AS
SELECT
  id,
  email,
  name,
  plan_type,
  expires_at,
  EXTRACT(DAY FROM expires_at - NOW()) as days_until_expiry
FROM profiles
WHERE
  plan_type != 'free'
  AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY expires_at;

-- View: Erros recentes
CREATE OR REPLACE VIEW recent_webhook_errors AS
SELECT
  transaction_id,
  event_type,
  customer_email,
  error_message,
  created_at
FROM transaction_logs
WHERE
  status = 'error'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

#### 2.3 Alertas via Supabase

**Opção A:** Usar Supabase Database Webhooks para disparar alertas quando `status = 'error'`

**Opção B:** Integrar com serviço externo (Slack, Discord, Email)

```typescript
// Adicionar em handlePurchaseApproved após erro crítico
async function sendAlert(message: string, context: Record<string, unknown>) {
  const ALERT_WEBHOOK = Deno.env.get('ALERT_WEBHOOK_URL');
  if (!ALERT_WEBHOOK) return;

  await fetch(ALERT_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `[Cakto Webhook] ${message}`,
      context
    })
  });
}
```

**Commit Checkpoint**
```bash
git commit -m "feat(cakto): add subscription expiration job and monitoring views"
```

---

### Phase 3 — Testes e Validação

**Objetivo:** Garantir que as melhorias funcionam corretamente

#### 3.1 Testes de Integração

**Criar:** `tests/cakto-webhook-improvements.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Cakto Webhook Improvements', () => {
  describe('findUser optimization', () => {
    it('should find user by direct query instead of listUsers', async () => {
      // Mock e teste
    });

    it('should handle non-existent user gracefully', async () => {
      // Mock e teste
    });
  });

  describe('timeout handling', () => {
    it('should return 202 when processing takes too long', async () => {
      // Simular operação lenta
    });

    it('should complete within 25s for normal operations', async () => {
      // Teste de performance
    });
  });

  describe('idempotency', () => {
    it('should not process same transaction twice', async () => {
      // Enviar mesmo webhook duas vezes
    });
  });

  describe('expiration job', () => {
    it('should mark expired subscriptions as free', async () => {
      // Criar subscription expirada e rodar job
    });

    it('should log expiration events', async () => {
      // Verificar transaction_logs
    });
  });
});
```

#### 3.2 Testes Manuais

1. **Teste de timeout:**
   ```bash
   # Simular payload que demora para processar
   curl -X POST https://xxx.functions.supabase.co/cakto \
     -H "Content-Type: application/json" \
     -d '{"event":"purchase_approved","data":{"customer":{"email":"slow@test.com"},"id":"slow-test"},"secret":"xxx"}'
   ```

2. **Teste de expiração:**
   ```sql
   -- Criar subscription expirada para teste
   UPDATE profiles
   SET expires_at = NOW() - INTERVAL '1 day', plan_type = 'annual'
   WHERE email = 'test@example.com';

   -- Invocar função manualmente
   SELECT net.http_post('https://xxx.functions.supabase.co/expire-subscriptions');

   -- Verificar resultado
   SELECT * FROM profiles WHERE email = 'test@example.com';
   ```

3. **Verificar views:**
   ```sql
   SELECT * FROM webhook_daily_summary;
   SELECT * FROM subscriptions_expiring_soon;
   SELECT * FROM recent_webhook_errors;
   ```

**Commit Checkpoint**
```bash
git commit -m "test(cakto): add integration tests for webhook improvements"
```

---

## Rollback Plan

### Rollback Triggers
- Webhooks retornando erro 500 em > 5% das requisições
- Tempo de resposta > 25s consistentemente
- Usuários reportando planos sendo cancelados incorretamente
- Job de expiração marcando planos ativos como expirados

### Rollback Procedures

#### Phase 1 Rollback (Performance)
- **Action:** Reverter para `listUsers()` se query direta causar problemas
- **Command:** `git revert <commit-hash>`
- **Data Impact:** Nenhum (apenas lógica de busca)

#### Phase 2 Rollback (Job de Expiração)
- **Action:** Desabilitar scheduled function
- **Command:** `supabase functions delete expire-subscriptions`
- **Data Impact:** Reverter `plan_type` dos últimos usuários afetados
  ```sql
  UPDATE profiles
  SET plan_type = (webhook_payload->>'previous_plan')::text,
      subscription_status = 'active'
  FROM transaction_logs
  WHERE profiles.id = transaction_logs.user_id
    AND transaction_logs.event_type = 'subscription_expired'
    AND transaction_logs.created_at > NOW() - INTERVAL '1 day';
  ```

### Post-Rollback Actions
1. Analisar logs em `transaction_logs` para identificar causa raiz
2. Criar issue no GitHub com detalhes do problema
3. Notificar equipe via Slack/Discord

---

## Evidence & Follow-up

### Artifacts to Collect
- [ ] PR com otimização de `findUser`
- [ ] PR com job de expiração
- [ ] Screenshot das views de monitoramento
- [ ] Logs de testes de performance (antes/depois)
- [ ] Relatório de cobertura de testes

### Métricas de Sucesso
| Métrica | Baseline | Target |
|---------|----------|--------|
| Tempo médio de webhook | ~5s | < 2s |
| Timeouts por dia | ~3 | 0 |
| Planos expirados não tratados | ~10% | 0% |
| Cobertura de testes | ~40% | > 80% |

### Follow-up Actions
- [ ] Documentar novas views no WEBHOOK_INSTRUCTIONS.md
- [ ] Atualizar Guia_Completo_Integracao_Cakto.md
- [ ] Configurar alertas no Slack para erros críticos
- [ ] Agendar revisão mensal das métricas
