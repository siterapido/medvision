-- Add whatsapp column to profiles if it doesn't exist (it was removed in 015)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp text;

COMMENT ON COLUMN public.profiles.whatsapp IS 'Número de WhatsApp para notificações (formato E.164)';

-- Notification Templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    content text NOT NULL,
    trigger_type text NOT NULL CHECK (trigger_type IN ('cron', 'manual', 'event')),
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Notification Logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_id uuid REFERENCES public.notification_templates(id),
    channel text DEFAULT 'whatsapp',
    status text NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    sent_at timestamptz DEFAULT now(),
    content text,
    response_data jsonb,
    error_message text
);

-- RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Templates (Admin only)
CREATE POLICY "Admins can manage templates"
ON public.notification_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Policies for Logs (Admin view all, User view own)
CREATE POLICY "Admins can view all logs"
ON public.notification_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Seed initial templates
INSERT INTO public.notification_templates (name, description, content, trigger_type)
VALUES 
('trial_warning_3_days', 'Aviso de 3 dias restantes do trial', 'Olá {{name}}, seu período gratuito do OdontoGPT acaba em 3 dias! Aproveite para explorar todas as funcionalidades.', 'cron'),
('trial_expired', 'Aviso de trial expirado', 'Olá {{name}}, seu período de testes do OdontoGPT expirou. Assine agora para continuar tendo acesso!', 'cron'),
('subscription_expired', 'Aviso de assinatura expirada', 'Olá {{name}}, sua assinatura do OdontoGPT expirou. Renove agora para não perder o acesso.', 'cron')
ON CONFLICT (name) DO NOTHING;












