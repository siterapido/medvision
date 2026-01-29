-- WhatsApp Chat Integration Migration
-- Adds support for bidirectional WhatsApp conversations with database persistence

-- 1. Add channel field to chat_threads
ALTER TABLE IF EXISTS chat_threads
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp'));

-- 2. Add metadata field to chat_messages for WhatsApp-specific data
ALTER TABLE IF EXISTS chat_messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Add WhatsApp opt-in fields to profiles
ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS whatsapp_optin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_optin_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS whatsapp_optout_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_threads_channel
ON chat_threads(user_id, channel);

CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata
ON chat_messages USING gin(metadata);

CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_optin
ON profiles(whatsapp_optin) WHERE whatsapp IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_threads_created_at
ON chat_threads(user_id, created_at DESC);

-- 5. Create queue table for outgoing messages
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'template')),
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status
ON notification_queue(status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id
ON notification_queue(user_id);

-- 6. Create alerts table for monitoring
CREATE TABLE IF NOT EXISTS whatsapp_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  threshold NUMERIC,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  notified_admins BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_alerts_triggered_at
ON whatsapp_alerts(triggered_at DESC);

-- 7. Create usage tracking table for cost control
CREATE TABLE IF NOT EXISTS whatsapp_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL UNIQUE,
  messages_sent INT DEFAULT 0,
  estimated_cost NUMERIC(10,2) DEFAULT 0,
  budget_limit NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_usage_month
ON whatsapp_usage(month);

-- 8. Enable RLS on new tables
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_usage ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
-- Admins can view queue
DROP POLICY IF EXISTS "Admins can view queue" ON notification_queue;
CREATE POLICY "Admins can view queue" ON notification_queue FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admins can view alerts
DROP POLICY IF EXISTS "Admins can view alerts" ON whatsapp_alerts;
CREATE POLICY "Admins can view alerts" ON whatsapp_alerts FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admins can view usage
DROP POLICY IF EXISTS "Admins can view usage" ON whatsapp_usage;
CREATE POLICY "Admins can view usage" ON whatsapp_usage FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 10. Update existing chat RLS policies to support both web and whatsapp
-- Users can view their own threads (both channels)
DROP POLICY IF EXISTS "Users view own threads" ON chat_threads;
CREATE POLICY "Users view own threads" ON chat_threads FOR SELECT
USING (user_id = auth.uid());

-- Users can view their own messages (both channels)
DROP POLICY IF EXISTS "Users view own messages" ON chat_messages;
CREATE POLICY "Users view own messages" ON chat_messages FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all threads
DROP POLICY IF EXISTS "Admins view all threads" ON chat_threads;
CREATE POLICY "Admins view all threads" ON chat_threads FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admins can view all messages
DROP POLICY IF EXISTS "Admins view all messages" ON chat_messages;
CREATE POLICY "Admins view all messages" ON chat_messages FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 11. Create view for unified chat history
CREATE OR REPLACE VIEW user_chat_history AS
SELECT
  cm.id,
  cm.thread_id,
  cm.user_id,
  cm.role,
  cm.content,
  cm.created_at,
  ct.channel,
  cm.metadata->>'phone' AS whatsapp_phone,
  cm.metadata->>'wa_message_id' AS wa_message_id,
  p.name AS user_name,
  p.whatsapp
FROM chat_messages cm
JOIN chat_threads ct ON cm.thread_id = ct.id
JOIN profiles p ON cm.user_id = p.id
ORDER BY cm.created_at ASC;
