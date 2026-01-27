# RAG Document Ingestion Runbook

> Step-by-step guide for ingesting dental textbooks into the RAG knowledge base

**Version:** 1.0
**Last Updated:** 2026-01-27
**Owner:** Feature Developer

---

## Prerequisites

- [ ] Next.js development server running (`npm run dev`)
- [ ] Database migration applied (`knowledge_documents` table exists)
- [ ] `ADMIN_API_KEY` configured in `.env.local`
- [ ] `OPENROUTER_API_KEY` configured for embeddings
- [ ] Python 3.12+ with `pdfplumber`, `PyPDF2`, `requests`

---

## Step 1: Verify Environment

```bash
# Check if server is running
lsof -ti:3000

# Check API keys are set
grep -E "ADMIN_API_KEY|OPENROUTER_API_KEY" .env.local

# Verify database table exists
curl -X GET http://localhost:3000/api/admin/ingest-document \
  -H "Authorization: Bearer ${ADMIN_API_KEY}"
```

**Expected output:**
```json
{
  "status": "ok",
  "message": "Document ingestion API is ready"
}
```

---

## Step 2: Setup Python Environment

```bash
# Create virtual environment (if not exists)
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # macOS/Linux
# or
.venv\Scripts\activate     # Windows

# Install dependencies
pip install pdfplumber PyPDF2 requests
```

---

## Step 3: Test Single Document Ingestion

```bash
# Test with a small PDF first
.venv/bin/python scripts/test-single-ingest.py
```

**Expected output:**
```
Testing with: manual_dentística.pdf
Extracting text...
Extracted 4548 characters
Sending to API...
✓ SUCCESS: 4/4 chunks ingested
```

If test fails, check:
- Is the database migration applied?
- Is the Next.js server running?
- Are API keys correct?

---

## Step 4: Run Bulk Ingestion

```bash
# Set environment variables
export ADMIN_API_KEY="test-admin-key-1769526451"
export APP_URL="http://localhost:3000"

# Run bulk ingestion (this will take 20-30 minutes)
.venv/bin/python scripts/extract-pdfs-split.py "Assuntos com PDF"
```

**Progress monitoring:**

In another terminal:
```bash
# Watch ingestion progress
tail -f /tmp/pdf-ingestion.log

# Check database count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM knowledge_documents;"
```

---

## Step 5: Monitor Ingestion

### Expected Processing
- **Total PDFs:** 36
- **Estimated chunks:** 3,600-4,500
- **Processing time:** 20-30 minutes
- **Success rate target:** ≥95%

### Real-Time Monitoring
```bash
# Watch logs
tail -f /tmp/pdf-ingestion.log

# Check database count every 30 seconds
watch -n 30 'echo "SELECT COUNT(*) FROM knowledge_documents;" | psql $DATABASE_URL'
```

### Per-Specialty Progress

The script will output progress by specialty:
```
Processing: Anestesiologia (1/36)
✓ Manual de Anestesia Local Malamed 6 Ed.pdf: 87/92 chunks

Processing: Cirurgia Oral Menor (2/36)
✓ Hupp 6 Ed.pdf: 156/159 chunks
...
```

---

## Step 6: Verify Completion

```bash
# Check final statistics
psql $DATABASE_URL << EOF
SELECT
  specialty,
  COUNT(*) as chunk_count,
  COUNT(DISTINCT parent_document_id) as document_count
FROM knowledge_documents
GROUP BY specialty
ORDER BY specialty;
EOF
```

**Expected output:**
```
     specialty      | chunk_count | document_count
--------------------+-------------+----------------
 anestesiologia     |         120 |              1
 cirurgia_oral      |         850 |              3
 dentistica         |         310 |              2
 endodontia         |       1,820 |              8
 oclusao            |         180 |              1
 protese            |         270 |              2
                    |          50 |              1
(7 rows)
```

---

## Step 7: Validate Search Quality

Run validation queries to test search accuracy:

```bash
# Execute validation script
.venv/bin/python scripts/validate-rag-quality.py
```

This will:
1. Load 26 test queries from `tests/fixtures/rag-validation-queries.json`
2. Execute each query against the RAG system
3. Score relevance (0-5 scale)
4. Generate report with accuracy metrics

**Target:** ≥85% queries return relevant results (score ≥3)

---

## Troubleshooting

### Issue: "Table not found"
**Cause:** Database migration not applied

**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy content from `supabase/migrations/20260128000000_create_knowledge_documents.sql`
3. Execute migration
4. Verify: `SELECT COUNT(*) FROM knowledge_documents;`

---

### Issue: PDF parsing fails
**Symptom:**
```
Error extracting PDF: ValueError: not enough values to unpack
```

**Cause:** Complex PDF layout (scanned images, unusual formatting)

**Solutions:**
1. Skip the problematic PDF (document in logs)
2. Try PyPDF2 fallback extractor
3. Manual extraction and text upload via API

---

### Issue: Slow ingestion speed
**Symptom:** Processing < 5 PDFs per minute

**Causes:**
- Rate limiting from OpenRouter API
- Large PDF files requiring splitting
- Network latency

**Solutions:**
- Normal for large documents (200+ pages)
- Script includes automatic rate limiting
- Monitor `/tmp/pdf-ingestion.log` for progress

---

### Issue: Embedding generation fails
**Symptom:**
```
Error: OpenRouter API error: 429 Too Many Requests
```

**Cause:** API rate limit exceeded

**Solution:**
1. Script will automatically retry with exponential backoff
2. If persistent, check OpenRouter dashboard for quota
3. Consider batching requests (already implemented)

---

### Issue: API returns 401 Unauthorized
**Cause:** Invalid or missing ADMIN_API_KEY

**Solution:**
```bash
# Verify key is set
echo $ADMIN_API_KEY

# Or check .env.local
grep ADMIN_API_KEY .env.local

# Set manually if needed
export ADMIN_API_KEY="test-admin-key-1769526451"
```

---

## Post-Ingestion Tasks

- [ ] Run validation queries (`scripts/validate-rag-quality.py`)
- [ ] Measure search latency (target p95 ≤500ms)
- [ ] Configure monitoring dashboard in Supabase
- [ ] Set up Sentry alerts for errors
- [ ] Document baseline metrics
- [ ] Test chat integration (`searchKnowledge` tool)
- [ ] Update `architecture.md` with ingestion stats

---

## Rollback Procedure

If ingestion fails or produces bad results:

```bash
# 1. Stop any running ingestion processes
pkill -f extract-pdfs-split.py

# 2. Delete all ingested chunks
psql $DATABASE_URL -c "DELETE FROM knowledge_documents;"

# 3. Verify deletion
psql $DATABASE_URL -c "SELECT COUNT(*) FROM knowledge_documents;"
# Expected: 0

# 4. Fix issues identified in logs

# 5. Re-run ingestion from Step 3
```

---

## Maintenance

### Adding New Documents

1. Place PDF in appropriate specialty folder under `Assuntos com PDF/`
2. Run ingestion for that folder only:
```bash
.venv/bin/python scripts/extract-pdfs-split.py "Assuntos com PDF/Endodontia"
```
3. Verify new chunks: `SELECT * FROM knowledge_documents ORDER BY created_at DESC LIMIT 10;`

### Updating Existing Documents

1. Delete old chunks:
```sql
DELETE FROM knowledge_documents
WHERE source_name = 'Old Document Name';
```
2. Re-ingest new version following Step 4

### Monitoring Disk Usage

```sql
-- Check total storage
SELECT pg_size_pretty(pg_total_relation_size('knowledge_documents'));

-- Check by specialty
SELECT
  specialty,
  pg_size_pretty(SUM(LENGTH(content))) as text_size,
  pg_size_pretty(SUM(LENGTH(embedding::text))) as embedding_size
FROM knowledge_documents
GROUP BY specialty;
```

---

## API Reference

### Ingest Single Document

**Endpoint:** `POST /api/admin/ingest-document`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer ${ADMIN_API_KEY}
```

**Body:**
```json
{
  "title": "Endodontia Clássica",
  "content": "Full text content here...",
  "sourceType": "textbook",
  "sourceName": "Leonardo Vol 1",
  "specialty": "endodontia",
  "author": "Mario Leonardo",
  "chapter": "Capítulo 3: Instrumentação"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ingested 87/92 chunks successfully",
  "parentId": "uuid-here",
  "totalChunks": 92,
  "successCount": 87,
  "failureCount": 5,
  "results": [...]
}
```

---

## Quick Reference

```bash
# Setup
python3 -m venv .venv && source .venv/bin/activate
pip install pdfplumber PyPDF2 requests

# Test
.venv/bin/python scripts/test-single-ingest.py

# Ingest All
.venv/bin/python scripts/extract-pdfs-split.py "Assuntos com PDF"

# Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM knowledge_documents;"

# Validate
.venv/bin/python scripts/validate-rag-quality.py
```

---

**For support, check:**
- Implementation status: `docs/rag-implementation-status.md`
- Chunking strategy: `docs/rag-chunking-strategy.md`
- Validation queries: `tests/fixtures/rag-validation-queries.json`
