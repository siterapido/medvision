---
title: "Biblioteca Overhaul: Interactive Forms & LP Animations"
summary: "Refatoração completa da Biblioteca para incluir formulários de criação de artefatos com animações premium da Landing Page."
status: in_progress
generated: 2026-01-28
agents:
  - type: "frontend-specialist"
    role: "Implementação da UI/UX, animações Framer Motion e formulários interativos."
  - type: "backend-specialist"
    role: "Expansão da API de geração de artefatos e integração com LLM."
  - type: "architect-specialist"
    role: "Design dos esquemas de dados e estrutura de componentes."
---

# Plano de Implementação: Biblioteca Overhaul

## 1. Objetivos e Escopo
O objetivo é transformar a página `/dashboard/biblioteca` de uma simples lista de artefatos em um hub central de criação de conhecimento. A experiência deve ser premium, utilizando animações dinâmicas inspiradas na landing page para engajar o usuário durante o processo de geração.

### Escopo:
- **UI/UX**: Novo grid de criação no topo da página.
- **Formulários**: Implementação de formulários específicos para:
    - Pesquisa Científica (Research)
    - Resumo & Flashcards (Summary)
    - Simulados Práticos (Exam)
    - Laudo Vision (Vision)
    - Mapas Mentais (Mindmap)
- **Animações**: Integração dos componentes `AgentDemo*` como overlays de processamento.
- **Backend**: Atualização de `api/artifacts/generate` para suportar novos tipos.

## 2. Fases de Implementação

### Fase 1: Fundação e UI do Hub
- **Passo 1.1**: Criar `components/artifacts/artifact-creation-hub.tsx` com cards interativos para cada tipo de artefato.
- **Passo 1.2**: Implementar `components/artifacts/artifact-type-card.tsx` com efeitos de hover e gradientes premium.
- **Passo 1.3**: Integrar o Hub na `app/dashboard/biblioteca/page.tsx` removendo o modal "Coming Soon".

### Fase 2: Formulários e Lógica de Geração
- **Passo 2.1**: Desenvolver componentes de formulário individuais usando `react-hook-form` e `zod`.
- **Passo 2.2**: Criar `components/artifacts/generation-overlay.tsx` que seleciona a animação correta (`AgentDemoResearch`, `AgentDemoSummary`, etc) baseada no tipo de artefato.
- **Passo 2.3**: Implementar a lógica de submissão que chama a API e gerencia o estado de "loading animado".

### Fase 3: Expansão do Backend
- **Passo 3.1**: Atualizar `app/api/artifacts/generate/route.ts` para incluir handlers de `research`, `exam` e `mindmap`.
- **Passo 3.2**: Refinar os system prompts para garantir saída JSON consistente e de alta qualidade técnica odontológica.

### Fase 4: Polimento e Transições
- **Passo 4.1**: Adicionar transições suaves entre o formulário, a animação de processamento e a exibição do resultado.
- **Passo 4.2**: Testar responsividade e performance das animações em dispositivos móveis.

## 3. Atribuição de Agentes
- **Architect**: Definir o contrato de dados entre formulários e API.
- **Frontend**: Foco total nas animações Framer Motion e design do Hub.
- **Backend**: Implementação dos novos prompts e lógica de storage.

## 4. Documentação
- Atualizar `.context/docs/architecture.md` com o novo fluxo de criação direta.
- Documentar os novos endpoints em `.context/docs/api.md`.

## 5. Critérios de Sucesso
- Usuário consegue criar um Resumo Científico em menos de 3 cliques.
- A animação de "Pesquisando" é exibida corretamente durante o await da API.
- O artefato gerado é salvo e aparece instantaneamente na biblioteca após a conclusão.
- Design consistente com a estética premium da Landing Page.

## 6. Plano de Rollback
- Manter a versão anterior da página em `page_old.tsx` (já existente).
- Em caso de falha crítica na API, desativar temporariamente o Hub e voltar para a visualização simples.
