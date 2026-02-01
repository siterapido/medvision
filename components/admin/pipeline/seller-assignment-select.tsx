"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, User, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getSellers } from "@/app/actions/pipeline"

type Seller = {
  id: string
  name: string | null
  email: string | null
}

interface SellerAssignmentSelectProps {
  value?: string | null
  onValueChange: (sellerId: string | null) => void
  disabled?: boolean
  size?: "sm" | "default"
  showLabel?: boolean
  className?: string
}

export function SellerAssignmentSelect({
  value,
  onValueChange,
  disabled = false,
  size = "default",
  showLabel = false,
  className,
}: SellerAssignmentSelectProps) {
  const [open, setOpen] = useState(false)
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSellers() {
      const result = await getSellers()
      if (result.success) {
        setSellers(result.data)
      }
      setLoading(false)
    }
    loadSellers()
  }, [])

  const selectedSeller = sellers.find((s) => s.id === value)
  const displayName = selectedSeller?.name || selectedSeller?.email?.split("@")[0]

  const handleSelect = (sellerId: string) => {
    if (sellerId === value) {
      // Deselect if clicking the same one
      onValueChange(null)
    } else {
      onValueChange(sellerId)
    }
    setOpen(false)
  }

  const handleClear = () => {
    onValueChange(null)
    setOpen(false)
  }

  if (loading) {
    return (
      <Button
        variant="outline"
        disabled
        className={cn(
          "justify-between bg-muted/30 border-border/50",
          size === "sm" ? "h-7 text-xs px-2" : "h-9 text-sm px-3",
          className
        )}
      >
        <span className="text-muted-foreground">Carregando...</span>
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "justify-between bg-card/50 border-border/50 hover:bg-card/80",
            size === "sm" ? "h-7 text-xs px-2 gap-1" : "h-9 text-sm px-3 gap-2",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {value ? (
              <>
                <div className={cn(
                  "rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shrink-0",
                  size === "sm" ? "w-4 h-4" : "w-5 h-5"
                )}>
                  <User className={cn("text-violet-400", size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
                </div>
                <span className="truncate text-foreground">{displayName}</span>
              </>
            ) : (
              <>
                <UserPlus className={cn("text-muted-foreground shrink-0", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
                <span className="truncate">{showLabel ? "Atribuir vendedor" : "Sem vendedor"}</span>
              </>
            )}
          </div>
          <ChevronsUpDown className={cn("shrink-0 opacity-50", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0 bg-card border-border shadow-xl" align="start">
        <Command className="bg-transparent">
          <CommandInput placeholder="Buscar vendedor..." className="h-9 text-sm border-b border-border/50" />
          <CommandList>
            <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
              Nenhum vendedor encontrado.
            </CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  onSelect={handleClear}
                  className="text-xs cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <div className="w-4 h-4 mr-2" />
                  Remover atribuicao
                </CommandItem>
              )}
              {sellers.map((seller) => (
                <CommandItem
                  key={seller.id}
                  value={seller.name || seller.email || seller.id}
                  onSelect={() => handleSelect(seller.id)}
                  className="text-xs cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      value === seller.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{seller.name || "Sem nome"}</span>
                    <span className="text-[10px] text-muted-foreground">{seller.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
