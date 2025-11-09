-- =====================================================
-- Migration: Add duration_minutes to courses
-- Created: 2025-11-09
-- Description: Track course duration in minutes alongside the free-text duration column
-- =====================================================

BEGIN;

-- 1. Add the column and populate from existing duration text when possible
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS duration_minutes integer;

UPDATE public.courses
SET duration_minutes = NULLIF(REGEXP_REPLACE(duration, '\\D', '', 'g'), '')::integer
WHERE duration IS NOT NULL
  AND (duration_minutes IS NULL OR duration_minutes = 0);

-- 2. Keep the admin view in sync with the new column
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
         c.price, c.course_type, c.duration_minutes, c.thumbnail_url, c.duration,
         c.lessons_count, c.tags, c.is_published, c.published_at, c.created_at, c.updated_at
ORDER BY c.updated_at DESC;

COMMIT;
