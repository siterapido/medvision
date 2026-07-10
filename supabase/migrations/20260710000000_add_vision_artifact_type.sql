-- Add vision artifact type for Med Vision laudos
ALTER TYPE artifact_type ADD VALUE IF NOT EXISTS 'vision';

COMMENT ON TYPE artifact_type IS 'Tipos de artifacts: chat, document, code, image, research, exam, summary, flashcards, mindmap, report, quiz, diagram, text, vision, other';
