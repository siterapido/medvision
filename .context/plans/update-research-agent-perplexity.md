---
title: Atualização do Agente de Pesquisas com Perplexity AI
status: pending
summary: Migração do agente 'odonto-research' para utilizar o modelo 'sonar-reasoning' da Perplexity AI, habilitando pesquisas online em tempo real e geração de artefatos com referências ricas integradas ao workflow de contexto.
---

# Plano de Atualização: Agente de Pesquisas com Perplexity

Este plano detalha a migração do `odonto-research` para usar a API da Perplexity (modelo `sonar-reasoning`), permitindo pesquisas profundas, atualizadas e com citações verificáveis, integradas ao sistema de artefatos (`save_research`).

## 1. Contexto e Motivação

Atualmente, o agente de pesquisa depende de ferramentas manuais (`search_pubmed`, `search_arxiv`) e de um LLM genérico. Isso tem limitações:
- Dificuldade em sintetizar múltiplas fontes.
- Falta de acesso à web aberta em tempo real (notícias, guidelines recentes).
- Complexidade em formatar citações corretamente.

A API da Perplexity (modelo `sonar-reasoning`) oferece:
- **Acesso à Web em Tempo Real**: Respostas atualizadas.
- **Citações Nativas**: O modelo fundamenta suas respostas.
- **Raciocínio (Chain of Thought)**: Melhor síntese de informações complexas.

## 2. Objetivos

1.  Habilitar `odonto-research` para usar o modelo `sonar-reasoning` via API da Perplexity.
2.  Garantir que o agente continue usando a ferramenta `save_research` para persistir os artefatos.
3.  Estruturar o prompt para que o modelo extraia as fontes usadas e as passe corretamente para o campo `sources` do artefato.
4.  Manter compatibilidade com o workflow de criação direta (`DirectArtifactWorkflow`).

## 3. Plano de Implementação

### Fase 1: Configuração e Infraestrutura

- [ ] **Configurar Variáveis de Ambiente**:
    - Verificar se `OPENROUTER_API_KEY` está configurada corretamente (já existente).
    - Não é necessário adicionar chave extra, pois usaremos o provider OpenRouter.

### Fase 2: Atualização do Agente (`science_agent.py`)

- [ ] **Migrar Modelo para Perplexity via OpenRouter**:
    - Atualizar a configuração de `OpenAILike` para usar o modelo Perplexity.
    - **Base URL**: `https://openrouter.ai/api/v1` (Padrão existente).
    - **Modelo**: `perplexity/sonar-reasoning` (ou `perplexity/llama-3-sonar-large-32k-online`).
    - **Parâmetros**: Ajustar `temperature` para ~0.1 e incluir `extra_headers` se necessário (HTTP-Referer, X-Title).

- [ ] **Refinar Instruções (System Prompt)**:
    - Remover instruções de "fingir" ou alucinar citações (se houver).
    - Adicionar instrução explícita: *"Você é um motor de resposta online. Ao gerar a pesquisa, liste explicitamente as URLs das fontes utilizadas no final para que possam ser estruturadas."*
    - Instruir o agente a preencher o campo `sources` da ferramenta `save_research` com os dados reais obtidos na pesquisa online.

- [ ] **Revisão de Ferramentas**:
    - Manter `save_research` (Crucial).
    - Avaliar `search_pubmed`/`search_arxiv`:
        - *Opção A*: Manter como complementares (o modelo decide usar se precisar de paper específico).
        - *Opção B*: Remover e confiar no índice da Perplexity (que já indexa PubMed). **Decisão**: Manter como opcionais, mas dar prioridade ao conhecimento nativo do modelo.

### Fase 3: Integração e Testes

- [ ] **Teste de Fluxo de Pesquisa**:
    - Criar script `scripts/test_perplexity_research.py`.
    - Verificar se o agente responde perguntas atuais (ex: "Guidelines de 2024/2025 para...").
    - Verificar se o artefato é salvo no Supabase.
    - **Verificação Crítica**: Confirmar se o JSON salvo em `sources` contém URLs válidas retornadas pelo Perplexity.

- [ ] **Validação de Hallucination Guard**:
    - Verificar se o `hallucination_guard.py` não bloqueia as respostas do Perplexity (que tendem a ser ricas em texto).

### Fase 4: Integração com IA-Context

- [ ] **Atualizar Documentação do Agente**:
    - Atualizar `.context/agents/odonto-research.md` refletindo as novas capacidades.
    - Documentar o comportamento de "Online Research".

## 4. Detalhes Técnicos

### Exemplo de Configuração (Draft)

```python
from agno.models.openai.like import OpenAILike

# ...
model = OpenAILike(
    id="sonar-reasoning",
    api_key=os.getenv("PERPLEXITY_API_KEY"),
    base_url="https://api.perplexity.ai",
    temperature=0.1,  # Fatos precisam de precisão
)
# ...
```

### Estrutura de Prompt para Sources

Como a API da Perplexity retorna citações em um campo separado (`citations`) que pode não ser capturado automaticamente pelo `OpenAILike` (que espera apenas `choices[0].message.content`), precisamos instruir o modelo:

> "Ao finalizar sua pesquisa, inclua uma seção 'REFERÊNCIAS_PARA_FERRAMENTA' contendo uma lista JSON com title e url das fontes usadas, para que você mesmo possa ler isso e chamar a ferramenta `save_research` corretamente."

Alternativamente, se o `Agno` tiver suporte nativo a Perplexity, usar a classe específica. (Assumiremos `OpenAILike` genérico por compatibilidade).

## 5. Próximos Passos (Checklist para o Usuário)

1.  Aprovar este plano.
2.  Fornecer a `PERPLEXITY_API_KEY`.
3.  Autorizar a execução das modificações de código.
