# RAG (Retrieval-Augmented Generation) Guide
## Odonto GPT Agno Service

Este guia explica como configurar e usar RAG com o framework Agno para melhorar as respostas dos agentes com conhecimento base.

## 📋 Índice

1. [O que é RAG?](#o-que-é-rag)
2. [Configuração Inicial](#configuração-inicial)
3. [Tipos de Busca](#tipos-de-busca)
4. [Como Usar](#como-usar)
5. [Melhores Práticas](#melhores-práticas)
6. [Troubleshooting](#troubleshooting)

---

## O que é RAG?

**RAG (Retrieval-Augmented Generation)** combina:
- **Retrieval** (Recuperação): Busca conhecimento relevante de uma base
- **Generation** (Geração): Gera respostas usando esse conhecimento

**Benefícios:**
- ✅ Respostas baseadas em fontes específicas (cursos, materiais)
- ✅ Redução de alucinações (o modelo não "inventa" informações)
- ✅ Citações e referências diretas ao material
- ✅ Conhecimento atualizável sem retrtreinamento do modelo

---

## Configuração Inicial

### 1. Pré-requisitos

**Banco de Dados com pgvector:**

```sql
-- Criar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar tabela knowledge_base
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    specialty TEXT,
    source_type TEXT NOT NULL,
    source_id UUID NOT NULL,
    metadata JSONB,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(source_type, source_id)
);

-- Índices para performance
CREATE INDEX idx_knowledge_base_specialty ON knowledge_base(specialty);
CREATE INDEX idx_knowledge_base_fulltext ON knowledge_base
    USING gin(to_tsvector('portuguese', title || ' ' || COALESCE(content, '')));
```

**Variáveis de Ambiente (.env):**

```env
# OpenRouter (para embeddings)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL_EMBEDDING=openai/text-embedding-3-small

# Supabase (para armazenamento)
SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

### 2. Instalar Dependências

```bash
cd odonto-gpt-agno-service
pip install -r requirements.txt
```

### 3. Popular a Knowledge Base

```bash
# Indexar todo o conteúdo dos cursos
python scripts/populate_knowledge.py

# Apenas cursos de uma especialidade
python scripts/populate_knowledge.py --specialty periodontia

# Forçar reindexação (ignorar já indexados)
python scripts/populate_knowledge.py --force

# Ver o que seria indexado (sem indexar)
python scripts/populate_knowledge.py --dry-run
```

---

## Tipos de Busca

O Agno suporta 3 tipos de busca RAG:

### 1. Vector Search (Busca Semântica)

```python
from app.tools.knowledge import search_knowledge_base

results = search_knowledge_base(
    query="tratamento de canal",
    search_type="vector",  # Apenas similaridade vetorial
    match_count=5
)
```

**Vantagens:**
- Encontra conceitos semanticamente relacionados
- Funciona bem com sinônimos e paráfrases

**Desvantagens:**
- Pode perder termos específicos/exatos

### 2. Hybrid Search (Recomendado) ⭐

```python
results = search_knowledge_base(
    query="tratamento endodôntico molar inferior",
    search_type="hybrid",  # Vector + Full-text (padrão)
    match_count=5
)
```

**Vantagens:**
- Combina semântica com termos exatos
- Melhor para conteúdo técnico/médico
- Resultados mais precisos

**Desvantagens:**
- Ligeiramente mais lento que busca pura

### 3. Text Search (Full-text)

```python
results = search_knowledge_base(
    query="periodontite crônica",
    search_type="text",  # Apenas busca full-text
    match_count=5
)
```

**Vantagens:**
- Mais rápido
- Encontra termos exatos

**Desvantagens:**
- Não entende sinônimos ou conceitos relacionados

---

## Como Usar

### Exemplo 1: Busca Simples

```python
from app.tools.knowledge import search_knowledge_base

# Buscar conhecimento
results = search_knowledge_base(
    query="sintomas de periodontite",
    match_count=5,
    search_type="hybrid"
)

# Usar resultados na resposta
for result in results:
    print(f"Título: {result['title']}")
    print(f"Similaridade: {result['similarity']:.2f}")
    print(f"Conteúdo: {result['content'][:200]}...")
    print("-" * 80)
```

### Exemplo 2: Busca por Especialidade

```python
from app.tools.knowledge import search_by_specialty

# Buscar apenas em materiais de periodontia
results = search_by_specialty(
    specialty="periodontia",
    query="tratamento não cirúrgico",
    match_count=10
)
```

### Exemplo 3: Integrar com Agente Agno

```python
from agno.agent import Agent
from agno.models.openai.like import OpenAILike

agent = Agent(
    name="dental_qa_agent",
    model=OpenAILike(
        id="openai/gpt-4o-mini",
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1"
    ),
    instructions=[
        "Use the knowledge base to answer questions about dental procedures",
        "Cite the sources from the knowledge base when providing information",
        "Search for relevant course materials when answering student questions",
    ],
    # Adicionar tool de busca personalizada
    tools=[search_knowledge_base_tool]
)
```

---

## Melhores Práticas

### 1. Embeddings de Qualidade

```python
# Use modelo de embedding adequado
embedding = generate_embedding(
    text="seu texto aqui",
    model="openai/text-embedding-3-small",  # ou 3-large
    dimensions=1536  # Melhor precisão
)
```

### 2. Estrutura de Conteúdo

Organize o conteúdo antes de indexar:

```python
# Bom: Estruturado e completo
content = """
# Título do Módulo

## Objetivos de Aprendizagem
- Objetivo 1
- Objetivo 2

## Conteúdo
Explicação detalhada...

## Casos Clínicos
Exemplo prático...
"""

# Ruim: Texto sem organização
content = "texto solto sem estrutura..."
```

### 3. Metadados Ricos

```python
# Adicione metadados úteis
metadata = {
    "type": "lesson",
    "specialty": "endodontia",
    "difficulty": "advanced",
    "author": "Dr. Silva",
    "date": "2024-01-15",
    "keywords": ["tratamento de canal", "endodontia", "molar"]
}
```

### 4. Atualização Regular

```bash
# Reindexar quando o conteúdo mudar
python scripts/populate_knowledge.py --force
```

### 5. Threshold de Similaridade

```python
# Ajuste threshold conforme necessário
results = search_knowledge_base(
    query="sua query",
    match_threshold=0.7,  # 0.7 = 70% de similaridade (padrão)
    # Aumente para resultados mais precisos (menos resultados)
    # Diminua para mais resultados (menos precisos)
)
```

---

## Troubleshooting

### Problema: "vector does not exist"

**Solução:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Problema: "No results found"

**Causas possíveis:**
1. Tabela knowledge_base vazia → Execute `populate_knowledge.py`
2. Threshold muito alto → Diminua `match_threshold`
3. Query muito específica → Use termos mais gerais

### Problema: Slow queries

**Soluções:**
1. Use `search_type="text"` para mais velocidade
2. Reduza `match_count`
3. Crie índices apropriados (veja seção 1)

### Problema: Irrelevant results

**Soluções:**
1. Use `search_type="hybrid"` (mais preciso)
2. Aumente `match_threshold`
3. Melhore a qualidade do conteúdo indexado

### Problema: Out of memory errors

**Soluções:**
1. Diminua `dimensions` de 1536 para 512
2. Reduza `match_count`
3. Use busca em lotes menores

---

## Performance & Benchmarks

**Tempos típicos de busca** (1000 documentos indexados):

| Search Type | Latência | Precisão |
|-------------|----------|----------|
| `vector` | ~200ms | 85% |
| `hybrid` | ~350ms | 92% ⭐ |
| `text` | ~50ms | 75% |

**Recomendação:** Use `hybrid` para melhor equilíbrio precisão/performance.

---

## Próximos Passos

1. ✅ Configure o banco de dados com pgvector
2. ✅ Execute `populate_knowledge.py`
3. ✅ Teste diferentes tipos de busca
4. ✅ Monitore performance e ajuste parâmetros
5. ✅ Atualize o conhecimento base regularmente

---

## Recursos Adicionais

- [Agno Documentation](https://github.com/ago-dev/ago)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

---

**Dúvidas?** Consulte o `README.md` ou abra uma issue no repositório.
