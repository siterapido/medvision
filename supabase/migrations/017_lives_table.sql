-- =====================================================
-- Migration 017: Tabela de lives e políticas
-- =====================================================

CREATE TABLE IF NOT EXISTS public.lives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  instructor text,
  scheduled_at timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'agendada',
  thumbnail_url text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT lives_status_check CHECK (status IN ('agendada','realizada','cancelada'))
);

CREATE INDEX IF NOT EXISTS lives_created_at_idx ON public.lives (created_at DESC);
CREATE INDEX IF NOT EXISTS lives_scheduled_at_idx ON public.lives (scheduled_at);

ALTER TABLE public.lives ENABLE ROW LEVEL SECURITY;

-- Leitura pública de lives publicadas
CREATE POLICY "Anyone can read lives"
  ON public.lives FOR SELECT
  USING (is_published = true);

-- Admins podem gerir lives
CREATE POLICY "Admins podem gerir lives"
  ON public.lives FOR INSERT, UPDATE, DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles admins
      WHERE admins.id = auth.uid()
        AND admins.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles admins
      WHERE admins.id = auth.uid()
        AND admins.role = 'admin'
    )
  );