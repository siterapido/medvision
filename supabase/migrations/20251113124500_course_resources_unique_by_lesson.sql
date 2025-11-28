-- =====================================================
-- Migration: Ajuste de unicidade de materiais por aula
-- Criado: 2025-11-13
-- Descrição: Permite títulos repetidos em cursos distintos e garante unicidade por aula
-- =====================================================

BEGIN;

-- Remover constraint anterior (unicidade por curso + título)
ALTER TABLE public.course_resources
  DROP CONSTRAINT IF EXISTS course_resources_course_id_title_key;

-- Nova constraint: unicidade por curso + aula + título
ALTER TABLE public.course_resources
  ADD CONSTRAINT course_resources_course_lesson_title_key
  UNIQUE (course_id, lesson_id, title);

COMMIT;
