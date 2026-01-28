-- Migration to add 'report' type for Clinical Reports (Laudos/Prescrições)

ALTER TYPE artifact_type ADD VALUE IF NOT EXISTS 'report';

COMMENT ON TYPE artifact_type IS 'Tipos de artifacts: chat, document, code, image, research, exam, summary, flashcards, mindmap, report, other';
