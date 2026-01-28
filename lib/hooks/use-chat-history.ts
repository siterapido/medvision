'use client'

/**
 * useChatHistory - Helper hook for chat history revalidation
 *
 * @deprecated Use useHistoryRevalidation from '@/lib/chat' instead
 *
 * This file re-exports from the new location for backwards compatibility.
 */

import { useHistoryRevalidation } from '@/lib/chat'

export function useChatHistory() {
  const { revalidateHistory } = useHistoryRevalidation()

  return {
    revalidateHistory,
  }
}
