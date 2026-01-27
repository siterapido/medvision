---
status: ready
generated: 2026-01-27
agents:
  - type: "feature-developer"
    role: "Build PDF extraction and batch processing pipeline"
  - type: "test-writer"
    role: "Validate extraction quality and ingestion correctness"
  - type: "devops-specialist"
    role: "Create automated batch processing for all 7 specialties"
docs:
  - "RAG_TESTING_GUIDE.md"
  - "development-workflow.md"
phases:
  - id: "phase-1"
    name: "PDF Extraction Setup"
    prevc: "P"
  - id: "phase-2"
    name: "Batch Processing by Specialty"
    prevc: "E"
  - id: "phase-3"
    name: "Quality Validation & Monitoring"
    prevc: "V"
---

# Pipeline de Extração e Ingestão de PDFs para RAG

> Processar 7 especialidades de PDFs (Endodontia, Periodontia, Cirurgia Oral, Dentística, Prótese, Anestesiologia, Oclusão) para extrair texto e ingerir no RAG híbrido do Supabase.

## Task Snapshot

- **Primary goal:** Extrair texto de ~15-20 arquivos PDF organizados em 7 especialidades odontológicas, convertê-los para chunks semanticamente relevantes e ingerir no banco de conhecimento com embeddings
- **Success signal:** Todos os PDFs processados com >95% de sucesso na extração, usuarios conseguem fazer queries que retornam documentos relevantes com citações corretas
- **Key references:**
  - [RAG Testing Guide](../docs/RAG_TESTING_GUIDE.md)
  - [Ingestion API](./app/api/admin/ingest-document/route.ts)
  - [Test Script](./scripts/test-rag-ingest.sh)

## Codebase Context
- **Total files analyzed:** 1186
- **Total symbols discovered:** 6058
- **Architecture layers:** Config, Controllers, Utils, Components, Services, Models, Repositories
- **Detected patterns:** Factory, Service Layer, Controller, Observer
- **Entry points:** lib/supabase/server.ts, lib/db/index.ts, components/sidebar/index.ts (+28 more)

### Key Components
**Core Classes:**
- `ArtifactsService` — /Users/marcosalexandre/Library/CloudStorage/GoogleDrive-marckexpert1@gmail.com/Meu Drive/Mac_Sync/Projetos/v0-odonto-gpt-ui/lib/services/artifacts.ts:15
- `ChatService` — /Users/marcosalexandre/Library/CloudStorage/GoogleDrive-marckexpert1@gmail.com/Meu Drive/Mac_Sync/Projetos/v0-odonto-gpt-ui/lib/ai/chat-service.ts:26
- `MemoryService` — /Users/marcosalexandre/Library/CloudStorage/GoogleDrive-marckexpert1@gmail.com/Meu Drive/Mac_Sync/Projetos/v0-odonto-gpt-ui/lib/ai/memory/service.ts:77
- `StreamingArtifact` — /Users/marcosalexandre/Library/CloudStorage/GoogleDrive-marckexpert1@gmail.com/Meu Drive/Mac_Sync/Projetos/v0-odonto-gpt-ui/lib/ai/artifacts/streaming.ts:24
- `ArtifactStore` — /Users/marcosalexandre/Library/CloudStorage/GoogleDrive-marckexpert1@gmail.com/Meu Drive/Mac_Sync/Projetos/v0-odonto-gpt-ui/lib/ai/artifacts/streaming.ts:263

**Key Interfaces:**
- `NotificationTemplate` — /Users/marcosalexandre/Library/CloudStorage/GoogleDrive-marckexpert1@gmail.com/Meu Drive/Mac_Sync/Projetos/v0-odonto-gpt-ui/lib/notifications.ts:5
- `AgentTheme` — /Users/marcosalexandre/Library/CloudStorage/GoogleDrive-marckexpert1@gmail.com/Meu Drive/Mac_Sync/Projetos/v0-odonto-gpt-ui/lib/agent-themes.ts:18
- `AgentInfo` — /Users/marcosalexandre/Library/CloudStorage/GoogleDrive-marckexpert1@gmail.com/Meu Drive/Mac_Sync/Projetos/v0-odonto-gpt-ui/lib/agent-config.ts:3
- `ArtifactState` — /Users/marcosalexandre/Library/CloudStorage/GoogleDrive-marckexpert1@gmail.com/Meu Drive/Mac_Sync/Projetos/v0-odonto-gpt-ui/hooks/use-artifacts.ts:25
- `UseArtifactOptions` — /Users/marcosalexandre/Library/CloudStorage/GoogleDrive-marckexpert1@gmail.com/Meu Drive/Mac_Sync/Projetos/v0-odonto-gpt-ui/hooks/use-artifacts.ts:33
## Agent Lineup
| Agent | Role in this plan | Playbook | First responsibility focus |
| --- | --- | --- | --- |
| Code Reviewer | TODO: Describe why this agent is involved. | [Code Reviewer](../agents/code-reviewer.md) | Review code changes for quality, style, and best practices |
| Bug Fixer | TODO: Describe why this agent is involved. | [Bug Fixer](../agents/bug-fixer.md) | Analyze bug reports and error messages |
| Feature Developer | TODO: Describe why this agent is involved. | [Feature Developer](../agents/feature-developer.md) | Implement new features according to specifications |
| Refactoring Specialist | TODO: Describe why this agent is involved. | [Refactoring Specialist](../agents/refactoring-specialist.md) | Identify code smells and improvement opportunities |
| Test Writer | TODO: Describe why this agent is involved. | [Test Writer](../agents/test-writer.md) | Write comprehensive unit and integration tests |
| Documentation Writer | TODO: Describe why this agent is involved. | [Documentation Writer](../agents/documentation-writer.md) | Create clear, comprehensive documentation |
| Performance Optimizer | TODO: Describe why this agent is involved. | [Performance Optimizer](../agents/performance-optimizer.md) | Identify performance bottlenecks |
| Security Auditor | TODO: Describe why this agent is involved. | [Security Auditor](../agents/security-auditor.md) | Identify security vulnerabilities |
| Frontend Specialist | TODO: Describe why this agent is involved. | [Frontend Specialist](../agents/frontend-specialist.md) | Design and implement user interfaces |
| Architect Specialist | TODO: Describe why this agent is involved. | [Architect Specialist](../agents/architect-specialist.md) | Design overall system architecture and patterns |
| Devops Specialist | TODO: Describe why this agent is involved. | [Devops Specialist](../agents/devops-specialist.md) | Design and maintain CI/CD pipelines |

## Documentation Touchpoints
| Guide | File | Primary Inputs |
| --- | --- | --- |
| Project Overview | [project-overview.md](../docs/project-overview.md) | Roadmap, README, stakeholder notes |
| Architecture Notes | [architecture.md](../docs/architecture.md) | ADRs, service boundaries, dependency graphs |
| Development Workflow | [development-workflow.md](../docs/development-workflow.md) | Branching rules, CI config, contributing guide |
| Testing Strategy | [testing-strategy.md](../docs/testing-strategy.md) | Test configs, CI gates, known flaky suites |
| Glossary & Domain Concepts | [glossary.md](../docs/glossary.md) | Business terminology, user personas, domain rules |
| Security & Compliance Notes | [security.md](../docs/security.md) | Auth model, secrets management, compliance requirements |
| Tooling & Productivity Guide | [tooling.md](../docs/tooling.md) | CLI scripts, IDE configs, automation workflows |

## Risk Assessment
Identify potential blockers, dependencies, and mitigation strategies before beginning work.

### Identified Risks
| Risk | Probability | Impact | Mitigation Strategy | Owner |
| --- | --- | --- | --- | --- |
| TODO: Dependency on external team | Medium | High | Early coordination meeting, clear requirements | TODO: Name |
| TODO: Insufficient test coverage | Low | Medium | Allocate time for test writing in Phase 2 | TODO: Name |

### Dependencies
- **Internal:** TODO: List dependencies on other teams, services, or infrastructure
- **External:** TODO: List dependencies on third-party services, vendors, or partners
- **Technical:** TODO: List technical prerequisites or required upgrades

### Assumptions
- TODO: Document key assumptions being made (e.g., "Assume current API schema remains stable")
- TODO: Note what happens if assumptions prove false

## Resource Estimation

### Time Allocation
| Phase | Estimated Effort | Calendar Time | Team Size |
| --- | --- | --- | --- |
| Phase 1 - Discovery | TODO: e.g., 2 person-days | 3-5 days | 1-2 people |
| Phase 2 - Implementation | TODO: e.g., 5 person-days | 1-2 weeks | 2-3 people |
| Phase 3 - Validation | TODO: e.g., 2 person-days | 3-5 days | 1-2 people |
| **Total** | **TODO: total** | **TODO: total** | **-** |

### Required Skills
- TODO: List required expertise (e.g., "React experience", "Database optimization", "Infrastructure knowledge")
- TODO: Identify skill gaps and training needs

### Resource Availability
- **Available:** TODO: List team members and their availability
- **Blocked:** TODO: Note any team members with conflicting priorities
- **Escalation:** TODO: Name of person to contact if resources are insufficient

## Working Phases
### Phase 1 — Discovery & Alignment
**Steps**
1. TODO: Outline discovery tasks and assign the accountable owner.
2. TODO: Capture open questions that require clarification.

**Commit Checkpoint**
- After completing this phase, capture the agreed context and create a commit (for example, `git commit -m "chore(plan): complete phase 1 discovery"`).

### Phase 2 — Implementation & Iteration
**Steps**
1. TODO: Note build tasks, pairing expectations, and review cadence.
2. TODO: Reference docs or playbooks to keep changes aligned.

**Commit Checkpoint**
- Summarize progress, update cross-links, and create a commit documenting the outcomes of this phase (for example, `git commit -m "chore(plan): complete phase 2 implementation"`).

### Phase 3 — Validation & Handoff
**Steps**
1. TODO: Detail testing, verification, and documentation updates.
2. TODO: Document evidence the team must capture for maintainers.

**Commit Checkpoint**
- Record the validation evidence and create a commit signalling the handoff completion (for example, `git commit -m "chore(plan): complete phase 3 validation"`).

## Rollback Plan
Document how to revert changes if issues arise during or after implementation.

### Rollback Triggers
When to initiate rollback:
- Critical bugs affecting core functionality
- Performance degradation beyond acceptable thresholds
- Data integrity issues detected
- Security vulnerabilities introduced
- User-facing errors exceeding alert thresholds

### Rollback Procedures
#### Phase 1 Rollback
- Action: Discard discovery branch, restore previous documentation state
- Data Impact: None (no production changes)
- Estimated Time: < 1 hour

#### Phase 2 Rollback
- Action: TODO: Revert commits, restore database to pre-migration snapshot
- Data Impact: TODO: Describe any data loss or consistency concerns
- Estimated Time: TODO: e.g., 2-4 hours

#### Phase 3 Rollback
- Action: TODO: Full deployment rollback, restore previous version
- Data Impact: TODO: Document data synchronization requirements
- Estimated Time: TODO: e.g., 1-2 hours

### Post-Rollback Actions
1. Document reason for rollback in incident report
2. Notify stakeholders of rollback and impact
3. Schedule post-mortem to analyze failure
4. Update plan with lessons learned before retry

## Evidence & Follow-up

List artifacts to collect (logs, PR links, test runs, design notes). Record follow-up actions or owners.

## Codebase Context

- **RAG System:** Recém implementado com 3 componentes principais
  - Migration: `knowledge_documents` table com pgvector
  - Edge Function: `rag-search` para busca híbrida
  - Ingestion API: `/api/admin/ingest-document` para carregar documentos

- **PDF Library:** Usar `pdfplumber` (Python)
- **Embedding:** OpenRouter API (text-embedding-3-small, 1536 dims)
- **Chunking:** Chunks de ~1500 chars com 200 char overlap

---

## Quick Start Guide

### 1. Instalar dependências
```bash
pip install -r scripts/requirements-pdf-extraction.txt
```

### 2. Processar uma especialidade
```bash
export ADMIN_API_KEY=$(grep ADMIN_API_KEY .env.local | cut -d= -f2)
python3 scripts/extract-and-ingest-pdfs.py "Assuntos com PDF/Endodontia"
```

### 3. Processar todas as especialidades
```bash
chmod +x scripts/process-all-pdfs.sh
bash scripts/process-all-pdfs.sh
```

### 4. Verificar resultados
```bash
# Query por especialidade
supabase sql -c "SELECT specialty, COUNT(*) as total FROM knowledge_documents GROUP BY specialty;"

# Testar busca
curl -X POST http://localhost:3000/api/admin/ingest-document/status \
  -H "Authorization: Bearer $(grep ADMIN_API_KEY .env.local | cut -d= -f2)"
```

---

## Expected Output

Ao processar com sucesso:
```
Processing: Endodontia/Caminhos Da Polpa 10 Ed.compressed.pdf
✓ Successfully ingested Caminhos Da Polpa 10 Ed: 45/45 chunks

============================================================
SUMMARY
============================================================
Total PDFs: 6
Successful: 6
Failed: 0
Success rate: 100%

By Specialty:
  endodontia: 6/6 (100%)
============================================================
```

---

## Troubleshooting

**Problem: "ADMIN_API_KEY not found"**
```bash
# Verificar se existe em .env.local
grep ADMIN_API_KEY .env.local

# Caso contrário, set a chave
export ADMIN_API_KEY="your-secret-key"
```

**Problem: "pdfplumber not installed"**
```bash
pip install pdfplumber==0.10.4
```

**Problem: "Connection refused to localhost:3000"**
```bash
# Verificar se o servidor está rodando
curl http://localhost:3000/api/health
```

**Problem: "Embeddings API rate limit"**
- O script tenta automaticamente com backoff exponencial
- Se persistir, ajuste `OPENROUTER_API_KEY` ou rode em outro horário

---

## Monitoring & Analytics

Após processar, consulte a base de dados:

```sql
-- Total de documentos por especialidade
SELECT 
  specialty, 
  COUNT(*) as total_chunks,
  COUNT(DISTINCT parent_document_id) as total_documents,
  AVG(LENGTH(content)) as avg_chunk_size
FROM knowledge_documents
GROUP BY specialty;

-- Documentos com embeddings gerados com sucesso
SELECT 
  COUNT(*) as total_embedded,
  COUNT(CASE WHEN embedding IS NULL THEN 1 END) as missing_embeddings
FROM knowledge_documents;

-- Distribuição por fonte
SELECT 
  source_name, 
  COUNT(*) as chunks
FROM knowledge_documents
GROUP BY source_name
ORDER BY chunks DESC;
```

---

## Next Steps

1. ✅ **Criar scripts de extração** (Concluído)
2. 🔄 **Processar todos os PDFs** (Próximo passo)
3. ⚙️ **Testar qualidade de busca**
4. 📊 **Configurar monitoramento**
5. 🔄 **Auto-refresh periódico de documentos**
