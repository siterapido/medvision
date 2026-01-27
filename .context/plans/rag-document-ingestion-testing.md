---
status: active
created: 2026-01-27
prevc_phase: P
agents:
  - type: "architect-specialist"
    role: "Design RAG ingestion pipeline and document chunking strategy"
  - type: "feature-developer"
    role: "Implement PDF processing and document ingestion endpoints"
  - type: "test-writer"
    role: "Write tests for RAG search quality and document chunking"
  - type: "documentation-writer"
    role: "Document RAG system, indexing strategy, and monitoring setup"
  - type: "performance-optimizer"
    role: "Benchmark search performance and identify bottlenecks"
  - type: "security-auditor"
    role: "Validate document access controls and sensitive data handling"
docs:
  - "architecture.md"
  - "testing-strategy.md"
  - "security.md"
  - "tooling.md"
phases:
  - id: "phase-1"
    name: "Discovery & Architecture Planning"
    prevc: "P"
  - id: "phase-2"
    name: "Implementation & Ingestion"
    prevc: "E"
  - id: "phase-3"
    name: "Validation & Monitoring"
    prevc: "V"
---

# RAG Document Ingestion & Testing - 36 Dental Textbooks

> Build and validate a production-ready RAG system by ingesting 36 dental textbooks, establishing baseline search quality metrics, and implementing comprehensive performance monitoring.

## Task Snapshot

- **Primary goal:** Ingest all 36 dental textbooks into the RAG system with chunk-level metadata, establish baseline search quality benchmarks (relevance scoring, latency), and deploy monitoring infrastructure for production use.
- **Success signal:** All documents indexed with proper chunking, search accuracy ≥ 85% on validation queries, p95 latency ≤ 500ms, and monitoring dashboard operational.
- **Key references:**
  - [Architecture Notes](../docs/architecture.md) — RAG system design and Supabase integration
  - [Testing Strategy](../docs/testing-strategy.md) — Test approach and CI gates
  - [Development Workflow](../docs/development-workflow.md) — Branching and commit conventions

## Executive Summary

The system currently has a foundation for RAG via the `knowledge_documents` table, rag-search edge function, and document ingestion API. This plan focuses on operationalizing the system: bulk-loading dental textbooks, validating retrieval quality against domain-specific queries, and establishing monitoring baselines.

**Timeline:** 2-3 weeks
**Team size:** 2-3 developers
**Risk level:** Medium (data volume, performance tuning)

## Current State Assessment

### Existing Infrastructure
- **Database:** `knowledge_documents` table with pgvector support in Supabase
- **Ingestion API:** `POST /api/documents/ingest` endpoint accepting PDFs and metadata
- **Search endpoint:** Edge function `rag-search` implementing semantic search with vector similarity
- **Codebase patterns:** Service layer (`ChatService`, `MemoryService`), artifact streaming support
- **Testing base:** Jest/Playwright setup with E2E capabilities

### Known Gaps
- Batch ingestion performance not validated at scale (36 documents × 100+ chunks each)
- No search quality baseline or relevance scoring mechanism
- Monitoring/observability for RAG search latency and vector quality missing
- Document chunking strategy undefined (size, overlap, metadata preservation)
- No automated validation workflow for ingestion completeness

## Agent Lineup

| Agent | Role in this plan | Key responsibilities |
| --- | --- | --- |
| Architect Specialist | Design system architecture | Design chunking strategy, validate vector schema, plan performance tiers |
| Feature Developer | Implement features | Bulk ingestion, chunk metadata pipeline, monitoring dashboards |
| Test Writer | Write tests | Search quality validation, edge cases (corrupted PDFs, OCR failures) |
| Documentation Writer | Maintain docs | Ingestion runbook, monitoring queries, troubleshooting guide |
| Performance Optimizer | Identify bottlenecks | Benchmark batch operations, optimize embedding calls, tune database queries |
| Security Auditor | Validate security | Document access controls, PII detection in chunks, secure credential handling |

## Documentation Touchpoints

| Document | Updates needed | Owner |
| --- | --- | --- |
| architecture.md | RAG system design, chunking pipeline, vector storage | Architect Specialist |
| testing-strategy.md | Search quality tests, ingestion validation suite | Test Writer |
| security.md | Document access controls, PII handling in RAG | Security Auditor |
| tooling.md | Ingestion scripts, monitoring CLI commands | Documentation Writer |

## Risk Assessment

### Identified Risks

| Risk | Probability | Impact | Mitigation Strategy | Owner |
| --- | --- | --- | --- | --- |
| Embedding API rate limits during bulk ingestion | Medium | High | Implement exponential backoff, batch in 5-document chunks, monitor quota | Feature Developer |
| Poor search quality on niche dental terms | Medium | High | Establish baseline before rollout, create domain-specific validation queries, consider reranking | Test Writer |
| Vector dimension mismatch or schema conflicts | Low | High | Validate embedding model dimensions early, test with sample documents | Architect Specialist |
| Performance degradation with 3,600+ chunks | Medium | Medium | Profile with production volume, implement pagination in UI, cache frequent queries | Performance Optimizer |
| PII exposure in document chunks (patient names, etc.) | Low | High | Implement chunk-level PII detection, enforce field-level access controls | Security Auditor |

### Dependencies

- **Internal:** ChatService for integration testing, MemoryService for context validation, Supabase project with pgvector enabled
- **External:** Embedding model API (OpenAI, Anthropic, or local), PDF extraction library (PyPDF2 or equivalent)
- **Technical:** Node.js ≥18, TypeScript, Supabase CLI, Jest test framework

### Assumptions

- All 36 textbooks are in PDF format and machine-readable (no scanned images)
- Embedding API is available and stable (99.9% uptime SLA)
- Supabase pgvector extension is enabled and indexed
- Search validation can use manually curated dental domain queries (~20-30 queries)

## Resource Estimation

### Time Allocation

| Phase | Estimated Effort | Calendar Time | Team Size | Focus |
| --- | --- | --- | --- | --- |
| Phase 1 - Discovery | 3 person-days | 5 days | 2 people | Architect + Feature Dev |
| Phase 2 - Implementation | 8 person-days | 2 weeks | 2-3 people | Full team |
| Phase 3 - Validation | 4 person-days | 1 week | 2 people | Test Writer + Architect |
| **Total** | **15 person-days** | **3 weeks** | **2-3 people** | - |

### Required Skills

- PDF processing and text extraction (Python or Node.js)
- Vector database operations (pgvector, SQL)
- API performance profiling and monitoring
- Knowledge of dental domain terminology (for validation queries)
- Familiarity with embedding models and semantic search

### Resource Availability

- **Available:** Full-time feature developers (2), QA/testing (1), part-time architect for design reviews
- **Blocked:** None anticipated
- **Escalation:** Escalate to platform lead if embedding API quota exceeded

## Working Phases

### Phase 1 — Discovery & Architecture Planning (P)

**Objectives**
1. Finalize document chunking strategy (size, overlap, metadata fields)
2. Design vector schema and indexing approach
3. Plan performance monitoring and alerting
4. Identify edge cases and failure modes

**Steps**

1. **Chunking Strategy Design** (Owner: Architect Specialist)
   - Evaluate chunk sizes: 256, 512, 1024 tokens
   - Define overlap strategy: 10-20% for semantic continuity
   - Identify metadata to preserve: source chapter, page number, section hierarchy
   - Document in `/docs/rag-chunking-strategy.md`

2. **Vector Schema Validation** (Owner: Architect Specialist)
   - Verify embedding model dimensions match table schema
   - Test batch embedding with sample PDFs
   - Profile ingestion performance with 100-chunk test batch
   - Document findings in plan comments

3. **Search Quality Framework** (Owner: Test Writer)
   - Create 20-30 domain-specific validation queries (e.g., "implant osseointegration timeline")
   - Define relevance scoring rubric (0-5 scale)
   - Plan A/B testing approach for future model/chunking iterations
   - Document in `/tests/fixtures/rag-validation-queries.json`

4. **Monitoring Plan** (Owner: Architect Specialist)
   - Design dashboard: ingestion rate, search latency p50/p95, embedding cost
   - Plan Supabase analytics integration
   - Define alerting thresholds (search latency > 1s, error rate > 1%)
   - Document in `/docs/rag-monitoring-dashboard.md`

5. **Security & Access Control Review** (Owner: Security Auditor)
   - Review document access restrictions (all users or licensed only?)
   - Plan PII detection in chunks (name patterns, ID numbers)
   - Define retention/deletion policies
   - Document in `/docs/rag-security-model.md`

**Deliverables**
- Chunking strategy document with code examples
- Vector schema validation report
- Search quality validation dataset
- Monitoring dashboard design mockup
- Security review checklist

**Commit Checkpoint**
```bash
git commit -m "chore(plan): complete phase 1 RAG architecture discovery

- Finalize chunking strategy: 512-token chunks with 10% overlap
- Validate vector schema dimensions (1536 for text-embedding-3-small)
- Create 25 domain-specific validation queries
- Design monitoring dashboard with key metrics
- Complete security access control review"
```

### Phase 2 — Implementation & Ingestion (E)

**Objectives**
1. Build bulk ingestion pipeline for 36 documents
2. Implement chunk metadata and quality tracking
3. Integrate monitoring and alerting
4. Execute bulk ingestion and validate completion

**Steps**

1. **Enhance Ingestion API** (Owner: Feature Developer)
   - Add batch endpoint: `POST /api/documents/ingest/batch`
   - Implement chunking service with configurable sizes and overlap
   - Add metadata fields: document_id, chunk_index, section, page_number
   - Support concurrent embeddings with rate limiting
   - Files to modify:
     - `app/api/documents/ingest/route.ts` (expand batch support)
     - `lib/services/document-ingestion.ts` (new chunking service)
     - `lib/db/knowledge-documents.ts` (batch insert with metadata)

2. **Build PDF Processing Pipeline** (Owner: Feature Developer)
   - Script: `scripts/ingest-dental-textbooks.ts`
   - Read textbooks from `./Assuntos com PDF/`
   - Extract text with page/section metadata using pdf-parse or PyPDF2
   - Batch documents into 5-10 item chunks for API calls
   - Log progress and errors to `/tmp/ingestion-report.json`
   - Handle retries and partial failures

3. **Implement Monitoring Integration** (Owner: Feature Developer)
   - Add observability to ingestion: chunk count, embedding latency, error rates
   - Log metrics to Supabase `audit_logs` table or Sentry
   - Create monitoring dashboard using Supabase admin UI
   - Document dashboard queries in `/docs/rag-monitoring-queries.sql`

4. **Write Ingestion Tests** (Owner: Test Writer)
   - Unit tests: chunking logic with various PDF formats
   - Integration test: full ingestion with 5-10 sample documents
   - Validation test: search quality on validation queries
   - Edge case tests: corrupted PDFs, OCR failures, metadata preservation
   - Files: `tests/ingestion.test.ts`, `tests-e2e/rag-ingestion.spec.ts`

5. **Execute Bulk Ingestion** (Owner: Feature Developer)
   - Run ingestion script against all 36 documents
   - Monitor real-time progress dashboard
   - Handle errors and retry failures
   - Verify all chunks indexed in `knowledge_documents` table
   - Document final count and metrics in `/docs/rag-ingestion-report.md`

**Deliverables**
- Enhanced ingestion API with batch support
- PDF processing pipeline script
- Monitoring dashboard with real-time metrics
- Comprehensive test suite
- Ingestion completion report with statistics

**Implementation Details**

**Chunking Service** (`lib/services/document-ingestion.ts`)
```typescript
interface ChunkMetadata {
  source_document_id: string;
  chunk_index: number;
  page_number?: number;
  section?: string;
  total_chunks: number;
  character_count: number;
}

function chunkDocument(
  text: string,
  metadata: ChunkMetadata
): Chunk[] {
  // Implement 512-token chunks with 10% overlap
  // Preserve section boundaries where possible
  // Attach metadata to each chunk
}
```

**Batch Ingestion Endpoint** (`app/api/documents/ingest/batch/route.ts`)
```typescript
POST /api/documents/ingest/batch
Content-Type: application/json

{
  "documents": [
    {
      "filename": "textbook-01.pdf",
      "content": "...",
      "metadata": { "source": "official-curriculum", "year": 2024 }
    }
  ]
}

Response:
{
  "succeeded": 1,
  "failed": 0,
  "total_chunks": 152,
  "errors": []
}
```

**Commit Checkpoint**
```bash
git commit -m "feat(rag): implement bulk ingestion pipeline and monitoring

- Add batch ingestion endpoint with rate limiting
- Implement 512-token chunking with metadata preservation
- Integrate Supabase metrics for monitoring
- Add comprehensive ingestion tests
- Execute bulk load of 36 dental textbooks (3,847 total chunks)"
```

### Phase 3 — Validation & Monitoring (V)

**Objectives**
1. Validate search quality against dental domain queries
2. Establish baseline performance metrics
3. Configure production alerting
4. Document runbook and troubleshooting guide

**Steps**

1. **Search Quality Validation** (Owner: Test Writer)
   - Execute 25 domain-specific queries against indexed documents
   - Score results: relevance (0-5), completeness, ranking quality
   - Document in `/test-results/rag-validation-results.md`
   - Target: ≥85% of queries return relevant top-3 results
   - If <85%, identify issues: chunking size, overlap, embedding model

2. **Performance Baseline Measurement** (Owner: Performance Optimizer)
   - Benchmark search latency: p50, p95, p99
   - Measure embedding generation time
   - Profile database query performance with pgvector indexing
   - Generate baseline report: `/docs/rag-performance-baseline.md`
   - Target: p95 latency ≤ 500ms (excluding embedding time)

3. **Production Monitoring Setup** (Owner: Feature Developer)
   - Configure Sentry alerts: error rate > 1%, latency > 1s
   - Set up Supabase analytics dashboard with key metrics
   - Enable cost tracking (embedding API calls, storage growth)
   - Document monitoring queries and alert conditions

4. **Documentation & Runbook** (Owner: Documentation Writer)
   - Write `/docs/rag-ingestion-runbook.md`: step-by-step guide for future document additions
   - Create `/docs/rag-troubleshooting.md`: common issues and resolution steps
   - Document monitoring dashboards: URL, key metrics, alert thresholds
   - Include disaster recovery: chunk deletion, re-indexing, rollback

5. **Finalize & Sign-Off** (Owner: Architect Specialist)
   - Review all metrics against acceptance criteria
   - Document any limitations or future improvements
   - Create `/docs/rag-system-status.md` with current state
   - Plan for next iterations (reranking, metadata filtering, cost optimization)

**Deliverables**
- Search quality validation report with scoring
- Performance baseline metrics and graphs
- Production monitoring dashboard and alerts configured
- Complete documentation (runbook, troubleshooting, monitoring)
- Sign-off document with known limitations

**Validation Criteria**

| Metric | Target | Owner |
| --- | --- | --- |
| Search relevance (top-3 results) | ≥ 85% | Test Writer |
| p95 search latency | ≤ 500ms | Performance Optimizer |
| Document ingestion success rate | ≥ 99% | Feature Developer |
| Monitoring dashboard operational | Yes | Feature Developer |
| Documentation complete | Yes | Documentation Writer |

**Commit Checkpoint**
```bash
git commit -m "chore(rag): complete validation and production readiness

- Validate search quality: 24/25 queries (96%) return relevant results
- Establish performance baseline: p95 latency 380ms
- Configure Sentry alerts for error and latency thresholds
- Document monitoring dashboard and runbook
- System ready for production deployment"
```

## Rollback Plan

### Rollback Triggers

When to initiate rollback:
- Search relevance <75% on validation queries (systematic issue)
- Ingestion failure rate >5% (data quality issue)
- Search latency p95 > 2 seconds (performance regression)
- Security issue detected in document access
- Embedding API quota exceeded or service unavailable

### Rollback Procedures

#### Phase 1 Rollback
- **Action:** Discard design branches, restore documentation state
- **Data Impact:** None (no production data changes)
- **Estimated Time:** < 30 minutes

#### Phase 2 Rollback
- **Action:** Stop ingestion, delete all chunks via `DELETE FROM knowledge_documents WHERE ingestion_batch = $1`, restore backup of API code
- **Data Impact:** All 3,847 chunks deleted, system returns to pre-ingestion state
- **Estimated Time:** 1-2 hours (depends on delete performance)
- **Recovery:** Re-run ingestion after fixes, or use backup restore if data corruption

#### Phase 3 Rollback
- **Action:** Disable rag-search endpoint in Supabase (set to always return error), revert any schema changes, restore previous monitoring config
- **Data Impact:** Search unavailable; documents remain indexed for future retry
- **Estimated Time:** 30 minutes
- **Recovery:** Fix underlying issue (e.g., embedding model, relevance algorithm) and re-enable endpoint

### Post-Rollback Actions

1. Document rollback reason in `/docs/rag-incident-log.md`
2. Post-mortem within 24 hours: identify root cause and fix
3. Adjust plan based on learnings
4. Schedule retry with additional safeguards

## Evidence & Follow-up

### Artifacts to Collect

**Phase 1**
- Chunking strategy document with code examples
- Search quality validation dataset (25+ queries)
- Vector schema validation report
- Monitoring design mockup

**Phase 2**
- Batch ingestion API implementation
- PDF processing script with sample output
- Ingestion test suite (unit + E2E)
- Completion report: chunk count, processing time, error log

**Phase 3**
- Search quality validation results (scoring spreadsheet)
- Performance baseline metrics (graphs, latency percentiles)
- Sentry alert configuration export
- Complete documentation set (runbook, monitoring, troubleshooting)

### Sign-Off Checklist

- [ ] All 36 documents successfully ingested (3,800+ chunks)
- [ ] Search quality validation: ≥85% relevance achieved
- [ ] Performance baseline: p95 latency ≤ 500ms
- [ ] Monitoring dashboard deployed and alerting operational
- [ ] Complete documentation published
- [ ] Security review completed and passed
- [ ] Runbook tested (dry-run with 1 additional document)
- [ ] Team trained on monitoring and troubleshooting

### Future Improvements (Post-Delivery)

1. Implement semantic reranking (Cohere, CrossEncoder) to boost relevance
2. Add metadata filtering (e.g., filter by document source, year, topic)
3. Optimize embedding costs through caching and batch strategies
4. Implement adaptive chunk sizing based on document type
5. Add user feedback loop for continuous quality improvement
6. Expand to other medical specialties beyond dental

---

**Plan Owner:** Architect Specialist
**Last Updated:** 2026-01-27
**Status:** Ready for Review (awaiting approval before E phase)
