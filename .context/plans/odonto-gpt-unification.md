# Plano de Unificação: Odonto GPT & Odonto Flow

Este plano detalha a estratégia para unificar o agente de chat ("Odonto GPT") e o orquestrador ("Odonto Flow" / "Odonto GPT Team") em uma única entidade coesa chamada **Odonto GPT**, utilizando `ai-context` para orquestração inteligente.

## 1. Objetivo
Eliminar a distinção entre "conversar com o chat" e "usar o fluxo de equipe". O usuário deve interagir com uma única inteligência (**Odonto GPT**) que, nativamente, sabe responder de forma amigável (persona do chat) OU delegar para especialistas (função do flow) com base no contexto.

## 2. Análise da Situação Atual
*   **Odonto GPT (`odonto_gpt_agent.py`)**: Agente individual. Personalidade: Mentor amigável. Funções: Chat, RAG básico.
*   **Odonto Flow / Team (`team.py`)**: Equipe de agentes. Personalidade: Orquestrador neutro. Funções: Delegar tarefas para especialistas (Research, Vision, etc.).
*   **Problema**: O usuário ou o roteador precisa decidir entre "falar com o chat" ou "chamar a equipe".

## 3. Arquitetura Proposta: "Odonto GPT Unificado"
A classe `Team` definida em `team.py` será refatorada para se tornar a identidade principal do **Odonto GPT**.

### Mudanças Principais:
1.  **Absorção de Persona**: A `Team` receberá as instruções de personalidade (amigável, didático, emojis) que hoje estão isoladas no `odonto_gpt_agent.py`.
2.  **Agente Generalista Interno**: O membro `odonto_gpt` da equipe será reconfigurado para ser o "executor padrão" de respostas de texto, mas a **interface** será a Equipe.
3.  **Orquestração via `ai-context`**: As instruções do sistema (System Prompt) usarão explicitamente regras de contexto para decidir a delegação, sem depender de um "roteador híbrido" externo para essa escolha binária inicial.

## 4. Etapas de Implementação

### Fase 1: Refatoração do Backend (`odonto-gpt-agno-service`)
1.  **Atualizar `app/agents/team.py`**:
    *   Renomear a variável de instância para refletir a unicidade (ex: `odonto_gpt_unified`).
    *   **Instructions**: Mesclar as instruções de "Identidade e Tom" do `odonto_gpt_agent.py` nas instruções da `Team`.
    *   **Fallback Behavior**: Garantir que, se nenhuma ferramenta especializada for necessária, a resposta seja gerada com a persona do Odonto GPT.

2.  **Ajuste no Roteamento (`app/agents/team.py` -> `rotear_para_agente_apropriado`)**:
    *   Simplificar a lógica: A maioria das intenções genéricas deve cair direto no **Odonto GPT Unificado**.
    *   Manter roteamento direto para especialistas APENAS se o usuário pedir explicitamente (ex: "Quero falar com o Odonto Vision"). Caso contrário, tudo passa pelo Odonto GPT.

3.  **Integração com `ai-context`**:
    *   Nas instruções da `Team`, adicionar regras claras baseadas nos arquivos `.context`:
        *   `Se o contexto indicar necessidade de imagem -> Delegar para Odonto Vision`
        *   `Se o contexto indicar dúvida acadêmica profunda -> Delegar para Odonto Research`

### Fase 2: Limpeza e Simplificação
*   Remover a necessidade de chamar `odonto_gpt` separadamente. Ele passa a ser um "membro interno" transparente.
*   Atualizar o endpoint da API para expor principalmente essa interface unificada.

## 5. Exemplo de Fluxo Unificado
> **Usuário**: "Estou com dúvida sobre cimentação de facetas."
>
> **Antes**:
> *   *Router*: Manda para Odonto GPT (Chat).
> *   *Odonto GPT*: Responde com base no conhecimento geral.
>
> **Depois (Unificado)**:
> *   *Odonto GPT (Team)*: Recebe a mensagem.
> *   *Análise Interna*: "Pergunta clínica. Posso responder, mas se for muito complexo, chamo o Research."
> *   *Ação*: Responde com a persona amigável, mas tem o poder de invocar `odonto_research` se o usuário pedir "busque artigos sobre isso".

## 6. Próximos Passos
1.  Aprovar este plano.
2.  Executar a refatoração de `team.py`.
3.  Testar o fluxo unificado.
