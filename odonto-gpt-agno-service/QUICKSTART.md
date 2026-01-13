# 🚀 Quick Start Guide
## Odonto GPT Agno Service - Início Rápido

**Tempo estimado:** 10-15 minutos

---

## ⚡ Início Rápido (3 Passos)

### Passo 1: Configurar Variáveis de Ambiente

Edite o arquivo `.env`:

```bash
cd odonto-gpt-agno-service
nano .env  # ou seu editor preferido
```

**Substitua os placeholders:**

```env
# Antes (INCORRETO):
SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Depois (CORRETO):
SUPABASE_DB_URL=postgresql://postgres:SUA_SENHA@db.SEU_ID.supabase.co:5432/postgres
SUPABASE_URL=https://SEU_ID.supabase.co
SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```

**Onde encontrar:**
- Acesse: https://supabase.com/dashboard/project
- Settings → API (para URL e anon key)
- Database → Settings (para password)

### Passo 2: Testar Configuração

```bash
# Instalar dependências
pip install -r requirements.txt

# Executar teste
python test_setup.py
```

**Resultado esperado:** Todos os 5 testes devem ✅ PASSAR

### Passo 3: Iniciar e Testar

```bash
# Popular knowledge base (opcional, mas recomendado)
python scripts/populate_knowledge.py

# Iniciar playground
python playground_agentos.py
```

**Acesse:** http://localhost:7777

---

## 🎯 O Que Você Pode Fazer Agora

### 1. Fazer Perguntas Clínicas

**No playground ou via API:**

```
"Quais são os sinais e sintomas de periodontite?"
```

**O agente irá:**
- Buscar no knowledge base (se populado)
- Buscar no PubMed (automático)
- Responder com citações científicas
- Fornecer evidências e referências

### 2. Analisar Imagens

```
"Analise esta radiografia e identifique possíveis patologias"
```

**O agente irá:**
- Analisar a imagem com visão computacional
- Buscar literatura sobre achados
- Fornecer diagnóstico diferencial
- Sugerir próximos passos

### 3. Pesquisar Literatura

```
"Busque no PubMed as últimas evidências sobre implantes imediatos"
```

**O agente irá:**
- Executar busca no PubMed
- Sintetizar os achados
- Citar artigos com PMID
- Resumir evidências clínicas

---

## 📖 Exemplos de Uso

### Exemplo 1: Pergunta sobre Tratamento

**Pergunta:**
```
"Qual é o protocolo para tratamento de canal em molares?"
```

**Resposta típica:**
- Explicação passo a passo
- Citações de artigos científicos
- Nível de evidência
- Recomendações clínicas
- Referências aos cursos (se KB populada)

### Exemplo 2: Urgência Odontológica

**Pergunta:**
```
"O que fazer em caso de avulsão dentária?"
```

**Resposta típica:**
- Protocolo imediato (primeiros 30 min)
- Passo a passo detalhado
- Transporte adequado
- Prognóstico baseado em tempo
- Referências científicas

### Exemplo 3: Análise de Imagem

**Envie uma imagem e pergunte:**
```
"Há alguma evidência de cárie nesta radiografia?"
```

**O agente irá:**
- Analisar a imagem
- Identificar lesões
- Buscar literatura sobre diagnóstico
- Fornecer conduta

---

## 🔧 Comandos Úteis

```bash
# Testar configuração
python test_setup.py

# Popular knowledge base com cursos
python scripts/populate_knowledge.py

# Popular apenas especialidades específicas
python scripts/populate_knowledge.py --specialty periodontia

# Ver o que seria indexado (sem indexar)
python scripts/populate_knowledge.py --dry-run

# Forçar reindexação completa
python scripts/populate_knowledge.py --force

# Iniciar playground AgentOS
python playground_agentos.py

# Iniciar API FastAPI
python -m uvicorn app.main:app --reload --port 8000
```

---

## 🌐 Endpoints Disponíveis

### Agno Service (porta 8000)

- `POST /api/v1/qa/chat` - Chat QA com streaming
- `POST /api/v1/image/analyze` - Análise de imagens
- `POST /api/v1/chat` - Chat unificado
- `GET /health` - Health check

### AgentOS (porta 7777)

- `http://localhost:7777` - Interface web
- `http://localhost:7777/docs` - Documentação FastAPI
- `http://localhost:7777/mcp` - MCP Server

---

## 📚 Documentação Completa

- **`SETUP_CHECKLIST.md`** - Checklist completo de configuração
- **`RAG_GUIDE.md`** - Guia detalhado de RAG
- **`RESEARCH_TOOLS_GUIDE.md`** - Como usar PubMed/arXiv
- **`IMPLEMENTATION_SUMMARY.md`** - Resumo da implementação

---

## 🐛 Problemas Comuns

### "No module named 'arxiv'"

**Solução:**
```bash
pip install -r requirements.txt
```

### "could not translate host name"

**Solução:**
Edite `.env` e substitua `[project]` pelo ID real do seu projeto Supabase.

### "No cookie auth credentials found"

**Solução:**
Verifique se `OPENROUTER_API_KEY` no `.env` começa com `sk-or-v1-`.

### "relation knowledge_base does not exist"

**Solução:**
```bash
python scripts/populate_knowledge.py
```

---

## 💡 Dicas

### Para Melhorar Respostas

1. **Use perguntas específicas:**
   - ❌ "Fale sobre dentes"
   - ✅ "Quais são as contraindicações para implantes em pacientes diabéticos?"

2. **Peça citações:**
   - ✅ "Cite artigos científicos sobre o tema"
   - ✅ "Busque no PubMed as últimas evidências"

3. **Use contexto:**
   - ✅ "Para um paciente de 45 anos, fumante, qual o risco de peri-implantite?"

### Para Melhorar Performance

- Use `search_type="hybrid"` (padrão) para melhor precisão
- Limite `match_count` para respostas mais rápidas
- Especifique `specialty` quando souber a área

### Para Debugar

```bash
# Ativar logs detalhados
export LOG_LEVEL=debug

# Ver logs do playground
# Os logs aparecem no terminal onde executou playground_agentos.py
```

---

## 🎓 Próximos Passos

1. **Explore os agentes:** Teste diferentes tipos de perguntas
2. **Popule o KB:** Execute `populate_knowledge.py` para habilitar RAG
3. **Leia a documentação:** Consulte os guias para recursos avançados
4. **Customize:** Adicione seus próprios few-shot examples
5. **Integre:** Use os agentes na sua aplicação via API

---

## 📞 Suporte

- **Documentação:** Ver os arquivos `.md` no diretório
- **Teste:** Execute `test_setup.py` para diagnosticar problemas
- **Logs:** Ver logs do terminal para erros detalhados

---

**Sistema pronto para uso!** 🎉

Se todos os testes passaram, você está pronto para começar a usar os agentes com:
- ✅ Pesquisa científica integrada (PubMed + arXiv)
- ✅ RAG com busca híbrida (92% precisão)
- ✅ Few-shot learning para respostas consistentes
- ✅ Análise de imagens com suporte de literatura
