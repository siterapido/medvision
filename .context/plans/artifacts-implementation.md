---
title: Plano de Implementação Completa dos Artefatos Odonto
description: Plano detalhado para integração total dos agentes, artefatos, banco de dados e UI/UX no ecossistema Odonto GPT.
status: completed
---

# Plano de Implementação Completa: Ecossistema de Artefatos Odonto GPT

Este documento descreve a arquitetura completa, fluxo de dados e implementação da interface para os artefatos gerados pelos agentes especializados (Odonto Practice, Vision, Summary).

## 1. Visão Geral da Arquitetura

O sistema opera em um fluxo bidirecional totalmente integrado:
1.  **Agentes Especializados (Agno Service):** Geram conteúdo estruturado e persistem automaticamente no Supabase.
2.  **Supabase (Database):** Armazena os artefatos em tabelas dedicadas com tipagem forte.
3.  **Frontend (Next.js/AG-UI):** Renderiza visualizações ricas ("Cards") no chat e Páginas de Detalhes completas no Dashboard.

## 2. Mapeamento de Agentes e Artefatos

Cada agente é responsável por tipos específicos de artefatos. A persistência é automática via chamadas de ferramentas.

| Agente | ID | Artefatos Gerados | Ferramentas (Python) | Tabela Supabase | Rota Frontend |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Odonto GPT** | `odonto-gpt` | *Nenhum direto (Triage)* | (Encaminha para especialistas) | - | - |
| **Odonto Practice** | `odonto-practice` | Simulados, Questões | `save_practice_exam` | `practice_exams` | `/dashboard/questionarios/[id]` |
| **Odonto Summary** | `odonto-summary` | Resumos, Flashcards, Mapas Mentais | `save_summary`, `save_flashcards`, `save_mind_map` | `summaries`, `flashcard_decks`, `mind_map_artifacts` | `/dashboard/{resumos|flashcards|mindmaps}/[id]` |
| **Odonto Vision** | `odonto-vision` | Análise de Imagem | `save_image_analysis` | `image_artifacts` | `/dashboard/imagens/[id]` * |

> (*) Necessita implementação da visualização no Chat e Página de Detalhes.

## 3. Fluxo de Dados e Integração

### A. Geração e Persistência (Backend)
Os agentes não escrevem o artefato no texto do chat. Eles usam ferramentas:
1.  User solicita: "Crie um simulado de Endodontia".
2.  Agente (`odonto-practice`) gera o JSON do simulado.
3.  Agente chama `save_practice_exam(...)` com o JSON.
4.  Ferramenta salva no Supabase e retorna: `ID: 123-abc`.
5.  Agente responde no chat: "Simulado salvo com sucesso! ID: 123-abc".

### B. Visualização no Chat (Frontend)
O componente `AgnoMessage` (`components/agno-chat/agno-message.tsx`) intercepta as chamadas de ferramenta (`tool_calls`):
1.  Detecta `tool_name` (ex: `save_practice_exam`).
2.  Oculta a resposta em texto cru (se necessário).
3.  Renderiza um **Card Interativo** (ex: Card Roxo para Simulados) com status (Loading/Success).
4.  Exibe botão "Iniciar" ou "Abrir" que leva à rota do Dashboard.

### C. Gestão no Dashboard (Frontend)
Páginas dedicadas para consumo e gestão dos artefatos:
-   **Listagem**: Visualização em Grid/Lista com filtros (Data, Tópico).
-   **Detalhes**: Layout imersivo (`ArtifactPageLayout`) com ações (Exportar PDF, Compartilhar, Discutir com IA).
-   **Integração**: Botão "Discutir com IA" carrega o artefato como contexto no chat.

## 4. Plano de Ação para Implementação Final

### Fase 1: Padronização e Correções (Imediato)
-   [x] Verificar ferramentas de salvamento nos agentes (`study`, `summary` OK).
-   [ ] **Ação**: Adicionar suporte visual para `save_image_analysis` no `AgnoMessage`.
-   [ ] **Ação**: Criar/Verificar página de detalhes para Análise de Imagem (`/dashboard/imagens/[id]`).

### Fase 2: Interface "Possibilidade de Salvar" (Melhoria UX)
Atualmente, apenas artefatos gerados via ferramentas são salvos. Para permitir salvar *qualquer* resposta:
-   [ ] Adicionar botão "Salvar como Nota" nas ações da mensagem (`AgnoMessage`).
-   [ ] Criar tabela simples `notes` no Supabase e rota `/dashboard/notas`.

### Fase 3: Navegação Cruzada
-   [ ] Garantir que o `odonto-gpt` (Generalista) saiba encaminhar corretamente para os especialistas quando o usuário pedir um artefato complexo.

## 5. Estrutura de Tabelas (Referência)

As tabelas já devem existir via migrations (`20260114...` em diante):
-   `practice_exams`: `id`, `title`, `topic`, `difficulty`.
-   `practice_questions`: `id`, `exam_id`, `question_text`, `correct_answer`, `explanation`.
-   `summaries`: `id`, `title`, `content`, `tags`.
-   `flashcard_decks`: `id`, `title`, `cards` (json).
-   `mind_map_artifacts`: `id`, `title`, `data` (json).
-   `image_artifacts`: `id`, `title`, `analysis`, `findings` (array).

---
*Este plano serve como guia mestre para a arquitetura de artefatos do Odonto GPT.*
