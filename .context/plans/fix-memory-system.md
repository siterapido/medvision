---
status: active
generated: 2026-01-24
agents:
  - type: "bug-fixer"
    role: "Diagnosticar e corrigir problemas no sistema de memoria"
  - type: "test-writer"
    role: "Criar testes para validar funcionamento da memoria"
phases:
  - id: "phase-1"
    name: "Diagnostico"
    prevc: "P"
  - id: "phase-2"
    name: "Correcoes"
    prevc: "E"
  - id: "phase-3"
    name: "Validacao"
    prevc: "V"
---

# Corrigir Sistema de Memoria do Odonto GPT

> O agente nao esta lembrando informacoes do usuario (nome, etc.) entre mensagens.

## Task Snapshot
- **Primary goal:** Fazer o sistema de memoria funcionar para que o agente lembre informacoes do usuario (nome, universidade, etc.)
- **Success signal:** Usuario diz o nome, faz outra pergunta, e o agente ainda lembra o nome
- **Arquivos principais:**
  - [lib/ai/memory/service.ts](../../lib/ai/memory/service.ts) - MemoryService
  - [lib/ai/memory/extractor.ts](../../lib/ai/memory/extractor.ts) - Extracao automatica
  - [lib/ai/tools/memory-tools.ts](../../lib/ai/tools/memory-tools.ts) - Tools do agente
  - [app/api/chat/route.ts](../../app/api/chat/route.ts) - Rota principal

## Problema Reportado
- Usuario disse o nome em um chat
- Perguntou depois e o agente nao sabia mais
- Sistema de memoria nao esta funcionando

## Arquitetura do Sistema de Memoria

```
lib/ai/
├── memory/
│   ├── index.ts       # Exports
│   ├── service.ts     # MemoryService (salvar, buscar, contexto)
│   ├── embeddings.ts  # Geracao de embeddings via OpenRouter
│   ├── types.ts       # Tipos TypeScript
│   └── extractor.ts   # Extracao automatica de fatos via LLM
├── tools/
│   └── memory-tools.ts # Tools: rememberFact, recallMemories, etc.
└── artifacts/
    └── context.ts     # Contexto global (userId, sessionId)
```

### Fluxo de Dados Esperado
1. Usuario envia mensagem
2. `route.ts` carrega contexto via `memoryService.getUserContext()`
3. Memorias sao injetadas no system prompt
4. Agente responde (pode usar memory tools)
5. `processConversation()` extrai fatos automaticamente

## Diagnostico - 5 Problemas Identificados

### PROBLEMA 1: Agente NAO usa memory tools proativamente
**Arquivo:** `lib/ai/agents/config.ts:61-67`
**Descricao:** O system prompt diz "USE as ferramentas de memoria", mas o LLM decide por conta propria se vai usar. Na maioria das vezes, ele simplesmente responde sem salvar nada.
**Impacto:** CRITICO - Nome nunca e salvo porque agente nao chama `rememberFact`

### PROBLEMA 2: Extracao automatica pode estar silenciosamente falhando
**Arquivo:** `app/api/chat/route.ts:311-318`
```typescript
processConversation(currentUserId, currentSessionId, userMessageText, result.text)
  .catch(err => console.error('[Chat] Error extracting facts:', err))
```
**Descricao:** Erros sao apenas logados, nao ha fallback. Se extraction falhar, memoria nao e salva.
**Impacto:** ALTO - Extracao pode estar falhando sem ninguem saber

### PROBLEMA 3: Migracoes podem nao estar aplicadas
**Arquivo:** `supabase/migrations/20260124000000_add_memory_embeddings.sql`
**Descricao:** Funcoes RPC `search_memories`, `get_recent_memories` podem nao existir
**Verificacao:** Rodar query SQL no Supabase Dashboard

### PROBLEMA 4: Embeddings podem estar falhando
**Arquivo:** `lib/ai/memory/embeddings.ts:19-63`
```typescript
if (!apiKey) {
  console.warn('[Embeddings] OPENROUTER_API_KEY not configured')
  return []  // <-- Retorna array vazio silenciosamente
}
```
**Descricao:** Sem `OPENROUTER_API_KEY`, embeddings retornam `[]` e busca semantica nao funciona
**Impacto:** MEDIO - Cai para fallback, mas pode ter outros problemas

### PROBLEMA 5: Race condition no contexto global
**Arquivo:** `lib/ai/artifacts/context.ts:34`
```typescript
let currentContext: OdontoContext | null = null  // <-- Variavel GLOBAL
```
**Descricao:** Multiplas requests podem sobrescrever o contexto uma da outra
**Impacto:** MEDIO - userId errado nas tools em situacoes de alta concorrencia

## Plano de Correcao

### Fase 1 - Diagnostico (AGORA)

| Step | Tarefa | Status |
|------|--------|--------|
| 1.1 | Verificar se migracoes estao aplicadas | Pendente |
| 1.2 | Verificar dados na tabela `agent_memories` | Pendente |
| 1.3 | Testar geracao de embeddings isoladamente | Pendente |
| 1.4 | Verificar logs do servidor durante conversa | Pendente |

### Fase 2 - Correcoes

| Step | Tarefa | Arquivo | Prioridade |
|------|--------|---------|------------|
| 2.1 | Adicionar extracao EXPLICITA de nome | `route.ts` | CRITICA |
| 2.2 | Melhorar prompt do extractor | `extractor.ts` | ALTA |
| 2.3 | Adicionar logging detalhado | `service.ts` | MEDIA |
| 2.4 | Corrigir race condition com AsyncLocalStorage | `context.ts` | MEDIA |
| 2.5 | Melhorar system prompt do agente | `config.ts` | MEDIA |

### Fase 3 - Validacao

| Step | Tarefa | Criterio de Sucesso |
|------|--------|---------------------|
| 3.1 | Testar fluxo completo | Nome salvo e recuperado |
| 3.2 | Verificar dados no banco | Registro em `agent_memories` |
| 3.3 | Testar persistencia entre sessoes | Nome lembrado em novo chat |

## Solucoes Propostas

### Solucao 2.1: Extracao Explicita de Nome (MAIS IMPORTANTE)
Adicionar em `route.ts` uma funcao que detecta padroes de nome e salva AUTOMATICAMENTE:

```typescript
// Detectar padroes de nome na mensagem do usuario
const namePatterns = [
  /meu nome [eé] (\w+)/i,
  /me chamo (\w+)/i,
  /sou (?:o |a )?(\w+)/i,
  /pode me chamar de (\w+)/i,
]

for (const pattern of namePatterns) {
  const match = userMessageText.match(pattern)
  if (match && match[1]) {
    await memoryService.saveMemory({
      userId: currentUserId,
      agentId: 'odonto-gpt',
      type: 'long_term',
      content: `O nome do aluno e ${match[1]}`,
      topic: 'nome',
      confidence: 1.0,
      sessionId: currentSessionId,
    })
    break
  }
}
```

### Solucao 2.2: Melhorar Prompt do Extractor
Adicionar exemplos mais explicitos em `extractor.ts`:

```
EXTRAIR OBRIGATORIAMENTE:
- Quando usuario diz "meu nome e X" -> {"content": "O nome do aluno e X", "type": "long_term", "topic": "nome", "confidence": 1.0}
- Quando usuario menciona universidade -> salvar universidade
```

### Solucao 2.5: Melhorar System Prompt do Agente
Tornar o uso de `rememberFact` mais explicito:

```
REGRA OBRIGATORIA: Quando o aluno informar seu nome, SEMPRE use a ferramenta rememberFact para salvar.
Exemplo: Se o aluno disser "Meu nome e Carlos", IMEDIATAMENTE chame rememberFact com content="O nome do aluno e Carlos".
```

## Testes de Validacao

### Teste 1: Salvar nome
```
Input: "Oi, meu nome e Marcos"
Esperado:
- Memoria salva com content="O nome do aluno e Marcos"
- topic="nome"
- Embedding gerado (array de 1536 floats)
```

### Teste 2: Recuperar nome na mesma sessao
```
Input: "Qual meu nome?"
Esperado: Agente responde "Marcos"
```

### Teste 3: Persistencia entre sessoes
```
1. Chat A: "Meu nome e Marcos"
2. Fechar browser
3. Chat B (nova sessao): "Qual meu nome?"
Esperado: Agente responde "Marcos"
```

## Verificacoes de Banco de Dados

### Query 1: Verificar se tabela existe
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'agent_memories'
);
```

### Query 2: Verificar funcoes RPC
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
AND routine_name IN ('search_memories', 'get_recent_memories', 'cleanup_expired_memories');
```

### Query 3: Verificar memorias salvas
```sql
SELECT id, user_id, type, content, topic, created_at
FROM agent_memories
ORDER BY created_at DESC
LIMIT 10;
```

## Proximos Passos

1. **IMEDIATO:** Verificar estado do banco de dados
2. **IMEDIATO:** Rodar app localmente e testar fluxo completo com logs
3. Implementar Solucao 2.1 (extracao explicita)
4. Testar novamente
5. Se necessario, implementar demais solucoes
