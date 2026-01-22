# Guia de Acesso ao AgentOS

## 🚀 Iniciar o AgentOS

```bash
cd odonto-gpt-agno-service
source venv/bin/activate
python playground_agentos.py
```

O servidor vai mostrar:
```
🎯 Odonto GPT AgentOS (Novo Método)
============================================================

Agentes disponíveis:
  • Dental QA Agent (ID: dental-qa-agent)
  • Dental Image Agent (ID: dental-image-agent)

Endpoints:
  • Local:         http://localhost:7777
  • IP Local:      http://192.168.0.2:7777
  • API Docs:      http://localhost:7777/docs
```

---

## 📋 Opções de Acesso

### 1️⃣ Swagger UI (Mais Rápido) ⚡

**URL:** http://localhost:7777/docs

**Como usar:**
1. Abra no navegador
2. Encontre `POST /agents/{agent_id}/runs`
3. Clique em "Try it out"
4. Preencha:
   - `agent_id`: `dental-qa-agent`
   - Body: `{"message": "O que é endodontia?"}`
5. Execute

**Melhor para:** Testes rápidos de API

---

### 2️⃣ Python Client (Integração) 🐍

```bash
python test_agentos_client.py
```

Exemplo:
```python
import asyncio
from agno.client import AgentOSClient

async def chat():
    client = AgentOSClient(base_url="http://localhost:7777")

    result = await client.run_agent(
        agent_id="dental-qa-agent",
        message="O que é endodontia?"
    )

    print(result.content)

asyncio.run(chat())
```

**Melhor para:** Integração em aplicações Python

---

### 3️⃣ cURL (Linha de comando) 💻

```bash
curl -X POST 'http://localhost:7777/agents/dental-qa-agent/runs' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "user123",
    "message": "O que é uma obturação?"
  }'
```

**Melhor para:** Scripts shell, automação

---

### 4️⃣ os.agno.com (Interface Web na Nuvem) ☁️

**IMPORTANTE:** O os.agno.com não consegue acessar `localhost` ou IPs locais diretamente.

**Solução:** Use ngrok para criar um túnel público

```bash
# Instale o ngrok
brew install ngrok

# Inicie o AgentOS (se não estiver rodando)
python playground_agentos.py

# Em outro terminal, crie o túnel
ngrok http 7777
```

O ngrok vai mostrar:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:7777
```

**No os.agno.com:**
1. Acesse: https://os.agno.com
2. "Add new OS" → "Local"
3. Endpoint: `https://abc123.ngrok-free.app` (use a URL do ngrok)
4. Name: `Odonto GPT Ngrok`

**Melhor para:** Interface web completa com histórico e métricas

---

## 🔧 Agentes Disponíveis

### Dental QA Agent
- **ID:** `dental-qa-agent`
- **Função:** Assistente educacional em odontologia
- **Modelo:** Google Gemma 3 27B (grátis via OpenRouter)

**Exemplo de uso:**
```json
POST /agents/dental-qa-agent/runs
{
  "message": "Quais são os sintomas de pulpite?"
}
```

### Dental Image Agent
- **ID:** `dental-image-agent`
- **Função:** Análise de radiografias e imagens clínicas
- **Modelo:** GPT-4o (vision)

**Exemplo de uso:**
```json
POST /agents/dental-image-agent/runs
{
  "message": "Analise esta imagem: https://url-da-imagem.jpg"
}
```

---

## 📊 Endpoints Úteis

| Endpoint | Descrição |
|----------|-----------|
| `GET /` | Informações da API |
| `GET /health` | Health check |
| `GET /config` | Configuração completa |
| `GET /agents` | Lista de agentes |
| `GET /agents/{id}` | Detalhes do agente |
| `POST /agents/{id}/runs` | Executar agente |
| `GET /sessions` | Histórico de sessões |
| `GET /docs` | Swagger UI |

---

## 🐛 Troubleshooting

### Porta 7777 em uso
```bash
lsof -ti:7777 | xargs kill -9
```

### AgentOS não inicia
- Verifique se o PostgreSQL está acessível
- Verifique a variável `SUPABASE_DB_URL` no `.env`
- Verifique a chave `OPENROUTER_API_KEY`

### Erro de conexão no os.agno.com
- Use ngrok para criar um túnel público
- Verifique se o firewall não está bloqueando
- Tente usar a URL do ngrok em vez do IP local

### Agentes não aparecem
```bash
curl http://localhost:7777/config
```

Verifique se `"agents"` contém os dois agentes.

---

## 📚 Recursos Adicionais

- **Documentação Agno:** https://docs.agno.com
- **os.agno.com:** https://os.agno.com
- **OpenRouter:** https://openrouter.ai

---

**Última atualização:** Janeiro 2026
