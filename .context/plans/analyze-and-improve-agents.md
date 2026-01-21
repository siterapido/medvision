---
status: completed
generated: 2026-01-21
agents:
  - type: "code-reviewer"
    role: "Review code changes for quality, style, and best practices"
  - type: "bug-fixer"
    role: "Analyze bug reports and error messages"
  - type: "feature-developer"
    role: "Implement new features according to specifications"
  - type: "refactoring-specialist"
    role: "Identify code smells and improvement opportunities"
  - type: "test-writer"
    role: "Write comprehensive unit and integration tests"
  - type: "documentation-writer"
    role: "Create clear, comprehensive documentation"
  - type: "performance-optimizer"
    role: "Identify performance bottlenecks"
  - type: "security-auditor"
    role: "Identify security vulnerabilities"
  - type: "frontend-specialist"
    role: "Design and implement user interfaces"
  - type: "architect-specialist"
    role: "Design overall system architecture and patterns"
  - type: "devops-specialist"
    role: "Design and maintain CI/CD pipelines"
docs:
  - "project-overview.md"
  - "architecture.md"
  - "development-workflow.md"
  - "testing-strategy.md"
  - "glossary.md"
  - "security.md"
  - "tooling.md"
phases:
  - id: "phase-1"
    name: "Discovery & Alignment"
    prevc: "P"
  - id: "phase-2"
    name: "Implementation & Iteration"
    prevc: "E"
  - id: "phase-3"
    name: "Validation & Handoff"
    prevc: "V"
---

# Analyze And Improve Agents Plan

> Análise abrangente dos agentes atuais e seus artefatos para otimização com ai-context. Foco em limpar ruído de arquivos arquivados, preencher descrições faltantes e conectar playbooks às implementações reais.

## Task Snapshot
- **Primary goal:** Otimizar os 14 playbooks de agentes em `.context/agents/` removendo ruído (`_archived`, `venv`) e enriquecendo com links contextuais precisos para o código fonte ativo.
- **Success signal:** Todos os playbooks livres de referências a diretórios temporários ou arquivados; descrições de diretórios preenchidas; agentes de domínio (`odonto-*`) linkados às suas implementações em `lib/ai`.
- **Key references:**
  - [Documentation Index](../docs/README.md)
  - [Agent Handbook](../agents/README.md)
  - [Plans Index](./README.md)

## Codebase Context
- **Total files analyzed:** 5000+
- **Total symbols discovered:** 24062+
- **Architecture layers:** Config, Controllers, Components, Utils, Services, Models, Repositories
- **Detected patterns:** Factory, Singleton, Repository, Controller, Builder, Observer
- **Entry points:** lib/supabase/server.ts, components/research/index.ts, components/newdashboard/index.ts

### Key Components
**Core Classes:**
- `MockDb` — scripts/test_perplexity_research.py
- `HybridRouter` — _archived/odonto-gpt-agno-service/app/router.py (to be checked for migration status)

**Key Interfaces:**
- `NotificationTemplate` — lib/notifications.ts
- `AgentDetails` — lib/agno.ts
- `ToolCall` — lib/agno.ts

## Agent Lineup
| Agent | Role in this plan | Playbook | First responsibility focus |
| --- | --- | --- | --- |
| Architect Specialist | Lead Analyst | [Architect Specialist](../agents/architect-specialist.md) | Analisar a estrutura atual e definir o padrão ouro para os playbooks. |
| Feature Developer | Executor | [Feature Developer](../agents/feature-developer.md) | Implementar as correções nos arquivos markdown dos agentes. |
| Documentation Writer | Reviewer | [Documentation Writer](../agents/documentation-writer.md) | Garantir clareza e consistência nas descrições adicionadas. |

## Documentation Touchpoints
| Guide | File | Primary Inputs |
| --- | --- | --- |
| Agent Handbook | [agents/README.md](../agents/README.md) | Atualizar lista de agentes se houver novos descobertos. |
| Project Overview | [project-overview.md](../docs/project-overview.md) | Garantir que a visão do projeto esteja refletida nos agentes. |

## Risk Assessment
Identify potential blockers, dependencies, and mitigation strategies before beginning work.

### Identified Risks
| Risk | Probability | Impact | Mitigation Strategy | Owner |
| --- | --- | --- | --- | --- |
| Remoção acidental de contexto útil | Baixo | Médio | Usar git para versionamento; revisar diffs cuidadosamente. | Feature Developer |
| Desatualização rápida dos links manuais | Médio | Baixo | Usar caminhos relativos estáveis e referências a diretórios chave em vez de arquivos voláteis. | Architect Specialist |

### Dependencies
- **Internal:** Acesso de escrita aos arquivos em `.context/agents`.
- **External:** Nenhuma.
- **Technical:** Ferramentas `ai-context` operacionais.

### Assumptions
- O diretório `_archived` contém código que não deve ser referenciado pelos agentes ativos.
- O diretório `tmp` e `venv` são artefatos de build/teste locais e não parte do contexto do projeto.

## Resource Estimation

### Time Allocation
| Phase | Estimated Effort | Calendar Time | Team Size |
| --- | --- | --- | --- |
| Phase 1 - Discovery | 0.5 hours | 1 day | 1 AI |
| Phase 2 - Implementation | 1.0 hours | 1 day | 1 AI |
| Phase 3 - Validation | 0.5 hours | 1 day | 1 AI |
| **Total** | **2.0 hours** | **1 day** | **1 AI** |

## Working Phases
### Phase 1 — Discovery & Alignment
**Status: Completed**
**Steps**
1. Listar todos os arquivos em `.context/agents`.
2. Identificar agentes "scaffolded" (gerados auto) vs "custom".
3. Mapear quais arquivos precisam de limpeza (`_archived`, `venv`).

**Commit Checkpoint**
- N/A (Fase de análise apenas, resultado será o plano detalhado de execução na Fase 2).

### Phase 2 — Implementation & Iteration
**Status: Completed**
**Steps**
1. **Limpeza em Lote:** Remover linhas contendo `_archived`, `venv`, `tmp` de todos os arquivos `.md` em `.context/agents`.
2. **Enriquecimento Core:** Atualizar `feature-developer.md` e outros core agents preenchendo as descrições "TODO" com resumos de uma linha sobre cada diretório (`app/`: Next.js App Router; `components/`: UI Components, etc.).
3. **Enriquecimento Domain:** Atualizar `odonto-research.md` e outros domain agents adicionando links diretos para `lib/ai/tools/...` e `lib/agno.ts`.

**Commit Checkpoint**
- `chore(context): clean and enrich agent playbooks`

### Phase 3 — Validation & Handoff
**Status: Completed**
**Steps**
1. Ler um dos arquivos atualizados (ex: `feature-developer.md`) para verificar a limpeza.
2. Validar se os links adicionados apontam para arquivos existentes.

**Commit Checkpoint**
- `chore(context): validate agent playbooks`

## Rollback Plan
Document how to revert changes if issues arise during or after implementation.

### Rollback Triggers
- Playbooks quebrados ou ilegíveis.

### Rollback Procedures
#### Phase 2 Rollback
- Action: `git checkout .context/agents/`
- Data Impact: Perda das descrições novas.
- Estimated Time: < 1 minute

## Evidence & Follow-up
- Lista de arquivos modificados.
- Conteúdo de exemplo de um arquivo limpo.
