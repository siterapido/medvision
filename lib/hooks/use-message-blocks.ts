/**
 * Hook para gerenciar blocos de mensagem com melhor estado
 *
 * Refactor do useChat para suportar message blocks estruturados.
 */

import { useMemo, useCallback } from 'react'
import type { UIMessage } from 'ai'
import {
  uiMessageToBlocks,
  groupTextBlocks,
  hasArtifacts,
  hasPendingTools,
  type MessageBlock,
} from '@/lib/ai/message-blocks'

export interface MessageBlocksState {
  messages: UIMessage[]
  blocksByMessageId: Map<string, MessageBlock[]>
  hasArtifacts: boolean
  hasPendingTools: boolean
}

export interface UseMessageBlocksReturn {
  state: MessageBlocksState
  getBlocks: (messageId: string) => MessageBlock[]
  getGroupedBlocks: (messageId: string) => MessageBlock[]
}

/**
 * Hook para converter e agrupar message blocks
 * Otimiza renderização evitando recálculos
 */
export function useMessageBlocks(messages: UIMessage[]): UseMessageBlocksReturn {
  const state = useMemo<MessageBlocksState>(() => {
    const blocksByMessageId = new Map<string, MessageBlock[]>()
    let totalArtifacts = false
    let totalPendingTools = false

    for (const message of messages) {
      const blocks = uiMessageToBlocks(message)
      blocksByMessageId.set(message.id, blocks)

      if (hasArtifacts(blocks)) totalArtifacts = true
      if (hasPendingTools(blocks)) totalPendingTools = true
    }

    return {
      messages,
      blocksByMessageId,
      hasArtifacts: totalArtifacts,
      hasPendingTools: totalPendingTools,
    }
  }, [messages])

  const getBlocks = useCallback(
    (messageId: string) => {
      return state.blocksByMessageId.get(messageId) || []
    },
    [state.blocksByMessageId]
  )

  const getGroupedBlocks = useCallback(
    (messageId: string) => {
      const blocks = state.blocksByMessageId.get(messageId) || []
      return groupTextBlocks(blocks)
    },
    [state.blocksByMessageId]
  )

  return {
    state,
    getBlocks,
    getGroupedBlocks,
  }
}

/**
 * Hook para gerenciar renderização incremental de blocos
 * Útil para grandes mensagens
 */
export function useIncrementalMessageBlocks(
  messageId: string,
  blocks: MessageBlock[],
  visibleCount: number = 10
) {
  const visibleBlocks = useMemo(() => {
    return blocks.slice(0, visibleCount)
  }, [blocks, visibleCount])

  const hasMore = useMemo(() => {
    return blocks.length > visibleCount
  }, [blocks.length, visibleCount])

  return { visibleBlocks, hasMore, total: blocks.length }
}
