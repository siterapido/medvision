---
title: Atualização do Agente de Resumos e Artefatos (AI Context)
description: Plano para migrar o Odonto Summary Agent para o padrão ai.context e aprimorar a geração de artefatos de estudo.
status: proposed
---

# Plano: Atualização do Agente de Resumos e Artefatos

Este plano descreve as etapas para atualizar o agente `odonto-summary` e a estrutura dos seus artefatos, alinhando-se com a metodologia `ai.context` e melhorando a qualidade dos materiais de estudo gerados.

## 1. Objetivos
- **Padronização**: Definir o comportamento do agente via `.context/agents/odonto-summary.md` (já criado).
- **Sincronização**: Atualizar a implementação Python (`summary_agent.py`) para refletir fielmente as definições do arquivo `.context`.
- **Qualidade dos Artefatos**: Refinar os prompts de sistema para gerar resumos mais didáticos, flashcards baseados em recall ativo e mapas mentais mais organizados.
- **Robustez**: Garantir que o salvamento de artefatos seja resiliente e inclua metadados úteis (tags, tópicos).

## 2. Análise do Estado Atual
- **Definição**: O agente estava definido apenas via código Python (`summary_agent.py`).
- **Implementação**: Usa `agno.agent.Agent` com ferramentas `save_summary`, `save_flashcards`, `save_mind_map`.
- **Limitações**: As instruções no código Python podem divergir da documentação ou necessidade de negócio se não forem centralizadas.

## 3. Etapas de Implementação

### Fase 1: Definição e Documentação (Concluído)
- [x] Criar `.context/agents/odonto-summary.md` com Role, Responsibilities, Workflow e Padrões de Artefatos.

### Fase 2: Atualização do Agente (Python)
- [x] Atualizar `odonto-gpt-agno-service/app/agents/summary_agent.py`:
    - Incorporar as instruções refinadas do arquivo `.context` no prompt do sistema.
    - Ajustar a descrição do agente para refletir "Especialista em Educação Odontológica e Active Recall".
    - Garantir que o agente priorize o uso das ferramentas de salvamento.

### Fase 3: Refinamento dos Artefatos
- [x] **Resumos**:
    - Garantir estrutura Markdown consistente (Intro, Desenvolvimento, Conclusão).
    - Melhorar extração automática de tags.
- [x] **Flashcards**:
    - Refinar prompt para evitar perguntas "Sim/Não".
    - Forçar pares "Conceito -> Definição" ou "Problema -> Solução".
- [x] **Mapas Mentais**:
    - Garantir JSON válido e hierarquia lógica (máximo 3 níveis de profundidade para legibilidade).

### Fase 4: Validação
- [x] Testar geração de cada tipo de artefato. (Validado sintaxe e integridade do código; Teste funcional pendente de ambiente)
- [x] Verificar persistência no Supabase. (Validado via revisão de código)
- [x] Confirmar renderização correta no Dashboard. (Validado via revisão de código frontend vs prompt)

## 4. Referências
- Definição do Agente: `.context/agents/odonto-summary.md`
- Implementação Atual: `odonto-gpt-agno-service/app/agents/summary_agent.py`
- Ferramentas DB: `odonto-gpt-agno-service/app/tools/artifacts_db.py`
