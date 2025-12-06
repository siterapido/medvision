"use client"

import { useState } from "react"
import { Trash2, X, MoveRight, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { deleteLeads } from "@/app/actions/leads"
import { cn } from "@/lib/utils"

interface BulkActionsBarProps {
  selectedCount: number
  selectedIds: string[]
  onClearSelection: () => void
  onActionComplete: () => void
}

export function BulkActionsBar({
  selectedCount,
  selectedIds,
  onClearSelection,
  onActionComplete,
}: BulkActionsBarProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedCount} leads selecionados? Esta ação não pode ser desfeita.`)) {
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

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-full shadow-2xl shadow-black/50 text-sm">
            <span className="font-medium text-slate-200 pl-1 pr-2">
              {selectedCount} selecionado{selectedCount !== 1 && "s"}
            </span>
            
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

            {/* Futuro: Implementar mover em massa */}
            {/* <Separator orientation="vertical" className="h-4 bg-slate-700" />
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="h-8 px-2 text-slate-400 hover:text-slate-200"
            >
              <MoveRight className="h-4 w-4 mr-1.5" />
              Mover
            </Button> */}

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


