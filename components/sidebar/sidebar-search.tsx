'use client'

import { Search, X } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarSearchProps {
  onSearch?: (query: string) => void
  placeholder?: string
}

export function SidebarSearch({
  onSearch,
  placeholder = 'Buscar conversas...'
}: SidebarSearchProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleClear = useCallback(() => {
    setQuery('')
    onSearch?.('')
  }, [onSearch])

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
          'bg-[var(--sidebar-hover)] border-sidebar-border',
          'text-sm text-[var(--sidebar-text-primary)]',
          'placeholder:text-[var(--sidebar-text-tertiary)]',
          'focus:ring-1 focus:ring-primary/50 focus:border-primary/50',
          'transition-all duration-200'
        )}
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-[var(--sidebar-text-tertiary)] hover:text-[var(--sidebar-text-primary)]"
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Limpar busca</span>
        </Button>
      )}
      {!query && !isFocused && (
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar-border bg-sidebar px-1.5 font-mono text-[10px] font-medium text-[var(--sidebar-text-tertiary)]">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      )}
    </div>
  )
}
