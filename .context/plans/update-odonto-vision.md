# Plano de Atualização: Odonto Vision 2.0

Este documento detalha a estratégia para pesquisar, atualizar e otimizar o agente **Odonto Vision**, integrando-o plenamente ao fluxo de trabalho do OdontoGPT e à documentação do contexto (`.context`).

## 1. Pesquisa e Seleção de Modelos (OpenRouter)

O objetivo é selecionar modelos multimodais (Vision-Language Models - VLMs) que ofereçam o melhor equilíbrio entre precisão diagnóstica, capacidade de raciocínio clínico e custo-benefício.

### Modelos Candidatos
| Modelo | ID OpenRouter | Pontos Fortes | Uso Recomendado |
| :--- | :--- | :--- | :--- |
| **GPT-4o** | `openai/gpt-4o` | Referência em visão computacional, excelente raciocínio médico, rápido. | **Padrão** (Alta precisão) |
| **Claude 3.5 Sonnet** | `anthropic/claude-3.5-sonnet` | Excepcional em seguir instruções complexas, menos alucinação, análise visual detalhada. | **Alternativa Premium** (Análise detalhada) |
| **Gemini 1.5 Pro** | `google/gemini-pro-1.5` | Janela de contexto massiva, nativo multimodal, bom para comparar múltiplas imagens. | **Pesquisa/Complexo** (Casos difíceis) |
| **Llama 3.2 90B Vision** | `meta-llama/llama-3.2-90b-vision-instruct` | Opção Open Weights, custo menor, boa performance geral. | **Custo-efetivo** (Triagem inicial) |

### Recomendação
Manter **`openai/gpt-4o`** como padrão pela robustez, mas configurar o sistema para permitir fácil alternância (fallback) para **`anthropic/claude-3.5-sonnet`** caso haja indisponibilidade ou necessidade de uma "segunda opinião".

## 2. Workflow Otimizado (Fluxo de Análise)

O fluxo atual é linear. Propomos um fluxo estruturado em etapas cognitivas para garantir laudos mais completos e seguros.

### Novo Workflow Cognitivo
1.  **Triagem de Qualidade**: O agente verifica primeiro se a imagem tem qualidade diagnóstica. Se não, solicita nova imagem.
2.  **Varredura Sistemática**: Análise por quadrantes ou estruturas (esmalte, dentina, polpa, periodonto, osso).
3.  **Correlação Clínica**: Cruza achados visuais com o contexto fornecido pelo usuário (queixa principal).
4.  **Geração Estruturada**: Produz o laudo em formato híbrido (Markdown para leitura + JSON para dados).

### Prompt Engineering (System Prompt)
Atualizar as instruções do agente para impor uma estrutura rígida de saída, facilitando o parsing pelo frontend (ex: extrair "Achados" como uma lista separada).

## 3. Atualização do Agente (`image_agent.py`)

Modificar o arquivo `odonto-gpt-agno-service/app/agents/image_agent.py` para:
- Suportar explicitamente múltiplos modelos via configuração.
- Refinar o `instructions` com o novo protocolo de laudo.
- Garantir que o output seja rico em Markdown (tabelas, negrito) para melhor UX.

## 4. Integração ao AI Context (`.context`)

Documentar formalmente o agente para que outros agentes e desenvolvedores entendam suas capacidades.

### Tarefas de Documentação
1.  Criar `.context/agents/odonto-vision.md` seguindo o padrão do repositório.
    - Definir Inputs/Outputs.
    - Listar Tools disponíveis (Research, Navigation).
    - Exemplos de prompts e respostas ideais.
2.  Atualizar `AGENTS.md` (se necessário) para refletir as novas capacidades.

## 5. Plano de Execução

1.  **Documentar**: Criar o arquivo `.context/agents/odonto-vision.md`.
2.  **Atualizar Código**: Refatorar `image_agent.py` com o novo System Prompt e configuração de modelos.
3.  **Validar**: Testar o agente com uma imagem de exemplo (mock ou real se possível) para verificar o formato do laudo.

---
**Status**: Pronto para execução.
