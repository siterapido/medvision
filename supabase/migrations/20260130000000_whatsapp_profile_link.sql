-- Migration: WhatsApp Profile Link
-- Description: Adiciona vinculação de conversas WhatsApp a profiles e tipo de mensagem

-- ============================================
-- Adicionar user_id para vincular a profiles
-- ============================================
ALTER TABLE whatsapp_conversations
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_user_id ON whatsapp_conversations(user_id);

-- ============================================
-- Adicionar message_type para identificar áudio/imagem/etc
-- ============================================
ALTER TABLE whatsapp_messages
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text';

-- Comentários
COMMENT ON COLUMN whatsapp_conversations.user_id IS 'Vincula conversa a um perfil existente baseado no telefone';
COMMENT ON COLUMN whatsapp_messages.message_type IS 'Tipo original da mensagem: text, audio, image, document';

-- ============================================
-- Função para vincular automaticamente user_id
-- quando phone existe em profiles.whatsapp
-- ============================================
CREATE OR REPLACE FUNCTION link_whatsapp_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Tentar vincular com profile existente
  SELECT id INTO NEW.user_id
  FROM profiles
  WHERE whatsapp = NEW.phone
  LIMIT 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para vincular automaticamente
DROP TRIGGER IF EXISTS trigger_link_whatsapp_profile ON whatsapp_conversations;
CREATE TRIGGER trigger_link_whatsapp_profile
  BEFORE INSERT ON whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION link_whatsapp_to_profile();

-- ============================================
-- Atualizar conversas existentes com user_id
-- ============================================
UPDATE whatsapp_conversations wc
SET user_id = p.id
FROM profiles p
WHERE wc.phone = p.whatsapp
AND wc.user_id IS NULL;
