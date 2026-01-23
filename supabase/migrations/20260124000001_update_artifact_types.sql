-- Adicionar novos valores ao enum artifact_type
-- Migration para expandir tipos de artifacts suportados

-- Adicionar novos tipos de artifacts
ALTER TYPE artifact_type ADD VALUE IF NOT EXISTS 'research';
ALTER TYPE artifact_type ADD VALUE IF NOT EXISTS 'exam';
ALTER TYPE artifact_type ADD VALUE IF NOT EXISTS 'summary';
ALTER TYPE artifact_type ADD VALUE IF NOT EXISTS 'flashcards';
ALTER TYPE artifact_type ADD VALUE IF NOT EXISTS 'mindmap';

-- Documentação do enum atualizado
COMMENT ON TYPE artifact_type IS 'Tipos de artifacts: chat, document, code, image, research, exam, summary, flashcards, mindmap, other';
