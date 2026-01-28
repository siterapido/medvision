-- Adiciona soft delete para leads no pipeline
-- Permite mover leads para lixeira ao invés de excluir permanentemente

-- Adicionar colunas de soft delete
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

-- Criar índice para melhorar performance nas queries de leads não deletados
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at
ON profiles(deleted_at)
WHERE deleted_at IS NULL;

-- Adicionar comentários
COMMENT ON COLUMN profiles.deleted_at IS 'Data em que o lead foi movido para lixeira (soft delete)';
COMMENT ON COLUMN profiles.deleted_by IS 'ID do admin que moveu o lead para lixeira';
