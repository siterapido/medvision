-- =====================================================
-- Kiwfy Webhook + WhatsApp Z-API integration metadata
-- =====================================================

-- Extend profiles table with purchase + WhatsApp metadata
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS kiwfy_purchase_id text,
ADD COLUMN IF NOT EXISTS kiwfy_plan text,
ADD COLUMN IF NOT EXISTS kiwfy_status text,
ADD COLUMN IF NOT EXISTS whatsapp_phone text,
ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_last_message_at timestamptz;

COMMENT ON COLUMN public.profiles.kiwfy_purchase_id IS 'Última compra da Kiwfy associada ao usuário';
COMMENT ON COLUMN public.profiles.kiwfy_plan IS 'Slug ou nome do plano comprado via Kiwfy';
COMMENT ON COLUMN public.profiles.kiwfy_status IS 'Status da assinatura que veio da Kiwfy';
COMMENT ON COLUMN public.profiles.whatsapp_phone IS 'Telefone normalizado (E.164) usado para notificações via WhatsApp';
COMMENT ON COLUMN public.profiles.whatsapp_opt_in IS 'Indica se o cliente autorizou receber mensagens pelo WhatsApp';
COMMENT ON COLUMN public.profiles.whatsapp_last_message_at IS 'Timestamp da última mensagem automática enviada pelo WhatsApp';

CREATE INDEX IF NOT EXISTS profiles_kiwfy_purchase_idx ON public.profiles (kiwfy_purchase_id);
CREATE INDEX IF NOT EXISTS profiles_whatsapp_phone_idx ON public.profiles (whatsapp_phone);

-- =====================================================
-- Tabela de auditoria dos webhooks/processamentos
-- =====================================================

CREATE TABLE IF NOT EXISTS public.kiwfy_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id text,
  event_type text,
  status text,
  email text,
  phone text,
  payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  whatsapp_status text,
  whatsapp_response jsonb,
  error text
);

COMMENT ON TABLE public.kiwfy_webhook_events IS 'Auditoria dos webhooks recebidos da Kiwfy e ações relacionadas ao WhatsApp';
COMMENT ON COLUMN public.kiwfy_webhook_events.purchase_id IS 'ID único da compra/encomenda na Kiwfy';
COMMENT ON COLUMN public.kiwfy_webhook_events.event_type IS 'Tipo do evento recebido da Kiwfy (ex: purchase.updated)';
COMMENT ON COLUMN public.kiwfy_webhook_events.status IS 'Status principal do pedido';
COMMENT ON COLUMN public.kiwfy_webhook_events.email IS 'E-mail associado ao evento';
COMMENT ON COLUMN public.kiwfy_webhook_events.phone IS 'Telefone bruto recebido';
COMMENT ON COLUMN public.kiwfy_webhook_events.payload IS 'Payload completo do webhook para depuração';
COMMENT ON COLUMN public.kiwfy_webhook_events.processed_at IS 'Momento em que o webhook foi processado pela API';
COMMENT ON COLUMN public.kiwfy_webhook_events.whatsapp_status IS 'Resultado do disparo via Z-API (ex: sent, skipped, failed)';
COMMENT ON COLUMN public.kiwfy_webhook_events.whatsapp_response IS 'Resposta bruta da Z-API quando aplicável';
COMMENT ON COLUMN public.kiwfy_webhook_events.error IS 'Mensagem de erro amigável quando algo falha';

ALTER TABLE public.kiwfy_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS kiwfy_webhook_events_purchase_idx ON public.kiwfy_webhook_events (purchase_id);
