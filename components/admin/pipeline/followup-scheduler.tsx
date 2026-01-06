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
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-pink-500" />
            Agendar Follow-up
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Defina uma data e hora para entrar em contato com este lead.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-slate-300">Data e Hora</Label>
            <Input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 focus:ring-pink-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="note" className="text-slate-300">Observação</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Ligar para verificar se conseguiu acessar o curso..."
              className="bg-slate-950 border-slate-800 text-slate-100 focus:ring-pink-500 min-h-[100px]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="hover:bg-slate-800 hover:text-slate-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !date || !note.trim()}
              className="bg-pink-600 hover:bg-pink-700 text-white"
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


