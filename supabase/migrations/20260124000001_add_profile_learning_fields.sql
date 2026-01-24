-- Migration: Add Learning and Memory Fields to Profiles
-- Created: 2026-01-24
-- Purpose: Support the memory system and progressive setup

-- Add learning preferences fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS learning_style text
  CHECK (learning_style IN ('visual', 'reading', 'practice', 'mixed'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS response_preference text
  CHECK (response_preference IN ('direct', 'didactic', 'hybrid'))
  DEFAULT 'hybrid';

-- Add knowledge tracking fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS knowledge_gaps text[] DEFAULT '{}';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mastered_topics text[] DEFAULT '{}';

-- Add setup progress fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS setup_level int DEFAULT 1
  CHECK (setup_level BETWEEN 1 AND 3);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS setup_completed_at timestamptz;

-- Add conversation counter for progressive setup
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS conversation_count int DEFAULT 0;

-- Add comments
COMMENT ON COLUMN public.profiles.learning_style IS 'Estilo de aprendizado preferido (visual, leitura, pratico, misto)';
COMMENT ON COLUMN public.profiles.response_preference IS 'Preferencia de tipo de resposta (direto, didatico, hibrido)';
COMMENT ON COLUMN public.profiles.knowledge_gaps IS 'Topicos onde o aluno tem dificuldade';
COMMENT ON COLUMN public.profiles.mastered_topics IS 'Topicos que o aluno ja domina';
COMMENT ON COLUMN public.profiles.setup_level IS 'Nivel do setup progressivo (1-3)';
COMMENT ON COLUMN public.profiles.setup_completed_at IS 'Data de conclusao do setup';
COMMENT ON COLUMN public.profiles.conversation_count IS 'Contador de conversas para setup progressivo';
