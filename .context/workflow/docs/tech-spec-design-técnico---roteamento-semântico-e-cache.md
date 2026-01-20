# Design Técnico: Otimização de Roteamento e Performance

## 1. Visão Geral
Este documento detalha as mudanças arquiteturais para migrar o sistema de roteamento baseado em keywords para um sistema híbrido (semântico + regras) e implementar estratégias de caching para reduzir a latência das respostas.

## 2. Nova Arquitetura de Roteamento

### 2.1. Problema Atual
O roteamento atual (`count(keywords)`) falha em casos ambíguos onde o usuário mistura intenções (ex: "Pesquise e formate"). A taxa de erro atual é de ~14%.

### 2.2. Solução Proposta: Roteamento Híbrido
O novo roteador funcionará em dois estágios:

1.  **Estágio 1: Classificação Semântica (Embeddings)**
    *   Utilizar `sentence-transformers` (ex: `all-MiniLM-L6-v2`) para vetorizar a query do usuário.
    *   Comparar com vetores de descrição dos agentes.
    *   *Why:* Captura a intenção real, não apenas palavras-chave.

2.  **Estágio 2: Regras de Negócio (Determinístico)**
    *   Manter regras de prioridade máxima (ex: Upload de Imagem -> Vision Agent).
    *   Regras de "Equipe": Se a similaridade semântica for alta (>0.7) para 2+ agentes, acionar Orchestrator.

### 2.3. Implementação
```python
# Pseudo-código do novo router
async def semantic_router(query: str):
    query_vec = model.encode(query)
    scores = {
        "research": cosine_sim(query_vec, research_vec),
        "study": cosine_sim(query_vec, study_vec),
        "writer": cosine_sim(query_vec, writer_vec)
    }
    
    # Lógica de decisão híbrida
    if max(scores.values()) < 0.4:
        return "general_chat"
    
    top_agents = [k for k, v in scores.items() if v > 0.65]
    if len(top_agents) > 1:
        return "orchestrator" # Equipe
        
    return max(scores, key=scores.get)
```

## 3. Estratégia de Performance (Latência)

### 3.1. Problema Atual
Queries complexas levam >4s devido à chamada síncrona de ferramentas (tool calling) e inicialização fria.

### 3.2. Soluções
1.  **Cache de Respostas (Redis/Supabase):**
    *   Hash da query -> Resposta armazenada (TTL 24h).
    *   Para perguntas frequentes ("O que é periodontite?"), reduz latência para <100ms.

2.  **Streaming Especulativo:**
    *   O agente deve começar a emitir tokens de "pensamento" ("Estou consultando a base de dados do PubMed...") *antes* da ferramenta retornar.
    *   Isso reduz o TTFT percebido pelo usuário.

3.  **Execução Paralela:**
    *   Usar `asyncio.gather` para disparar buscas no PubMed e arXiv simultaneamente, em vez de sequencialmente.

## 4. Métricas de Sucesso
*   **Precisão de Roteamento:** > 95% no dataset de teste.
*   **TTFT (Time to First Token):** < 800ms (P95).
*   **Latência Total (Cache Hit):** < 200ms.
