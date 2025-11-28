-- =====================================================
-- Migration: Garantir UUIDs válidos para lessons.id
-- Criado: 2025-11-13
-- Descrição: Corrige IDs de aulas inválidos e atualiza FKs com ON UPDATE CASCADE
-- =====================================================

BEGIN;

-- 1) Extensão necessária para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2) Coluna temporária para novos IDs válidos
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS id_temp uuid;

-- 3) Preenche id_temp: preserva UUID válido, gera um novo caso contrário
UPDATE public.lessons
SET id_temp = CASE
  WHEN id IS NOT NULL
    AND id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    THEN id::uuid
  ELSE gen_random_uuid()
END
WHERE id_temp IS NULL;

-- 4) Mapa temporário old_id -> new_id para atualizar FKs
CREATE TEMP TABLE lesson_id_map AS
SELECT id::text AS old_id, id_temp AS new_id
FROM public.lessons;

-- 5) Atualiza tabelas que referenciam lessons.id
DO $$
BEGIN
  IF to_regclass('public.user_lessons') IS NOT NULL THEN
    UPDATE public.user_lessons ul
    SET lesson_id = m.new_id
    FROM lesson_id_map m
    WHERE ul.lesson_id::text = m.old_id;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.lesson_progress') IS NOT NULL THEN
    UPDATE public.lesson_progress lp
    SET lesson_id = m.new_id
    FROM lesson_id_map m
    WHERE lp.lesson_id::text = m.old_id;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.course_resources') IS NOT NULL THEN
    UPDATE public.course_resources cr
    SET lesson_id = m.new_id
    FROM lesson_id_map m
    WHERE cr.lesson_id::text = m.old_id;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.lesson_attachments') IS NOT NULL THEN
    UPDATE public.lesson_attachments la
    SET lesson_id = m.new_id
    FROM lesson_id_map m
    WHERE la.lesson_id::text = m.old_id;
  END IF;
END $$;

-- 6) Remove view dependente para evitar conflito ao trocar PK
DROP VIEW IF EXISTS public.admin_courses_with_stats CASCADE;

-- 7) Remove FKs antigas (serão recriadas com ON UPDATE CASCADE)
DO $$
BEGIN
  IF to_regclass('public.user_lessons') IS NOT NULL THEN
    ALTER TABLE public.user_lessons DROP CONSTRAINT IF EXISTS user_lessons_lesson_id_fkey;
  END IF;
  IF to_regclass('public.lesson_progress') IS NOT NULL THEN
    ALTER TABLE public.lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_lesson_id_fkey;
  END IF;
  IF to_regclass('public.course_resources') IS NOT NULL THEN
    ALTER TABLE public.course_resources DROP CONSTRAINT IF EXISTS course_resources_lesson_id_fkey;
  END IF;
  IF to_regclass('public.lesson_attachments') IS NOT NULL THEN
    ALTER TABLE public.lesson_attachments DROP CONSTRAINT IF EXISTS lesson_attachments_lesson_id_fkey;
  END IF;
END $$;

-- 8) Troca a coluna de ID
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_pkey;
ALTER TABLE public.lessons DROP COLUMN IF EXISTS id;
ALTER TABLE public.lessons RENAME COLUMN id_temp TO id;
ALTER TABLE public.lessons
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.lessons ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);

-- 9) Recria FKs com ON UPDATE CASCADE
DO $$
BEGIN
  IF to_regclass('public.user_lessons') IS NOT NULL THEN
    ALTER TABLE public.user_lessons
      ADD CONSTRAINT user_lessons_lesson_id_fkey FOREIGN KEY (lesson_id)
      REFERENCES public.lessons(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF to_regclass('public.lesson_progress') IS NOT NULL THEN
    ALTER TABLE public.lesson_progress
      ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id)
      REFERENCES public.lessons(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF to_regclass('public.course_resources') IS NOT NULL THEN
    ALTER TABLE public.course_resources
      ADD CONSTRAINT course_resources_lesson_id_fkey FOREIGN KEY (lesson_id)
      REFERENCES public.lessons(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF to_regclass('public.lesson_attachments') IS NOT NULL THEN
    ALTER TABLE public.lesson_attachments
      ADD CONSTRAINT lesson_attachments_lesson_id_fkey FOREIGN KEY (lesson_id)
      REFERENCES public.lessons(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 10) Recria a view administrativa
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

-- 11) Limpa o mapa temporário
DROP TABLE IF EXISTS lesson_id_map;

COMMIT;
