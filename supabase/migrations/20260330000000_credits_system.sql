-- Sistema de Créditos por Plano
-- Cada usuário tem um saldo mensal de créditos baseado no seu plano.
-- Cada chamada de IA consome créditos de acordo com o modelo utilizado.

-- Tabela principal de créditos do usuário
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,         -- saldo atual de créditos
  monthly_limit INTEGER NOT NULL DEFAULT 0,   -- limite mensal pelo plano
  period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()),
  period_end TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Histórico de transações de créditos
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,        -- negativo = consumo, positivo = adição/reset
  type TEXT NOT NULL CHECK (type IN (
    'chat', 'vision', 'research', 'artifact',
    'monthly_reset', 'admin_grant', 'plan_upgrade'
  )),
  model TEXT,                     -- modelo de IA utilizado (quando aplicável)
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- RLS: usuário só lê os próprios créditos
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_credits_select_own" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "credit_transactions_select_own" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Admin pode tudo
CREATE POLICY "user_credits_admin_all" ON user_credits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "credit_transactions_admin_all" ON credit_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role (server-side) ignora RLS automaticamente com chave de serviço

-- Função para inicializar créditos de um novo usuário
CREATE OR REPLACE FUNCTION initialize_user_credits(
  p_user_id UUID,
  p_plan_type TEXT DEFAULT 'free'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  -- Define limite pelo plano
  v_limit := CASE p_plan_type
    WHEN 'trial'       THEN 100
    WHEN 'free'        THEN 50
    WHEN 'basic'       THEN 500
    WHEN 'pro'         THEN 2000
    WHEN 'certificate' THEN 500
    ELSE 50
  END;

  INSERT INTO user_credits (user_id, balance, monthly_limit)
  VALUES (p_user_id, v_limit, v_limit)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Trigger: inicializa créditos automaticamente ao criar perfil
CREATE OR REPLACE FUNCTION trigger_init_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM initialize_user_credits(NEW.id, COALESCE(NEW.plan_type, 'free'));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_init_credits ON profiles;
CREATE TRIGGER on_profile_created_init_credits
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_init_credits();

-- Função atômica para debitar créditos (evita race conditions)
CREATE OR REPLACE FUNCTION deduct_user_credits(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_credits
  SET
    balance = GREATEST(balance - p_amount, 0),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Função atômica para conceder créditos
CREATE OR REPLACE FUNCTION grant_user_credits(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_credits
  SET
    balance = balance + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Inicializa créditos para usuários existentes que ainda não possuem registro
INSERT INTO user_credits (user_id, balance, monthly_limit)
SELECT
  p.id,
  CASE COALESCE(p.plan_type, 'free')
    WHEN 'trial'       THEN 100
    WHEN 'free'        THEN 50
    WHEN 'basic'       THEN 500
    WHEN 'pro'         THEN 2000
    WHEN 'certificate' THEN 500
    ELSE 50
  END,
  CASE COALESCE(p.plan_type, 'free')
    WHEN 'trial'       THEN 100
    WHEN 'free'        THEN 50
    WHEN 'basic'       THEN 500
    WHEN 'pro'         THEN 2000
    WHEN 'certificate' THEN 500
    ELSE 50
  END
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_credits uc WHERE uc.user_id = p.id
);
