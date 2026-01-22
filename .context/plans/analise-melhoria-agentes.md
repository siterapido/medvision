---
status: in_progress
generated: 2026-01-22
agents:
  - type: "architect-specialist"
    role: "Analizar a arquitetura dos agentes e fluxos de IA"
  - type: "feature-developer"
    role: "Implementar melhorias nos prompts e configurações dos agentes"
  - type: "test-writer"
    role: "Validar o comportamento dos agentes após as melhorias"
docs:
  - "architecture.md"
  - "ia-sdk-integration.md"
phases:
  - id: "P"
    name: "Análise e Planejamento de Melhorias"
    prevc: "P"
  - id: "R"
    name: "Review das Mudanças Propostas"
    prevc: "R"
  - id: "E"
    name: "Implementação das Melhorias"
    prevc: "E"
  - id: "V"
    name: "Validação e Testes"
    prevc: "V"
---

# Plano de Análise e Melhoria dos Agentes Odonto GPT

Este plano detalha a análise e o aprimoramento dos agentes de IA especializados em odontologia, focando na otimização de seus prompts, ferramentas e integração com os SDKs de IA e Chat.

## Objetivos
- Analisar os 6 agentes atuais: `odonto-gpt`, `odonto-summary`, `odonto-practice`, `odonto-research`, `odonto-vision` e `odonto-write`.
- Melhorar a clareza e eficácia dos prompts de sistema.
- Unificar e otimizar o uso de ferramentas (tools) entre os agentes.
- Garantir que a integração com o Agno Service e a Vercel AI SDK esteja seguindo as melhores práticas.

## Fases do Plano

### Phase P: Análise e Planejamento
**Objetivo**: Identificar gaps e oportunidades em cada agente.
**Passos**:
1. **Auditoria de Prompts**: Revisar `lib/ai/agents/config.ts` para verificar se os prompts de sistema estão alinhados com as diretrizes da ZPD (Zona de Desenvolvimento Proximal).
2. **Mapeamento de Ferramentas**: Verificar se cada agente tem as ferramentas necessárias e se os parâmetros estão corretos.
3. **Análise de Fluxo**: Examinar `lib/ai/agent.ts` e `lib/ai/agno-service.ts` para entender como os agentes são chamados e como o contexto é mantido.
4. **Documentação**: Criar/Atualizar `AGENTS.md` com a definição clara de cada agente.

**Commit Checkpoint**: `docs(context): finalize analysis of odonto agents`

### Phase R: Review
**Objetivo**: Validar as propostas de mudança.
**Passos**:
1. **Revisão Técnica**: Validar as alterações nos tipos e interfaces em `lib/ai/types.ts`.
2. **Aprovação de Prompts**: Revisar as melhorias de linguagem e pedagogia nos prompts.

### Phase E: Implementação
**Objetivo**: Aplicar as melhorias no código.
**Passos**:
1. **Refatoração de Config**: Atualizar `AGENT_CONFIGS` em `lib/ai/agents/config.ts`.
2. **Otimização de Ferramentas**: Ajustar as definições de tools se necessário em `lib/ai/tools/definitions.ts`.
3. **Ajustes no SDK**: Melhorar o tratamento de erros e streaming no `processMessage` de `lib/ai/agent.ts`.

**Commit Checkpoint**: `feat(ai): improve agent prompts and tool configurations`

### Phase V: Validação
**Objetivo**: Garantir que os agentes estão funcionando conforme o esperado.
**Passos**:
1. **Testes Manuais**: Testar cada agente via interface de chat.
2. **Scripts de Teste**: Criar um script simples para testar a resposta inicial de cada agente.
3. **Verificação de Logs**: Analisar logs do Agno Service para garantir que as ferramentas estão sendo chamadas corretamente.

**Commit Checkpoint**: `test(ai): verify agent responses and tool execution`

## Critérios de Sucesso
- Todos os agentes respondem de acordo com sua nova definição de persona.
- Ferramentas como `saveSummary` e `saveFlashcards` são chamadas corretamente sem "alucinação" de instruções.
- O sistema de streaming funciona sem interrupções em todos os agentes.
- Documentação dos agentes está 100% atualizada.
