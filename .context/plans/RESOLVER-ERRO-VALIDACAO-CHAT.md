# Plano: Resolver Erro de Validação do Chat

**ID do Problema**: `a88a13289901aeb1.js:10`  
**Severidade**: 🔴 CRÍTICA - Impede completamente o envio de mensagens no chat  
**Data**: 2026-01-23

---

## 📋 Sumário Executivo

O chat está retornando um erro de validação Zod ao tentar enviar mensagens. O erro indica uma incompatibilidade entre o schema esperado pelo `@ai-sdk/react` (useChat) e os dados retornados pela API `/api/newchat/route.ts`.

### Erro Principal:
```
Invalid input: expected string, received array
```

O erro sugere que a API está retornando dados em formato de **array** quando o SDK espera uma **string** ou formato específico de mensagem.

---

## 🔍 Análise do Problema

### 1. **Origem do Erro**
- **Componente Frontend**: `components/dashboard/odonto-ai-chat.tsx` (linha 52-67)
- **API Backend**: `/app/api/newchat/route.ts` (linha 194)
- **Biblioteca**: `@ai-sdk/react` v3.0.50 + `ai` v6.0.48

### 2. **Ponto de Falha**
A falha ocorre quando:
1. Usuário envia mensagem via `sendMessage()`
2. Frontend chama `/api/newchat` via `DefaultChatTransport`
3. Backend responde com `result.toUIMessageStreamResponse()`
4. SDK tenta validar a resposta contra o schema esperado
5. **FALHA**: Formato não corresponde ao schema Zod interno

### 3. **Schema Esperado vs Recebido**

**Esperado** (baseado no erro):
```typescript
{
  type: "message",
  role: "user" | "assistant" | "system" | "developer",
  content: string | Array<ContentPart>
}
```

**Recebido** (provável):
```typescript
[
  // Array de mensagens ou parts
  { ... }
]
```

---

## 🎯 Hipóteses de Causa

### Hipótese #1: Versão Incompatível do AI SDK ✅ MAIS PROVÁVEL
- **Versão atual**: `ai@6.0.48`, `@ai-sdk/react@3.0.50`
- **Problema**: Breaking changes entre versões do SDK
- **Solução**: Atualizar para versão estável mais recente

### Hipótese #2: Formato de Mensagem Incorreto
- **Problema**: Frontend envia mensagens com `parts` mas API retorna formato diferente
- **Linha**: `odonto-ai-chat.tsx:138-142`
```typescript
sendMessage({
  role: 'user',
  parts: [{ type: 'text', text: input }],
  experimental_attachments
} as any)
```
- **Solução**: Garantir consistência entre envio e recebimento

### Hipótese #3: Conflito entre DefaultChatTransport e toUIMessageStreamResponse
- **Problema**: `DefaultChatTransport` espera formato UI Message Stream v6
- **API retorna**: `toUIMessageStreamResponse()` pode estar usando protocolo antigo
- **Solução**: Ajustar método de resposta ou transport

---

## 🛠️ Plano de Ação

### **FASE 1: Diagnóstico Detalhado** (Tempo: 15 min)

#### Tarefa 1.1: Adicionar Logs de Debug
**Arquivo**: `/app/api/newchat/route.ts`

**Ação**: Adicionar logs antes do retorno para inspecionar estrutura:
```typescript
// Linha ~193, antes de return result.toUIMessageStreamResponse()
const debugResponse = await result.debug();
console.log("[DEBUG] StreamText Result:", JSON.stringify(debugResponse, null, 2));
```

#### Tarefa 1.2: Inspecionar Resposta no Browser
**Ação**: 
1. Abrir DevTools → Network
2. Enviar mensagem "ola"
3. Capturar response de `/api/newchat`
4. Verificar formato exato do JSON/Stream

#### Tarefa 1.3: Verificar Docs do AI SDK
**Ação**: Consultar changelog entre v6.0.0 e v6.0.48
- URL: https://sdk.vercel.ai/docs/changelog
- Buscar: "breaking changes", "toUIMessageStreamResponse"

---

### **FASE 2: Correção Primária** (Tempo: 30 min)

#### **Opção A: Atualizar AI SDK** (Recomendado ⭐)

**Reasoning**: Versão v6.0.48 pode ter bugs conhecidos

**Passos**:
```bash
npm update ai @ai-sdk/react @ai-sdk/openai
npm install
```

**Validação**:
- Verificar se versões são compatíveis
- Testar envio de mensagem simples

---

#### **Opção B: Ajustar Formato de Mensagem no Frontend**

**Arquivo**: `components/dashboard/odonto-ai-chat.tsx`

**Problema Identificado**: Linha 54-57
```typescript
messages: initialMessages?.map(m => ({
  ...m,
  parts: m.parts || [{ type: 'text', text: m.content || "" }]
})) as any || [],
```

**Correção**:
```typescript
messages: initialMessages?.map(m => {
  // Normalizar para formato UIMessage padrão
  if (m.content && typeof m.content === 'string') {
    return {
      id: m.id || crypto.randomUUID(),
      role: m.role,
      content: m.content,
      createdAt: m.createdAt || new Date()
    };
  }
  return m;
}) || [],
```

---

#### **Opção C: Ajustar Formato de Resposta no Backend**

**Arquivo**: `/app/api/newchat/route.ts`

**Problema**: `toUIMessageStreamResponse()` pode estar retornando formato errado

**Correção**: Usar método explícito de stream
```typescript
// Em vez de:
return result.toUIMessageStreamResponse()

// Usar:
return result.toDataStreamResponse({
  getErrorMessage: (error) => error.message,
});
```

---

### **FASE 3: Correção Estrutural** (Tempo: 45 min)

#### Tarefa 3.1: Padronizar Schema de Mensagens

**Criar**: `/lib/ai/message-schema.ts`
```typescript
import { z } from 'zod';

export const MessagePartSchema = z.union([
  z.object({
    type: z.literal('text'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('image'),
    image: z.string(), // URL ou base64
  }),
]);

export const UIMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system', 'developer']),
  content: z.union([
    z.string(),
    z.array(MessagePartSchema),
  ]),
  createdAt: z.date().optional(),
});

export type UIMessage = z.infer<typeof UIMessageSchema>;
```

#### Tarefa 3.2: Validar Mensagens na API
**Arquivo**: `/app/api/newchat/route.ts` (linha 38)

```typescript
import { UIMessageSchema } from '@/lib/ai/message-schema';

// Validar cada mensagem
const validatedMessages = messages.map(msg => {
  const result = UIMessageSchema.safeParse(msg);
  if (!result.success) {
    console.error('[Validation Error]', result.error);
    throw new Error(`Invalid message format: ${result.error.message}`);
  }
  return result.data;
});
```

---

### **FASE 4: Remover Código Legacy** (Tempo: 20 min)

#### Tarefa 4.1: Avaliar necessidade de CopilotKit

**Arquivo**: `/app/api/copilotkit/chat/route.ts`

**Questão**: Este endpoint está sendo usado?

**Ação**:
1. Buscar referências no código: `grep -r "copilotkit" components/`
2. Se não usado, remover dependências:
```bash
npm uninstall @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime
```

#### Tarefa 4.2: Limpar Tipos "any"

**Arquivos**:
- `odonto-ai-chat.tsx`: Linhas 52, 142
- `route.ts`: Linha 54

**Substituir**:
```typescript
// Antes
const { messages, sendMessage } = useChat({ ... } as any)

// Depois
const { messages, sendMessage } = useChat<UIMessage>({ ... })
```

---

## 🧪 Testes de Validação

### Teste 1: Mensagem Simples
```typescript
Input: "olá"
Expected: Resposta sem erro
Validation: Console sem erros Zod
```

### Teste 2: Mensagem com Anexo
```typescript
Input: "olá" + arquivo.pdf
Expected: Upload + resposta
Validation: Attachment processado
```

### Teste 3: Conversa Contínua
```typescript
Input: "olá" → "como vai?" → "obrigado"
Expected: 3 respostas consecutivas
Validation: chatId mantido, histórico preservado
```

### Teste 4: Troca de Agente
```typescript
Input: Trocar de "odonto-gpt" para outro agente
Expected: Contexto resetado
Validation: Novo agentId na API
```

---

## 📊 Critérios de Sucesso

- ✅ Chat aceita mensagens sem erro de validação
- ✅ Histórico é salvo corretamente no Supabase
- ✅ Múltiplas mensagens funcionam sequencialmente
- ✅ Console limpo (sem erros Zod)
- ✅ Tipos TypeScript corretos (sem `as any`)

---

## 🚨 Rollback Plan

Se as correções causarem novos problemas:

1. **Reverter versões do AI SDK**:
```bash
npm install ai@6.0.48 @ai-sdk/react@3.0.50 --save-exact
```

2. **Restaurar código original**:
```bash
git checkout HEAD -- components/dashboard/odonto-ai-chat.tsx
git checkout HEAD -- app/api/newchat/route.ts
```

3. **Usar API alternativa temporária**:
- Criar `/api/fallback-chat` com fetch direto OpenRouter
- Bypass do AI SDK completamente

---

## 📚 Recursos e Referências

1. **Vercel AI SDK Docs**: https://sdk.vercel.ai/docs
2. **AI SDK Changelog**: https://sdk.vercel.ai/docs/changelog
3. **OpenRouter API**: https://openrouter.ai/docs
4. **Zod Schema Validation**: https://zod.dev/

---

## 💡 Notas Adicionais

### Observação sobre Edge Runtime
**Linha 17 em route.ts**: `// export const runtime = 'edge'`
- Runtime está comentado (desabilitado)
- **Motivo**: Problemas de estabilidade anteriores
- **Impacto**: Pode afetar streaming performance
- **Ação futura**: Re-habilitar após confirmar estabilidade

### Observação sobre Memória
**Linhas 66-85**: Sistema de memória compartilhada implementado
- Pode estar causando overhead
- **Teste**: Desabilitar temporariamente para isolar problema

---

## ⏱️ Timeline Estimado

| Fase | Tempo | Status |
|------|-------|--------|
| Diagnóstico | 15 min | ⏳ Pendente |
| Correção Primária | 30 min | ⏳ Pendente |
| Correção Estrutural | 45 min | ⏳ Pendente |
| Limpeza Legacy | 20 min | ⏳ Pendente |
| Testes | 30 min | ⏳ Pendente |
| **TOTAL** | **2h 20min** | ⏳ Não iniciado |

---

## 👤 Responsável
- **Assistente**: Antigravity (Google Deepmind)
- **Usuário**: Marcos Alexandre
- **Prioridade**: 🔴 P0 (Crítica - Sistema não funcional)

---

## 🔄 Próximos Passos Imediatos

1. ✅ **Aprovar este plano**
2. ⏳ Executar FASE 1: Diagnóstico
3. ⏳ Escolher melhor opção de correção (A, B ou C)
4. ⏳ Implementar correção
5. ⏳ Validar com testes
6. ⏳ Commit e deploy

---

**Última atualização**: 2026-01-23 10:58 BRT
