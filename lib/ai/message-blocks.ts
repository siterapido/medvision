/**
 * Message Blocks - Structured organization of message content
 *
 * Organiza mensagens em blocos temáticos para melhor UX e controle de estado.
 * Seguindo padrões do AI SDK v6.
 */

import type { UIMessage } from 'ai'

/**
 * Text Block - Conteúdo textual com markdown
 */
export interface TextBlock {
  type: 'text'
  content: string
  role: 'user' | 'assistant'
}

/**
 * Tool Invocation Block - Ferramenta sendo executada
 */
export interface ToolBlock {
  type: 'tool'
  toolName: string
  state: 'streaming' | 'input-streaming' | 'input-available' | 'output-available' | 'done' | 'error'
  input?: any
  output?: any
  error?: string
}

/**
 * Artifact Block - Conteúdo estruturado (código, resumo, quiz, etc)
 */
export interface ArtifactBlock {
  type: 'artifact'
  kind: 'summary' | 'code' | 'flashcards' | 'quiz' | 'table' | 'research' | 'report' | 'image'
  title: string
  content: any
  metadata?: Record<string, any>
}

/**
 * Thinking Block - Pensamento do modelo (se disponível)
 */
export interface ThinkingBlock {
  type: 'thinking'
  content: string
  visible?: boolean
}

export type MessageBlock = TextBlock | ToolBlock | ArtifactBlock | ThinkingBlock

/**
 * Estrutura melhorada de mensagem com blocos
 */
export interface BlockMessage extends UIMessage {
  blocks: MessageBlock[]
}

/**
 * Converter UIMessage para blocos estruturados
 */
export function uiMessageToBlocks(message: UIMessage): MessageBlock[] {
  const blocks: MessageBlock[] = []

  if (!message.parts) return blocks

  for (const part of message.parts) {
    if (typeof part !== 'object') continue

    // Text block
    if (part.type === 'text' && 'text' in part) {
      blocks.push({
        type: 'text',
        content: part.text,
        role: message.role,
      })
      continue
    }

    // Tool block
    if (part.type.startsWith('tool-')) {
      const toolName = part.type.replace('tool-', '')
      blocks.push({
        type: 'tool',
        toolName,
        state: part.state || 'done',
        input: part.input,
        output: part.output,
        error: part.error,
      })
      continue
    }
  }

  return blocks
}

/**
 * Group consecutive text blocks (para otimização de render)
 */
export function groupTextBlocks(blocks: MessageBlock[]): MessageBlock[] {
  const grouped: MessageBlock[] = []
  let currentText = ''

  for (const block of blocks) {
    if (block.type === 'text') {
      currentText += (currentText ? '\n\n' : '') + block.content
    } else {
      if (currentText) {
        grouped.push({
          type: 'text',
          content: currentText,
          role: 'assistant',
        })
        currentText = ''
      }
      grouped.push(block)
    }
  }

  if (currentText) {
    grouped.push({
      type: 'text',
      content: currentText,
      role: 'assistant',
    })
  }

  return grouped
}

/**
 * Filter blocks by type
 */
export function filterBlocks<T extends MessageBlock['type']>(
  blocks: MessageBlock[],
  type: T
): Extract<MessageBlock, { type: T }>[] {
  return blocks.filter((b): b is Extract<MessageBlock, { type: T }> => b.type === type)
}

/**
 * Get first text block
 */
export function getFirstTextBlock(blocks: MessageBlock[]): TextBlock | null {
  return filterBlocks(blocks, 'text')[0] || null
}

/**
 * Check if message has any artifacts
 */
export function hasArtifacts(blocks: MessageBlock[]): boolean {
  return blocks.some((b) => b.type === 'artifact')
}

/**
 * Check if message has pending tool execution
 */
export function hasPendingTools(blocks: MessageBlock[]): boolean {
  return blocks.some(
    (b) =>
      b.type === 'tool' &&
      (b.state === 'streaming' || b.state === 'input-streaming' || b.state === 'input-available')
  )
}
