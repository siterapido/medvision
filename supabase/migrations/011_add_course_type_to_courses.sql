-- =====================================================
-- Migration: Add course_type to courses
-- Created: 2025-11-09
-- Description: Adds the course_type column required by the admin UI
-- =====================================================

BEGIN;

-- 1. Add column if missing and backfill existing records
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS course_type text;

UPDATE public.courses
SET course_type = COALESCE(course_type, 'Ondonto GPT');

ALTER TABLE public.courses
  ALTER COLUMN course_type SET DEFAULT 'Ondonto GPT',
  ALTER COLUMN course_type SET NOT NULL;

-- 2. Ensure check constraint limits the allowed types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_course_type_check'
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_course_type_check
      CHECK (course_type IN ('Ondonto GPT', 'Premium'));
  END IF;
END $$;

-- 3. Keep admin view in sync with the new column
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
         c.price, c.course_type, c.thumbnail_url, c.duration, c.lessons_count, c.tags,
         c.is_published, c.published_at, c.created_at, c.updated_at
ORDER BY c.updated_at DESC;

COMMIT;
