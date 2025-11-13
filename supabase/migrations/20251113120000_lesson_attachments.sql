-- ============================================================================
-- LESSON ATTACHMENTS: Tabela de metadados e bucket privado para anexos de aulas
-- ============================================================================

-- 1) Bucket privado para anexos de aulas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-attachments',
  'lesson-attachments',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- docx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', -- pptx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- xlsx
    'application/msword', -- doc
    'application/vnd.ms-powerpoint', -- ppt
    'application/vnd.ms-excel', -- xls
    'application/zip',
    'application/x-7z-compressed',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- OBS: Sem políticas de SELECT/INSERT/UPDATE/DELETE para este bucket
-- O acesso será mediado via endpoints usando service role para gerar URLs assinadas.

-- 2) Tabela de metadados dos anexos de aula
CREATE TABLE IF NOT EXISTS public.lesson_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  storage_path text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_attachments_lesson_id ON public.lesson_attachments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attachments_created_at ON public.lesson_attachments(created_at DESC);

-- 3) Habilitar RLS (apenas se for usado acesso direto; endpoints usarão service role)
ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;

-- Política: SELECT permitido para admins ou usuários participantes do curso da aula
DROP POLICY IF EXISTS "Selecionar anexos da aula (users/admin)" ON public.lesson_attachments;
CREATE POLICY "Selecionar anexos da aula (users/admin)"
  ON public.lesson_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_id
    )
    AND (
      -- Admin
      EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
      )
      OR
      -- Participante do curso (tem registro em user_courses)
      EXISTS (
        SELECT 1
        FROM public.lessons l
        JOIN public.user_courses uc ON uc.course_id = l.course_id AND uc.user_id = auth.uid()
        WHERE l.id = lesson_id
      )
    )
  );

-- Política: INSERT/DELETE restritas a admins (se usado direto)
DROP POLICY IF EXISTS "Admins podem inserir anexos" ON public.lesson_attachments;
CREATE POLICY "Admins podem inserir anexos"
  ON public.lesson_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins podem remover anexos" ON public.lesson_attachments;
CREATE POLICY "Admins podem remover anexos"
  ON public.lesson_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

