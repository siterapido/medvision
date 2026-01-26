'use client'

/**
 * useChatHistory - Helper hook for chat history revalidation
 *
 * Provides utilities to revalidate the sidebar chat history
 * when new sessions are created.
 */

import { useSWRConfig } from 'swr'
import { useCallback } from 'react'

export function useChatHistory() {
  const { mutate } = useSWRConfig()

  /**
   * Revalidate the sidebar chat history
   * Call this when a new session is created
   */
  const revalidateHistory = useCallback(() => {
    // Revalidate all history-related SWR keys
    mutate(
      (key) => typeof key === 'string' && key.startsWith('/api/history'),
      undefined,
      { revalidate: true }
    )
    console.log('[useChatHistory] Revalidated chat history')
  }, [mutate])

  return {
    revalidateHistory,
  }
}
