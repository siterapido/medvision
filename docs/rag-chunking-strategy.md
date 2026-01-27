# RAG Chunking Strategy

**Status:** Implemented ✅
**Last Updated:** 2026-01-27
**Owner:** Architect Specialist

## Overview

The RAG system uses a fixed-size chunking strategy with sentence-boundary detection and overlap to maintain semantic continuity across chunks.

## Chunking Parameters

```typescript
{
  maxSize: 1500,        // Maximum characters per chunk
  overlap: 200,         // Character overlap between consecutive chunks
  minChunkSize: 50      // Minimum characters to include chunk
}
```

### Rationale

- **1500 characters (~300-400 tokens)**: Optimal for:
  - Single concept/paragraph coverage
  - Efficient embedding generation (8000 char API limit)
  - Balance between context and specificity

- **200 character overlap (13%)**: Ensures:
  - Semantic continuity across boundaries
  - No loss of context at chunk edges
  - Better retrieval for queries spanning chunk boundaries

- **Sentence boundary detection**: Preserves:
  - Complete thoughts and sentences
  - Better semantic coherence
  - Improved readability in search results

## Implementation

Located in: `app/api/admin/ingest-document/route.ts:24-58`

```typescript
function chunkText(
  text: string,
  maxSize: number = 1500,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxSize;

    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + maxSize / 2) {
        end = breakPoint + 1;
      }
    }

    const chunk = text.slice(start, end).trim();

    // Only include chunks with meaningful content
    if (chunk.length > 50) {
      chunks.push(chunk);
    }

    // Move start position with overlap
    start = end - overlap;
  }

  return chunks;
}
```

## Chunk Metadata

Each chunk is stored with:

| Field | Type | Purpose |
|-------|------|---------|
| `title` | text | Document title + part number (if multi-chunk) |
| `content` | text | The actual chunk text |
| `chunk_index` | int | Position in document (0-based) |
| `total_chunks` | int | Total chunks in parent document |
| `parent_document_id` | uuid | Reference to first chunk (parent) |
| `specialty` | text | Dental specialty (endodontia, periodontia, etc.) |
| `source_type` | text | textbook, article, protocol, guideline, course_material |
| `source_name` | text | Original document name |
| `embedding` | vector(1536) | Semantic embedding via text-embedding-3-small |

## Vector Embeddings

**Model:** `openai/text-embedding-3-small`
**Dimension:** 1536
**Provider:** OpenRouter API
**Cost:** ~$0.02 per 1M tokens

Embeddings are generated via:
- `lib/ai/memory/embeddings.ts:19-64` - Single embedding
- `lib/ai/memory/embeddings.ts:69-134` - Batch embeddings (up to 100)

## Search Strategy

**Hybrid Search** combining:
- **70% Semantic** (pgvector cosine similarity)
- **30% Keyword** (PostgreSQL Full-Text Search)

Function: `hybrid_search_knowledge()` in `supabase/migrations/20260128000000_create_knowledge_documents.sql:79-158`

## Performance Characteristics

### Storage
- **Average chunk size:** ~1200 characters
- **Average chunks per document:** 100-200 for 200-page textbook
- **Total storage for 36 textbooks:** ~3,600-4,500 chunks

### Embedding Generation
- **Time per chunk:** ~200-500ms
- **Time for 3,600 chunks:** ~20-30 minutes (with batching)
- **API cost:** ~$1-2 for full corpus

### Search Performance
- **Target p95 latency:** ≤500ms
- **Includes:** Embedding generation + hybrid search + ranking
- **Bottleneck:** Embedding generation (~300ms), not database

## Validation

**Test cases:**
1. Short document (<1500 chars): Single chunk, no parent_id
2. Medium document (3000 chars): 2 chunks with 200 char overlap
3. Large document (>100,000 chars): 70+ chunks, proper indexing
4. Sentence boundary: No chunk ends mid-sentence
5. Empty/whitespace: Filtered out, not stored

## Future Improvements

1. **Adaptive chunking**: Vary size by document type (protocols shorter, textbooks longer)
2. **Section-aware chunking**: Use PDF TOC/headings as boundaries
3. **Metadata enrichment**: Extract page numbers, figures, tables
4. **De-duplication**: Detect identical chunks across documents
5. **Compression**: Store original + compressed for display

---

**References:**
- Migration: `supabase/migrations/20260128000000_create_knowledge_documents.sql`
- API Route: `app/api/admin/ingest-document/route.ts`
- Embeddings: `lib/ai/memory/embeddings.ts`
