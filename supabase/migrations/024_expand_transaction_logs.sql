-- Ajusta transaction_logs para armazenar todos os dados usados pela função Cakto

ALTER TABLE public.transaction_logs
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_cpf text,
  ADD COLUMN IF NOT EXISTS amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS error_message text;

ALTER TABLE public.transaction_logs
  RENAME COLUMN payload TO webhook_payload;
