# Odonto GPT Chat - Assistente Geral de Odontologia

**Data:** 2026-03-27
**Status:** ✅ Em Produção

---

## Visão Geral

Odonto GPT é o assistente geral de odontologia do sistema, projetado para responder dúvidas clínicas, auxiliar no estudo e fornecer informações baseadas em evidências científicas.

### Características Principais

- **ID do Agente:** `odonto-gpt`
- **Tipo:** Livre (disponível para todos os usuários)
- **Capacidade:** Chat conversacional com RAG
- **Ícone:** Sparkles (Estrelas)
- **Cor:** Cyan (#00A3FF)

---

## Funcionalidades

### Capacidades do Agente

| Funcionalidade | Descrição |
|----------------|-----------|
| **Responder Dúvidas** | Explicações clínicas sobre procedimentos, materiais, técnicas |
| **Estudo** | Criação de resumos, flashcards e materiais de estudo |
| **RAG** | Busca em base de conhecimento odontológico |
| **Pesquisa** | Buscas em artigos científicos (com plugin) |

### Integração com Outros Agentes

O Odonto GPT serve como agente principal e pode direcionar usuários para agentes especializados:

| Agente | Gatilho |
|--------|---------|
| Odonto Research | "pesquise", "evidência", "estudo" |
| Odonto Practice | "caso clínico", "pratique" |
| Odonto Summary | "resumo", "flashcard", "estudar" |
| Odonto Vision | "imagem", "radiografia", "analise" |

---

## Integração Técnica

### API de Chat

```typescript
// Envio de mensagem
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Qual a melhor técnica de restauração?' }
    ],
    agentId: 'odonto-gpt',
    stream: true
  })
});

// Resposta streaming
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}
```

### Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|--------------|
| `OPENROUTER_API_KEY` | Chave da API OpenRouter | Sim |
| `OPENROUTER_MODEL` | Modelo do chat (padrão: `anthropic/claude-3.5-sonnet`) | Não |
| `OPENAI_API_KEY` | Fallback para embeddings | Não |

### Modelos Utilizados

| Função | Provider | Modelo |
|--------|----------|--------|
| Chat Principal | OpenRouter | `anthropic/claude-3.5-sonnet` |
| Fallback | OpenRouter | `google/gemini-2.0-flash-001` |
| Embeddings | OpenAI | `text-embedding-3-small` |

---

## RAG - Base de Conhecimento

### Estrutura de Dados

```sql
-- Tabela de documentos
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  source TEXT,
  specialty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Estratégia de Chunking

- **Tamanho:** 1500 caracteres
- **Overlap:** 200 caracteres
- **Embedding:** 1536 dimensões

### Busca Híbrida

```sql
-- Função de busca
SELECT * FROM hybrid_search_knowledge(
  query_text := 'cárie dentária',
  query_embedding := embeddings,
  specialty_filter := NULL,
  limit := 5
);
```

---

## Interface do Usuário

### Componente: `odonto-ai-chat.tsx`

```typescript
// Configuração padrão
{
  id: 'odonto-gpt',
  icon: <Sparkles className="w-4 h-4" />,
  name: 'Odonto GPT',
  description: 'Assistente geral de odontologia para dúvidas e estudo',
  placeholder: 'Pergunte sobre odontologia...',
  greeting: 'Olá, {userName}!'
}
```

### Fluxo de Chat

1. Usuário envia mensagem
2. Sistema identifica intenção
3. Se necessário, busca contexto via RAG
4. Gera resposta com modelo de linguagem
5. Retorna resposta em streaming

---

## Monitoramento

### Métricas Rastreadas

| Métrica | Target | Local |
|---------|--------|-------|
| Latência p95 | ≤5s | Dashboard |
| Tokens/s | ≥50 | Logs |
| Taxa de erro | ≤1% | Sentry |
| Relevância RAG | ≥85% | Avaliação manual |

### Sentry Tags

```typescript
sentry.captureMessage('Chat response', {
  tags: {
    agent: 'odonto-gpt',
    model: 'claude-3.5-sonnet',
    has_rag_context: true,
    tokens_used: 1500
  }
});
```

---

## Limitações Conhecidas

1. **Conhecimento limitado** - Base de dados pode não cobrir topics récents
2. **Latência** - Respostas longas podem demorar mais
3. **Rate limiting** - Limite de requisições na API
4. **Contexto** - Limite de tokens por conversa

---

## Boas Práticas

### Para Melhor Experiência

- ✅ Sea específico nas perguntas
- ✅ Use termos técnicos quando souber
- ✅ Peça fontes quando necessário
- ✅ Use agentes especializados para tarefas específicas

### Para Evitar

- ❌ Perguntas muito genéricas
- ❌ Múltiplas perguntas em uma só
- ❌ Solicitar diagnósticos (sempre redirecionar para profissional)

---

## Troubleshooting

### "Erro de rate limiting"
→ Aguarde alguns segundos e tente novamente. O sistema usa cache.

### "Resposta incompleta"
→ Tente dividir a pergunta em partes menores.

### "Contexto não encontrado"
→ A base de conhecimento pode não ter informações sobre o tópico.

### "Modelo indisponível"
→ Sistema automaticamente tenta modelos fallback.

---

## Arquitetura do Sistema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│  API Route  │────▶│ OpenRouter  │
│  (Next.js)  │     │  /api/chat  │     │   (LLM)     │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │  RAG Search │
                    │  (Supabase) │
                    └─────────────┘
```

---

## Próximas Melhorias

- [ ] Expansão da base de conhecimento
- [ ] Suporte a documentos PDF na conversa
- [ ] Histórico de conversas por especialidade
- [ ] Integração com PubMed para pesquisas

---

**Última atualização:** 2026-03-27
