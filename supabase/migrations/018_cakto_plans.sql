-- =====================================================
-- Integração Cakto - Campos de plano e histórico
-- =====================================================

-- Adiciona campos relacionados a assinaturas na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_payment_date timestamptz,
  ADD COLUMN IF NOT EXISTS payment_method text;

COMMENT ON COLUMN public.profiles.plan_type IS 'Plano atual do usuário (free, premium, etc)';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Status da assinatura (active, canceled, refunded, etc)';
COMMENT ON COLUMN public.profiles.expires_at IS 'Data de expiração da assinatura quando aplicável';
COMMENT ON COLUMN public.profiles.last_payment_date IS 'Data do último pagamento aprovado';
COMMENT ON COLUMN public.profiles.payment_method IS 'Método de pagamento usado no checkout';

CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON public.profiles(plan_type);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);

-- =====================================================
-- Histórico de pagamentos processados pelo Cakto
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id text UNIQUE NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'BRL',
  status text NOT NULL,
  payment_method text,
  webhook_data jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_transaction ON public.payment_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON public.payment_history(created_at DESC);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuários podem ver próprio histórico" ON public.payment_history
  FOR SELECT
  USING (auth.uid() = user_id);

GRANT SELECT ON public.payment_history TO authenticated;
GRANT SELECT ON public.payment_history TO anon;
GRANT ALL PRIVILEGES ON public.payment_history TO service_role;
