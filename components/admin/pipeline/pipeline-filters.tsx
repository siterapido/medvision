"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Filter, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export type PipelineFiltersState = {
  source: string[]
  sheetName: string[]
  state: string[]
  ies: string[]
}

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface PipelineFiltersProps {
  filters: PipelineFiltersState
  onFilterChange: (filters: PipelineFiltersState) => void
  options: {
    sources: FilterOption[]
    sheetNames: FilterOption[]
    states: FilterOption[]
    ies: FilterOption[]
  }
}

export function PipelineFilters({ filters, onFilterChange, options }: PipelineFiltersProps) {
  const activeFilterCount = Object.values(filters).reduce(
    (acc, curr) => acc + curr.length,
    0
  )

  const handleFilterChange = (key: keyof PipelineFiltersState, value: string) => {
    const current = filters[key]
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]
    
    onFilterChange({
      ...filters,
      [key]: next,
    })
  }

  const clearFilters = () => {
    onFilterChange({
      source: [],
      sheetName: [],
      state: [],
      ies: [],
    })
  }

  return (
    <div className="flex items-center gap-2">
      <FilterPopover
        title="Origem"
        options={options.sources}
        selected={filters.source}
        onChange={(value) => handleFilterChange("source", value)}
      />
      <FilterPopover
        title="Planilha"
        options={options.sheetNames}
        selected={filters.sheetName}
        onChange={(value) => handleFilterChange("sheetName", value)}
      />
      <FilterPopover
        title="Estado"
        options={options.states}
        selected={filters.state}
        onChange={(value) => handleFilterChange("state", value)}
      />
      <FilterPopover
        title="Instituição"
        options={options.ies}
        selected={filters.ies}
        onChange={(value) => handleFilterChange("ies", value)}
      />

      {activeFilterCount > 0 && (
        <>
          <Separator orientation="vertical" className="mx-2 h-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-xs"
          >
            Limpar
            <X className="ml-2 h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  )
}

interface FilterPopoverProps {
  title: string
  options: FilterOption[]
  selected: string[]
  onChange: (value: string) => void
}

function FilterPopover({ title, options, selected, onChange }: FilterPopoverProps) {
  const [open, setOpen] = React.useState(false)

  if (options.length === 0) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 border-dashed bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200",
            selected.length > 0 && "border-solid border-slate-700 bg-slate-900 text-slate-200"
          )}
        >
          {title}
          {selected.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden bg-slate-800 text-slate-300"
              >
                {selected.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selected.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal bg-slate-800 text-slate-300"
                  >
                    {selected.length} selecionados
                  </Badge>
                ) : (
                  options
                    .filter((option) => selected.includes(option.value))
                    .map((option) => (
                      <Badge
                        key={option.value}
                        variant="secondary"
                        className="rounded-sm px-1 font-normal bg-slate-800 text-slate-300"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-slate-950 border-slate-800" align="start">
        <Command className="bg-slate-950">
          <CommandInput placeholder={title} className="text-xs" />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-xs text-muted-foreground">
              Nenhum resultado.
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => onChange(option.value)}
                    className="text-xs data-[selected=true]:bg-slate-900 text-slate-300"
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-3 w-3 items-center justify-center rounded-sm border border-slate-600",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-3 w-3")} />
                    </div>
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-[10px] text-slate-500">
                        {option.count}
                      </span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => selected.forEach(v => onChange(v))} // Limpa um por um ou refatorar para limpar tudo
                    className="justify-center text-center text-xs cursor-pointer text-slate-400 hover:text-slate-200"
                  >
                    Limpar filtros
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}


