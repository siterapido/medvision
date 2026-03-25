-- Gemini Flash PDF Upload Validation
-- Run this after processing to verify uploads

-- 1. Total documents ingested with Gemini Flash
SELECT
  COUNT(*) as total_documents,
  COUNT(DISTINCT parent_document_id) as parent_documents,
  COUNT(DISTINCT specialty) as specialties
FROM knowledge_documents
WHERE metadata->>'extractionMethod' = 'gemini-flash-vision';

-- 2. Breakdown by specialty
SELECT
  specialty,
  COUNT(*) as chunks,
  COUNT(DISTINCT parent_document_id) as documents
FROM knowledge_documents
WHERE metadata->>'extractionMethod' = 'gemini-flash-vision'
GROUP BY specialty
ORDER BY chunks DESC;

-- 3. Check embeddings are present
SELECT
  COUNT(*) as chunks_with_embedding,
  COUNT(*) FILTER (WHERE embedding IS NULL) as chunks_without_embedding
FROM knowledge_documents
WHERE metadata->>'extractionMethod' = 'gemini-flash-vision';

-- 4. Average chunk size
SELECT
  AVG(LENGTH(content))::INT as avg_chars,
  MIN(LENGTH(content)) as min_chars,
  MAX(LENGTH(content)) as max_chars,
  COUNT(*) as total_chunks
FROM knowledge_documents
WHERE metadata->>'extractionMethod' = 'gemini-flash-vision';

-- 5. Sample documents (first 3)
SELECT
  id,
  title,
  LEFT(content, 150) as preview,
  specialty,
  metadata->>'extractionMethod' as extraction_method
FROM knowledge_documents
WHERE metadata->>'extractionMethod' = 'gemini-flash-vision'
LIMIT 5;

-- 6. Documents by source (to identify which PDFs were processed)
SELECT
  source_name,
  COUNT(*) as chunks,
  COUNT(DISTINCT parent_document_id) as documents,
  MAX(created_at) as last_updated
FROM knowledge_documents
WHERE metadata->>'extractionMethod' = 'gemini-flash-vision'
GROUP BY source_name
ORDER BY chunks DESC;
