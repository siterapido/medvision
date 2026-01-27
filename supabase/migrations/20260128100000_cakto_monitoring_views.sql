-- Migration: Cakto Monitoring Views
-- Descrição: Cria views para monitoramento de webhooks, assinaturas e erros

-- =============================================================================
-- View: Resumo diário de webhooks
-- Mostra contagem e tempo médio de processamento por dia/evento/status
-- =============================================================================
CREATE OR REPLACE VIEW webhook_daily_summary AS
SELECT
  DATE(created_at) as date,
  event_type,
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as error_count
FROM transaction_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), event_type, status
ORDER BY date DESC, event_type;

-- Permitir acesso para service_role
GRANT SELECT ON webhook_daily_summary TO service_role;

-- =============================================================================
-- View: Assinaturas próximas de expirar (7 dias)
-- Lista usuários cujos planos expiram nos próximos 7 dias
-- =============================================================================
CREATE OR REPLACE VIEW subscriptions_expiring_soon AS
SELECT
  id,
  email,
  name,
  plan_type,
  subscription_status,
  expires_at,
  EXTRACT(DAY FROM expires_at - NOW())::integer as days_until_expiry
FROM profiles
WHERE
  plan_type IS NOT NULL
  AND plan_type != 'free'
  AND expires_at IS NOT NULL
  AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY expires_at ASC;

-- Permitir acesso para service_role
GRANT SELECT ON subscriptions_expiring_soon TO service_role;

-- =============================================================================
-- View: Erros de webhook recentes (últimas 24 horas)
-- Lista todos os erros de webhook para debugging
-- =============================================================================
CREATE OR REPLACE VIEW recent_webhook_errors AS
SELECT
  transaction_id,
  event_type,
  customer_email,
  error_message,
  webhook_payload,
  created_at
FROM transaction_logs
WHERE
  status = 'error'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Permitir acesso para service_role
GRANT SELECT ON recent_webhook_errors TO service_role;

-- =============================================================================
-- View: Resumo de assinaturas ativas
-- Mostra contagem de usuários por tipo de plano
-- =============================================================================
CREATE OR REPLACE VIEW subscription_summary AS
SELECT
  COALESCE(plan_type, 'free') as plan_type,
  COALESCE(subscription_status, 'free') as status,
  COUNT(*) as user_count,
  COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_count,
  COUNT(CASE WHEN expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days' THEN 1 END) as expiring_soon_count
FROM profiles
GROUP BY COALESCE(plan_type, 'free'), COALESCE(subscription_status, 'free')
ORDER BY plan_type, status;

-- Permitir acesso para service_role
GRANT SELECT ON subscription_summary TO service_role;

-- =============================================================================
-- View: Histórico de webhooks por usuário
-- Mostra transações recentes agrupadas por email
-- =============================================================================
CREATE OR REPLACE VIEW webhook_history_by_user AS
SELECT
  customer_email,
  COUNT(*) as total_events,
  COUNT(CASE WHEN event_type = 'purchase_approved' THEN 1 END) as purchases,
  COUNT(CASE WHEN event_type = 'refund' THEN 1 END) as refunds,
  COUNT(CASE WHEN event_type = 'subscription_cancelled' THEN 1 END) as cancellations,
  COUNT(CASE WHEN event_type = 'subscription_expired' THEN 1 END) as expirations,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
  MAX(created_at) as last_event_at
FROM transaction_logs
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY customer_email
ORDER BY last_event_at DESC;

-- Permitir acesso para service_role
GRANT SELECT ON webhook_history_by_user TO service_role;

-- =============================================================================
-- Comentários nas views para documentação
-- =============================================================================
COMMENT ON VIEW webhook_daily_summary IS 'Resumo diário de webhooks processados nos últimos 30 dias';
COMMENT ON VIEW subscriptions_expiring_soon IS 'Lista de assinaturas que expiram nos próximos 7 dias';
COMMENT ON VIEW recent_webhook_errors IS 'Erros de webhook das últimas 24 horas para debugging';
COMMENT ON VIEW subscription_summary IS 'Resumo de assinaturas por tipo de plano e status';
COMMENT ON VIEW webhook_history_by_user IS 'Histórico de webhooks agrupado por email do cliente';
