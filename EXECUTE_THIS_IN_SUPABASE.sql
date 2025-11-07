-- =====================================================
-- INSTRUÇÕES DE EXECUÇÃO
-- =====================================================
-- 1. Acesse: https://supabase.com/dashboard/project/qphofwxpmmhfplylozsh/sql/new
-- 2. Copie TODO o conteúdo deste arquivo
-- 3. Cole no SQL Editor
-- 4. Clique em "RUN" ou pressione Ctrl+Enter
-- 5. Aguarde a mensagem de sucesso
-- =====================================================

-- =====================================================
-- MIGRATION 009: Storage Buckets
-- =====================================================

-- Insert bucket for course assets (thumbnails, materials, etc)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-assets',
  'course-assets',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view course assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload course assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update course assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete course assets" ON storage.objects;

-- Policy: Anyone can view files in course-assets
CREATE POLICY "Anyone can view course assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-assets');

-- Policy: Authenticated users can upload to course-assets
CREATE POLICY "Authenticated users can upload course assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-assets'
    AND auth.role() = 'authenticated'
  );

-- Policy: Authenticated users can update their own uploads
CREATE POLICY "Authenticated users can update course assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'course-assets'
    AND auth.role() = 'authenticated'
  );

-- Policy: Authenticated users can delete their own uploads
CREATE POLICY "Authenticated users can delete course assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course-assets'
    AND auth.role() = 'authenticated'
  );

-- =====================================================
-- MIGRATION 010: Course Structure Refactor
-- =====================================================

-- =====================================================
-- 1. ADD MISSING FIELDS TO COURSES TABLE
-- =====================================================

-- Add core fields first (may already exist from migration 002)
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS lessons_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration text;

-- Add metadata fields to courses if they don't exist
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS difficulty text,
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS price text,
  ADD COLUMN IF NOT EXISTS tags text,
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Add constraints separately to avoid errors if columns already exist with constraints
DO $$
BEGIN
  -- Add difficulty constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_difficulty_check'
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_difficulty_check
      CHECK (difficulty IN ('Iniciante', 'Intermediário', 'Avançado'));
  END IF;

  -- Add format constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_format_check'
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_format_check
      CHECK (format IN ('100% online', 'Híbrido', 'Presencial'));
  END IF;
END $$;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS courses_is_published_idx ON public.courses(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS courses_area_idx ON public.courses(area);
CREATE INDEX IF NOT EXISTS courses_difficulty_idx ON public.courses(difficulty);

-- Add comments
COMMENT ON COLUMN public.courses.area IS 'Área/especialidade do curso (ex: Implantodontia, Endodontia)';
COMMENT ON COLUMN public.courses.difficulty IS 'Nível de dificuldade: Iniciante, Intermediário ou Avançado';
COMMENT ON COLUMN public.courses.format IS 'Formato de entrega: 100% online, Híbrido ou Presencial';
COMMENT ON COLUMN public.courses.price IS 'Preço sugerido (texto livre, ex: R$ 1.497)';
COMMENT ON COLUMN public.courses.tags IS 'Tags separadas por vírgula para busca e filtros';
COMMENT ON COLUMN public.courses.is_published IS 'Indica se o curso está publicado e visível para alunos';
COMMENT ON COLUMN public.courses.published_at IS 'Data/hora de publicação do curso';

-- =====================================================
-- 2. ENSURE LESSONS HAS ALL REQUIRED FIELDS
-- =====================================================

-- These were added in migration 007, but ensure they exist
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS module_title text,
  ADD COLUMN IF NOT EXISTS materials jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS available_at timestamptz;

-- Ensure constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lessons_materials_is_array'
  ) THEN
    ALTER TABLE public.lessons
      ADD CONSTRAINT lessons_materials_is_array CHECK (jsonb_typeof(materials) = 'array');
  END IF;
END $$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS lessons_module_title_idx ON public.lessons(module_title);
CREATE INDEX IF NOT EXISTS lessons_available_at_idx ON public.lessons(available_at);

-- =====================================================
-- 3. UPDATE COURSE_RESOURCES TO SUPPORT LESSON ATTACHMENT
-- =====================================================

-- This was added in migration 007, ensure it exists
ALTER TABLE public.course_resources
  ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS course_resources_lesson_idx ON public.course_resources(lesson_id);

-- =====================================================
-- 4. CREATE FUNCTION TO AUTO-UPDATE LESSONS_COUNT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_course_lessons_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.courses
    SET lessons_count = (
      SELECT COUNT(*)
      FROM public.lessons
      WHERE course_id = NEW.course_id
    )
    WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.courses
    SET lessons_count = (
      SELECT COUNT(*)
      FROM public.lessons
      WHERE course_id = OLD.course_id
    )
    WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update lessons_count
DROP TRIGGER IF EXISTS trigger_update_lessons_count ON public.lessons;
CREATE TRIGGER trigger_update_lessons_count
  AFTER INSERT OR DELETE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_lessons_count();

-- =====================================================
-- 5. CREATE FUNCTION TO AUTO-SET PUBLISHED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_course_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true AND (OLD.is_published IS NULL OR OLD.is_published = false) THEN
    NEW.published_at = NOW();
  ELSIF NEW.is_published = false THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_published_at ON public.courses;
CREATE TRIGGER trigger_set_published_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_course_published_at();

-- =====================================================
-- 6. UPDATE RLS POLICIES FOR ADMIN OPERATIONS
-- =====================================================

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Admins podem gerenciar cursos" ON public.courses;
DROP POLICY IF EXISTS "Admins podem gerenciar aulas" ON public.lessons;
DROP POLICY IF EXISTS "Admins podem gerenciar recursos de curso" ON public.course_resources;

-- Recreate policies with proper admin checks
CREATE POLICY "Admins podem gerenciar cursos"
  ON public.courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins podem gerenciar aulas"
  ON public.lessons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins podem gerenciar recursos de curso"
  ON public.course_resources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 7. CREATE HELPER VIEW FOR ADMIN COURSE LISTING
-- =====================================================

DROP VIEW IF EXISTS public.admin_courses_with_stats;

CREATE VIEW public.admin_courses_with_stats AS
SELECT
  c.id,
  c.title,
  c.description,
  c.area,
  c.difficulty,
  c.format,
  c.price,
  c.thumbnail_url,
  c.duration,
  c.lessons_count,
  c.tags,
  c.is_published,
  c.published_at,
  c.created_at,
  c.updated_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', l.id,
        'title', l.title,
        'module_title', l.module_title,
        'duration_minutes', l.duration_minutes,
        'video_url', l.video_url,
        'order_index', l.order_index,
        'materials', l.materials,
        'available_at', l.available_at
      ) ORDER BY l.order_index
    ) FILTER (WHERE l.id IS NOT NULL),
    '[]'
  ) as lessons
FROM public.courses c
LEFT JOIN public.lessons l ON l.course_id = c.id
GROUP BY c.id, c.title, c.description, c.area, c.difficulty, c.format,
         c.price, c.thumbnail_url, c.duration, c.lessons_count, c.tags,
         c.is_published, c.published_at, c.created_at, c.updated_at
ORDER BY c.updated_at DESC;

-- Grant access to authenticated users (admins will see via RLS)
GRANT SELECT ON public.admin_courses_with_stats TO authenticated;

-- =====================================================
-- 8. FIX EXISTING DATA
-- =====================================================

-- Set default values for existing courses
UPDATE public.courses
SET
  is_published = COALESCE(is_published, true),
  published_at = COALESCE(published_at, created_at),
  difficulty = COALESCE(difficulty, 'Intermediário'),
  format = COALESCE(format, '100% online')
WHERE is_published IS NULL OR difficulty IS NULL OR format IS NULL;

-- Ensure all lessons have proper order_index
WITH ordered_lessons AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY created_at) - 1 as new_order
  FROM public.lessons
  WHERE order_index IS NULL
)
UPDATE public.lessons l
SET order_index = ol.new_order
FROM ordered_lessons ol
WHERE l.id = ol.id;

-- Initialize materials as empty array if null
UPDATE public.lessons
SET materials = '[]'::jsonb
WHERE materials IS NULL;

-- Update lessons_count for all courses
UPDATE public.courses c
SET lessons_count = (
  SELECT COUNT(*)
  FROM public.lessons l
  WHERE l.course_id = c.id
);

-- =====================================================
-- COMPLETED ✅
-- =====================================================
-- As migrations 009 e 010 foram aplicadas com sucesso!
-- Verifique abaixo se há algum erro. Se não houver, tudo está pronto!
-- =====================================================

SELECT 'Migration completed successfully! ✅' as status;
