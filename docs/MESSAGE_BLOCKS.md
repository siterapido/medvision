# Message Blocks Architecture

## Visão Geral

O sistema de **Message Blocks** reorganiza o chat para usar uma estrutura mais clara e eficiente, seguindo os padrões do AI SDK v6.

### Antes (Legacy)
```
UIMessage
└── parts[]
    ├── { type: 'text', text: '...' }
    ├── { type: 'tool-createDocument', state: 'done', output: {...} }
    └── { type: 'text', text: '...' }
```

### Depois (Message Blocks)
```
UIMessage
└── blocks[]
    ├── { type: 'text', content: '...', role: 'assistant' }
    ├── { type: 'tool', toolName: 'createDocument', state: 'done', output: {...} }
    └── { type: 'text', content: '...', role: 'assistant' }
```

## Tipos de Blocos

### TextBlock
```typescript
{
  type: 'text'
  content: string
  role: 'user' | 'assistant'
}
```

Renderizado como:
- **User**: Bolha azul alinhada à direita
- **Assistant**: Texto com markdown alinhado à esquerda

### ToolBlock
```typescript
{
  type: 'tool'
  toolName: string
  state: 'streaming' | 'input-streaming' | 'input-available' | 'output-available' | 'done' | 'error'
  input?: any
  output?: any
  error?: string
}
```

Estados:
- `streaming`: Ferramenta em execução (mostra spinner)
- `input-available`: Aguardando aprovação do usuário
- `output-available` / `done`: Resultado pronto para renderização
- `error`: Erro na execução

### ArtifactBlock
```typescript
{
  type: 'artifact'
  kind: 'summary' | 'code' | 'flashcards' | 'quiz' | 'table' | 'research' | 'report' | 'image'
  title: string
  content: any
  metadata?: Record<string, any>
}
```

### ThinkingBlock
```typescript
{
  type: 'thinking'
  content: string
  visible?: boolean
}
```

## Componentes Afetados

### `Message` (chat/message.tsx)
- Agora converte `UIMessage` em blocos usando `uiMessageToBlocks()`
- Renderiza blocos através de `MessageBlockRenderer`
- Mantém compatibilidade com mensagens legacy (sem blocos)

### `Messages` (chat/messages.tsx)
- Usa novo hook `useMessageBlocks()`
- Calcula estado global: artifacts presentes, tools pendentes
- Debug info em modo desenvolvimento

## Hooks Novos

### `useMessageBlocks(messages)`
```typescript
const { state, getBlocks, getGroupedBlocks } = useMessageBlocks(messages)

// state.blocksByMessageId: Map<messageId, blocks[]>
// state.hasArtifacts: boolean
// state.hasPendingTools: boolean

// Obter blocos de uma mensagem
const blocks = getBlocks(messageId)

// Obter blocos agrupados (text blocks consecutivos merged)
const grouped = getGroupedBlocks(messageId)
```

## Utilitários (`lib/ai/message-blocks.ts`)

### `uiMessageToBlocks(message: UIMessage): MessageBlock[]`
Converte uma `UIMessage` em array de blocos estruturados.

### `groupTextBlocks(blocks: MessageBlock[]): MessageBlock[]`
Agrupa blocos de texto consecutivos para otimização de render.

### `filterBlocks<T>(blocks, type): T[]`
Filtra blocos por tipo.

### `hasArtifacts(blocks): boolean`
Verifica se há artifacts.

### `hasPendingTools(blocks): boolean`
Verifica se há tools aguardando execução.

## Exemplo de Uso

```tsx
import { useMessageBlocks } from '@/lib/hooks/use-message-blocks'

function ChatMessages({ messages }) {
  const { state, getGroupedBlocks } = useMessageBlocks(messages)

  return (
    <div>
      {messages.map((msg) => {
        const blocks = getGroupedBlocks(msg.id)
        return (
          <Message
            key={msg.id}
            message={msg}
            blocks={blocks}
            hasArtifacts={state.hasArtifacts}
            hasPendingTools={state.hasPendingTools}
          />
        )
      })}
    </div>
  )
}
```

## Fluxo de Renderização

```
Message (UIMessage)
  ↓
  uiMessageToBlocks() → MessageBlock[]
  ↓
  groupTextBlocks() → MessageBlock[] (otimizado)
  ↓
  MessageBlockRenderer para cada bloco
  ├─ TextBlock → renderiza markdown/texto
  ├─ ToolBlock → renderiza tool execution
  ├─ ArtifactBlock → renderiza artifact
  └─ ThinkingBlock → renderiza thinking (se visível)
```

## Benefícios

✅ **Estrutura clara**: Cada bloco tem responsabilidade bem definida
✅ **Otimização**: Blocos de texto agrupados reduzem re-renders
✅ **Extensibilidade**: Fácil adicionar novos tipos de blocos
✅ **Debugging**: Estado mais transparente
✅ **Compatibility**: Mantém suporte a UIMessage legacy
✅ **AI SDK v6**: Alinhado com padrões da Vercel

## Migração Gradual

1. ✅ Criar `message-blocks.ts` com tipos
2. ✅ Criar `use-message-blocks.ts` com hook
3. ✅ Refatorar `Message` para usar blocos
4. ✅ Refatorar `Messages` para usar hook
5. Próximos: Otimizar API route para retornar blocos diretos
6. Próximos: Suporte a streaming incremental de blocos

## Notas

- Compatibilidade com UIMessage mantida para transição suave
- Legacy `renderToolPart()` ainda disponível como fallback
- Em produção, remover debug info do `Messages.tsx`
- Considerar cache de blocos em sessões longas
