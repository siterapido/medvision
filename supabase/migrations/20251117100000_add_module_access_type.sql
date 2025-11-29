-- =====================================================
-- Migration: Add access_type to lesson_modules
-- Created: 2025-11-17
-- Description: Permite marcar módulos como gratuitos ou premium e expõe na view admin
-- =====================================================

BEGIN;

-- 1) Nova coluna de acesso nos módulos
ALTER TABLE public.lesson_modules
  ADD COLUMN IF NOT EXISTS access_type text DEFAULT 'free'
    CHECK (access_type IN ('free', 'premium'));

COMMENT ON COLUMN public.lesson_modules.access_type IS 'Define se o módulo é gratuito (free) ou premium.';

-- 2) Backfill para registros existentes
UPDATE public.lesson_modules
SET access_type = COALESCE(NULLIF(access_type, ''), 'free')
WHERE access_type IS NULL OR access_type NOT IN ('free', 'premium');

-- 3) Recria view administrativa incluindo o access_type do módulo
DROP VIEW IF EXISTS public.admin_courses_with_stats CASCADE;

CREATE OR REPLACE VIEW public.admin_courses_with_stats AS
SELECT
  c.id,
  c.title,
  c.description,
  c.area,
  c.difficulty,
  c.format,
  c.price,
  c.course_type,
  c.duration_minutes,
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
        'module_id', l.module_id,
        'module_access_type', lm.access_type,
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
LEFT JOIN public.lesson_modules lm ON lm.id = l.module_id
GROUP BY c.id, c.title, c.description, c.area, c.difficulty, c.format,
         c.price, c.course_type, c.duration_minutes, c.thumbnail_url, c.duration,
         c.lessons_count, c.tags, c.is_published, c.published_at, c.created_at, c.updated_at
ORDER BY c.updated_at DESC;

GRANT SELECT ON public.admin_courses_with_stats TO authenticated;

COMMIT;

-- =====================================================
-- FIM
-- =====================================================
