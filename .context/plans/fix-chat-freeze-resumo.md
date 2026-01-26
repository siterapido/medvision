---
status: active
generated: 2026-01-26
agents:
  - type: "bug-fixer"
    role: "Investigate and fix the chat freeze issue"
  - type: "frontend-specialist"
    role: "Fix React state and DOM issues"
  - type: "performance-optimizer"
    role: "Optimize generateObject timeout handling"
phases:
  - id: "phase-1"
    name: "Root Cause Analysis"
    prevc: "P"
  - id: "phase-2"
    name: "Implementation"
    prevc: "E"
  - id: "phase-3"
    name: "Validation"
    prevc: "V"
---

# Corrigir travamento do chat ao solicitar resumo

> Bug: O chat do Odonto GPT trava (loading infinito) quando o usuario pede um resumo. O console mostra erro "Node cannot be found in the current page" e multiplos logs "[useBlockingChat] Sending messages:".

## Task Snapshot

- **Primary goal:** Corrigir o bug que causa travamento do chat ao solicitar resumo
- **Success signal:** Chat responde normalmente ao comando "resumo" sem travar ou mostrar erros no console
- **Key references:**
  - `lib/hooks/use-blocking-chat.ts` - Hook de chat blocking
  - `components/chat/chat.tsx` - Componente principal do chat
  - `components/chat/messages.tsx` - Renderizacao de mensagens
  - `app/api/chat/route.ts` - API de chat
  - `lib/ai/tools/create-document.ts` - Tool de criacao de documentos
  - `lib/ai/structured-generation.ts` - Geracao estruturada de artifacts

## Analise do Bug

### Sintomas Observados
1. Chat fica em loading infinito (spinner girando)
2. Console mostra erro: `Node cannot be found in the current page`
3. Multiplos logs de `[useBlockingChat] Sending messages:` (1, 3, 3, 7...)
4. O problema ocorre especificamente ao pedir "resumo"

### Fluxo de Execucao Identificado

```
Usuario digita "resumo"
    |
    v
useBlockingChat.sendMessage()
    |
    v
POST /api/chat/route.ts
    |
    v
detectIntent() -> { tool: 'createDocument', kind: 'summary', confidence: 'high' }
    |
    v
toolChoice: { type: 'tool', toolName: 'createDocument' } (forcado)
    |
    v
generateText() com tool createDocument
    |
    v
createDocumentTool.execute()
    |
    v
generateArtifact() -> generateObject() (AI SDK)
    |
    v
[POSSIVEL TIMEOUT OU ERRO AQUI]
```

### Hipoteses de Causa Raiz

#### Hipotese 1: Timeout na geracao estruturada (MAIS PROVAVEL)
- `generateObject()` pode demorar muito para gerar um summary completo
- O timeout de 120s da API pode ser insuficiente quando combinado com `generateText` + `generateObject`
- O erro pode estar sendo silenciado, deixando o frontend esperando indefinidamente

#### Hipotese 2: Loop de requisicoes no frontend
- Os multiplos logs de "Sending messages" sugerem possiveis re-renders que disparam novas requisicoes
- Pode haver uma dependencia circular no `useCallback` de `sendMessage`

#### Hipotese 3: Erro de DOM na renderizacao
- O erro "Node cannot be found" indica que o React esta tentando manipular um no DOM que nao existe mais
- Pode estar relacionado ao `scrollIntoView` no componente `Messages`
- O componente pode estar tentando renderizar enquanto o estado ainda esta sendo atualizado

### Arquivos Criticos

| Arquivo | Problema Potencial |
|---------|-------------------|
| `lib/hooks/use-blocking-chat.ts:100-198` | Loop potencial no sendMessage, dependencias do useCallback |
| `components/chat/messages.tsx:64-69` | Auto-scroll pode causar erro de DOM |
| `lib/ai/tools/create-document.ts:69-113` | Falta tratamento de erro robusto |
| `lib/ai/structured-generation.ts:47-62` | generateObject sem timeout explicito |
| `app/api/chat/route.ts:448-481` | generateText + tool pode exceder timeout |

## Working Phases

### Phase 1 — Root Cause Analysis

**Steps**
1. Reproduzir o bug em ambiente de desenvolvimento
2. Adicionar logs detalhados no fluxo de geracao de resumo
3. Verificar se o erro ocorre no frontend ou backend
4. Identificar se ha timeout ou erro de resposta da API
5. Verificar se ha loop de re-renders no React DevTools

**Checklist de Investigacao**
- [ ] Verificar Network tab para status da requisicao `/api/chat`
- [ ] Verificar se a resposta chega ao frontend
- [ ] Verificar tempo total da requisicao
- [ ] Verificar logs do servidor para erros
- [ ] Verificar se `generateObject` completa ou falha

### Phase 2 — Implementation

**Correcoes Planejadas**

#### 2.1 Adicionar timeout explicito na geracao estruturada
```typescript
// lib/ai/structured-generation.ts
const { object } = await generateObject({
  model: openrouter(model),
  schema,
  prompt,
  temperature,
  maxTokens,
  // ADICIONAR:
  abortSignal: AbortSignal.timeout(30000), // 30s timeout
})
```

#### 2.2 Melhorar tratamento de erro no createDocument
```typescript
// lib/ai/tools/create-document.ts
try {
  const generatedData = await generateArtifact(kind, topic, {
    context,
    userLevel,
    additionalInstructions,
  })
  // ...
} catch (error) {
  console.error(`[createDocument] Failed:`, error)
  // Retornar resposta de fallback em vez de throw
  return {
    id,
    kind,
    title: `Resumo sobre ${topic}`,
    content: 'Desculpe, nao foi possivel gerar o resumo. Tente novamente.',
    error: true,
  }
}
```

#### 2.3 Corrigir dependencias do useCallback em sendMessage
```typescript
// lib/hooks/use-blocking-chat.ts
const sendMessage = useCallback(
  async (content: string, attachments?: File[]) => {
    // Usar ref para isLoading para evitar re-renders
    if (isLoadingRef.current) return
    // ...
  },
  [api, agentId] // Remover 'messages' e 'isLoading' das dependencias
)
```

#### 2.4 Proteger scroll automático contra erros de DOM
```typescript
// components/chat/messages.tsx
const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
  try {
    endRef.current?.scrollIntoView({ behavior })
  } catch (e) {
    // Ignorar erros de DOM durante atualizacoes de estado
    console.warn('[Messages] Scroll error:', e)
  }
}, [])
```

### Phase 3 — Validation

**Steps**
1. Testar comando "resumo" com diferentes topicos
2. Verificar que nao ha erros no console
3. Verificar que a resposta chega em tempo razoavel
4. Testar em mobile (onde o bug foi reportado)
5. Verificar que outros comandos ainda funcionam

**Criterios de Aceite**
- [ ] Chat responde ao "resumo" sem travar
- [ ] Sem erros "Node cannot be found" no console
- [ ] Sem multiplos logs de "Sending messages"
- [ ] Tempo de resposta < 60 segundos
- [ ] Funciona em mobile

## Risk Assessment

### Identified Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Correcao quebra outras funcionalidades | Medium | High | Testar todos os comandos apos correcao |
| Timeout muito agressivo | Low | Medium | Ajustar timeout conforme necessario |
| Mudanca no useCallback causa re-renders | Medium | Medium | Usar React DevTools para verificar |

### Dependencies
- **External:** OpenRouter API (timeout e resposta)
- **Technical:** AI SDK (generateObject, generateText)

## Rollback Plan

### Rollback Triggers
- Chat para de funcionar completamente
- Outros comandos comecam a falhar
- Performance degradada significativamente

### Rollback Procedure
```bash
git revert HEAD  # Se apenas um commit
# OU
git checkout main -- lib/hooks/use-blocking-chat.ts
git checkout main -- lib/ai/tools/create-document.ts
git checkout main -- lib/ai/structured-generation.ts
git checkout main -- components/chat/messages.tsx
```

## Evidence & Follow-up

- [ ] Screenshot do bug reproduzido
- [ ] Logs do servidor mostrando erro
- [ ] PR com correcoes
- [ ] Video de teste mostrando correcao funcionando
