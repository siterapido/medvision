-- =====================================================
-- Migration: Lesson Modules
-- Created: 2025-11-09
-- Description: Cria módulos de aulas e conecta lessons.module_id
-- =====================================================

-- 1. Tabela de módulos
CREATE TABLE IF NOT EXISTS public.lesson_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS lesson_modules_course_title_idx
  ON public.lesson_modules (course_id, lower(title));
CREATE INDEX IF NOT EXISTS lesson_modules_course_idx
  ON public.lesson_modules (course_id);
CREATE INDEX IF NOT EXISTS lesson_modules_order_idx
  ON public.lesson_modules (course_id, order_index);

CREATE OR REPLACE FUNCTION public.lesson_modules_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lesson_modules_updated_at ON public.lesson_modules;
CREATE TRIGGER lesson_modules_updated_at
  BEFORE UPDATE ON public.lesson_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.lesson_modules_set_updated_at();

-- 2. Relacionar aulas aos módulos
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.lesson_modules(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.lessons.module_id IS 'Módulo ao qual a aula pertence.';

-- 3. Popular módulos existentes
WITH distinct_modules AS (
  SELECT
    course_id,
    COALESCE(NULLIF(trim(module_title), ''), 'Sem módulo') AS title,
    MIN(order_index) AS sample_order
  FROM public.lessons
  GROUP BY course_id, COALESCE(NULLIF(trim(module_title), ''), 'Sem módulo')
)
INSERT INTO public.lesson_modules (course_id, title, order_index)
SELECT
  course_id,
  title,
  ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY sample_order, title) - 1
FROM distinct_modules
WHERE NOT EXISTS (
  SELECT 1
  FROM public.lesson_modules existing
  WHERE existing.course_id = distinct_modules.course_id
    AND lower(existing.title) = lower(distinct_modules.title)
);

UPDATE public.lessons l
SET
  module_id = m.id,
  module_title = m.title
FROM public.lesson_modules m
WHERE m.course_id = l.course_id
  AND COALESCE(NULLIF(trim(l.module_title), ''), 'Sem módulo') = m.title;

-- 4. Políticas e permissões
DROP POLICY IF EXISTS "Admins podem gerenciar módulos" ON public.lesson_modules;
CREATE POLICY "Admins podem gerenciar módulos"
  ON public.lesson_modules
  FOR ALL
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

GRANT SELECT ON public.lesson_modules TO authenticated;

-- =====================================================
-- FINALIZADO
-- =====================================================
