-- =====================================================
-- Reversão da integração Kiwfy + WhatsApp Z-API
-- =====================================================

-- Remover campos específicos usados por esse fluxo
DROP INDEX IF EXISTS profiles_kiwfy_purchase_idx;
DROP INDEX IF EXISTS profiles_whatsapp_phone_idx;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS kiwfy_purchase_id,
  DROP COLUMN IF EXISTS kiwfy_plan,
  DROP COLUMN IF EXISTS kiwfy_status,
  DROP COLUMN IF EXISTS whatsapp_phone,
  DROP COLUMN IF EXISTS whatsapp_opt_in,
  DROP COLUMN IF EXISTS whatsapp_last_message_at;

-- Apagar a tabela de auditoria criada para o webhook e WhatsApp
DROP INDEX IF EXISTS kiwfy_webhook_events_purchase_idx;
DROP TABLE IF EXISTS public.kiwfy_webhook_events;
