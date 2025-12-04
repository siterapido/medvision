-- Additional Templates for Subscription Lifecycle

-- WhatsApp Templates
INSERT INTO public.notification_templates (name, description, content, channel, trigger_type)
VALUES 
('subscription_expiring_3_days', 'Aviso de renovação em 3 dias', 'Olá {{name}}, sua assinatura do OdontoGPT renova em 3 dias. Verifique seu cartão para evitar interrupções.', 'whatsapp', 'cron')
ON CONFLICT (name) DO NOTHING;

-- Email Templates
INSERT INTO public.notification_templates (name, description, content, subject, channel, trigger_type)
VALUES 
('subscription_expiring_3_days_email', 'Aviso de renovação em 3 dias (Email)', '<p>Olá {{name}},</p><p>Sua assinatura do OdontoGPT renova em <strong>3 dias</strong>.</p><p>Garanta que seu método de pagamento está atualizado para continuar aproveitando todos os benefícios.</p>', 'Sua assinatura renova em breve', 'email', 'cron'),
('subscription_expired_email', 'Aviso de assinatura expirada (Email)', '<p>Olá {{name}},</p><p>Sua assinatura do OdontoGPT expirou.</p><p><a href="https://odontogpt.com/dashboard/assinatura">Renove agora</a> para recuperar seu acesso exclusivo.</p>', 'Sua assinatura expirou', 'email', 'cron')
ON CONFLICT (name) DO NOTHING;










