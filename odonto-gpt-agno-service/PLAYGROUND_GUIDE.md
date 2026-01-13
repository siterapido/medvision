# 🎮 Guia do Playground Agno

## Como Iniciar

### 1. Inicie o playground
```bash
cd odonto-gpt-agno-service
source venv/bin/activate
python playground_no_db.py
```

### 2. Você verá:
```
🎮 Playground Odonto GPT (sem banco de dados)
==================================================
Acesse: http://localhost:8000
==================================================

INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 3. Abra no navegador
```
http://localhost:8000
```

---

## Interface do Playground

### Estrutura Visual

```
┌─────────────────────────────────────────────────────────┐
│  Odonto GPT Playground                                 │
├──────────────┬────────────────────────────────────────┤
│              │                                         │
│  AGENTES     │  CHAT                                   │
│              │                                         │
│  📚 Q&A      │  ┌─────────────────────────────────┐  │
│  🖼️  Imagem  │  │ Digite sua pergunta...          │  │
│              │  └─────────────────────────────────┘  │
│              │                                         │
│              │  [Enviar]                               │
│              │                                         │
│              │  ┌─────────────────────────────────┐  │
│              │  │ Resposta do agente...            │  │
│              │  │                                  │  │
│              │  └─────────────────────────────────┘  │
└──────────────┴────────────────────────────────────────┘
```

---

## Como Usar

### 1. Selecionar um Agente
- **dental_education_assistant**: Para perguntas sobre odontologia
- **dental_image_analyzer**: Para análise de imagens

### 2. Fazer uma Pergunta
Digite no campo de chat:
```
O que é endodontia?
```

### 3. Ver a Resposta
O agente responderá em tempo real com streaming.

---

## Exemplos de Uso

### Exemplo 1: Pergunta sobre Odontologia
```
Você: Quais são os sinais de doença periodontal?

Agente: Os principais sinais de doença periodontal incluem:
1. Sangramento gengival
2. Vermelhidão e inflamação
3. Retração gengival
4. Mau hálito persistente
...
```

### Exemplo 2: Análise de Imagem
```
Você: Analise esta imagem de raio-X: https://exemplo.com/radiox.jpg

Agente: Analisando a imagem radiográfica...
Observações:
- Ausência de lesões cariosas visíveis
- Osso alveolar com altura preservada
- Região apical dos dentes sem alterações
...
```

---

## Endpoints da API

Se preferir usar via API em vez do playground visual:

### Chat Q&A
```bash
curl -X POST http://localhost:8000/api/v1/qa/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "O que é endodontia?",
    "sessionId": "user-123"
  }'
```

### Análise de Imagem
```bash
curl -X POST http://localhost:8000/api/v1/image/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Analise esta imagem",
    "imageUrl": "https://exemplo.com/radiox.jpg",
    "sessionId": "user-123"
  }'
```

---

## Solução de Problemas

### Erro: "Address already in use"
```bash
# Use outra porta
python playground_no_db.py --port 8001
```

### Erro: "Agent not found"
Verifique se os agentes foram importados corretamente:
```python
from agents_no_db import dental_qa_agent_simple, dental_image_agent_simple
```

### Playground muito lento
- Use o `playground_no_db.py` em vez de `playground.py`
- O banco de dados pode adicionar latência

---

## Próximos Passos

1. ✅ Testar o playground visual
2. ✅ Fazer perguntas de teste
3. ✅ Testar análise de imagens
4. ✅ Integrar com o frontend Next.js

---

## Documentação Adicional

- [Documentação do Agno](https://agno.dev/)
- [Playground Phidata](https://phidata.dev/)
- [OpenRouter API](https://openrouter.ai/)
