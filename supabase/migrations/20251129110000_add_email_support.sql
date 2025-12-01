-- Add subject and channel columns to notification_templates
ALTER TABLE public.notification_templates
ADD COLUMN IF NOT EXISTS subject text,
ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'email', 'sms'));

-- Update existing templates to be whatsapp
UPDATE public.notification_templates SET channel = 'whatsapp' WHERE channel IS NULL;

-- Add comment
COMMENT ON COLUMN public.notification_templates.subject IS 'Assunto do email (apenas para channel=email)';

-- Seed initial EMAIL templates
INSERT INTO public.notification_templates (name, description, content, subject, channel, trigger_type)
VALUES 
('trial_warning_3_days_email', 'Aviso de 3 dias restantes do trial (Email)', '<p>Olá {{name}},</p><p>Seu período gratuito do OdontoGPT acaba em <strong>3 dias</strong>!</p><p>Aproveite para explorar todas as funcionalidades.</p>', 'Seu trial acaba em 3 dias!', 'email', 'cron'),
('trial_expired_email', 'Aviso de trial expirado (Email)', '<p>Olá {{name}},</p><p>Seu período de testes do OdontoGPT expirou.</p><p><a href="https://odontogpt.com/dashboard/assinatura">Assine agora</a> para continuar tendo acesso!</p>', 'Seu trial expirou', 'email', 'cron')
ON CONFLICT (name) DO NOTHING;




