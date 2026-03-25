# Refatoração: Message Blocks - Chat com Blocos Estruturados

## 📋 Sumário

Refatoração do sistema de chat para usar **Message Blocks** - uma estrutura organizada que segue os padrões do AI SDK v6 da Vercel.

**Status:** ✅ Concluído

## 🎯 Objetivo

Melhorar a organização e renderização de mensagens do chat agrupando conteúdo em blocos temáticos:
- `TextBlock` - conteúdo textual com markdown
- `ToolBlock` - execução de ferramentas (artifacts, pesquisa, etc)
- `ArtifactBlock` - conteúdo estruturado (código, resumos, etc)
- `ThinkingBlock` - pensamento do modelo

## 📁 Arquivos Criados

### 1. `lib/ai/message-blocks.ts`
Tipos e utilitários para trabalhar com blocos:

```typescript
// Tipos
- TextBlock
- ToolBlock
- ArtifactBlock
- ThinkingBlock
- MessageBlock (union)

// Funções utilitárias
- uiMessageToBlocks() - converte UIMessage em blocos
- groupTextBlocks() - agrupa blocos de texto consecutivos
- filterBlocks() - filtra por tipo
- hasArtifacts() - verifica se há artifacts
- hasPendingTools() - verifica se há tools pendentes
```

### 2. `lib/hooks/use-message-blocks.ts`
Hook React para gerenciar blocks com otimização:

```typescript
useMessageBlocks(messages)
└── state
    ├── messages: UIMessage[]
    ├── blocksByMessageId: Map<string, MessageBlock[]>
    ├── hasArtifacts: boolean
    ├── hasPendingTools: boolean
└── getBlocks(messageId) - obter blocos brutos
└── getGroupedBlocks(messageId) - obter blocos agrupados

useIncrementalMessageBlocks() - renderização incremental
```

### 3. `docs/MESSAGE_BLOCKS.md`
Documentação completa da arquitetura.

## 🔄 Arquivos Modificados

### `components/chat/message.tsx`
- ✅ Importa `message-blocks.ts`
- ✅ Novo componente `MessageBlockRenderer()` renderiza blocos
- ✅ Novo componente `renderToolBlock()` para tool invocations
- ✅ Refatorado `Message()` para converter em blocos
- ✅ Mantém compatibilidade com UIMessage legacy

**Fluxo:**
```
UIMessage
  ↓
uiMessageToBlocks() → MessageBlock[]
  ↓
groupTextBlocks() → otimizados
  ↓
MessageBlockRenderer para cada bloco
```

### `components/chat/messages.tsx`
- ✅ Importa `use-message-blocks.ts`
- ✅ Usa hook `useMessageBlocks(messages)`
- ✅ Calcula estado global (artifacts, pending tools)
- ✅ Debug info em modo desenvolvimento

## 🚀 Como Usar

### Renderizar mensagens com blocos
```tsx
import { Message } from '@/components/chat/message'

// Message agora renderiza blocos automaticamente
<Message
  message={uiMessage}
  isLoading={false}
  onEdit={handleEdit}
  onRegenerate={handleRegenerate}
/>
```

### Acessar blocos manualmente
```tsx
import { useMessageBlocks } from '@/lib/hooks/use-message-blocks'

function MyComponent({ messages }) {
  const { state, getGroupedBlocks } = useMessageBlocks(messages)

  return messages.map(msg => {
    const blocks = getGroupedBlocks(msg.id)
    // Use blocks aqui
  })
}
```

### Converter UIMessage em blocos
```tsx
import { uiMessageToBlocks, groupTextBlocks } from '@/lib/ai/message-blocks'

const blocks = uiMessageToBlocks(message)
const grouped = groupTextBlocks(blocks)
```

## 📊 Estrutura antes vs depois

### Antes (UIMessage com parts)
```
{
  id: "msg-123",
  role: "assistant",
  parts: [
    { type: 'text', text: 'Aqui está um resumo...' },
    { type: 'tool-createDocument', state: 'done', output: {...} },
    { type: 'text', text: 'Espero ter ajudado.' }
  ]
}
```

Problemas:
- ❌ Difícil verificar se há artifacts
- ❌ Difícil agrupar conteúdo
- ❌ Renderização de tool parts misturada com texto

### Depois (com Message Blocks)
```
{
  id: "msg-123",
  role: "assistant",
  parts: [...],
  blocks: [
    { type: 'text', content: 'Aqui está um resumo...', role: 'assistant' },
    { type: 'tool', toolName: 'createDocument', state: 'done', output: {...} },
    { type: 'text', content: 'Espero ter ajudado.', role: 'assistant' }
  ]
}
```

Vantagens:
- ✅ Estrutura clara
- ✅ Fácil verificar estado (`hasArtifacts()`, `hasPendingTools()`)
- ✅ Blocos agrupados por tipo
- ✅ Renderização mais limpa

## 🔧 Próximos Passos

### Curto Prazo
- [ ] Testar renderização com mensagens reais
- [ ] Remover debug info do `Messages.tsx` em produção
- [ ] Adicionar testes unitários para `message-blocks.ts`

### Médio Prazo
- [ ] Otimizar API route para retornar blocos estruturados
- [ ] Implementar streaming incremental de blocos
- [ ] Cache de blocos para sessões longas

### Longo Prazo
- [ ] Deprecate antiga estrutura de parts
- [ ] Migrar completamente para BlockMessage
- [ ] Suporte a custom block types

## 💡 Notas Técnicas

### Performance
- `useMessageBlocks()` usa `useMemo` para evitar recálculos
- `groupTextBlocks()` otimiza re-renders agrupando texto
- Map cache em estado para acesso O(1)

### Compatibilidade
- ✅ Mantém suporte a UIMessage sem blocos
- ✅ Fallback para renderização legacy se blocos vazios
- ✅ Não quebra mensagens existentes

### AI SDK v6
Alinhado com padrões da Vercel:
- Use `UIMessage` para persistência
- Converter para blocos na renderização
- Estrutura clara de tipos

## 📝 Exemplo Completo

```tsx
import { useChat } from '@ai-sdk/react'
import { Messages } from '@/components/chat/messages'
import { useMessageBlocks } from '@/lib/hooks/use-message-blocks'

export function Chat() {
  const { messages, status } = useChat({
    api: '/api/chat'
  })

  // Opcional: acessar blocos
  const { state } = useMessageBlocks(messages)
  console.log('Há artifacts?', state.hasArtifacts)
  console.log('Há tools pendentes?', state.hasPendingTools)

  return (
    <Messages
      messages={messages}
      status={status}
      // ...
    />
  )
}
```

## 🎓 Aprendizados

1. **Separação de Concerns**: Cada bloco tem responsabilidade clara
2. **Composição sobre Herança**: Blocos são compostos, não herdados
3. **Backward Compatibility**: Importante manter suporte a UIMessage legacy
4. **Otimização**: `useMemo` e memoização crucial para performance
5. **Type Safety**: Union types (`MessageBlock`) mais seguro que `any`

---

**Refatoração concluída com sucesso!** 🎉
