-- =====================================================
-- Migration: Garantir UUIDs válidos para courses.id
-- Criado: 2025-11-12
-- Descrição: Corrige IDs inválidos, atualiza FK e garante ON UPDATE CASCADE
-- =====================================================

BEGIN;

-- 1. Garante que a extensão necessária esteja disponível
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Cria coluna temporária para preservar os dados atuais com UUID válidos
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS id_temp uuid;

-- 3. Atualiza os novos valores gerando UUID quando o valor atual não bate com o padrão
UPDATE public.courses
SET id_temp = CASE
    WHEN id IS NOT NULL
      AND id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN id::uuid
    ELSE gen_random_uuid()
  END
WHERE id_temp IS NULL;

-- 4. Cria mapa temporário para atualizar as FK que ainda usam o valor antigo
CREATE TEMP TABLE course_id_map AS
SELECT id::text AS old_id, id_temp AS new_id
FROM public.courses;

-- 5. Atualiza todas as tabelas que referenciam public.courses(id)
UPDATE public.lessons l
SET course_id = m.new_id
FROM course_id_map m
WHERE l.course_id::text = m.old_id;

UPDATE public.user_courses uc
SET course_id = m.new_id
FROM course_id_map m
WHERE uc.course_id::text = m.old_id;

UPDATE public.course_resources cr
SET course_id = m.new_id
FROM course_id_map m
WHERE cr.course_id::text = m.old_id;

UPDATE public.course_category_map ccm
SET course_id = m.new_id
FROM course_id_map m
WHERE ccm.course_id::text = m.old_id;

UPDATE public.course_tag_map ctm
SET course_id = m.new_id
FROM course_id_map m
WHERE ctm.course_id::text = m.old_id;

UPDATE public.course_instructor_courses cic
SET course_id = m.new_id
FROM course_id_map m
WHERE cic.course_id::text = m.old_id;

UPDATE public.course_collection_courses cco
SET course_id = m.new_id
FROM course_id_map m
WHERE cco.course_id::text = m.old_id;

UPDATE public.lesson_modules lm
SET course_id = m.new_id
FROM course_id_map m
WHERE lm.course_id::text = m.old_id;

-- 6. Remove as FK antigas para poder renomear a PK
DROP VIEW IF EXISTS public.admin_courses_with_stats CASCADE;
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_course_id_fkey;
ALTER TABLE public.user_courses DROP CONSTRAINT IF EXISTS user_courses_course_id_fkey;
ALTER TABLE public.course_resources DROP CONSTRAINT IF EXISTS course_resources_course_id_fkey;
ALTER TABLE public.course_category_map DROP CONSTRAINT IF EXISTS course_category_map_course_id_fkey;
ALTER TABLE public.course_tag_map DROP CONSTRAINT IF EXISTS course_tag_map_course_id_fkey;
ALTER TABLE public.course_instructor_courses DROP CONSTRAINT IF EXISTS course_instructor_courses_course_id_fkey;
ALTER TABLE public.course_collection_courses DROP CONSTRAINT IF EXISTS course_collection_courses_course_id_fkey;
ALTER TABLE public.lesson_modules DROP CONSTRAINT IF EXISTS lesson_modules_course_id_fkey;

-- 7. Substitui a coluna id e preserva a PK
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_pkey;
ALTER TABLE public.courses DROP COLUMN IF EXISTS id;
ALTER TABLE public.courses RENAME COLUMN id_temp TO id;
ALTER TABLE public.courses
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.courses ADD CONSTRAINT courses_pkey PRIMARY KEY (id);

-- 8. Recria as FK usando ON UPDATE CASCADE
ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id)
  REFERENCES public.courses(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.user_courses
  ADD CONSTRAINT user_courses_course_id_fkey FOREIGN KEY (course_id)
  REFERENCES public.courses(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.course_resources
  ADD CONSTRAINT course_resources_course_id_fkey FOREIGN KEY (course_id)
  REFERENCES public.courses(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.course_category_map
  ADD CONSTRAINT course_category_map_course_id_fkey FOREIGN KEY (course_id)
  REFERENCES public.courses(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.course_tag_map
  ADD CONSTRAINT course_tag_map_course_id_fkey FOREIGN KEY (course_id)
  REFERENCES public.courses(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.course_instructor_courses
  ADD CONSTRAINT course_instructor_courses_course_id_fkey FOREIGN KEY (course_id)
  REFERENCES public.courses(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.course_collection_courses
  ADD CONSTRAINT course_collection_courses_course_id_fkey FOREIGN KEY (course_id)
  REFERENCES public.courses(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.lesson_modules
  ADD CONSTRAINT lesson_modules_course_id_fkey FOREIGN KEY (course_id)
  REFERENCES public.courses(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. Recria a view administrativa com os campos esperados
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

-- 10. Limpa o mapa temporário
DROP TABLE IF EXISTS course_id_map;

COMMIT;
