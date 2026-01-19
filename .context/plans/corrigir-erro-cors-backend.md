---
status: in_progress
generated: 2026-01-19
agents:
  - type: "bug-fixer"
    role: "Implement the CORS fix in the backend code"
  - type: "security-auditor"
    role: "Verify that allowing the new origin is safe"
  - type: "devops-specialist"
    role: "Guide the deployment process"
docs:
  - "odonto-gpt-agno-service/README.md"
phases:
  - id: "phase-1"
    name: "Discovery & Analysis"
    prevc: "P"
  - id: "phase-2"
    name: "Implementation"
    prevc: "E"
  - id: "phase-3"
    name: "Validation"
    prevc: "V"
---

# Correção de Erro CORS em Produção Plan

> Adicionar o domínio de produção www.odontogpt.com à lista de origens permitidas (CORS) no serviço backend FastAPI.

## Task Snapshot
- **Primary goal:** Resolver o erro de CORS bloqueando requisições de `https://www.odontogpt.com` para o backend `v0-odonto-gpt-ui-production.up.railway.app`.
- **Success signal:** O código backend reflete explicitamente a origem `https://www.odontogpt.com` na configuração do CORSMiddleware.
- **Key references:**
  - `odonto-gpt-agno-service/app/main.py`: Arquivo principal onde o CORS é configurado.

## Codebase Context
O backend é um serviço FastAPI localizado em `odonto-gpt-agno-service/`. A configuração de CORS é feita via `CORSMiddleware` no arquivo `app/main.py`. Atualmente, ele lê a variável de ambiente `ALLOWED_ORIGINS` e usa um padrão que não inclui o domínio de produção principal `www.odontogpt.com`.

## Agent Lineup
| Agent | Role in this plan | Playbook | First responsibility focus |
| --- | --- | --- | --- |
| Bug Fixer | Implementar a correção no código | [Bug Fixer](../agents/bug-fixer.md) | Editar `app/main.py` |
| Security Auditor | Revisar segurança | [Security Auditor](../agents/security-auditor.md) | Confirmar domínios confiáveis |

## Working Phases
### Phase 1 — Discovery & Analysis
**Steps**
1.  Identificar o local exato da configuração CORS. (Concluído: `odonto-gpt-agno-service/app/main.py`).
2.  Verificar quais domínios estão atualmente permitidos por padrão. (Concluído: localhost e vercel app).

### Phase 2 — Implementation
**Steps**
1.  Atualizar a lista `ALLOWED_ORIGINS` padrão em `odonto-gpt-agno-service/app/main.py` para incluir:
    - `https://www.odontogpt.com`
    - `https://odontogpt.com`

**Commit Checkpoint**
- `fix(backend): add production domains to CORS allowed origins`

### Phase 3 — Validation
**Steps**
1.  Verificar se a sintaxe Python está correta.
2.  Orientar o usuário a realizar o deploy da alteração no Railway.

## Rollback Plan
- Reverter as alterações em `odonto-gpt-agno-service/app/main.py` para o estado anterior.
