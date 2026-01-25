# Testing Message Blocks - Guia de Teste

## 🧪 Testes Manuais

### 1. Renderização Básica de Mensagens

```bash
# Verificar que as mensagens renderizam sem erros
npm run dev
# Navegue para chat e verifique:
✓ Mensagens do usuário renderizam em bolha azul
✓ Mensagens do assistente renderizam com markdown
✓ Sem erros de console
```

### 2. Debug Info em Desenvolvimento

```bash
# Com NODE_ENV=development (padrão no dev)
npm run dev

# Deve aparecer no Chat:
# "📄 Blocos: 5" (se há artifacts)
# "⏳ Blocos: 3" (se há tools pendentes)
```

### 3. Testar Diferentes Tipos de Mensagens

```javascript
// Mensagem com texto apenas
{
  id: "1",
  role: "user",
  parts: [{ type: "text", text: "Olá!" }]
}
// Esperado: TextBlock renderizado

// Mensagem com artifact
{
  id: "2",
  role: "assistant",
  parts: [
    { type: "text", text: "Aqui está o resumo:" },
    {
      type: "tool-createDocument",
      state: "done",
      output: { id: "d1", title: "Resumo", content: "..." }
    }
  ]
}
// Esperado: TextBlock + ToolBlock/ArtifactBlock

// Mensagem com múltiplos textos
{
  id: "3",
  role: "assistant",
  parts: [
    { type: "text", text: "Primeira parte" },
    { type: "text", text: "Segunda parte" }
  ]
}
// Esperado: Blocos agrupados em um único TextBlock
```

### 4. Verificar Otimizações

```jsx
// No Components -> Messages.tsx debug info
// Verificar que blocksByMessageId usa Map
// Verificar que memoização funciona (não recalcula desnecessariamente)

const { state } = useMessageBlocks(messages)
console.log(state.blocksByMessageId.size) // Deve ser === messages.length
console.log(state.hasArtifacts) // true/false
console.log(state.hasPendingTools) // true/false
```

## 🧬 Testes de Regressão

### Compatibilidade com Mensagens Legacy

```javascript
// Antiga estrutura de parts ainda deve funcionar
const legacyMessage = {
  id: "legacy",
  role: "assistant",
  parts: [
    { type: "text", text: "Conteúdo antigo" }
  ]
}

// Deve renderizar sem erros
// Fallback para renderização legacy ativado
// ✓ Sem breaking changes
```

### Performance

```javascript
// Testar com 50+ mensagens
const manyMessages = Array.from({ length: 50 }, (_, i) => ({
  id: `msg-${i}`,
  role: i % 2 === 0 ? 'user' : 'assistant',
  parts: [{ type: 'text', text: `Message ${i}` }]
}))

// Verificar:
// ✓ Scroll smooth
// ✓ Sem memory leaks
// ✓ useMessageBlocks recalcula eficientemente
```

## 🔍 Verificação de Types

```bash
# Verificar tipos TypeScript
npx tsc --noEmit

# Esperado: Sem erros
# ✓ message-blocks.ts tipos corretos
# ✓ use-message-blocks.ts hook tipado
# ✓ message.tsx MessageBlockRenderer tipado
# ✓ messages.tsx integração tipada
```

## 📋 Checklist de Teste Manual

- [ ] Chat renderiza sem erros
- [ ] Mensagens de usuário aparecem em bolha azul
- [ ] Markdown renderiza corretamente em respostas do assistente
- [ ] Artifacts renderizam quando presentes
- [ ] Múltiplos textos consecutivos são agrupados (1 bloco visual)
- [ ] Debug info aparece em desenvolvimento
- [ ] Scroll funciona suavemente
- [ ] Copy/Edit/Regenerate funcionam
- [ ] Tool approval dialog aparece quando necessário
- [ ] Sem erros de console

## 🔧 Debugging

### Habilitar logs de debug

```typescript
// Adicione em message-blocks.ts
if (process.env.DEBUG_BLOCKS === 'true') {
  console.log('[MessageBlocks]', {
    messageId: message.id,
    blockCount: blocks.length,
    types: blocks.map(b => b.type)
  })
}

// Executar com:
DEBUG_BLOCKS=true npm run dev
```

### Inspecionar blocos no console

```javascript
// Em browser console
import { uiMessageToBlocks } from '@/lib/ai/message-blocks'

// Encontre uma mensagem
const msg = document.querySelector('[data-role="assistant"]')
// Inspecione seus blocos
console.log(window.__lastMessage?.blocks)
```

## 🚨 Problemas Conhecidos e Soluções

### Problema: "key prop is missing"
**Solução:** Usar `blockKey` corretamente em `MessageBlockRenderer`
```typescript
// ❌ Errado
<MessageBlockRenderer block={block} />

// ✅ Correto
<MessageBlockRenderer
  block={block}
  blockKey={`message-${message.id}-block-${index}`}
/>
```

### Problema: Blocos não agrupando
**Solução:** Verificar que `groupTextBlocks()` está sendo chamado
```typescript
// ❌ Errado
const blocks = uiMessageToBlocks(message)

// ✅ Correto (se quiser agrupamento)
const blocks = groupTextBlocks(uiMessageToBlocks(message))
```

### Problema: useMessageBlocks recalculando muito
**Solução:** Verificar que messages está em dependência do useMemo
```typescript
// ✓ Correto - recalcula apenas quando messages muda
const state = useMemo(() => {
  // ... processamento
}, [messages])  // ← dependency array importante
```

## 📊 Métricas a Monitorar

- **Render Performance**
  - Tempo de renderização inicial
  - Tempo de adição de nova mensagem
  - Smooth scrolling

- **Memory Usage**
  - Tamanho do Map `blocksByMessageId`
  - Não deve crescer indefinidamente
  - Cache eficiente

- **Type Safety**
  - Sem `any` types
  - Todos os tipos definidos
  - TypeScript strict mode

## ✅ Teste de Aceitação

```gherkin
Feature: Message Blocks Rendering

Scenario: User message should render in blue bubble
  Given a user message is received
  When the message is rendered
  Then it should display in a blue bubble aligned to the right
  And the text should be plain (no markdown)

Scenario: Assistant message with markdown should be rendered
  Given an assistant message with markdown
  When the message is rendered
  Then markdown should be properly formatted
  And the message should be aligned to the left
  And avatar icon should appear

Scenario: Message with tool invocation should show artifact
  Given a message with tool-createDocument output
  When the message is rendered
  Then artifact should be visible
  And tool execution state should be displayed
  And artifact content should be interactive

Scenario: Consecutive text blocks should be grouped
  Given multiple consecutive text blocks
  When blocks are processed with groupTextBlocks()
  Then they should be merged into single TextBlock
  And rendered as one visual unit
```

## 🎯 Critérios de Sucesso

- ✅ Build passes sem warnings
- ✅ TypeScript tipos corretos
- ✅ Renderização funciona em todas as telas
- ✅ Performance aceitável (60 FPS)
- ✅ Sem memory leaks
- ✅ Backward compatibility mantida
- ✅ Debug info útil em desenvolvimento
- ✅ Documentação completa

---

**Última atualização:** 2026-01-24
