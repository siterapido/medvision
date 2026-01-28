'use client'

/**
 * Unified hook for chat history management
 *
 * Provides a consistent interface for loading, searching, and managing
 * chat history across both sidebar and full history page views.
 */

import { useMemo, useCallback } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { useSWRConfig } from 'swr'
import { groupChatsByDate } from '../utils'
import type {
  GroupedChats,
  HistoryResponse,
  SearchResponse,
  ChatSearchResult,
} from '../types'
import type { Chat } from '@/lib/db/queries'

const DEFAULT_PAGE_SIZE = 20

interface UseHistoryOptions {
  /**
   * Pagination mode
   * - 'cursor': Uses ending_before cursor (better for real-time updates)
   * - 'offset': Uses offset/limit (better for random access)
   */
  mode?: 'cursor' | 'offset'
  /**
   * Number of items per page
   */
  pageSize?: number
  /**
   * Search query for full-text search
   */
  query?: string
  /**
   * Filter by agent type
   */
  agentType?: string
  /**
   * Filter by date range (start)
   */
  dateFrom?: Date
  /**
   * Filter by date range (end)
   */
  dateTo?: Date
  /**
   * Whether to enable the hook
   */
  enabled?: boolean
}

interface UseHistoryReturn {
  /** All chats loaded so far */
  chats: Chat[]
  /** Chats grouped by date */
  groupedChats: GroupedChats<Chat>
  /** Total count (only available in search mode) */
  total: number | null
  /** Whether there are more pages to load */
  hasMore: boolean
  /** Whether the initial load is in progress */
  isLoading: boolean
  /** Whether any request is in progress */
  isValidating: boolean
  /** Whether the history is empty */
  isEmpty: boolean
  /** Load the next page */
  loadMore: () => void
  /** Refresh the data */
  refresh: () => void
  /** Delete a chat by ID */
  deleteChat: (chatId: string) => Promise<boolean>
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

/**
 * Unified hook for chat history
 */
export function useHistory(options: UseHistoryOptions = {}): UseHistoryReturn {
  const {
    mode = 'cursor',
    pageSize = DEFAULT_PAGE_SIZE,
    query,
    agentType,
    dateFrom,
    dateTo,
    enabled = true,
  } = options

  const hasFilters = !!(query || agentType || dateFrom || dateTo)
  const useSearchMode = hasFilters || mode === 'offset'

  // Build URL for search mode
  const buildSearchUrl = useCallback(
    (pageIndex: number, offset: number) => {
      const params = new URLSearchParams()
      params.set('limit', pageSize.toString())
      params.set('offset', offset.toString())

      if (query) params.set('q', query)
      if (agentType && agentType !== 'all') params.set('agent', agentType)
      if (dateFrom) params.set('from', dateFrom.toISOString())
      if (dateTo) params.set('to', dateTo.toISOString())

      return `/api/history/search?${params.toString()}`
    },
    [pageSize, query, agentType, dateFrom, dateTo]
  )

  // Key function for search mode (offset-based)
  const getSearchKey = useCallback(
    (pageIndex: number, previousPageData: SearchResponse | null) => {
      if (!enabled) return null
      if (previousPageData && !previousPageData.hasMore) return null
      const offset = pageIndex * pageSize
      return buildSearchUrl(pageIndex, offset)
    },
    [enabled, pageSize, buildSearchUrl]
  )

  // Key function for cursor mode
  const getCursorKey = useCallback(
    (pageIndex: number, previousPageData: HistoryResponse | null) => {
      if (!enabled) return null
      if (previousPageData && previousPageData.hasMore === false) return null

      if (pageIndex === 0) {
        return `/api/history?limit=${pageSize}`
      }

      const lastChat = previousPageData?.chats.at(-1)
      if (!lastChat) return null

      return `/api/history?ending_before=${lastChat.id}&limit=${pageSize}`
    },
    [enabled, pageSize]
  )

  // Use SWRInfinite for search mode
  const {
    data: searchPages,
    size: searchSize,
    setSize: setSearchSize,
    isValidating: searchValidating,
    isLoading: searchLoading,
    mutate: searchMutate,
  } = useSWRInfinite<SearchResponse>(
    useSearchMode ? getSearchKey : () => null,
    fetcher,
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    }
  )

  // Use SWRInfinite for cursor mode
  const {
    data: cursorPages,
    size: cursorSize,
    setSize: setCursorSize,
    isValidating: cursorValidating,
    isLoading: cursorLoading,
    mutate: cursorMutate,
  } = useSWRInfinite<HistoryResponse>(
    !useSearchMode ? getCursorKey : () => null,
    fetcher,
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    }
  )

  // Merge results based on mode
  const chats = useMemo(() => {
    if (useSearchMode) {
      if (!searchPages) return []
      return searchPages.flatMap((page) =>
        page.results.map((result) => ({
          id: result.id,
          title: result.title,
          createdAt: new Date(result.createdAt),
          userId: '',
          visibility: 'private' as const,
          agentType: result.agentType,
        }))
      ) as Chat[]
    } else {
      if (!cursorPages) return []
      return cursorPages.flatMap((page) => page.chats)
    }
  }, [useSearchMode, searchPages, cursorPages])

  const groupedChats = useMemo(() => groupChatsByDate(chats), [chats])

  const total = useMemo(() => {
    if (useSearchMode && searchPages?.[0]) {
      return searchPages[0].total
    }
    return null
  }, [useSearchMode, searchPages])

  const hasMore = useMemo(() => {
    if (useSearchMode) {
      return searchPages ? searchPages[searchPages.length - 1]?.hasMore : false
    } else {
      return cursorPages
        ? !cursorPages.some((page) => page.hasMore === false)
        : false
    }
  }, [useSearchMode, searchPages, cursorPages])

  const isLoading = useSearchMode ? searchLoading : cursorLoading
  const isValidating = useSearchMode ? searchValidating : cursorValidating
  const isEmpty = !isLoading && chats.length === 0

  const loadMore = useCallback(() => {
    if (isValidating || !hasMore) return

    if (useSearchMode) {
      setSearchSize(searchSize + 1)
    } else {
      setCursorSize(cursorSize + 1)
    }
  }, [
    isValidating,
    hasMore,
    useSearchMode,
    searchSize,
    setSearchSize,
    cursorSize,
    setCursorSize,
  ])

  const refresh = useCallback(() => {
    if (useSearchMode) {
      searchMutate()
    } else {
      cursorMutate()
    }
  }, [useSearchMode, searchMutate, cursorMutate])

  const deleteChat = useCallback(
    async (chatId: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/chat?id=${chatId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Delete failed')

        // Optimistically update the cache
        if (useSearchMode) {
          searchMutate(
            (pages) =>
              pages?.map((page) => ({
                ...page,
                results: page.results.filter((r) => r.id !== chatId),
                total: page.total - 1,
              })),
            { revalidate: false }
          )
        } else {
          cursorMutate(
            (pages) =>
              pages?.map((page) => ({
                ...page,
                chats: page.chats.filter((c) => c.id !== chatId),
              })),
            { revalidate: false }
          )
        }

        return true
      } catch {
        return false
      }
    },
    [useSearchMode, searchMutate, cursorMutate]
  )

  return {
    chats,
    groupedChats,
    total,
    hasMore,
    isLoading,
    isValidating,
    isEmpty,
    loadMore,
    refresh,
    deleteChat,
  }
}

/**
 * Hook to revalidate all history caches
 * Use this when creating a new chat session
 */
export function useHistoryRevalidation() {
  const { mutate } = useSWRConfig()

  const revalidateHistory = useCallback(() => {
    mutate(
      (key) => {
        if (typeof key === 'string' && key.includes('/api/history')) {
          return true
        }
        if (
          Array.isArray(key) &&
          key.some((k) => typeof k === 'string' && k.includes('/api/history'))
        ) {
          return true
        }
        return false
      },
      undefined,
      { revalidate: true }
    )
  }, [mutate])

  return { revalidateHistory }
}
