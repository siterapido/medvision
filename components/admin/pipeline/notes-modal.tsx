"use client"

import { useEffect, useState, useTransition } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, MessageSquare, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { addPipelineNote, deletePipelineNote, getPipelineNotes } from "@/app/actions/pipeline"
import { cn } from "@/lib/utils"

interface PipelineNote {
  id: string
  note: string
  created_at: string
  created_by: string
  profiles?: {
    id: string
    name: string | null
    email: string | null
  } | null
}

interface NotesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName?: string | null
}

export function NotesModal({ open, onOpenChange, userId, userName }: NotesModalProps) {
  const [notes, setNotes] = useState<PipelineNote[]>([])
  const [newNote, setNewNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (open && userId) {
      loadNotes()
    }
  }, [open, userId])

  const loadNotes = async () => {
    setIsLoading(true)
    try {
      const result = await getPipelineNotes(userId)
      if (result.success) {
        setNotes(result.data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar notas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return

    startTransition(async () => {
      const result = await addPipelineNote(userId, newNote)
      if (result.success) {
        setNewNote("")
        await loadNotes()
      }
    })
  }

  const handleDeleteNote = async (noteId: string) => {
    setDeletingId(noteId)
    try {
      const result = await deletePipelineNote(noteId)
      if (result.success) {
        await loadNotes()
      }
    } catch (error) {
      console.error("Erro ao excluir nota:", error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
            Notas do Lead
            {userName && (
              <span className="text-slate-400 font-normal text-sm">({userName})</span>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Adicione e gerencie anotações sobre este lead no pipeline de conversão.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="space-y-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Digite sua nota aqui..."
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 min-h-[100px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  handleAddNote()
                }
              }}
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || isPending}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  Adicionar Nota
                  <span className="text-xs ml-2 text-slate-300">(Ctrl+Enter)</span>
                </>
              )}
            </Button>
          </div>

          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma nota adicionada ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm text-white whitespace-pre-wrap">{note.note}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={deletingId === note.id}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          {deletingId === note.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          Por: {note.profiles?.name || note.profiles?.email || "Admin"}
                        </span>
                        <span>
                          {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}





