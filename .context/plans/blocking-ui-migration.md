---
status: active
generated: 2026-01-25
agents:
  - type: "backend-developer"
    role: "Migrate API from streamText to generateText"
  - type: "frontend-developer"
    role: "Update client to handle non-streaming responses"
phases:
  - id: "phase-1"
    name: "Analise e Planejamento"
    prevc: "P"
  - id: "phase-2"
    name: "Backend Migration"
    prevc: "E"
  - id: "phase-3"
    name: "Frontend Migration"
    prevc: "E"
  - id: "phase-4"
    name: "Validacao e Testes"
    prevc: "V"
---

# Plano: Migrar de Streaming UI para Blocking UI

> Migrar o chat de `/dashboard/chat` de Streaming UI (streamText + useChat) para Blocking UI (generateText + fetch manual) usando AI SDK v6.

## Task Snapshot

- **Primary goal:** Substituir o streaming por respostas bloqueantes completas para simplificar o fluxo e melhorar a experiencia em cenarios onde streaming nao e necessario
- **Success signal:** Chat funcional com respostas completas (nao-streaming), loading state visivel, e mesma funcionalidade de tools/artifacts
- **Key references:**
  - [AI SDK generateText](https://ai-sdk.dev/docs/ai-sdk-core/generating-text)
  - Codigo atual: `app/api/chat/route.ts`
  - Componente: `components/chat/chat.tsx`

## Contexto: Streaming vs Blocking UI

### Streaming UI (Atual)
```
User Message -> streamText() -> toUIMessageStreamResponse() -> useChat hook
                    |
                    v
            [Chunks aparecem progressivamente]
```

**Vantagens:**
- Feedback imediato ao usuario
- Percepcao de velocidade

**Desvantagens:**
- Complexidade no cliente (parsing de chunks)
- Bugs de re-render
- Dificil debugar

### Blocking UI (Proposto)
```
User Message -> generateText() -> Response.json() -> fetch + setState
                    |
                    v
            [Resposta completa de uma vez]
```

**Vantagens:**
- Codigo mais simples
- Facil debugar
- Melhor para tools com multi-steps
- Loading state claro

**Desvantagens:**
- Usuario espera mais tempo sem feedback
- Pode parecer "travado" em respostas longas

## Arquitetura Proposta

### Backend: API Route

**De (Streaming):**
```typescript
const result = streamText({
  model: openrouter(modelId),
  messages: modelMessages,
  tools,
})
return result.toUIMessageStreamResponse()
```

**Para (Blocking):**
```typescript
const result = await generateText({
  model: openrouter(modelId),
  messages: modelMessages,
  tools,
  maxSteps: toolPreset.maxSteps,
})

return Response.json({
  message: {
    id: generateId(),
    role: 'assistant',
    parts: [{ type: 'text', text: result.text }],
    // Include tool results if any
    ...(result.toolResults && { toolResults: result.toolResults }),
  },
  sessionId: currentSessionId,
  usage: result.usage,
})
```

### Frontend: Remover useChat

**De (useChat hook):**
```typescript
const { messages, append, status } = useChat({
  api: '/api/chat',
  body: { agentId, sessionId },
})
```

**Para (fetch manual):**
```typescript
const [messages, setMessages] = useState<UIMessage[]>([])
const [isLoading, setIsLoading] = useState(false)

async function sendMessage(content: string) {
  setIsLoading(true)

  const userMessage: UIMessage = {
    id: generateId(),
    role: 'user',
    parts: [{ type: 'text', text: content }],
  }

  setMessages(prev => [...prev, userMessage])

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, userMessage],
        agentId,
        sessionId,
      }),
    })

    const data = await response.json()
    setMessages(prev => [...prev, data.message])
  } catch (error) {
    toast.error('Erro ao enviar mensagem')
  } finally {
    setIsLoading(false)
  }
}
```

---

## Fases de Implementacao

### Phase 1 - Analise e Planejamento (PLANNING)

**Objetivo:** Entender impacto e definir estrategia de migracao

**Steps:**
1. [x] Analisar codigo atual do chat
2. [x] Pesquisar documentacao AI SDK para generateText
3. [x] Definir nova arquitetura
4. [x] Criar este plano

**Outputs:**
- Este documento

---

### Phase 2 - Backend Migration (EXECUTION)

**Objetivo:** Migrar API route de streamText para generateText

**Step 2.1 - Criar nova API route**

Arquivo: `app/api/chat/route.ts`

```typescript
// Mudancas principais:
// 1. Importar generateText em vez de streamText
// 2. Usar await para esperar resposta completa
// 3. Retornar JSON em vez de stream

import { generateText, convertToModelMessages, UIMessage, generateId } from 'ai'

export async function POST(req: Request) {
  // ... autenticacao e validacao (manter igual)

  // MUDANCA: usar generateText
  const result = await generateText({
    model: openrouter(modelId) as any,
    system: systemPrompt,
    messages: modelMessages,
    tools: Object.keys(tools).length > 0 ? tools : undefined,
    maxSteps: Object.keys(tools).length > 0 ? toolPreset.maxSteps : 1,
    temperature: 0.1,
    maxTokens: 4000,
    abortSignal: req.signal,
  })

  // Construir mensagem de resposta
  const assistantMessage: UIMessage = {
    id: generateId(),
    role: 'assistant',
    parts: [{ type: 'text', text: result.text }],
  }

  // Persistir no banco (mover de onFinish para aqui)
  if (currentSessionId && result.text) {
    await adminSupabase.from('agent_messages').insert({
      session_id: currentSessionId,
      agent_id: agentId,
      role: 'assistant',
      content: result.text,
    })
  }

  return Response.json({
    message: assistantMessage,
    sessionId: currentSessionId,
    usage: result.usage,
    toolResults: result.toolResults,
  })
}
```

**Step 2.2 - Manter compatibilidade com tools**

O `generateText` suporta tools nativamente com `maxSteps`:

```typescript
const result = await generateText({
  model,
  messages,
  tools: {
    createDocument: createDocumentTool,
    // ... other tools
  },
  maxSteps: 5, // Permite ate 5 iteracoes de tool calls
})

// result.text contem a resposta final
// result.toolResults contem os resultados de todas as tools chamadas
// result.steps contem cada passo do processo
```

**Step 2.3 - Tratar erros**

```typescript
try {
  const result = await generateText({ ... })
  return Response.json({ message: ... })
} catch (error) {
  console.error('[Chat API Error]', error)
  return Response.json(
    { error: error instanceof Error ? error.message : 'Erro interno' },
    { status: 500 }
  )
}
```

---

### Phase 3 - Frontend Migration (EXECUTION)

**Objetivo:** Remover useChat hook e usar fetch manual

**Step 3.1 - Criar hook customizado useBlockingChat**

Arquivo: `lib/hooks/use-blocking-chat.ts`

```typescript
'use client'

import { useState, useCallback } from 'react'
import { generateId } from 'ai'
import type { UIMessage } from 'ai'

interface UseBlockingChatOptions {
  api?: string
  initialMessages?: UIMessage[]
  agentId?: string
  sessionId?: string
  onError?: (error: Error) => void
  onFinish?: (message: UIMessage) => void
}

interface UseBlockingChatReturn {
  messages: UIMessage[]
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>
  isLoading: boolean
  error: Error | null
  sendMessage: (content: string) => Promise<void>
  reload: () => Promise<void>
  stop: () => void
}

export function useBlockingChat({
  api = '/api/chat',
  initialMessages = [],
  agentId = 'odonto-gpt',
  sessionId,
  onError,
  onFinish,
}: UseBlockingChatOptions): UseBlockingChatReturn {
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    const controller = new AbortController()
    setAbortController(controller)

    // Criar mensagem do usuario
    const userMessage: UIMessage = {
      id: generateId(),
      role: 'user',
      parts: [{ type: 'text', text: content }],
    }

    // Adicionar mensagem do usuario imediatamente
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          agentId,
          sessionId,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao processar mensagem')
      }

      const data = await response.json()

      // Adicionar resposta do assistente
      setMessages(prev => [...prev, data.message])

      onFinish?.(data.message)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request foi cancelado, nao tratar como erro
        return
      }

      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      onError?.(error)
    } finally {
      setIsLoading(false)
      setAbortController(null)
    }
  }, [api, agentId, sessionId, messages, isLoading, onError, onFinish])

  const reload = useCallback(async () => {
    // Encontrar ultima mensagem do usuario
    const lastUserMessageIndex = messages.findLastIndex(m => m.role === 'user')
    if (lastUserMessageIndex === -1) return

    // Remover todas as mensagens apos a ultima do usuario
    const newMessages = messages.slice(0, lastUserMessageIndex)
    setMessages(newMessages)

    // Re-enviar a ultima mensagem
    const lastUserMessage = messages[lastUserMessageIndex]
    const textPart = lastUserMessage.parts?.find(
      (p): p is { type: 'text'; text: string } => p.type === 'text'
    )

    if (textPart) {
      await sendMessage(textPart.text)
    }
  }, [messages, sendMessage])

  const stop = useCallback(() => {
    abortController?.abort()
    setIsLoading(false)
  }, [abortController])

  return {
    messages,
    setMessages,
    isLoading,
    error,
    sendMessage,
    reload,
    stop,
  }
}
```

**Step 3.2 - Atualizar componente Chat**

Arquivo: `components/chat/chat.tsx`

```typescript
'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useBlockingChat } from '@/lib/hooks/use-blocking-chat'
import { Messages } from './messages'
import { MultimodalInput } from './multimodal-input'
// ... other imports

export function Chat({ id, initialMessages = [], agentId = 'odonto-gpt' }: ChatProps) {
  const [input, setInput] = useState('')
  const [selectedAgent, setSelectedAgent] = useState(agentId)

  // MUDANCA: usar useBlockingChat em vez de useChat
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    reload,
    stop,
  } = useBlockingChat({
    api: '/api/chat',
    initialMessages: initialMessages as any,
    agentId: selectedAgent,
    sessionId: id,
    onError: (err) => {
      toast.error('Erro no chat', { description: err.message })
    },
  })

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput('')
  }, [input, isLoading, sendMessage])

  // Mapear status para componente
  const componentStatus = isLoading ? 'submitted' : error ? 'error' : 'ready'

  return (
    <div className="flex h-full flex-col">
      <Messages
        messages={messages}
        status={componentStatus}
        // ... other props
      />

      <MultimodalInput
        input={input}
        setInput={setInput}
        status={componentStatus}
        stop={stop}
        onSubmit={handleSubmit}
        // ... other props
      />
    </div>
  )
}
```

**Step 3.3 - Adicionar loading state visual**

Como nao ha streaming, adicionar um indicador de loading claro:

```typescript
// Em messages.tsx ou greeting.tsx
{isLoading && (
  <div className="flex items-center gap-2 p-4">
    <div className="animate-pulse flex gap-1">
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
    </div>
    <span className="text-sm text-muted-foreground">Pensando...</span>
  </div>
)}
```

---

### Phase 4 - Validacao e Testes (VALIDATION)

**Objetivo:** Validar que tudo funciona corretamente

**Step 4.1 - Testes Funcionais**

- [ ] Enviar mensagem de texto simples
- [ ] Verificar loading state aparece
- [ ] Verificar resposta completa aparece
- [ ] Testar com tool call (createDocument)
- [ ] Testar reload (regenerar)
- [ ] Testar stop (cancelar request)
- [ ] Testar erro de rede
- [ ] Testar timeout

**Step 4.2 - Verificar Persistencia**

- [ ] Mensagem do usuario salva no banco
- [ ] Resposta do assistente salva no banco
- [ ] Session criada corretamente
- [ ] Historico aparece na sidebar

**Step 4.3 - Comparar Performance**

- [ ] Medir tempo de resposta
- [ ] Verificar uso de memoria
- [ ] Testar com respostas longas

---

## Consideracoes Importantes

### Tool Approval
Com blocking UI, o tool approval funciona diferente:
- O backend executa tools automaticamente (com maxSteps)
- Se precisar de approval, criar endpoint separado para tool execution

### Artifacts
O `createDocument` tool continuara funcionando:
- `generateText` executa a tool
- O resultado inclui o artifact criado
- Frontend extrai e renderiza

### Timeout
`generateText` pode demorar mais:
```typescript
export const maxDuration = 120 // Aumentar para 2 minutos
```

### Abort
O `AbortSignal` funciona com `generateText`:
```typescript
const result = await generateText({
  // ...
  abortSignal: req.signal,
})
```

---

## Rollback Plan

Se houver problemas:
1. Reverter `route.ts` para usar `streamText`
2. Reverter `chat.tsx` para usar `useChat`
3. Remover `use-blocking-chat.ts`

---

## Checklist Final

- [ ] API route migrada para generateText
- [ ] Hook useBlockingChat criado
- [ ] Componente Chat atualizado
- [ ] Loading state visual implementado
- [ ] Testes funcionais passando
- [ ] Persistencia funcionando
- [ ] Tools funcionando
- [ ] Sem erros no console
