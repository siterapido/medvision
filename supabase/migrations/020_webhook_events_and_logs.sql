-- Tabelas para idempotência e logs de transações de webhooks Cakto

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.webhook_events FROM authenticated;
REVOKE ALL ON public.webhook_events FROM anon;
GRANT ALL PRIVILEGES ON public.webhook_events TO service_role;
CREATE POLICY IF NOT EXISTS "Service role pode gerenciar" ON public.webhook_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.transaction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text NOT NULL,
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email text,
  customer_name text,
  customer_cpf text,
  amount numeric(10,2),
  status text NOT NULL,
  error_message text,
  webhook_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_transaction_logs_transaction_id ON public.transaction_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_user_id ON public.transaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at ON public.transaction_logs(created_at DESC);

ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Usuários veem seus próprios logs" ON public.transaction_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());
GRANT SELECT ON public.transaction_logs TO authenticated;
REVOKE ALL ON public.transaction_logs FROM anon;
GRANT ALL PRIVILEGES ON public.transaction_logs TO service_role;
