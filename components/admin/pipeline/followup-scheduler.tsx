"use client"

import { useState, useTransition } from "react"
import { CalendarClock, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createFollowup } from "@/app/actions/pipeline"

interface FollowupSchedulerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSuccess?: () => void
}

export function FollowupScheduler({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: FollowupSchedulerProps) {
  const [date, setDate] = useState("")
  const [note, setNote] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!date || !note.trim()) return

    startTransition(async () => {
      const result = await createFollowup(userId, new Date(date), note)
      if (result.success) {
        setDate("")
        setNote("")
        onSuccess?.()
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#020617] border-[rgba(148,163,184,0.12)] text-[#f8fafc] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <CalendarClock className="h-5 w-5 text-[#06b6d4]" />
            Agendar Follow-up
          </DialogTitle>
          <DialogDescription className="text-[#94a3b8]">
            Defina uma data e hora para entrar em contato com este lead.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-[#cbd5e1] font-medium">Data e Hora</Label>
            <Input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[#0a0f1f] border-[rgba(148,163,184,0.08)] text-[#f8fafc] focus:border-[#06b6d4] focus:ring-1 focus:ring-[rgba(6,182,212,0.15)]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="text-[#cbd5e1] font-medium">Observação</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Ligar para verificar se conseguiu acessar o curso..."
              className="bg-[#0a0f1f] border-[rgba(148,163,184,0.08)] text-[#f8fafc] placeholder:text-[#64748b] focus:border-[#06b6d4] focus:ring-1 focus:ring-[rgba(6,182,212,0.15)] min-h-[100px]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="hover:bg-[#0f172a] text-[#94a3b8] hover:text-[#f8fafc]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !date || !note.trim()}
              className="bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#0e7490] hover:to-[#0891b2] text-white font-medium transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agendando...
                </>
              ) : (
                "Agendar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


