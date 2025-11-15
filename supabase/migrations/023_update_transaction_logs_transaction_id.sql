-- Convert transaction_logs.transaction_id from uuid to text
-- to allow storing external references like "test-<timestamp>"

ALTER TABLE public.transaction_logs
ALTER COLUMN transaction_id TYPE text
USING transaction_id::text;

COMMENT ON COLUMN public.transaction_logs.transaction_id
IS 'External transaction identifier coming from payment providers (text for compatibility).';
