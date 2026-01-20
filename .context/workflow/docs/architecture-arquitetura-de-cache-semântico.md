# Arquitetura de Cache Semântico e Streaming Especulativo

## 1. Visão Geral
Este documento descreve a arquitetura para implementar um cache inteligente e um sistema de streaming que melhora a percepção de velocidade pelo usuário.

## 2. Cache Semântico (Camada 1: Performance)

### 2.1. Problema
Requisições repetidas para o mesmo conceito (ex: "O que é periodontite?" vs "Defina periodontite") geram chamadas de LLM redundantes e custosas.

### 2.2. Solução: Vector Cache
*   **Armazenamento:** Tabela `semantic_cache` no Supabase (pgvector).
*   **Estrutura:**
    *   `query_embedding`: Vetor da pergunta original.
    *   `response`: Texto da resposta gerada.
    *   `agent`: Agente que gerou a resposta.
    *   `created_at`: Timestamp para expiração (TTL).
*   **Lógica:**
    1.  Ao receber query, vetorizar.
    2.  Buscar vizinho mais próximo (`<->`) no Supabase.
    3.  Se similaridade > 0.95 (muito alta), retornar cache.
    4.  Caso contrário, processar e salvar no cache assincronamente.

## 3. Streaming Especulativo (Camada 2: UX)

### 3.1. Problema
O usuário vê uma tela em branco por 2-5 segundos enquanto o agente decide e pesquisa.

### 3.2. Solução: Feedback Imediato
*   O `HybridRouter` deve retornar não apenas o agente, mas uma **"Intenção Inicial"**.
*   O frontend recebe imediatamente um evento de `thought` (pensamento).
*   **Exemplo de Fluxo:**
    1.  User: "Pesquise artigos sobre diabetes."
    2.  Router (10ms): Identifica `odonto-research`.
    3.  System (20ms): Envia evento: `{"type": "thought", "content": "Entendido. Iniciando pesquisa científica sobre 'diabetes'..."}`.
    4.  Agent (2s): Executa pesquisa.
    5.  Agent (3s): Começa a enviar a resposta real.

## 4. Refinamento de "Equipe" (Camada 3: Inteligência)

### 4.1. Problema
O router atual escolhe apenas UM agente, falhando em pedidos compostos ("Pesquise E Resuma").

### 4.2. Solução: Detecção de Sequência
*   Novo método `detect_sequence(query)` no Router.
*   Se detectar conectivos (`e`, `depois`, `então`) E keywords de múltiplos domínios:
    *   Retorna `equipe`.
    *   Gera um plano de execução: `[('odonto-research', 'pesquisar...'), ('odonto-summary', 'resumir...')]`.
