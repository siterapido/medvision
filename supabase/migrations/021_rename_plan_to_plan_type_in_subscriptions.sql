-- =====================================================
-- Rename 'plan' column to 'plan_type' in subscriptions table
-- =====================================================

-- Rename the column
ALTER TABLE public.subscriptions
RENAME COLUMN plan TO plan_type;

-- Update the constraint
ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_plan_type_check
CHECK (plan_type in ('monthly', 'annual'));

-- Update comment
COMMENT ON COLUMN public.subscriptions.plan_type IS 'Tipo de plano da subscrição (monthly, annual)';

-- =====================================================
-- Log this migration
-- =====================================================

INSERT INTO public.webhook_events_log (
  event_type,
  event_source,
  status,
  details
) VALUES (
  'migration',
  'system',
  'success',
  'Renamed subscriptions.plan to subscriptions.plan_type'
);
