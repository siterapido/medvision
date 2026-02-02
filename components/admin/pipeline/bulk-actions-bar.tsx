"use client"

import { useState, useEffect } from "react"
import { Trash2, X, Loader2, UserPlus, Check, ChevronsUpDown } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { deleteLeads, assignSellerToLeads } from "@/app/actions/leads"
import { assignSellerToProfiles, getSellers } from "@/app/actions/pipeline"
import { cn } from "@/lib/utils"

type Seller = {
  id: string
  name: string | null
  email: string | null
}

interface BulkActionsBarProps {
  selectedCount: number
  selectedIds: string[]
  onClearSelection: () => void
  onActionComplete: () => void
  type?: "cold_lead" | "profile"
  showDelete?: boolean
}

export function BulkActionsBar({
  selectedCount,
  selectedIds,
  onClearSelection,
  onActionComplete,
  type = "cold_lead",
  showDelete = true,
}: BulkActionsBarProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [sellerOpen, setSellerOpen] = useState(false)
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loadingSellers, setLoadingSellers] = useState(false)

  useEffect(() => {
    if (sellerOpen && sellers.length === 0) {
      loadSellers()
    }
  }, [sellerOpen])

  const loadSellers = async () => {
    setLoadingSellers(true)
    const result = await getSellers()
    if (result.success) {
      setSellers(result.data)
    }
    setLoadingSellers(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedCount} leads selecionados? Esta acao nao pode ser desfeita.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteLeads(selectedIds)

      if (result.success) {
        onClearSelection()
        onActionComplete()
      } else {
        alert(result.message || "Erro ao excluir leads")
      }
    } catch (error) {
      console.error("Erro ao excluir leads em massa:", error)
      alert("Ocorreu um erro ao excluir os leads.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAssignSeller = async (sellerId: string | null) => {
    setIsAssigning(true)
    setSellerOpen(false)

    try {
      let result
      if (type === "cold_lead") {
        result = await assignSellerToLeads(selectedIds, sellerId)
      } else {
        result = await assignSellerToProfiles(selectedIds, sellerId)
      }

      if (result.success) {
        onClearSelection()
        onActionComplete()
      } else {
        alert(result.message || "Erro ao atribuir vendedor")
      }
    } catch (error) {
      console.error("Erro ao atribuir vendedor em massa:", error)
      alert("Ocorreu um erro ao atribuir o vendedor.")
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-full shadow-2xl shadow-black/50 text-sm">
            <span className="font-medium text-slate-200 pl-1 pr-2">
              {selectedCount} selecionado{selectedCount !== 1 && "s"}
            </span>

            <Separator orientation="vertical" className="h-4 bg-slate-700" />

            {/* Atribuir Vendedor */}
            <Popover open={sellerOpen} onOpenChange={setSellerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isAssigning}
                  className="h-8 px-2 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                >
                  {isAssigning ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-1.5" />
                  )}
                  Atribuir Vendedor
                  <ChevronsUpDown className="h-3 w-3 ml-1 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0 bg-card border-border shadow-xl" align="center">
                <Command className="bg-transparent">
                  <CommandInput placeholder="Buscar vendedor..." className="h-9 text-sm border-b border-border/50" />
                  <CommandList>
                    {loadingSellers ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                        Carregando...
                      </div>
                    ) : (
                      <>
                        <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                          Nenhum vendedor encontrado.
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => handleAssignSeller(null)}
                            className="text-xs cursor-pointer text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5 mr-2" />
                            Remover atribuicao
                          </CommandItem>
                          {sellers.map((seller) => (
                            <CommandItem
                              key={seller.id}
                              value={seller.name || seller.email || seller.id}
                              onSelect={() => handleAssignSeller(seller.id)}
                              className="text-xs cursor-pointer"
                            >
                              <Check className="mr-2 h-3.5 w-3.5 opacity-0" />
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium">{seller.name || "Sem nome"}</span>
                                <span className="text-[10px] text-muted-foreground">{seller.email}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {showDelete && (
              <>
                <Separator orientation="vertical" className="h-4 bg-slate-700" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1.5" />
                  )}
                  Excluir
                </Button>
              </>
            )}

            <Separator orientation="vertical" className="h-4 bg-slate-700" />

            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              className="h-6 w-6 rounded-full hover:bg-slate-800"
            >
              <X className="h-3 w-3 text-slate-400" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
