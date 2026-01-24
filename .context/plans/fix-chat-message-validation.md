---
status: ready
generated: 2026-01-24
priority: critical
agents:
  - type: "bug-fixer"
    role: "Corrigir validação de mensagens no chat"
phases:
  - id: "phase-1"
    name: "Diagnóstico"
    prevc: "P"
  - id: "phase-2"
    name: "Implementação"
    prevc: "E"
  - id: "phase-3"
    name: "Validação"
    prevc: "V"
---

# Correção do Erro de Validação de Mensagens no Chat

> Corrigir erro de validação Zod no envio da segunda mensagem do chat, onde o índice 2 do array está malformado (content: undefined)

## Task Snapshot

- **Primary goal:** Corrigir o erro de validação que impede o envio da segunda mensagem do usuário no chat
- **Success signal:** Conversas com múltiplas mensagens funcionam sem erros de validação
- **Key references:**
  - `app/api/chat/route.ts` - Rota da API de chat
  - `components/dashboard/odonto-ai-chat.tsx` - Componente principal de chat
  - AI SDK v6 docs - Formato UIMessage com parts array

## Diagnóstico do Problema

### Erro Identificado

```
Invalid input: expected string, received undefined
path: ["input", 2, "content"]
```

O erro ocorre na **terceira mensagem** (índice 2) do array `messages` enviado para a API `/api/chat`. O validador Zod do AI SDK tenta encaixar o objeto em vários formatos (`user`, `system`, `assistant`, etc.) mas falha em todos.

### Análise da Causa Raiz

#### 1. Incompatibilidade de Formato de Mensagens

O AI SDK v6 (`ai@6.0.49`) usa o novo formato `UIMessage` com array `parts`:

```typescript
// Formato CORRETO (v6)
const uiMessage: UIMessage = {
  id: '1',
  role: 'user',
  parts: [{ type: 'text', text: 'Olá!' }],
}
```

O formato antigo com `content` direto **não é mais válido**:

```typescript
// Formato INCORRETO (v4 legado)
const message = {
  id: '1',
  role: 'user',
  content: 'Olá!', // ERRO: deprecado!
}
```

#### 2. Fluxo do Problema

```
1. Usuário envia primeira mensagem (índice 0) - OK
2. Assistente responde (índice 1) - OK
3. Usuário envia segunda mensagem (índice 2) - FALHA
```

A terceira mensagem (segunda do usuário) está chegando com estrutura corrompida.

#### 3. Arquivos Envolvidos

| Arquivo | Função | Problema Potencial |
|---------|--------|-------------------|
| `components/dashboard/odonto-ai-chat.tsx:127` | Chat principal | Usa `sendMessage({ text })` |
| `app/api/chat/route.ts:180` | API handler | `convertToModelMessages(messages)` |

### Hipóteses de Falha

**Hipótese A: Tool Invocation Malformada**
Quando o assistente usa uma tool (ex: `createSummary`), a resposta inclui `tool-invocation` parts. Se o estado intermediário (`state: 'call'`) for reenviado sem `result`, pode quebrar a validação.

**Hipótese B: Mensagem com Parts Vazias**
Uma mensagem pode ter `parts: []` (array vazio) ou `parts: [{ type: 'text', text: undefined }]`.

**Hipótese C: Mensagem do Assistente Incompleta**
A resposta do assistente (índice 1) pode não ter sido finalizada corretamente, deixando uma estrutura parcial.

---

## Plano de Correção

### Fase 1: Diagnóstico (Logging)

**Objetivo**: Identificar exatamente qual mensagem está malformada.

#### Tarefa 1.1: Adicionar logging na API

Arquivo: `app/api/chat/route.ts`

Adicionar antes da linha 180 (`convertToModelMessages`):

```typescript
// DEBUG: Log estrutura das mensagens
console.log('[Chat Debug] Messages count:', messages.length)
messages.forEach((msg, i) => {
  console.log(`[Chat Debug] Message[${i}]:`, {
    id: msg.id,
    role: msg.role,
    hasParts: !!msg.parts,
    partsLength: msg.parts?.length,
    partsTypes: msg.parts?.map(p => p.type),
    hasContent: 'content' in msg,
  })
})
```

---

### Fase 2: Implementação

#### Tarefa 2.1: Criar função de sanitização

Criar arquivo: `lib/ai/sanitize-messages.ts`

```typescript
import { UIMessage } from 'ai'

/**
 * Sanitiza array de UIMessages para garantir formato válido para AI SDK v6.
 *
 * Problemas tratados:
 * - Mensagens sem parts (converte content legado)
 * - Parts com text undefined
 * - Tool invocations órfãs (state: 'call' sem resultado)
 * - Mensagens completamente vazias
 */
export function sanitizeUIMessages(messages: UIMessage[]): UIMessage[] {
  return messages
    .filter((msg) => {
      // Remover mensagens inválidas
      if (!msg || !msg.id || !msg.role) {
        console.warn('[sanitizeUIMessages] Removendo mensagem inválida:', msg)
        return false
      }
      return true
    })
    .map((msg, index) => {
      // Se não tem parts, tentar recuperar de content legado
      if (!msg.parts || msg.parts.length === 0) {
        const legacyContent = (msg as any).content
        if (typeof legacyContent === 'string' && legacyContent.trim()) {
          console.warn(`[sanitizeUIMessages] Convertendo content legado em message[${index}]`)
          return {
            ...msg,
            parts: [{ type: 'text' as const, text: legacyContent }],
          }
        }
        // Mensagem vazia - adicionar placeholder para não quebrar
        console.warn(`[sanitizeUIMessages] Mensagem vazia em [${index}], adicionando placeholder`)
        return {
          ...msg,
          parts: [{ type: 'text' as const, text: '' }],
        }
      }

      // Filtrar parts inválidas
      const validParts = msg.parts.filter((part) => {
        if (part.type === 'text') {
          // Aceitar text vazio mas não undefined
          return part.text !== undefined
        }
        if (part.type === 'tool-invocation') {
          const ti = part.toolInvocation
          if (!ti) return false
          // Manter tool results, remover calls órfãos no histórico
          if (ti.state === 'call') {
            // Se é mensagem do assistente no histórico (não a última), pode ser órfã
            const isLastMessage = index === messages.length - 1
            if (!isLastMessage && msg.role === 'assistant') {
              console.warn(`[sanitizeUIMessages] Removendo tool call órfão em [${index}]`)
              return false
            }
          }
          return true
        }
        // Outros tipos (reasoning, source, file, etc) - manter
        return true
      })

      // Se ficou sem parts válidas após filtro
      if (validParts.length === 0) {
        return {
          ...msg,
          parts: [{ type: 'text' as const, text: '' }],
        }
      }

      return { ...msg, parts: validParts }
    })
}
```

#### Tarefa 2.2: Aplicar sanitização na rota da API

Arquivo: `app/api/chat/route.ts`

1. Adicionar import no topo:
```typescript
import { sanitizeUIMessages } from '@/lib/ai/sanitize-messages'
```

2. Modificar antes de `convertToModelMessages` (linha ~180):
```typescript
// Sanitizar mensagens antes de converter
const sanitizedMessages = sanitizeUIMessages(messages)

// Log para debug (remover em produção)
if (sanitizedMessages.length !== messages.length) {
  console.warn(`[Chat] Sanitização removeu ${messages.length - sanitizedMessages.length} mensagens`)
}

// Convert UI messages to model messages
const modelMessages = await convertToModelMessages(sanitizedMessages)
```

---

### Fase 3: Validação

#### Testes Manuais

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 1 | Enviar primeira mensagem | Resposta normal |
| 2 | Enviar segunda mensagem | **Sem erro de validação** |
| 3 | Conversa longa (5+ mensagens) | Todas funcionam |
| 4 | Usar tool (pedir resumo) | Tool executa e responde |
| 5 | Mensagem após tool call | Funciona normalmente |
| 6 | Carregar histórico anterior | Sessão carrega sem erros |

#### Verificações de Log

- [ ] Nenhum erro `Invalid input: expected string, received undefined`
- [ ] Warnings de sanitização aparecem quando necessário
- [ ] `convertToModelMessages` recebe array válido

---

## Arquivos a Modificar

| Arquivo | Ação | Linhas |
|---------|------|--------|
| `lib/ai/sanitize-messages.ts` | **CRIAR** | ~70 linhas |
| `app/api/chat/route.ts` | **MODIFICAR** | +10 linhas |

## Rollback

Se a correção causar problemas:

```bash
# Reverter alterações
git checkout app/api/chat/route.ts
rm lib/ai/sanitize-messages.ts
```

## Métricas de Sucesso

- [ ] Segunda mensagem enviada sem erro de validação
- [ ] Conversas longas (5+ mensagens) funcionam
- [ ] Tool calls não quebram o fluxo
- [ ] Histórico de sessões anteriores carrega corretamente
- [ ] Nenhuma regressão em funcionalidades existentes
