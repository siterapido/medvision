---
status: in_progress
generated: 2026-01-20
agents:
  - type: "refactoring-specialist"
    role: "Identificar e remover código redundante e boilerplate"
  - type: "architect-specialist"
    role: "Padronizar a orquestração e modularizar o serviço Agno"
  - type: "documentation-writer"
    role: "Limpar o contexto de IA removendo planos e relatórios obsoletos"
docs:
  - ".context/workflow/docs/architecture-guia-de-estilo-e-padronização-de-agentes.md"
phases:
  - id: "phase-1"
    name: "Pruning e Modularização"
    prevc: "E"
  - id: "phase-2"
    name: "Orquestrador Dedicado"
    prevc: "E"
  - id: "phase-3"
    name: "Cleanup de Contexto"
    prevc: "V"
---

# Plano de Simplificação de Código e Contexto IA

> Objetivo: Reduzir a complexidade cognitiva do backend Agno, remover dependências não utilizadas em produção e organizar a documentação de contexto.

## Goal & Scope
- **Goal:** Transformar o backend em uma arquitetura modular onde a API não conheça detalhes de roteamento, e o roteador seja leve (<4GB).
- **In-Scope:** `app/api.py`, `app/router.py`, `.context/plans`, `.context/reports`.
- **Out-of-Scope:** Mudanças na lógica de negócio das ferramentas (PubMed/Perplexity).

## Phases

### Phase 1: Pruning e Modularização (E)
- **Ação:** Remover lógica de `sentence-transformers` do `app/router.py` (mantendo apenas o modo keyword otimizado).
- **Ação:** Refatorar `app/router.py` para ser uma classe utilitária pura sem dependências pesadas de ML.
- **Commit:** `refactor(router): remove heavy ML dependencies and standardize keyword routing`

### Phase 2: Orquestrador Dedicado (E)
- **Ação:** Criar `app/services/orchestrator.py`.
- **Ação:** Mover o `agent_map` e a lógica de decisão de `app/api.py` para o novo serviço.
- **Ação:** Simplificar `app/api.py` para usar apenas `Orchestrator.handle_chat(...)`.
- **Commit:** `feat(orchestrator): move agent routing logic to dedicated service`

### Phase 3: Cleanup de Contexto (V)
- **Ação:** Deletar planos concluídos em `.context/plans/` (exceto README).
- **Ação:** Limpar `.context/reports/` de execuções passadas.
- **Ação:** Atualizar o `README.md` do contexto com a nova estrutura simplificada.
- **Commit:** `chore(context): prune obsolete plans and reports`

## Success Criteria
1.  **Tamanho da Imagem:** Manter build abaixo de 1GB no Railway.
2.  **Legibilidade:** `app/api.py` deve ter menos de 500 linhas (atualmente >1000).
3.  **Modularidade:** É possível adicionar um novo agente alterando apenas o Orchestrator.
