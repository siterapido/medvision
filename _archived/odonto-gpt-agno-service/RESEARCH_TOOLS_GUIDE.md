# Research Tools Guide
## PubMed & arXiv Integration for Evidence-Based Dentistry

Este guia explica como usar as ferramentas de pesquisa científica integradas ao Odonto GPT Agno Service.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Ferramentas Disponíveis](#ferramentas-disponíveis)
3. [Como Usar](#como-usar)
4. [Integração com Agentes](#integração-com-agentes)
5. [Casos de Uso](#casos-de-uso)
6. [Limitações](#limitações)

---

## Visão Geral

O serviço Agno integra ferramentas de pesquisa científica para:

- ✅ **PubMed** - Literatura biomédica (MEDLINE)
- ✅ **arXiv** - Artigos acadêmicos (física, computação, etc.)
- ✅ **Latest Research** - Últimas pesquisas por especialidade
- ✅ **Clinical Trials** - Ensaios clínicos em odontologia

**Benefícios:**
- Respostas baseadas em evidências científicas
- Citações de artigos com PubMed IDs/DOIs
- Acesso às últimas pesquisas e diretrizes clínicas
- Suporte para tomada de decisão clínica informada

---

## Ferramentas Disponíveis

### 1. `search_pubmed`

Busca artigos no PubMed/MEDLINE.

```python
search_pubmed(
    query: str,           # Termo de busca
    max_results: int = 5, # Número de resultados
    specialty: str = None # Filtro por especialidade
)
```

**Exemplo:**
```python
results = search_pubmed(
    query="dental implant failure",
    max_results=10,
    specialty="implantology"
)
```

**Retorna:**
- Título do artigo
- Autores
- Resumo (abstract)
- PMID (PubMed ID)
- Data de publicação

### 2. `search_arxiv`

Busca artigos no arXiv (principalmente AI/ML aplicado à odontologia).

```python
search_arxiv(
    query: str,           # Termo de busca
    max_results: int = 5, # Número de resultados
    sort_by: str = "relevance" # "relevance" ou "lastUpdatedDate"
)
```

**Exemplo:**
```python
results = search_arxiv(
    query="dental X-ray deep learning",
    max_results=5,
    sort_by="relevance"
)
```

**Retorna:**
- Título
- Autores
- Resumo
- Link para PDF
- Data de publicação
- arXiv ID

### 3. `get_latest_dental_research`

Obtém as pesquisas mais recentes por especialidade.

```python
get_latest_dental_research(
    specialty: str = "general", # Especialidade odontológica
    days_back: int = 30,        # Últimos N dias
    max_results: int = 3        # Número de artigos
)
```

**Especialidades disponíveis:**
- `periodontia` - Periodontics
- `endodontia` - Endodontics
- `cirurgia` - Oral surgery
- `ortodontia` - Orthodontics
- `implantes` - Implantology
- `general` - General dentistry

**Exemplo:**
```python
# Últimas pesquisas em periodontia (30 dias)
results = get_latest_dental_research(
    specialty="periodontia",
    days_back=30,
    max_results=5
)
```

### 4. `search_clinical_trials`

Busca ensaios clínicos em odontologia.

```python
search_clinical_trials(
    condition: str,        # Condição/tratamento
    max_results: int = 5   # Número de resultados
)
```

**Exemplo:**
```python
# Encontrar ensaios clínicos sobre periodontite
trials = search_clinical_trials(
    condition="periodontitis treatment",
    max_results=10
)
```

---

## Como Usar

### Uso Direto (Python)

```python
from app.tools.research import (
    search_pubmed,
    search_arxiv,
    get_latest_dental_research,
    search_clinical_trials
)

# Buscar artigos no PubMed
results = search_pubmed(
    query="osseointegration dental implants",
    max_results=5
)

print(results)
# Output: Formatted markdown with titles, abstracts, PMIDs...
```

### Uso via Agente Agno

As ferramentas já estão integradas nos agentes:

```python
from app.agents.qa_agent import dental_qa_agent

# O agente usa as tools automaticamente quando necessário
response = dental_qa_agent.run(
    "Quais são as últimas evidências sobre carga imediata em implantes?"
)

# O agente vai:
# 1. Entender a pergunta
# 2. Usar search_pubmed para buscar artigos
# 3. Sintetizar a resposta com citações
```

---

## Integração com Agentes

### Exemplo: QA Agent com PubMed

```python
from agno.agent import Agent
from app.tools.research import RESEARCH_TOOLS

agent = Agent(
    name="evidence_based_dentist",
    model=OpenAIChat(id="gpt-4o"),
    tools=RESEARCH_TOOLS,  # Todas as tools incluídas
    instructions=[
        "Use PubMed search for clinical questions",
        "Use arXiv for AI/ML applications in dentistry",
        "Always cite PMID or DOI when referencing papers",
        "Indicate level of evidence (systematic review, RCT, etc.)",
    ]
)
```

### Exemplo: Especialista em Periodontia

```python
from agno.agent import Agent
from app.tools.research import search_pubmed, get_latest_dental_research

periodontist = Agent(
    name="periodontology_specialist",
    model=OpenAIChat(id="gpt-4o"),
    tools=[
        search_pubmed,
        get_latest_dental_research
    ],
    instructions=[
        "Focus on periodontal literature",
        "Search for recent systematic reviews and meta-analyses",
        "Provide clinical guidelines with citations",
    ]
)
```

---

## Casos de Uso

### Caso 1: Pergunta Clínica

**Pergunta:** "Qual é o melhor tratamento para periodontite crônica?"

**Agente usa:**
1. `search_pubmed` com query "chronic periodontitis treatment"
2. Encontra systematic reviews e RCTs
3. Sintetiza resposta com:
   - Nível de evidência
   - PMID das fontes
   - Resumo dos achados

**Resposta exemplo:**
```markdown
# Tratamento de Periodontite Crônica

## Evidências Atuais

Segundo uma **systematic review** (PMID: 38123456, 2024):

- **Terapia de desbridamento mecânico**: Remove biofilme e cálculo
- **Antibióticos sistêmicos**: Benefício adicional em casos avançados
- **Cirurgia periodontal**: Melhor acesso em bolsas >5mm

## Nível de Evidência
- Systematic reviews: Nível 1
- RCTs: Nível 2
- Consensus guidelines: Nível 3

## Referências
- PMID: 38123456 - Treatment of chronic periodontitis
- PMID: 38234567 - Surgical vs non-surgical therapy
```

### Caso 2: Pesquisa de Tecnologia

**Pergunta:** "Como IA está sendo usada em radiografia dental?"

**Agente usa:**
1. `search_arxiv` com query "dental radiograph AI deep learning"
2. `search_pubmed` para aplicações clínicas
3. Combina informações técnicas com clínicas

### Caso 3: Atualização Profissional

**Pergunta:** "Quais são as últimas pesquisas em implantes dentários?"

**Agente usa:**
1. `get_latest_dental_research(specialty="implantes", days_back=60)`
2. Filtra artigos dos últimos 2 meses
3. Resume descobertas recentes

---

## Limitações

### PubMed

**Limitações:**
- Acesso a artigos completos pode exigir assinatura
- Algumas revistas não estão indexadas
- Abstracts podem ser insuficientes para detalhes clínicos

**Soluções:**
- Usar PubMed Central (PMC) para artigos open access
- Citar PMID para que o usuário busque o artigo completo
- Focar em systematic reviews e meta-análises (resumos de alto nível)

### arXiv

**Limitações:**
- Artigos não são peer-reviewed (podem conter erros)
- Foco em computação/física (menos conteúdo clínico)
- Versões podem estar desatualizadas

**Soluções:**
- Usar principalmente para AI/ML applications
- Verificar se há versão publicada em revista científica
- Citar como "preprint" ou "submitted to"

### Acesso em Tempo Real

**Limitação:** As searches requerem conexão com a internet e podem ser lentas.

**Solução:**
- Cache results para queries frequentes
- Usar `get_latest_dental_research` para atualizações periódicas
- Considerar base de conhecimento local para conteúdo estável

---

## Best Practices

### 1. Queries Eficientes

```python
# Ruim: Muito genérico
results = search_pubmed(query="dentistry")

# Bom: Específico e relevante
results = search_pubmed(query="peri-implantitis treatment risk factors")
```

### 2. Número de Resultados

```python
# Para overview rápido
results = search_pubmed(query="...", max_results=3)

# Para revisão abrangente
results = search_pubmed(query="...", max_results=10)
```

### 3. Nível de Evidência

Sempre indicar o nível de evidência:

```python
instructions=[
    "Prioritize systematic reviews and meta-analyses (Level 1)",
    "Use RCTs as secondary evidence (Level 2)",
    "Cohort studies for etiology questions (Level 3)",
    "Case reports only for rare conditions (Level 4)",
]
```

### 4. Citação Adequada

```markdown
✅ **Bom:**
"Segundo Silva et al. (PMID: 38123456, 2024), o tratamento X mostrou..."

❌ **Ruim:**
"Segundo um artigo, o tratamento X funciona..."
```

---

## Exemplos de Prompts para Agentes

### Para Questões Clínicas

```
"Use PubMed to find recent systematic reviews about [topic].
Summarize the findings with PMIDs and evidence levels."
```

### Para Tecnologias Emergentes

```
"Search arXiv for AI applications in [dental field].
Explain the technology and its clinical implications."
```

### Para Atualização

```
"Get the latest research from the last [N] days in [specialty].
Highlight practice-changing findings."
```

---

## Troubleshooting

### Erro: "PubMed query failed"

**Causa:** Problema de conexão ou query muito complexa

**Solução:**
```python
# Simplificar a query
results = search_pubmed(query="dental implant")  # mais simples
```

### Erro: "No results found"

**Causa:** Query muito específica ou sem resultados

**Solução:**
```python
# Usar termos mais gerais
results = search_pubmed(query="implant dentistry")  # mais geral
```

### Lentidão nas respostas

**Causa:** Múltiplas searches em sequência

**Solução:**
```python
# Limitar número de searches simultâneas
results = search_pubmed(query="...", max_results=3)  # menos resultados
```

---

## Recursos Adicionais

- [PubMed Documentation](https://www.ncbi.nlm.nih.gov/books/NBK25501/)
- [arXiv API](https://arxiv.org/help/api/)
- [Evidence-Based Dentistry Guide](https://www.dentalresearch.org/)

---

**Dúvidas?** Consulte o `RAG_GUIDE.md` ou abra uma issue.
