'use client'

/**
 * Hook for lazy-loading message previews on hover
 *
 * Fetches the last few messages of a chat when the user hovers over it,
 * with caching to avoid repeated requests.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { MessagePreview } from '../types'

interface PreviewData {
  id: string
  title: string
  agentType: string
  createdAt: string
  messages: MessagePreview[]
}

interface UseMessagePreviewOptions {
  /**
   * Delay before fetching preview (ms)
   * @default 300
   */
  delay?: number
  /**
   * Cache duration (ms)
   * @default 30000
   */
  cacheDuration?: number
}

interface UseMessagePreviewReturn {
  /** Preview messages */
  messages: MessagePreview[]
  /** Whether the preview is loading */
  isLoading: boolean
  /** Error message if fetch failed */
  error: string | null
  /** Start loading preview (call on mouse enter) */
  onMouseEnter: () => void
  /** Cancel loading (call on mouse leave) */
  onMouseLeave: () => void
}

// Global cache for previews
const previewCache = new Map<
  string,
  { data: PreviewData; timestamp: number }
>()

/**
 * Hook for lazy-loading message previews
 */
export function useMessagePreview(
  chatId: string,
  options: UseMessagePreviewOptions = {}
): UseMessagePreviewReturn {
  const { delay = 300, cacheDuration = 30000 } = options

  const [messages, setMessages] = useState<MessagePreview[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchPreview = useCallback(async () => {
    // Check cache first
    const cached = previewCache.get(chatId)
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      setMessages(cached.data.messages)
      return
    }

    setIsLoading(true)
    setError(null)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const res = await fetch(`/api/history/${chatId}/preview`, {
        signal: abortController.signal,
      })

      if (!res.ok) {
        throw new Error('Failed to fetch preview')
      }

      const data: PreviewData = await res.json()

      // Update cache
      previewCache.set(chatId, { data, timestamp: Date.now() })

      if (!abortController.signal.aborted) {
        setMessages(data.messages)
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [chatId, cacheDuration])

  const onMouseEnter = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Start delayed fetch
    timeoutRef.current = setTimeout(() => {
      fetchPreview()
    }, delay)
  }, [delay, fetchPreview])

  const onMouseLeave = useCallback(() => {
    // Cancel pending fetch
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Abort in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setIsLoading(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    messages,
    isLoading,
    error,
    onMouseEnter,
    onMouseLeave,
  }
}

/**
 * Clear all cached previews
 */
export function clearPreviewCache(): void {
  previewCache.clear()
}

/**
 * Clear a specific preview from cache
 */
export function invalidatePreviewCache(chatId: string): void {
  previewCache.delete(chatId)
}
