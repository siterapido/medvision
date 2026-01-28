/**
 * Shared types for chat history functionality
 */

import type { Chat } from '@/lib/db/queries'

/**
 * Grouped chats by date range
 */
export type GroupedChats<T = Chat> = {
  today: T[]
  yesterday: T[]
  lastWeek: T[]
  lastMonth: T[]
  older: T[]
}

/**
 * Labels for chat groups in Portuguese
 */
export const GROUP_LABELS = {
  today: 'Hoje',
  yesterday: 'Ontem',
  lastWeek: 'Últimos 7 dias',
  lastMonth: 'Últimos 30 dias',
  older: 'Mais antigos',
} as const

export type GroupKey = keyof GroupedChats

/**
 * Order of groups for rendering
 */
export const GROUP_ORDER: GroupKey[] = [
  'today',
  'yesterday',
  'lastWeek',
  'lastMonth',
  'older',
]

/**
 * Message preview for hover cards
 */
export interface MessagePreview {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

/**
 * Chat with preview messages
 */
export interface ChatWithMessages extends Chat {
  preview: MessagePreview[]
  messageCount: number
}

/**
 * Search result from API
 */
export interface ChatSearchResult {
  id: string
  title: string
  agentType: string
  createdAt: string
  updatedAt: string
  snippet: string | null
  messageCount: number
}

/**
 * Paginated history response
 */
export interface HistoryResponse {
  chats: Chat[]
  hasMore: boolean
}

/**
 * Search response with total count
 */
export interface SearchResponse {
  results: ChatSearchResult[]
  total: number
  hasMore: boolean
}
