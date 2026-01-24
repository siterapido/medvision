/**
 * Sanitização de UIMessages para AI SDK v6
 *
 * O AI SDK v6 usa um novo formato de mensagens com array `parts` obrigatório.
 * Esta função garante que mensagens malformadas ou em formato legado
 * sejam convertidas para o formato correto antes de serem processadas.
 */

import type { UIMessage } from 'ai'

/**
 * Tipo para part de texto
 */
interface TextPart {
  type: 'text'
  text: string
}

/**
 * Tipo para part de tool invocation
 */
interface ToolInvocationPart {
  type: 'tool-invocation'
  toolInvocation: {
    toolCallId: string
    toolName: string
    args: unknown
    state: 'call' | 'result' | 'partial-call'
    result?: unknown
  }
}

/**
 * Union type para parts válidas
 */
type ValidPart = TextPart | ToolInvocationPart | { type: string; [key: string]: unknown }

/**
 * Sanitiza um array de UIMessages para garantir formato válido para AI SDK v6.
 *
 * Problemas tratados:
 * - Mensagens sem parts (converte content legado)
 * - Parts com text undefined
 * - Tool invocations órfãs (state: 'call' sem resultado no histórico)
 * - Mensagens completamente vazias
 *
 * @param messages - Array de UIMessages potencialmente malformadas
 * @returns Array de UIMessages sanitizadas
 */
export function sanitizeUIMessages(messages: UIMessage[]): UIMessage[] {
  if (!messages || !Array.isArray(messages)) {
    console.warn('[sanitizeUIMessages] Input inválido, retornando array vazio')
    return []
  }

  const totalMessages = messages.length

  return messages
    .filter((msg, index) => {
      // Remover mensagens inválidas (null, undefined, sem estrutura básica)
      if (!msg) {
        console.warn(`[sanitizeUIMessages] Mensagem nula em [${index}/${totalMessages}]`)
        return false
      }

      if (!msg.id || !msg.role) {
        console.warn(`[sanitizeUIMessages] Mensagem sem id/role em [${index}/${totalMessages}]:`, {
          hasId: !!msg.id,
          hasRole: !!msg.role,
        })
        return false
      }

      return true
    })
    .map((msg, index) => {
      // Se não tem parts ou parts está vazio, tentar recuperar
      if (!msg.parts || msg.parts.length === 0) {
        // Tentar recuperar de content legado (AI SDK v4)
        const legacyContent = (msg as unknown as { content?: string }).content

        if (typeof legacyContent === 'string' && legacyContent.trim()) {
          console.warn(
            `[sanitizeUIMessages] Convertendo content legado em [${index}/${totalMessages}]`
          )
          return {
            ...msg,
            parts: [{ type: 'text' as const, text: legacyContent }],
          }
        }

        // Se também não tem content, adicionar placeholder vazio
        console.warn(
          `[sanitizeUIMessages] Mensagem sem parts/content em [${index}/${totalMessages}], adicionando placeholder`
        )
        return {
          ...msg,
          parts: [{ type: 'text' as const, text: '' }],
        }
      }

      // Filtrar parts inválidas
      const validParts = msg.parts.filter((part: ValidPart) => {
        if (!part || typeof part !== 'object') {
          console.warn(`[sanitizeUIMessages] Part inválida em [${index}/${totalMessages}]`)
          return false
        }

        // Parts de texto - aceitar text vazio mas não undefined
        if (part.type === 'text') {
          const textPart = part as TextPart
          if (textPart.text === undefined) {
            console.warn(
              `[sanitizeUIMessages] Part de texto com text undefined em [${index}/${totalMessages}]`
            )
            return false
          }
          return true
        }

        // Tool invocations
        if (part.type === 'tool-invocation') {
          const toolPart = part as ToolInvocationPart
          const ti = toolPart.toolInvocation

          if (!ti) {
            console.warn(
              `[sanitizeUIMessages] tool-invocation sem toolInvocation em [${index}/${totalMessages}]`
            )
            return false
          }

          // Se é um tool call (state: 'call') no histórico (não a última mensagem),
          // pode ser órfão (sem resultado) e deve ser removido
          if (ti.state === 'call') {
            const isLastMessage = index === totalMessages - 1
            if (!isLastMessage && msg.role === 'assistant') {
              console.warn(
                `[sanitizeUIMessages] Removendo tool call órfão (${ti.toolName}) em [${index}/${totalMessages}]`
              )
              return false
            }
          }

          return true
        }

        // Outros tipos de parts (reasoning, source, file, etc) - manter
        return true
      })

      // Se ficou sem parts válidas após filtro, adicionar placeholder
      if (validParts.length === 0) {
        console.warn(
          `[sanitizeUIMessages] Todas as parts foram removidas em [${index}/${totalMessages}], adicionando placeholder`
        )
        return {
          ...msg,
          parts: [{ type: 'text' as const, text: '' }],
        }
      }

      // Retornar mensagem com parts sanitizadas
      return { ...msg, parts: validParts }
    })
}

/**
 * Valida se um array de UIMessages está no formato correto para AI SDK v6.
 * Útil para debugging sem modificar as mensagens.
 *
 * @param messages - Array de UIMessages para validar
 * @returns Objeto com resultado da validação e erros encontrados
 */
export function validateUIMessages(messages: UIMessage[]): {
  valid: boolean
  errors: Array<{ index: number; message: string }>
} {
  const errors: Array<{ index: number; message: string }> = []

  if (!messages || !Array.isArray(messages)) {
    return { valid: false, errors: [{ index: -1, message: 'Input não é um array válido' }] }
  }

  messages.forEach((msg, index) => {
    if (!msg) {
      errors.push({ index, message: 'Mensagem nula ou undefined' })
      return
    }

    if (!msg.id) {
      errors.push({ index, message: 'Mensagem sem id' })
    }

    if (!msg.role) {
      errors.push({ index, message: 'Mensagem sem role' })
    }

    if (!msg.parts || !Array.isArray(msg.parts)) {
      errors.push({ index, message: 'Mensagem sem array parts' })
    } else if (msg.parts.length === 0) {
      errors.push({ index, message: 'Array parts vazio' })
    } else {
      msg.parts.forEach((part: ValidPart, partIndex: number) => {
        if (!part || typeof part !== 'object') {
          errors.push({ index, message: `Part[${partIndex}] inválida` })
        } else if (part.type === 'text' && (part as TextPart).text === undefined) {
          errors.push({ index, message: `Part[${partIndex}] text é undefined` })
        }
      })
    }
  })

  return { valid: errors.length === 0, errors }
}
