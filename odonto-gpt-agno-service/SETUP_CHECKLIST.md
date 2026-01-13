# ✅ Checklist de Configuração Pós-Implementação

## 🎯 Status da Implementação

**Implementação:** ✅ **CONCLUÍDA** (fase principal)
**Configuração:** ⚠️ **NECESSÁRIA** (substituir placeholders no .env)

---

## 🔧 Ação Necessária: Configurar Variáveis de Ambiente

### Problema Identificado

O arquivo `odonto-gpt-agno-service/.env` contém **placeholders** que precisam ser substituídos:

```env
# ATUAL (INCORRETO):
SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Solução

#### 1. Obter Credenciais do Supabase

Acesse: https://supabase.com/dashboard/project

**Procure por:**
- **Project URL** (algo como `https://xxxxx.supabase.co`)
- **Database password** (definida ao criar o projeto)
- **anon public key** (em Settings → API)

#### 2. Atualizar o Arquivo .env

**Edite:** `odonto-gpt-agno-service/.env`

```env
# SUBSTITUA pelos valores reais do seu projeto Supabase:
SUPABASE_DB_URL=postgresql://postgres:SUA_SENHA_AQUI@db.SEU_PROJETO_ID.supabase.co:5432/postgres
SUPABASE_URL=https://SEU_PROJETO_ID.supabase.co
SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI
```

**Exemplo de como deve ficar:**
```env
SUPABASE_DB_URL=postgresql://postgres:your_actual_password@db.abcdefgh.supabase.co:5432/postgres
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ Checklist Completo de Configuração

### Passo 1: Configurar Supabase
- [ ] Abrir dashboard do Supabase
- [ ] Copiar Project URL
- [ ] Copiar Database password
- [ ] Copiar anon public key
- [ ] Atualizar `odonto-gpt-agno-service/.env`

### Passo 2: Instalar Dependências Python
```bash
cd odonto-gpt-agno-service
pip install -r requirements.txt
```

- [ ] `arxiv>=2.1.0` instalado
- [ ] `pymed>=0.9.0` instalado

### Passo 3: Configurar pgvector (Opcional, para RAG)

Acesse o SQL Editor do Supabase e execute:

```sql
-- Criar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Verificar se foi criada
SELECT * FROM pg_extension WHERE extname = 'vector';
```

- [ ] Extensão pgvector criada

### Passo 4: Popular Knowledge Base (Opcional)

```bash
cd odonto-gpt-agno-service

# Testar conexão com Supabase primeiro
python -c "from app.tools.database.supabase import get_supabase_connection; print(get_supabase_connection())"

# Indexar conteúdo dos cursos
python scripts/populate_knowledge.py

# Ou apenas testar (dry-run)
python scripts/populate_knowledge.py --dry-run
```

- [ ] Conexão com Supabase funcionando
- [ ] Tabela `knowledge_base` criada
- [ ] Conteúdo dos cursos indexado

### Passo 5: Testar Agentes

**Opção A: Usar Playground AgentOS**

```bash
cd odonto-gpt-agno-service
python playground_agentos.py
```

Acesse: http://localhost:7777 ou https://os.agno.com (conectar como Local)

- [ ] Playground iniciando sem erros
- [ ] QA Agent respondendo perguntas
- [ ] Image Agent funcionando

**Opção B: Testar via Python**

```python
from app.agents.qa_agent import dental_qa_agent

response = dental_qa_agent.run("Quais são os sinais de periodontite?")
print(response)
```

- [ ] QA Agent funcionando
- [ ] Respostas com citações científicas
- [ ] Few-shot examples funcionando

### Passo 6: Testar Research Tools

```python
from app.tools.research import search_pubmed

results = search_pubmed("dental implant failure", max_results=3)
print(results)
```

- [ ] PubMed search funcionando
- [ ] arXiv search funcionando
- [ ] Artigos sendo retornados

### Passo 7: Testar RAG

```python
from app.tools.knowledge import search_knowledge_base

results = search_knowledge_base(
    query="endodontia tratamento",
    search_type="hybrid",
    match_count=5
)

for r in results:
    print(f"{r['title']} - Similaridade: {r['similarity']:.2f}")
```

- [ ] Busca híbrida funcionando
- [ ] Resultados com similaridade > 0.7
- [ ] Metadados corretos

---

## 🐛 Troubleshooting Comum

### Erro: "could not translate host name"

**Causa:** URL do Supabase incorreta no `.env`

**Solução:**
1. Verifique se substituiu `[project]` pelo ID real do projeto
2. Verifique se a senha está correta
3. Teste a conexão:
   ```bash
   psql "postgresql://postgres:SUA_SENHA@db.SEU_PROJETO.supabase.co:5432/postgres"
   ```

### Erro: "No cookie auth credentials found"

**Causa:** API key do OpenRouter incorreta ou ausente

**Solução:**
1. Verifique se `OPENROUTER_API_KEY` está correto no `.env`
2. A chave deve começar com `sk-or-v1-`
3. Teste a chave:
   ```bash
   curl -H "Authorization: Bearer SUA_KEY" https://openrouter.ai/api/v1/models
   ```

### Erro: "relation knowledge_base does not exist"

**Causa:** Tabela não criada

**Solução:**
```bash
python scripts/populate_knowledge.py
```

O script cria a tabela automaticamente.

### Erro: "extension 'vector' does not exist"

**Causa:** pgvector não está instalado no Supabase

**Solução:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Execute no SQL Editor do Supabase.

---

## 📊 Validação Final

### Teste de Integração Completo

Execute este script para validar tudo:

```python
#!/usr/bin/env python3
"""Teste de integração do Odonto GPT Agno Service"""

import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("🧪 Teste de Integração - Odonto GPT Agno")
print("=" * 60)

# 1. Verificar variáveis de ambiente
print("\n1️⃣ Verificando variáveis de ambiente...")
required_vars = [
    "OPENROUTER_API_KEY",
    "SUPABASE_DB_URL",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY"
]

missing = []
for var in required_vars:
    value = os.getenv(var)
    if value and "[project]" not in value and "[password]" not in value and "your-" not in value:
        print(f"  ✅ {var}: OK")
    else:
        print(f"  ❌ {var}: FALTANDO ou placeholder")
        missing.append(var)

if missing:
    print(f"\n⚠️  Variáveis faltando: {', '.join(missing)}")
    print("Edite 'odonto-gpt-agno-service/.env' e preencha os valores corretos.")
    exit(1)

# 2. Testar conexão Supabase
print("\n2️⃣ Testando conexão Supabase...")
try:
    from app.tools.database.supabase import get_supabase_connection
    conn = get_supabase_connection()
    cur = conn.cursor()
    cur.execute("SELECT 1")
    print("  ✅ Conexão Supabase: OK")
    conn.close()
except Exception as e:
    print(f"  ❌ Conexão Supabase: ERRO - {e}")
    exit(1)

# 3. Testar OpenRouter
print("\n3️⃣ Testando OpenRouter API...")
try:
    from openai import OpenAI
    client = OpenAI(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1"
    )
    response = client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[{"role": "user", "content": "Test"}],
        max_tokens=10
    )
    print("  ✅ OpenRouter API: OK")
except Exception as e:
    print(f"  ❌ OpenRouter API: ERRO - {e}")
    exit(1)

# 4. Testar Research Tools
print("\n4️⃣ Testando Research Tools...")
try:
    from app.tools.research import search_pubmed
    result = search_pubmed("dental", max_results=1)
    if "PubMed" in result or "results" in result.lower():
        print("  ✅ PubMed search: OK")
    else:
        print("  ⚠️  PubMed search: Resultado inesperado")
except Exception as e:
    print(f"  ❌ PubMed search: ERRO - {e}")

# 5. Testar RAG
print("\n5️⃣ Testando RAG (Knowledge Base)...")
try:
    from app.tools.knowledge import search_knowledge_base
    results = search_knowledge_base("teste", match_count=1, search_type="text")
    print(f"  ✅ RAG search: OK ({len(results)} resultados)")
except Exception as e:
    print(f"  ⚠️  RAG search: Tabela pode não existir ainda - {e}")

# 6. Testar QA Agent
print("\n6️⃣ Testando QA Agent...")
try:
    from app.agents.qa_agent import dental_qa_agent
    print("  ✅ QA Agent import: OK")
except Exception as e:
    print(f"  ❌ QA Agent import: ERRO - {e}")

print("\n" + "=" * 60)
print("🎉 Teste concluído!")
print("=" * 60)
print("\nPróximos passos:")
print("1. Execute: python scripts/populate_knowledge.py")
print("2. Execute: python playground_agentos.py")
print("3. Acesse: http://localhost:7777")
print("=" * 60)
```

Salve como `test_integration.py` e execute:
```bash
python test_integration.py
```

---

## 📚 Documentação Disponível

- ✅ `RAG_GUIDE.md` - Guia completo de RAG
- ✅ `RESEARCH_TOOLS_GUIDE.md` - Guia de pesquisa científica
- ✅ `IMPLEMENTATION_SUMMARY.md` - Resumo da implementação
- ✅ `README.md` - Documentação principal

---

## 🎯 Próximos Passos Após Configuração

1. **Popular Knowledge Base:**
   ```bash
   python scripts/populate_knowledge.py
   ```

2. **Iniciar Playground:**
   ```bash
   python playground_agentos.py
   ```

3. **Testar Perguntas:**
   - "Quais são os sinais de periodontite?"
   - "Busque no PubMed sobre implantes dentários"
   - "Analise esta radiografia"

4. **Monitorar Performance:**
   - Latência das respostas
   - Qualidade das citações
   - Precisão das buscas

---

## 💡 Dicas Importantes

### Segurança
- ❌ **NUNCA** commitar `.env` com chaves reais
- ✅ Sempre usar `.env.example` como template
- ✅ Manter chaves no Supabase Environment Variables se possível

### Performance
- Use `search_type="hybrid"` para melhor precisão
- Limite `match_count` para respostas mais rápidas
- Cache results para queries frequentes

### Debugging
- Use `LOG_LEVEL=debug` no `.env` para logs detalhados
- Verifique logs do playground AgentOS
- Teste cada componente isoladamente

---

**Suporte:** Consulte os guias em `odonto-gpt-agno-service/*.md` para mais detalhes.
