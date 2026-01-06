-- Migration: AI Settings and WhatsApp Conversations
-- Description: Cria tabelas para configurações do agente de IA e conversas do WhatsApp

-- ============================================
-- Tabela: ai_settings
-- Configurações globais do agente de IA
-- ============================================
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_prompt TEXT NOT NULL,
  model VARCHAR(50) DEFAULT 'gpt-4o-mini',
  max_tokens INTEGER DEFAULT 2048,
  temperature DECIMAL(3,2) DEFAULT 0.70,
  whatsapp_enabled BOOLEAN DEFAULT true,
  web_chat_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO ai_settings (system_prompt, model, max_tokens, temperature)
VALUES (
  'Você é o Odonto GPT, um assistente de inteligência artificial especializado em odontologia.',
  'gpt-4o-mini',
  2048,
  0.70
) ON CONFLICT DO NOTHING;

-- ============================================
-- Tabela: whatsapp_conversations
-- Conversas do WhatsApp (cada telefone = uma conversa)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por telefone
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_phone ON whatsapp_conversations(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_last_message ON whatsapp_conversations(last_message_at DESC);

-- ============================================
-- Tabela: whatsapp_messages
-- Mensagens das conversas do WhatsApp
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca de mensagens
CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_conv ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_created ON whatsapp_messages(created_at DESC);

-- ============================================
-- RLS Policies
-- ============================================

-- AI Settings - apenas admins podem modificar
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ai_settings"
  ON ai_settings FOR SELECT
  USING (true); -- Todos podem ler configurações

CREATE POLICY "Admins can update ai_settings"
  ON ai_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- WhatsApp Conversations - apenas sistema/admins
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage whatsapp_conversations"
  ON whatsapp_conversations FOR ALL
  USING (true); -- Gerenciado pelo backend

-- WhatsApp Messages - apenas sistema/admins
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage whatsapp_messages"
  ON whatsapp_messages FOR ALL
  USING (true); -- Gerenciado pelo backend

-- ============================================
-- Triggers para updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_settings_updated_at
  BEFORE UPDATE ON ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Função para limpar conversas antigas (30 dias)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM whatsapp_messages
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE ai_settings IS 'Configurações globais do agente de IA Odonto GPT';
COMMENT ON TABLE whatsapp_conversations IS 'Conversas do WhatsApp, uma por telefone';
COMMENT ON TABLE whatsapp_messages IS 'Mensagens das conversas do WhatsApp';
