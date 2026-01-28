-- Migration: Atualizar pipeline para funil comportamental Trial → Pro
-- Data: 2026-01-28
-- Descrição: Substitui stages SPIM por stages baseados em comportamento do usuário

-- 1. Remover constraint antigo
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pipeline_stage_check;

-- 2. Adicionar novo constraint com stages comportamentais
ALTER TABLE profiles ADD CONSTRAINT profiles_pipeline_stage_check CHECK (
  pipeline_stage IN (
    'cadastro',           -- 📥 Cadastro Realizado
    'primeira_consulta',  -- 🧪 Primeira Consulta
    'usou_vision',        -- 🧠 Usou Odonto Vision
    'uso_recorrente',     -- 🔄 Uso Recorrente (3+ consultas)
    'barreira_plano',     -- 🚧 Barreira do Plano (limite atingido)
    'risco_churn',        -- 👻 Risco de Churn (inativo 3+ dias)
    'convertido',         -- 💳 Convertido (pagamento confirmado)
    'perdido'             -- ❌ Perdido (trial expirado sem conversão)
  )
);

-- 3. Mover TODOS os leads para "cadastro" para começar do zero
UPDATE profiles
SET pipeline_stage = 'cadastro'
WHERE deleted_at IS NULL
  AND role NOT IN ('admin', 'vendedor');

-- 4. Adicionar comentários para documentação
COMMENT ON COLUMN profiles.pipeline_stage IS 'Etapa no funil comportamental Trial → Pro: cadastro | primeira_consulta | usou_vision | uso_recorrente | barreira_plano | risco_churn | convertido | perdido';

-- 5. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_pipeline_stage_behavioral
  ON profiles(pipeline_stage, created_at DESC)
  WHERE deleted_at IS NULL;
