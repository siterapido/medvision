-- Migration: Re-engagement Templates
-- Description: Templates para rotinas de re-engajamento via WhatsApp

-- ============================================
-- Templates de Re-engajamento
-- ============================================
INSERT INTO notification_templates (name, content, trigger_type, channel, active) VALUES
-- Usuário em risco de churn
('reengagement_churn_risk',
 'Oi {{name}}! 👋 Notei que faz um tempo que você não acessa o OdontoGPT. Posso ajudar com alguma dificuldade? Estou aqui para apoiar seus estudos!',
 'cron', 'whatsapp', true),

-- Usuário inativo há 3+ dias
('reengagement_inactive',
 'Olá {{name}}! 📚 Sentimos sua falta no OdontoGPT. Tem alguma dúvida sobre odontologia que posso ajudar? Responda a qualquer momento!',
 'cron', 'whatsapp', true),

-- Usuário inativo há 7+ dias
('reengagement_inactive_7days',
 'Oi {{name}}! 🦷 Lembrei de você! Já faz uma semana desde nossa última conversa. Que tal tirar aquela dúvida que você estava guardando?',
 'cron', 'whatsapp', true),

-- Boas-vindas para novo cadastro via WhatsApp
('whatsapp_welcome',
 'Seja bem-vindo(a) ao OdontoGPT, {{name}}! 🎉 Sou seu mentor virtual de odontologia. Me pergunte qualquer dúvida sobre a área. Estou aqui 24h para ajudar!',
 'event', 'whatsapp', true),

-- Lembrete de trial acabando (WhatsApp específico)
('trial_ending_whatsapp',
 'Ei {{name}}! ⏰ Seu período de teste acaba em 3 dias. Aproveite para explorar todos os recursos do OdontoGPT! Precisa de ajuda?',
 'cron', 'whatsapp', true)

ON CONFLICT (name) DO UPDATE SET
  content = EXCLUDED.content,
  trigger_type = EXCLUDED.trigger_type,
  channel = EXCLUDED.channel,
  active = EXCLUDED.active;

-- Comentário
COMMENT ON TABLE notification_templates IS 'Templates de notificação incluindo re-engajamento via WhatsApp';
