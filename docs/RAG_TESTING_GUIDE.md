# RAG Implementation Testing Guide

This guide walks you through testing the new Hybrid RAG system for Odonto GPT.

## Prerequisites

- ✅ Phase 1: Database migration applied (knowledge_documents table created)
- ✅ Phase 2: RAG tool integrated into odonto-gpt agent
- ✅ Phase 3: Document ingestion API deployed
- ✅ ADMIN_API_KEY configured in `.env.local`
- ✅ OPENROUTER_API_KEY configured for embeddings

## Step 1: Apply Database Migration

The migration creates the `knowledge_documents` table with hybrid search capabilities:

```bash
# Via Supabase Dashboard > SQL Editor:
# Copy and run: supabase/migrations/20260128000000_create_knowledge_documents.sql

# Or deploy via Supabase CLI:
supabase db push
```

This creates:
- `knowledge_documents` table with pgvector embedding column
- Indexes for semantic (IVFFlat) and keyword (GIN) search
- `hybrid_search_knowledge()` and `hybrid_search_memories()` functions

## Step 2: Deploy Edge Function

The Edge Function handles embedding generation and hybrid search:

```bash
# Deploy the rag-search function
supabase functions deploy rag-search

# Verify deployment
curl https://<your-project>.supabase.co/functions/v1/rag-search \
  -H "Authorization: Bearer <ANON_KEY>"
# Should return 400 (missing POST body) - this is expected
```

## Step 3: Test Document Ingestion

### Option A: Using the test script

```bash
# Make the script executable
chmod +x scripts/test-rag-ingest.sh

# Ingest sample documents
bash scripts/test-rag-ingest.sh

# Or ingest specific document
bash scripts/test-rag-ingest.sh 1
bash scripts/test-rag-ingest.sh 2
bash scripts/test-rag-ingest.sh 3
```

### Option B: Manual ingestion

```bash
curl -X POST http://localhost:3000/api/admin/ingest-document \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-key-here" \
  -d '{
    "title": "Endodontia - Tratamento de Canal",
    "sourceType": "textbook",
    "sourceName": "Endodontia Clássica",
    "specialty": "endodontia",
    "author": "Paul Bauman",
    "content": "O tratamento endodôntico..."
  }'
```

**Response format:**
```json
{
  "success": true,
  "message": "Ingested 3/3 chunks successfully",
  "parentId": "uuid...",
  "totalChunks": 3,
  "successCount": 3,
  "results": [
    {
      "chunkIndex": 0,
      "success": true,
      "id": "uuid...",
      "hasEmbedding": true
    }
  ]
}
```

## Step 4: Test Chat with RAG

### In the Odonto GPT Chat:

1. **Start a new session**
   - Select "Odonto GPT" agent
   - Start chatting

2. **Ask a technical question:**
   ```
   Como fazer um tratamento de canal?
   ```

3. **Verify RAG is working:**
   - Agent should call `searchKnowledge` tool
   - Response should cite sources: "Fonte: Endodontia Clássica"
   - Response should be 3-5 lines with technical depth

4. **Test with filters:**
   ```
   Qual é o protocolo de periodontia para SRP?
   ```

5. **Verify memory tools:**
   - Agent should save facts with `rememberFact`
   - Agent should use `getStudentContext` for personalization

### Expected Flow:

```
User: "Como fazer um tratamento de canal?"
           ↓
Agent calls searchKnowledge
           ↓
Edge Function generates embedding
           ↓
Hybrid search (semantic 70% + keyword 30%)
           ↓
Returns 5 documents + user memories
           ↓
Agent formats with citations
           ↓
Response: "O tratamento de canal é um procedimento que..."
          "Fonte: Endodontia Clássica"
```

## Step 5: Monitoring & Debugging

### Check logs:

```bash
# Browser console (F12)
# Look for: [RAG-SEARCH] and [RAG Tool] messages

# Supabase function logs
supabase functions logs rag-search

# Check database
supabase sql
SELECT COUNT(*) FROM knowledge_documents;
SELECT title, specialty FROM knowledge_documents LIMIT 5;
```

### Test hybrid search directly:

```bash
# Query the search functions directly
supabase sql

-- Test semantic search
SELECT * FROM hybrid_search_knowledge(
  '[vector here]'::vector(1536),
  'protocolo de canal',
  0.5,
  5
);
```

## Step 6: Validate Search Quality

### Manual relevance check:

1. **For semantic search:**
   - Query: "canal radicular"
   - Should find endodontia documents even if keywords don't match exactly
   - Relevance should be 60%+

2. **For keyword search:**
   - Query: "tratamento canalicular"
   - Should find documents with exact terms
   - Relevance should be 40%+

3. **For combined:**
   - Combined score = (semantic 0.7) + (keyword 0.3)
   - Documents should appear in descending order of combined_score

## Troubleshooting

### Problem: "No results found"

**Causes:**
- No documents ingested yet
- Embedding API key not configured
- Query too specific

**Solutions:**
```bash
# Verify documents exist
supabase sql
SELECT COUNT(*) as total_docs FROM knowledge_documents;

# Check OPENROUTER_API_KEY
echo $OPENROUTER_API_KEY

# Try broader query
```

### Problem: "Error generating embedding"

**Causes:**
- OpenRouter API unreachable
- Rate limit exceeded
- Invalid API key

**Solutions:**
```bash
# Test API directly
curl -X POST https://openrouter.ai/api/v1/embeddings \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{"model":"openai/text-embedding-3-small","input":"test"}'

# Check rate limit status
# Reset with fresh API key if needed
```

### Problem: "Low relevance scores"

**Causes:**
- Poor chunk quality
- Misaligned specialty filters
- Query too vague

**Solutions:**
```bash
# Re-ingest with better metadata
bash scripts/test-rag-ingest.sh 1

# Test without specialty filter
# Increase match_count to 10

# Try more specific queries
```

## Performance Metrics

### Expected latency:

- Edge Function embedding: 500-1000ms
- Hybrid search database: 100-300ms
- Total RAG response: 1-2 seconds

### Expected quality:

- Semantic search recall: 70-80% (catches semantic meaning)
- Keyword search precision: 60-70% (exact matches)
- Combined score: More balanced results

## Next Steps

1. **Ingest full curriculum:**
   - Prepare 20-50 documents from your course materials
   - Organize by specialty and source type
   - Use the ingestion API to bulk-load

2. **Fine-tune weights:**
   - Test with different semantic/keyword ratios
   - Monitor user feedback on result relevance
   - Adjust in Edge Function as needed

3. **Monitor quality:**
   - Log search queries and results
   - Collect user feedback on accuracy
   - Iterate on document selection and chunking

4. **Production deployment:**
   - Set up automated document ingestion
   - Implement search analytics
   - Create admin dashboard for knowledge base management

## References

- Edge Function: `supabase/functions/rag-search/index.ts`
- RAG Tool: `lib/ai/tools/rag-tool.ts`
- Ingestion API: `app/api/admin/ingest-document/route.ts`
- Database Schema: `supabase/migrations/20260128000000_create_knowledge_documents.sql`
