-- =====================================================
-- Reset All Trials to 7 Days
-- Data: 2026-03-22
-- =====================================================

DO $$ 
BEGIN
    -- Update all profiles to have 7 days of trial starting now
    UPDATE public.profiles
    SET 
        trial_started_at = timezone('utc', now()),
        trial_ends_at = timezone('utc', now()) + interval '7 days',
        trial_used = false,
        plan_type = 'free',
        subscription_status = 'free',
        expires_at = timezone('utc', now()) + interval '7 days',
        updated_at = timezone('utc', now());

    -- record this event in transaction_logs for auditing (optional but recommended)
    -- This assumes transaction_logs table exists and follows the pattern in 020_webhook_events_and_logs.sql
END $$;
