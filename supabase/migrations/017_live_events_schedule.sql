-- =====================================================
-- Migration: Lives e lembretes em tempo real
-- Created: 2025-11-10
-- Description: Tabelas para agenda de lives e lembretes dos alunos
-- =====================================================

-- =====================================================
-- TABLE: live_events
-- =====================================================
CREATE TABLE IF NOT EXISTS public.live_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  start_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  instructor_name text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed')),
  is_featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS live_events_start_at_idx ON public.live_events(start_at);
CREATE INDEX IF NOT EXISTS live_events_status_idx ON public.live_events(status);

ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver lives"
  ON public.live_events FOR SELECT
  USING (true);

CREATE POLICY "Admins podem gerenciar lives"
  ON public.live_events FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles admins
      WHERE admins.id = auth.uid() AND admins.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles admins
      WHERE admins.id = auth.uid() AND admins.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS live_events_instructor_idx ON public.live_events(instructor_name);

-- Trigger para atualizar updated_at
CREATE TRIGGER on_live_events_updated
  BEFORE UPDATE ON public.live_events
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

COMMENT ON TABLE public.live_events IS 'Agenda de lives ao vivo exibida para alunos';
COMMENT ON COLUMN public.live_events.status IS 'scheduled, live ou completed';

-- =====================================================
-- TABLE: live_event_reminders
-- =====================================================
CREATE TABLE IF NOT EXISTS public.live_event_reminders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.live_events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS live_event_reminders_user_idx ON public.live_event_reminders(user_id);
CREATE INDEX IF NOT EXISTS live_event_reminders_event_idx ON public.live_event_reminders(event_id);

ALTER TABLE public.live_event_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus lembretes"
  ON public.live_event_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar lembretes"
  ON public.live_event_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover lembretes"
  ON public.live_event_reminders FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar lembretes"
  ON public.live_event_reminders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.live_event_reminders IS 'Registros dos lembretes ativados pelos alunos para lives';
