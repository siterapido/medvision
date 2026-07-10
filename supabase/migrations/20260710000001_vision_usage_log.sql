-- Vision usage log (rate limiting / audit) + shared analysis cache (L2)

CREATE TABLE IF NOT EXISTS public.vision_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  model TEXT,
  specialty TEXT,
  cached BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_vision_usage_log_user_created
  ON public.vision_usage_log(user_id, created_at DESC);

ALTER TABLE public.vision_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vision_usage_log_select_own" ON public.vision_usage_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "vision_usage_log_insert_own" ON public.vision_usage_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shared cache across serverless instances (server/service writes)
CREATE TABLE IF NOT EXISTS public.vision_cache (
  cache_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vision_cache_expires ON public.vision_cache(expires_at);
