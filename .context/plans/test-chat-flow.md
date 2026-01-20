---
status: in_progress
generated: 2026-01-19
agents:
  - type: "odonto-research"
    role: "Pesquisar informações clínicas precisas"
  - type: "odonto-summary"
    role: "Sintetizar informações para o paciente"
  - type: "performance-optimizer"
    role: "Monitorar latência e sugerir melhorias"
  - type: "code-reviewer"
    role: "Validar integridade dos artefatos JSON"
  - type: "frontend-specialist"
    role: "Verificar naturalidade e renderização"
docs:
  - ".context/workflow/docs/test-plan-estratégia-de-teste-chat-principal.md"
phases:
  - id: "phase-1"
    name: "Setup e Definição"
    prevc: "P"
  - id: "phase-2"
    name: "Execução da Simulação"
    prevc: "E"
  - id: "phase-3"
    name: "Análise e Validação"
    prevc: "V"
---

# Plano de Teste: Fluxo Integrado do Chat Principal

> Plano de teste abrangente focado na orquestração entre agentes (Research, Summary), métricas de latência e validação rigorosa de artefatos.

## Goal & Scope
- **Goal:** Validar se o Chat Principal processa perguntas complexas dentro dos SLAs de performance (<5s), mantendo a personalidade da marca e gerando JSONs válidos.
- **Scope:** Fluxo completo `User Request -> Router -> Research Agent -> Summary Agent -> Client Response`.
- **References:**
  - [Estratégia Detalhada de Teste](../workflow/docs/test-plan-estratégia-de-teste-chat-principal.md)
  - [Guidelines de Agentes](../agents/README.md)

## Phases

### Phase 1: Setup e Definição (P)
- [x] Inicializar Workflow (`workflowInit`).
- [x] Mapear Agentes Disponíveis (`discoverAgents`).
- [x] Criar Documento de Estratégia (`test-plan-estratégia-de-teste-chat-principal.md`).
- [ ] Definir massa de dados de teste (Prompts complexos vs. simples).

### Phase 2: Execução da Simulação (E)
- [ ] **Simulação 1: Baixa Complexidade** (Saudação/Trivial).
  - *Owner:* `frontend-specialist` (Simulado)
  - *Check:* TTFT < 800ms.
- [ ] **Simulação 2: Alta Complexidade** (Pergunta Clínica: "Implante em diabético").
  - *Owner:* `odonto-research` + `odonto-summary`
  - *Check:* Acionamento correto das ferramentas de busca.
- [ ] Captura de Logs de Latência (Trace da execução).

### Phase 3: Análise e Validação (V)
- [ ] **Análise de Performance:**
  - *Owner:* `performance-optimizer`
  - *Check:* Verificar gargalos na troca de mensagens entre agentes.
- [ ] **Validação de Artefatos:**
  - *Owner:* `code-reviewer`
  - *Check:* JSON Schema Validation (garantir que não há alucinações de formato).
- [ ] **Análise de Personalidade:**
  - *Owner:* `frontend-specialist`
  - *Check:* Tom empático e autoridade médica adequada (Disclaimer presente).

## Success Criteria
1.  **Latência:** Respostas complexas completas em < 5s.
2.  **Integridade:** 100% dos JSONs de resposta válidos.
3.  **Qualidade:** Resposta final contém disclaimer médico obrigatório.
4.  **Orquestração:** Router identifica corretamente quando chamar o Research Agent.
