# Plano: Habilitar Geração de Artefatos em Todos os Agentes com Vercel AI SDK e Contexto

Este plano detalha as etapas para atualizar os agentes do Odonto GPT (especialmente o agente principal `odonto-gpt`) para gerar artefatos (Resumos, Flashcards, Mapas Mentais, Simulados, Pesquisas) diretamente via chat, utilizando o SDK da Vercel (`ai`) e regras de contexto ("ia-context").

## 1. Objetivos
*   **Capacidade Universal**: Permitir que o agente principal (`odonto-gpt`) e outros agentes gerem artefatos sem precisar redirecionar o usuário para outra aba ou "agente especialista" isolado.
*   **Integração Vercel AI SDK**: Utilizar `streamText` com `tools` (Function Calling) para uma experiência de chat fluida.
*   **Contexto Inteligente (Perfil + Setup)**: Enriquecer o contexto do usuário (Universidade, Semestre, Especialidade de Interesse) para personalizar as respostas.
*   **Modo Setup (Onboarding)**: Criar um fluxo de diálogo onde o Odonto GPT coleta proativamente essas informações se estiverem faltando.

## 2. Análise da Situação Atual
*   **Agentes (`lib/ai/agents/config.ts`)**:
    *   `odonto-gpt`: Possui apenas ferramentas de consulta (`askPerplexity`, `searchPubMed`). **Não pode salvar artefatos.**
*   **Perfil do Usuário (`profiles` table)**:
    *   Atualmente possui: `name`, `email`, `profession`, `cro`, `company`.
    *   **Falta**: `university`, `semester` (periodo), `specialty_interest` (foco).
*   **API (`app/api/chat/route.ts`)**:
    *   Já utiliza `streamText` do Vercel AI SDK.
*   **Contexto**: O contexto do usuário não é injetado explicitamente no System Prompt.

## 3. Estratégia de Implementação

### Fase 1: Enriquecimento do Perfil (Banco de Dados e UI)
**Objetivo**: Armazenar dados acadêmicos relevantes.

1.  **Migration (Supabase)**:
    *   Adicionar colunas à tabela `profiles`:
        *   `university` (text)
        *   `semester` (text ou int) - ex: "8º semestre"
        *   `specialty_interest` (text) - ex: "Ortodontia", "Endodontia"
        *   `level` (text) - ex: "Graduando", "Especialista"

2.  **Atualizar UI do Perfil (`components/profile/profile-form.tsx`)**:
    *   Adicionar inputs para esses novos campos.
    *   Permitir que o usuário edite manualmente.

### Fase 2: Configuração do Agente e Ferramentas
**Arquivo Alvo**: `app/lib/ai/agents/config.ts` e `app/lib/ai/tools/definitions.ts`

1.  **Expandir Ferramentas do `odonto-gpt`**:
    *   Adicionar todas as ferramentas de `save*` (Summary, Flashcards, etc.).
    *   **Nova Ferramenta**: `updateUserProfile`.
        *   Permite que o agente salve as informações coletadas durante o chat (ex: "Entendi, você estuda na USP e está no 5º semestre.").
        *   Params: `university`, `semester`, `specialty_interest`.

2.  **Atualizar System Prompt do `odonto-gpt`**:
    *   **Instrução de Setup**: "Se você não souber o semestre ou faculdade do aluno, pergunte casualmente no início da conversa para adaptar seu ensino."
    *   **Instrução de Orquestração**: "Se o usuário pedir um material, use a ferramenta de salvamento apropriada."

### Fase 3: Injeção de Contexto e Modo Setup
**Arquivo Alvo**: `app/api/chat/route.ts`

1.  **Capturar Contexto Completo**:
    *   Recuperar `profiles` com os novos campos.

2.  **Lógica do "Modo Setup"**:
    *   Se os campos `semester` ou `university` estiverem vazios no banco:
        *   Injetar instrução temporária no System Prompt: "Você está no MODO SETUP. Sua prioridade agora é descobrir em qual semestre e faculdade o aluno está para personalizar o ensino. Pergunte isso de forma simpática antes de responder à dúvida técnica."
    *   Quando o agente chamar `updateUserProfile`, os dados são salvos e nas próximas chamadas o "Modo Setup" é desativado automaticamente (pois os campos não estarão mais vazios).

3.  **Prompt de Contexto**:
    *   `Contexto Acadêmico: [Universidade: {university}, Semestre: {semester}, Foco: {specialty_interest}]. Adapte a linguagem e profundidade para este perfil.`

### Fase 4: Padronização e Frontend

1.  **Frontend Chat**: Garantir feedback visual para a ferramenta `updateUserProfile` (ex: "Atualizando seu perfil...").

## 4. Plano de Execução (Passo a Passo)

1.  [ ] **Backup**: Criar branch `feat/unified-artifacts-context`.
2.  [ ] **Database**:
    *   Criar migration SQL para adicionar colunas em `profiles`.
    *   Rodar `supabase db push` ou executar SQL via ferramenta.
3.  [ ] **UI Perfil**: Atualizar `ProfileForm` com os novos campos.
4.  [ ] **Ferramenta de Update**: Criar `updateUserProfile` em `lib/ai/tools/definitions.ts`.
5.  [ ] **Configuração Agente**:
    *   Adicionar ferramentas ao `odonto-gpt`.
    *   Atualizar System Prompt com lógica de Setup e Orquestração.
6.  [ ] **Backend Chat**:
    *   Buscar perfil atualizado.
    *   Injetar contexto no prompt.
    *   Implementar lógica condicional para ativar instruções de "Modo Setup".
7.  [ ] **Teste**:
    *   Resetar perfil (deixar campos vazios).
    *   Iniciar chat e verificar se Odonto GPT pergunta sobre o semestre.
    *   Responder e verificar se ele salva (chamando a tool) e se o perfil é atualizado.
    *   Pedir um resumo e verificar se é salvo.

## 5. Benefícios
*   **Personalização Extrema**: O agente se adapta ao nível do aluno (calouro vs residente).
*   **Onboarding Fluido**: Coleta de dados via conversa natural ("Modo Setup").
*   **Tudo em Um**: Chat resolve dúvidas, cria materiais e gerencia o perfil.
