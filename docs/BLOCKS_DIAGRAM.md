# Message Blocks - Diagrama de Arquitetura

## 🏗️ Fluxo de Renderização

```
┌─────────────────────────────────────────────────────────────┐
│                      useChat Hook                           │
│             (AI SDK v6 DefaultChatTransport)               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Chat Component                            │
│        <Chat />  (recebe initialMessages)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Messages Container                        │
│  <Messages messages={UIMessage[]} />                        │
│                                                              │
│  ├─ useMessageBlocks(messages)                             │
│  │  └─ state: {                                            │
│  │     blocksByMessageId: Map,                             │
│  │     hasArtifacts: boolean,                              │
│  │     hasPendingTools: boolean                            │
│  │   }                                                      │
│  │                                                          │
│  └─ Renderiza cada Message                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │      Message Component              │
        │  <Message message={UIMessage} />    │
        │                                      │
        │  1. uiMessageToBlocks()             │
        │     UIMessage → MessageBlock[]      │
        │  2. groupTextBlocks()               │
        │     otimiza agrupamento             │
        │  3. renderiza cada bloco            │
        └─────────────────────────────────────┘
                              ↓
         ┌────────────────────────────────────────┐
         │  MessageBlockRenderer                  │
         │  renderiza cada tipo de bloco          │
         │                                         │
         ├─ TextBlock                             │
         │  ├─ role === 'user'                   │
         │  │  └─ Bolha azul à direita          │
         │  └─ role === 'assistant'              │
         │     ├─ Markdown rendering             │
         │     └─ Alinhado à esquerda            │
         │                                         │
         ├─ ToolBlock                             │
         │  ├─ state: 'streaming'                │
         │  │  └─ Loading spinner                │
         │  ├─ state: 'input-available'          │
         │  │  └─ Tool approval dialog           │
         │  └─ state: 'done' / 'output-available'│
         │     └─ Renderiza artifact             │
         │                                         │
         ├─ ArtifactBlock                         │
         │  ├─ kind: 'summary'                   │
         │  │  └─ SummaryArtifact                │
         │  ├─ kind: 'code'                      │
         │  │  └─ CodeArtifact                   │
         │  ├─ kind: 'quiz'                      │
         │  │  └─ QuizArtifact                   │
         │  └─ ... outros tipos                  │
         │                                         │
         └─ ThinkingBlock                         │
            └─ Renderiza pensamento (se visível) │
         │                                         │
         └─ Ações da Mensagem                     │
            ├─ Copy                               │
            ├─ Edit (se user)                    │
            ├─ Regenerate (se assistant)         │
            └─ Delete                             │
```

## 📊 Estrutura de Dados

```typescript
┌──────────────────────────────────────────────────┐
│              useMessageBlocks Hook               │
├──────────────────────────────────────────────────┤
│                                                   │
│  state.messages: UIMessage[]                    │
│  ↓                                               │
│  ┌─────────────────────────────────────────┐   │
│  │ {                                       │   │
│  │   id: "msg-123",                        │   │
│  │   role: "assistant",                    │   │
│  │   parts: [...]  // legacy               │   │
│  │ }                                       │   │
│  └─────────────────────────────────────────┘   │
│                      ↓                          │
│          uiMessageToBlocks()                    │
│                      ↓                          │
│  state.blocksByMessageId: Map<string, Block[]> │
│  ↓                                               │
│  ┌─────────────────────────────────────────┐   │
│  │ Map {                                   │   │
│  │   "msg-123": [                          │   │
│  │     {                                   │   │
│  │       type: "text",                     │   │
│  │       content: "...",                   │   │
│  │       role: "assistant"                 │   │
│  │     },                                  │   │
│  │     {                                   │   │
│  │       type: "tool",                     │   │
│  │       toolName: "createDocument",       │   │
│  │       state: "done",                    │   │
│  │       output: {...}                     │   │
│  │     },                                  │   │
│  │     {                                   │   │
│  │       type: "text",                     │   │
│  │       content: "...",                   │   │
│  │       role: "assistant"                 │   │
│  │     }                                   │   │
│  │   ]                                     │   │
│  │ }                                       │   │
│  └─────────────────────────────────────────┘   │
│                      ↓                          │
│        groupTextBlocks() [opcional]             │
│                      ↓                          │
│  MessageBlock[] otimizado (text agrupado)      │
│                                                   │
│  state.hasArtifacts: boolean                   │
│  state.hasPendingTools: boolean                │
│                                                   │
└──────────────────────────────────────────────────┘
```

## 🔄 Exemplo de Execução

### Entrada: UIMessage
```typescript
{
  id: "msg-456",
  role: "assistant",
  parts: [
    { type: 'text', text: 'Aqui está o resumo:' },
    {
      type: 'tool-createDocument',
      state: 'done',
      output: {
        id: 'doc-1',
        title: 'Resumo de Biologia',
        content: '...'
      }
    },
    { type: 'text', text: 'Qualquer dúvida?' }
  ]
}
```

### Processamento

```
Step 1: uiMessageToBlocks()
├─ parts[0] (type: 'text') → TextBlock
├─ parts[1] (type: 'tool-...') → ToolBlock
└─ parts[2] (type: 'text') → TextBlock

Step 2: groupTextBlocks() [opcional]
├─ TextBlock + TextBlock → TextBlock (agrupado)
└─ ToolBlock (permanece)

Result: MessageBlock[]
```

### Saída: Blocos Renderizados

```
┌─────────────────────────────────────┐
│  "Aqui está o resumo:               │  ← TextBlock (agrupado)
│   Qualquer dúvida?"                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📄 Resumo de Biologia               │  ← ArtifactBlock
│                                      │
│ [conteúdo do artifact]              │
│                                      │
└─────────────────────────────────────┘
```

## 🎯 Tipos de Blocos

### TextBlock
```typescript
{
  type: 'text',
  content: string,
  role: 'user' | 'assistant'
}
```
**Renderização:**
- User: Bolha azul, alinhado direita
- Assistant: Markdown, alinhado esquerda

### ToolBlock
```typescript
{
  type: 'tool',
  toolName: string,
  state: 'streaming' | 'input-available' | 'output-available' | 'done' | 'error',
  input?: any,
  output?: any,
  error?: string
}
```
**Estados:**
- `streaming` → Loading spinner
- `input-available` → Approval dialog
- `output-available` / `done` → Render artifact
- `error` → Error message

### ArtifactBlock
```typescript
{
  type: 'artifact',
  kind: 'summary' | 'code' | 'flashcards' | 'quiz' | 'table' | 'research' | 'report' | 'image',
  title: string,
  content: any,
  metadata?: Record<string, any>
}
```

### ThinkingBlock
```typescript
{
  type: 'thinking',
  content: string,
  visible?: boolean
}
```

## ⚡ Performance

### Memoização
```typescript
const state = useMemo(() => {
  // Recalcula apenas se messages mudam
  const blocksByMessageId = new Map()
  // ... processamento
  return { blocksByMessageId, hasArtifacts, hasPendingTools }
}, [messages])
```

### Agrupamento de Texto
```typescript
// Evita múltiplas divs para texto consecutivo
groupTextBlocks([
  { type: 'text', content: 'A' },
  { type: 'text', content: 'B' },
  { type: 'tool', ... }
])
// Retorna:
[
  { type: 'text', content: 'A\n\nB' },  ← Agrupado
  { type: 'tool', ... }
]
```

## 🔌 Integração com API

### Futuro: Retornar blocos direto
```typescript
// route.ts (futuro)
return result.toUIMessageStreamResponse({
  originalMessages,
  preprocessMessage: (message) => ({
    ...message,
    blocks: uiMessageToBlocks(message)  // Pré-processar
  })
})
```

## 📱 Responsividade

### Mobile
- TextBlock user: 85% da largura
- TextBlock assistant: Adaptável
- ToolBlock: Full width

### Desktop
- TextBlock user: Max 75% com fit-content
- TextBlock assistant: Max 100% - avatar
- ToolBlock: Full width (max-w-3xl)

---

## 🚀 Fluxo Completo do Usuário

```
1. Usuário digita mensagem
                ↓
2. Chat.tsx envia via useChat (transport)
                ↓
3. API route processa e faz streaming
                ↓
4. UIMessage chega com parts
                ↓
5. Messages.tsx renderiza:
   - useMessageBlocks() converte para blocks
   - calcule hasArtifacts, hasPendingTools
                ↓
6. Message.tsx recebe UIMessage:
   - Converte em blocos
   - Agrupa texto (opcional)
   - Renderiza cada bloco
                ↓
7. MessageBlockRenderer renderiza bloco individual:
   - TextBlock → div com markdown
   - ToolBlock → artifact ou loading
   - ThinkingBlock → visível se enabled
                ↓
8. Usuário vê resposta completa com artifacts
```

---

**Arquitetura desenhada com foco em clarity, extensibilidade e performance.**
