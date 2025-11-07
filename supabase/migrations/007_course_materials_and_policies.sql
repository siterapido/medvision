-- =====================================================
-- Admin course builder support: lesson modules/materials + RLS for writes
-- =====================================================

-- Add richer metadata to lessons so o admin consiga organizar módulos e anexos
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS module_title text,
  ADD COLUMN IF NOT EXISTS materials jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS available_at timestamptz;

ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_materials_is_array CHECK (jsonb_typeof(materials) = 'array');

COMMENT ON COLUMN public.lessons.module_title IS 'Nome do módulo/grupo ao qual a aula pertence.';
COMMENT ON COLUMN public.lessons.materials IS 'Lista de materiais anexados à aula (JSON array com title, type, url).';
COMMENT ON COLUMN public.lessons.available_at IS 'Data em que a aula libera para os alunos.';

CREATE INDEX IF NOT EXISTS lessons_module_title_idx ON public.lessons(module_title);
CREATE INDEX IF NOT EXISTS lessons_available_at_idx ON public.lessons(available_at);

-- Permitir anexar recursos diretamente à aula
ALTER TABLE public.course_resources
  ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS course_resources_lesson_idx ON public.course_resources(lesson_id);

-- =====================================================
-- RLS: admins podem gerenciar cursos, aulas e recursos
-- =====================================================
CREATE POLICY IF NOT EXISTS "Admins podem gerenciar cursos"
  ON public.courses
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

CREATE POLICY IF NOT EXISTS "Admins podem gerenciar aulas"
  ON public.lessons
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

CREATE POLICY IF NOT EXISTS "Admins podem gerenciar recursos de curso"
  ON public.course_resources
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
