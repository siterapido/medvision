/**
 * Shared utilities for chat history functionality
 */

import { isToday, isYesterday, subWeeks, subMonths } from 'date-fns'
import type { Chat } from '@/lib/db/queries'
import type { GroupedChats, GroupKey } from './types'
import { GROUP_ORDER, GROUP_LABELS } from './types'

/**
 * Groups an array of chats by their creation date into time-based categories.
 *
 * @param chats - Array of chat objects to group
 * @returns Object with chats grouped by: today, yesterday, lastWeek, lastMonth, older
 */
export function groupChatsByDate<T extends { createdAt: Date | string }>(
  chats: T[]
): GroupedChats<T> {
  const now = new Date()
  const oneWeekAgo = subWeeks(now, 1)
  const oneMonthAgo = subMonths(now, 1)

  const groups: GroupedChats<T> = {
    today: [],
    yesterday: [],
    lastWeek: [],
    lastMonth: [],
    older: [],
  }

  // Defensive check: ensure chats is an array
  if (!Array.isArray(chats)) {
    console.warn('[groupChatsByDate] Expected array, got:', typeof chats)
    return groups
  }

  for (const chat of chats) {
    const chatDate = new Date(chat.createdAt)

    if (isToday(chatDate)) {
      groups.today.push(chat)
    } else if (isYesterday(chatDate)) {
      groups.yesterday.push(chat)
    } else if (chatDate > oneWeekAgo) {
      groups.lastWeek.push(chat)
    } else if (chatDate > oneMonthAgo) {
      groups.lastMonth.push(chat)
    } else {
      groups.older.push(chat)
    }
  }

  return groups
}

/**
 * Checks if a grouped chats object is empty (no chats in any group)
 */
export function isGroupedChatsEmpty(groups: GroupedChats): boolean {
  return GROUP_ORDER.every((key) => groups[key].length === 0)
}

/**
 * Gets the total count of chats across all groups
 */
export function getTotalChatsCount(groups: GroupedChats): number {
  return GROUP_ORDER.reduce((total, key) => total + groups[key].length, 0)
}

/**
 * Iterates over non-empty groups with their labels
 */
export function* iterateGroups<T>(
  groups: GroupedChats<T>
): Generator<{ key: GroupKey; label: string; chats: T[] }> {
  for (const key of GROUP_ORDER) {
    const chats = groups[key]
    if (chats.length > 0) {
      yield { key, label: GROUP_LABELS[key], chats }
    }
  }
}

/**
 * Truncates text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Extracts a snippet around a search match
 */
export function extractSnippet(
  content: string,
  query: string,
  contextChars: number = 40
): string | null {
  const lowerContent = content.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const matchIndex = lowerContent.indexOf(lowerQuery)

  if (matchIndex === -1) return null

  const start = Math.max(0, matchIndex - contextChars)
  const end = Math.min(content.length, matchIndex + query.length + contextChars + 20)

  let snippet = content.slice(start, end)
  if (start > 0) snippet = '...' + snippet
  if (end < content.length) snippet = snippet + '...'

  return snippet
}
