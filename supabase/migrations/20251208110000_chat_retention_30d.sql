-- Migration: Chat retention window of 30 days
-- Created: 2025-12-08
-- Description: ensures chat messages/threads are kept for 30 days and cleaned up automatically

-- Enable pg_cron for scheduled cleanup (no-op if already enabled)
create extension if not exists "pg_cron";

-- Function: remove chat history older than 30 days and clean up stale threads
create or replace function public.cleanup_chat_history()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Delete messages older than 30 days
  delete from public.chat_messages
  where created_at < timezone('utc'::text, now()) - interval '30 days';

  -- Remove threads with no recent activity (after messages are removed)
  delete from public.chat_threads ct
  where ct.last_message_at < timezone('utc'::text, now()) - interval '30 days'
    and not exists (
      select 1
      from public.chat_messages cm
      where cm.thread_id = ct.id
    );
end;
$$;

-- Schedule daily cleanup at 03:00 UTC
do $$
begin
  -- unschedule gracefully if the job already exists
  perform cron.unschedule('chat_cleanup_30d');
exception
  when others then
    null;
end;
$$;

select
  cron.schedule(
    'chat_cleanup_30d',
    '0 3 * * *',
    $$call public.cleanup_chat_history();$$
  );

