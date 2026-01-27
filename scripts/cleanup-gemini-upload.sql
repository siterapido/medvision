-- Gemini Flash PDF Upload Cleanup
-- WARNING: This will delete all Gemini Flash ingested documents
-- Run this only if you need to rollback and reprocess

-- Check how many documents will be deleted
SELECT
  COUNT(*) as documents_to_delete,
  COUNT(DISTINCT parent_document_id) as parent_documents_to_delete
FROM knowledge_documents
WHERE metadata->>'extractionMethod' = 'gemini-flash-vision';

-- Rollback (uncomment to execute)
-- DELETE FROM knowledge_documents
-- WHERE metadata->>'extractionMethod' = 'gemini-flash-vision';

-- If rollback is complete, verify:
-- SELECT COUNT(*) FROM knowledge_documents WHERE metadata->>'extractionMethod' = 'gemini-flash-vision';
