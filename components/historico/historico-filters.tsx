'use client'

import { Search, Filter, X, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { AGENT_CONFIGS } from '@/lib/ai/agents/config'

interface HistoricoFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  agentFilter: string
  onAgentChange: (agent: string) => void
  dateFrom: Date | undefined
  onDateFromChange: (date: Date | undefined) => void
  dateTo: Date | undefined
  onDateToChange: (date: Date | undefined) => void
  availableAgents: string[]
}

export function HistoricoFilters({
  searchQuery,
  onSearchChange,
  agentFilter,
  onAgentChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  availableAgents,
}: HistoricoFiltersProps) {
  const hasActiveFilters = agentFilter !== 'all' || dateFrom || dateTo

  const clearFilters = () => {
    onAgentChange('all')
    onDateFromChange(undefined)
    onDateToChange(undefined)
    onSearchChange('')
  }

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onDateFromChange(value ? new Date(value) : undefined)
  }

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onDateToChange(value ? new Date(value) : undefined)
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 border-b border-[var(--border-subtle)] bg-[var(--surface-100)]">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
        <Input
          type="text"
          placeholder="Buscar conversas..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'pl-10 pr-10',
            'bg-[var(--surface-200)] border-[var(--border-default)]',
            'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
            'focus:ring-1 focus:ring-[var(--brand)]/50 focus:border-[var(--brand)]/50'
          )}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSearchChange('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Agent Filter */}
      <Select value={agentFilter} onValueChange={onAgentChange}>
        <SelectTrigger
          className={cn(
            'w-full md:w-[180px]',
            'bg-[var(--surface-200)] border-[var(--border-default)]',
            'text-[var(--text-primary)]'
          )}
        >
          <Filter className="h-4 w-4 mr-2 text-[var(--text-tertiary)]" />
          <SelectValue placeholder="Todos os agentes" />
        </SelectTrigger>
        <SelectContent className="bg-[var(--surface-300)] border-[var(--border-overlay)]">
          <SelectItem value="all">Todos os agentes</SelectItem>
          {availableAgents.map((agent) => (
            <SelectItem key={agent} value={agent}>
              {AGENT_CONFIGS[agent]?.name || agent}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date From */}
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
        <Input
          type="date"
          value={dateFrom ? format(dateFrom, 'yyyy-MM-dd') : ''}
          onChange={handleDateFromChange}
          max={dateTo ? format(dateTo, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
          className={cn(
            'w-full md:w-[150px] pl-10',
            'bg-[var(--surface-200)] border-[var(--border-default)]',
            'text-[var(--text-primary)]',
            !dateFrom && 'text-[var(--text-tertiary)]'
          )}
          placeholder="De"
        />
      </div>

      {/* Date To */}
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
        <Input
          type="date"
          value={dateTo ? format(dateTo, 'yyyy-MM-dd') : ''}
          onChange={handleDateToChange}
          min={dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined}
          max={format(new Date(), 'yyyy-MM-dd')}
          className={cn(
            'w-full md:w-[150px] pl-10',
            'bg-[var(--surface-200)] border-[var(--border-default)]',
            'text-[var(--text-primary)]',
            !dateTo && 'text-[var(--text-tertiary)]'
          )}
          placeholder="Ate"
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  )
}
