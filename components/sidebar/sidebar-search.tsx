'use client'

import { Search, X, Loader2 } from 'lucide-react'
import { useState, useCallback, useEffect, useDeferredValue } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import useSWR from 'swr'
import type { Chat } from '@/lib/db/queries'

interface SearchResult {
  id: string
  title: string
  agentType: string
  createdAt: string
  updatedAt: string
  snippet: string | null
  messageCount: number
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  hasMore: boolean
}

const fetcher = async (url: string): Promise<SearchResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

interface SidebarSearchProps {
  onSearch?: (query: string) => void
  onResults?: (chats: Chat[]) => void
  placeholder?: string
}

export function SidebarSearch({
  onSearch,
  onResults,
  placeholder = 'Buscar conversas...'
}: SidebarSearchProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const deferredQuery = useDeferredValue(query)

  // Only fetch when query has at least 2 characters
  const shouldFetch = deferredQuery.length >= 2

  const { data, isLoading } = useSWR<SearchResponse>(
    shouldFetch ? `/api/history/search?q=${encodeURIComponent(deferredQuery)}&limit=10` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 500,
    }
  )

  // Notify parent of results
  useEffect(() => {
    if (data?.results && onResults) {
      const chats: Chat[] = data.results.map((result) => ({
        id: result.id,
        title: result.title,
        createdAt: new Date(result.createdAt),
        userId: '',
        visibility: 'private' as const,
        agentType: result.agentType,
      }))
      onResults(chats)
    }
  }, [data, onResults])

  const handleClear = useCallback(() => {
    setQuery('')
    onSearch?.('')
    onResults?.([])
  }, [onSearch, onResults])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch?.(value)
  }, [onSearch])

  // Keyboard shortcut: Ctrl/Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const input = document.getElementById('sidebar-search') as HTMLInputElement
        input?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const showLoading = isLoading && shouldFetch

  return (
    <div className="relative">
      <Search className={cn(
        'absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors',
        isFocused ? 'text-primary' : 'text-[var(--sidebar-text-tertiary)]'
      )} />
      <Input
        id="sidebar-search"
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          'h-9 pl-9 pr-8',
          'bg-[var(--surface-100)] border-[var(--border-default)]',
          'text-sm text-[var(--text-primary)]',
          'placeholder:text-[var(--text-tertiary)]',
          'focus:ring-1 focus:ring-[var(--brand)]/50 focus:border-[var(--brand)]/50',
          'transition-all duration-200'
        )}
      />
      {showLoading && (
        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
      )}
      {query && !showLoading && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Limpar busca</span>
        </Button>
      )}
      {!query && !isFocused && (
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--surface-100)] px-1.5 font-mono text-[10px] font-medium text-[var(--text-tertiary)]">
          <span className="text-xs">⌘</span>K
        </kbd>
      )}

      {/* Search results count indicator */}
      {shouldFetch && data && !showLoading && (
        <div className="absolute -bottom-5 left-0 text-[10px] text-[var(--text-muted)]">
          {data.total === 0
            ? 'Nenhum resultado'
            : `${data.total} resultado${data.total !== 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  )
}
