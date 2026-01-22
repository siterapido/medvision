---
status: active
generated: 2026-01-22
priority: high
agents:
  - type: "architect-specialist"
    role: "Design da arquitetura de chat com AI SDK e OpenRouter"
  - type: "frontend-specialist"
    role: "Implementar componentes de chat e UI de artefatos"
  - type: "feature-developer"
    role: "Implementar logica de agentes e streaming"
  - type: "test-writer"
    role: "Criar testes de integracao e E2E"
phases:
  - id: "phase-1"
    name: "Pesquisa e Arquitetura"
    prevc: "P"
    status: "completed"
  - id: "phase-2"
    name: "Analise de Codigo Existente"
    prevc: "R"
    status: "pending"
  - id: "phase-3"
    name: "Implementacao"
    prevc: "E"
    status: "pending"
  - id: "phase-4"
    name: "Testes e Validacao"
    prevc: "V"
    status: "pending"
---

# Integracao Chat SDK + OpenRouter + Artefatos

> Implementar chat completo em /dashboard/chat usando Vercel AI SDK v6 com OpenRouter, suporte a agentes especializados e geracao de artefatos estruturados.

## Task Snapshot

- **Primary goal:** Criar sistema de chat funcional com streaming, multiplos agentes e geracao de artefatos educacionais
- **Success signal:** Chat respondendo via OpenRouter, tool calls funcionando, artefatos sendo renderizados
- **Key references:**
  - [AI SDK Docs](https://ai-sdk.dev)
  - [OpenRouter Provider](https://github.com/openrouterteam/ai-sdk-provider)
  - [AI SDK Agents Patterns](https://www.aisdkagents.com)

## Contexto da Analise Realizada

### Stack Detectada
- **Framework:** Next.js 16 (App Router)
- **AI SDK:** `ai` v6.0.48, `@ai-sdk/react` v3.0.50
- **Provider:** OpenRouter via `@ai-sdk/openai` (custom baseURL)
- **Linguagem:** TypeScript
- **Testes:** Playwright (E2E), Node Test Runner

### Arquivos Chave Identificados

| Arquivo | Descricao |
|---------|-----------|
| `app/dashboard/chat/page.tsx` | Pagina principal do chat (usa OdontoAIChat) |
| `components/dashboard/odonto-ai-chat.tsx` | Componente de chat atual com useChat |
| `app/api/newchat/route.ts` | API Route Edge Runtime com streamText |
| `app/api/chat/route.ts` | API alternativa com sessoes Supabase |
| `lib/ai/openrouter.ts` | Provider OpenRouter configurado |
| `lib/ai/agents/config.ts` | Configuracoes dos agentes |
| `components/chat/chat.tsx` | Componente Chat generico |

## Analise do Codigo Atual

### Provider OpenRouter (`lib/ai/openrouter.ts`)
```typescript
// Ja configurado corretamente usando @ai-sdk/openai
export const openrouter = createOpenAI({
  name: 'openrouter',
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

// Modelos disponiveis
export const MODELS = {
  chat: 'google/gemini-2.0-flash-exp:free',
  research: 'perplexity/sonar',
  vision: 'openai/gpt-4o',
  writer: 'anthropic/claude-3-haiku',
  fallback: 'meta-llama/llama-3.1-8b-instruct:free',
}
```

### Agentes Configurados (`lib/ai/agents/config.ts`)
- **odonto-gpt:** Tutor inteligente com metodo socratico
- **odonto-research:** Pesquisa academica com ferramentas Perplexity/PubMed

### Ferramentas Disponiveis
- `askPerplexity` - Busca via Perplexity Sonar
- `searchPubMed` - Pesquisa PubMed
- `saveResearch` - Salvar dossies
- `updateUserProfile` - Atualizar perfil do aluno

## Documentacao AI SDK Consultada

### Padrao useChat (AI SDK v6)
```typescript
// Cliente - Componente React
'use client';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';

const { messages, sendMessage, status, stop } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
    body: { agentId: 'odonto-gpt' },
  }),
});

// Enviar mensagem
sendMessage({
  role: 'user',
  parts: [{ type: 'text', text: input }],
});
```

### API Route com streamText
```typescript
// Servidor - Route Handler
import { streamText } from 'ai';
import { openrouter } from '@/lib/ai/openrouter';

export async function POST(req: Request) {
  const { messages, agentId } = await req.json();
  
  const result = streamText({
    model: openrouter('google/gemini-2.0-flash-exp:free'),
    system: agentConfig.system,
    messages,
    tools: agentConfig.tools,
    maxSteps: 5,
  });
  
  return result.toUIMessageStreamResponse();
}
```

### Renderizacao de Tool Calls
```typescript
// Renderizar partes da mensagem incluindo tool calls
{message.parts.map((part, i) => {
  switch (part.type) {
    case 'text':
      return <Markdown key={i}>{part.text}</Markdown>;
    
    case 'tool-generateArtifact':
      if (part.state === 'output-available') {
        return <ArtifactRenderer key={i} artifact={part.output} />;
      }
      return <LoadingIndicator key={i} />;
    
    default:
      return null;
  }
})}
```

### Streaming com OpenRouter
```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
// OU usando @ai-sdk/openai com baseURL customizado
import { createOpenAI } from '@ai-sdk/openai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Stream com metadata
const result = await streamText({
  model: openrouter('anthropic/claude-3.5-sonnet'),
  messages,
});

for await (const part of result.fullStream) {
  if (part.type === 'text-delta') {
    process.stdout.write(part.textDelta);
  }
  if (part.type === 'finish') {
    console.log('Usage:', part.usage);
  }
}
```

## Plano de Implementacao

### Fase 1 - Pesquisa e Arquitetura [CONCLUIDA]

**Descobertas:**
1. **useChat Hook:** Usa `DefaultChatTransport` para comunicacao com API
2. **Streaming:** `streamText` retorna `toUIMessageStreamResponse()` para chat
3. **Tool Calls:** Partes de mensagem tem `type: 'tool-*'` com estados `input-available` e `output-available`
4. **Artefatos:** Podem ser implementados via tool calls que retornam objetos estruturados

---

### Fase 2 - Analise de Codigo e Refatoracao

**Tarefas:**

#### 2.1 Unificar API Routes
- [ ] Consolidar `/api/chat/route.ts` e `/api/newchat/route.ts`
- [ ] Manter logica de sessoes do Supabase
- [ ] Usar `toUIMessageStreamResponse()` consistentemente

#### 2.2 Atualizar Componente de Chat
- [ ] Migrar `odonto-ai-chat.tsx` para usar padroes atualizados
- [ ] Implementar renderizacao de tool calls
- [ ] Adicionar suporte a artefatos visuais

#### 2.3 Expandir Sistema de Agentes
- [ ] Adicionar mais agentes especializados
- [ ] Implementar seletor de agentes no UI
- [ ] Criar contexto compartilhado entre agentes

---

### Fase 3 - Implementacao

#### 3.1 Sistema de Artefatos
```typescript
// Definir tipos de artefatos
type ArtifactType = 
  | 'research-dossier'    // Dossie de pesquisa
  | 'clinical-protocol'   // Protocolo clinico
  | 'study-guide'         // Guia de estudo
  | 'case-analysis'       // Analise de caso
  | 'flashcards'          // Flashcards
  | 'quiz'                // Quiz interativo

// Tool para gerar artefato
export const generateArtifact = tool({
  description: "Gera um artefato estruturado",
  parameters: z.object({
    type: z.enum(['research-dossier', 'clinical-protocol', ...]),
    title: z.string(),
    content: z.any(),
  }),
  execute: async ({ type, title, content }) => {
    return { type, title, content, createdAt: new Date() }
  }
})
```

#### 3.2 Componente de Renderizacao de Artefatos
```typescript
// components/chat/artifact-renderer.tsx
function ArtifactRenderer({ artifact }: { artifact: Artifact }) {
  switch (artifact.type) {
    case 'research-dossier':
      return <ResearchDossier data={artifact.content} />
    case 'flashcards':
      return <FlashcardViewer cards={artifact.content} />
    case 'quiz':
      return <QuizComponent questions={artifact.content} />
    default:
      return <GenericArtifact data={artifact} />
  }
}
```

#### 3.3 Novos Agentes
```typescript
// Agentes a implementar
const NEW_AGENTS = {
  'odonto-practice': {
    name: 'Odonto Practice',
    description: 'Casos clinicos e simulacoes',
    model: MODELS.chat,
    tools: { generateArtifact, createQuiz },
  },
  'odonto-summary': {
    name: 'Odonto Summary', 
    description: 'Resumos e flashcards',
    model: MODELS.writer,
    tools: { generateArtifact, createFlashcards },
  },
  'odonto-vision': {
    name: 'Odonto Vision',
    description: 'Analise de radiografias',
    model: MODELS.vision,
    tools: { analyzeImage, generateReport },
  },
}
```

---

### Fase 4 - Testes e Validacao

#### 4.1 Testes de Integracao
```typescript
// tests/chat-integration.test.ts
describe('Chat Integration', () => {
  test('should stream response from OpenRouter', async () => {
    const response = await fetch('/api/newchat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Ola' }],
        agentId: 'odonto-gpt'
      })
    })
    expect(response.ok).toBe(true)
    expect(response.headers.get('content-type')).toContain('text/event-stream')
  })
  
  test('should execute tool calls', async () => {
    // Test tool execution
  })
  
  test('should generate artifacts', async () => {
    // Test artifact generation
  })
})
```

#### 4.2 Testes E2E (Playwright)
```typescript
// e2e/chat.spec.ts
test('chat flow completo', async ({ page }) => {
  await page.goto('/dashboard/chat')
  
  // Enviar mensagem
  await page.fill('[data-testid="chat-input"]', 'Explique carie dentaria')
  await page.click('[data-testid="send-button"]')
  
  // Verificar resposta streaming
  await expect(page.locator('[data-testid="assistant-message"]')).toBeVisible()
  
  // Verificar artefato gerado
  await expect(page.locator('[data-testid="artifact"]')).toBeVisible()
})
```

---

## Checklist de Implementacao

### Backend
- [ ] Unificar API routes (`/api/chat` unico)
- [ ] Implementar `toUIMessageStreamResponse()` corretamente
- [ ] Adicionar tools de geracao de artefatos
- [ ] Configurar novos agentes
- [ ] Implementar persistencia de sessoes

### Frontend
- [ ] Atualizar `OdontoAIChat` para AI SDK v6
- [ ] Criar `ArtifactRenderer` component
- [ ] Implementar seletor de agentes
- [ ] Adicionar indicadores de tool execution
- [ ] UI para visualizar artefatos gerados

### Testes
- [ ] Testes unitarios dos tools
- [ ] Testes de integracao da API
- [ ] Testes E2E do fluxo completo
- [ ] Teste de streaming com diferentes modelos

---

## Dependencias Tecnicas

| Pacote | Versao Atual | Status |
|--------|--------------|--------|
| `ai` | 6.0.48 | OK |
| `@ai-sdk/react` | 3.0.50 | OK |
| `@ai-sdk/openai` | 3.0.18 | OK (usado para OpenRouter) |

### Variaveis de Ambiente Necessarias
```env
OPENROUTER_API_KEY=sk-or-...
NEXT_PUBLIC_APP_URL=https://...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Rate limits OpenRouter | Media | Alto | Implementar fallback para modelos gratuitos |
| Streaming timeout | Baixa | Medio | Usar Edge Runtime com maxDuration=60 |
| Incompatibilidade tool calls | Media | Alto | Testar com cada modelo antes de habilitar |

---

## Proximos Passos Imediatos

1. **Iniciar Fase 2:** Unificar API routes
2. **Criar branch:** `feat/chat-sdk-artifacts`
3. **Implementar tools de artefatos:** Comecar com `generateArtifact`
4. **Testar streaming:** Validar com modelos gratuitos

## Evidence e Follow-up

### Artefatos a Coletar
- [ ] Logs de streaming funcionando
- [ ] Screenshots do chat em funcionamento
- [ ] Resultados dos testes E2E
- [ ] Metricas de latencia OpenRouter

### PRs Relacionados
- TBD: PR de unificacao de API routes
- TBD: PR de sistema de artefatos
- TBD: PR de testes
