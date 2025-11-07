-- =====================================================
-- MIGRATION SIMPLIFICADA - EXECUTE ISTO PRIMEIRO
-- =====================================================
-- 1. Acesse: https://supabase.com/dashboard/project/qphofwxpmmhfplylozsh/sql/new
-- 2. Copie e cole APENAS este script
-- 3. Clique em RUN
-- 4. Aguarde completar
-- 5. Após sucesso, recarregue a página do dashboard
-- =====================================================

-- PASSO 1: Adicionar TODAS as colunas necessárias
DO $$
BEGIN
  -- Adicionar thumbnail_url se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN thumbnail_url text;
  END IF;

  -- Adicionar lessons_count se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'lessons_count'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN lessons_count integer DEFAULT 0;
  END IF;

  -- Adicionar duration se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'duration'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN duration text;
  END IF;

  -- Adicionar created_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN created_at timestamptz DEFAULT timezone('utc'::text, now());
  END IF;

  -- Adicionar updated_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN updated_at timestamptz DEFAULT timezone('utc'::text, now());
  END IF;

  -- Adicionar area se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'area'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN area text;
  END IF;

  -- Adicionar difficulty se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN difficulty text;
  END IF;

  -- Adicionar format se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'format'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN format text;
  END IF;

  -- Adicionar price se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'price'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN price text;
  END IF;

  -- Adicionar tags se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN tags text;
  END IF;

  -- Adicionar is_published se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN is_published boolean DEFAULT false;
  END IF;

  -- Adicionar published_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN published_at timestamptz;
  END IF;
END $$;

-- PASSO 2: Adicionar colunas em lessons
DO $$
BEGIN
  -- module_title
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'module_title'
  ) THEN
    ALTER TABLE public.lessons ADD COLUMN module_title text;
  END IF;

  -- materials
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'materials'
  ) THEN
    ALTER TABLE public.lessons ADD COLUMN materials jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- available_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'available_at'
  ) THEN
    ALTER TABLE public.lessons ADD COLUMN available_at timestamptz;
  END IF;
END $$;

-- PASSO 3: Adicionar lesson_id em course_resources
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_resources' AND column_name = 'lesson_id'
  ) THEN
    ALTER TABLE public.course_resources ADD COLUMN lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE;
  END IF;
END $$;

-- PASSO 4: Criar bucket de storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-assets',
  'course-assets',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
ON CONFLICT (id) DO NOTHING;

-- PASSO 5: Criar políticas de storage
DROP POLICY IF EXISTS "Anyone can view course assets" ON storage.objects;
CREATE POLICY "Anyone can view course assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-assets');

DROP POLICY IF EXISTS "Authenticated users can upload course assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload course assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'course-assets' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update course assets" ON storage.objects;
CREATE POLICY "Authenticated users can update course assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'course-assets' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete course assets" ON storage.objects;
CREATE POLICY "Authenticated users can delete course assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'course-assets' AND auth.role() = 'authenticated');

-- PASSO 6: Criar função e trigger para lessons_count
CREATE OR REPLACE FUNCTION public.update_course_lessons_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.courses
    SET lessons_count = (SELECT COUNT(*) FROM public.lessons WHERE course_id = NEW.course_id)
    WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.courses
    SET lessons_count = (SELECT COUNT(*) FROM public.lessons WHERE course_id = OLD.course_id)
    WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lessons_count ON public.lessons;
CREATE TRIGGER trigger_update_lessons_count
  AFTER INSERT OR DELETE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_lessons_count();

-- PASSO 7: Criar função e trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_courses_updated ON public.courses;
CREATE TRIGGER on_courses_updated
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- PASSO 8: Criar políticas RLS para admins
DROP POLICY IF EXISTS "Admins podem gerenciar cursos" ON public.courses;
CREATE POLICY "Admins podem gerenciar cursos"
  ON public.courses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins podem gerenciar aulas" ON public.lessons;
CREATE POLICY "Admins podem gerenciar aulas"
  ON public.lessons FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins podem gerenciar recursos de curso" ON public.course_resources;
CREATE POLICY "Admins podem gerenciar recursos de curso"
  ON public.course_resources FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- PASSO 9: Atualizar dados existentes
UPDATE public.courses
SET
  is_published = COALESCE(is_published, true),
  published_at = COALESCE(published_at, created_at),
  difficulty = COALESCE(difficulty, 'Intermediário'),
  format = COALESCE(format, '100% online'),
  lessons_count = (SELECT COUNT(*) FROM public.lessons l WHERE l.course_id = courses.id)
WHERE TRUE;

UPDATE public.lessons
SET materials = '[]'::jsonb
WHERE materials IS NULL;

-- =====================================================
-- CONCLUÍDO! ✅
-- =====================================================
-- Agora RECARREGUE a página do Supabase Dashboard
-- Depois vá em: Settings > API > Refresh API Schemas
-- Ou simplesmente feche e abra novamente o dashboard
-- =====================================================

SELECT 'Migration completed! Recarregue o dashboard do Supabase.' as status;
