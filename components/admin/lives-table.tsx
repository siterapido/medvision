"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { LiveFormDialog } from "./live-form-dialog"
import { deleteLive } from "@/app/actions/lives"
import { MoreVertical, Edit, Trash2, Eye, CalendarClock, Loader2 } from "lucide-react"
import Link from "next/link"

interface Live {
  id: string
  title: string
  description: string | null
  instructor_name: string | null
  thumbnail_url: string | null
  status: "scheduled" | "live" | "completed"
  start_at: string
  duration_minutes: number | null
  created_at: string
  updated_at?: string
}

interface LivesTableProps {
  lives: Live[]
  selectedIds: string[]
  onSelectChange: (ids: string[]) => void
}

export function LivesTable({ lives, selectedIds, onSelectChange }: LivesTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [liveToDelete, setLiveToDelete] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [liveToEdit, setLiveToEdit] = useState<Live | null>(null)

  const allSelected = lives.length > 0 && selectedIds.length === lives.length
  const someSelected = selectedIds.length > 0 && !allSelected

  const handleSelectAll = (checked: boolean) => {
    if (checked) onSelectChange(lives.map((l) => l.id))
    else onSelectChange([])
  }

  const handleSelectOne = (liveId: string, checked: boolean) => {
    if (checked) onSelectChange([...selectedIds, liveId])
    else onSelectChange(selectedIds.filter((id) => id !== liveId))
  }

  const handleDeleteClick = (liveId: string) => {
    setLiveToDelete(liveId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!liveToDelete) return
    startTransition(async () => {
      const result = await deleteLive(liveToDelete)
      if (result.success) {
        setDeleteDialogOpen(false)
        setLiveToDelete(null)
        if (selectedIds.includes(liveToDelete)) onSelectChange(selectedIds.filter((id) => id !== liveToDelete))
        router.refresh()
      }
    })
  }

  const handleEditClick = (live: Live) => {
    setLiveToEdit(live)
    setEditDialogOpen(true)
  }

  const handleEditDialogClose = () => {
    setEditDialogOpen(false)
    setLiveToEdit(null)
  }

  return (
    <>
      <div className="rounded-lg border border-slate-700 bg-[#0F192F] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-[#131D37]">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos"
                    className="border-slate-600 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                  />
                </TableHead>
                <TableHead className="w-20">Thumb</TableHead>
                <TableHead className="text-white">Título</TableHead>
                <TableHead className="text-white">Instrutor</TableHead>
                <TableHead className="text-white">Data/Horário</TableHead>
                <TableHead className="text-white text-center">Status</TableHead>
                <TableHead className="text-white text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lives.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-400">Nenhuma live encontrada</TableCell>
                </TableRow>
              ) : (
                lives.map((live) => (
                  <TableRow key={live.id} className="border-slate-700 hover:bg-[#131D37]">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(live.id)}
                        onCheckedChange={(checked) => handleSelectOne(live.id, checked as boolean)}
                        aria-label={`Selecionar ${live.title}`}
                        className="border-slate-600 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="w-16 h-12 rounded overflow-hidden bg-slate-800">
                        {live.thumbnail_url ? (
                          <img src={live.thumbnail_url} alt={live.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <CalendarClock className="h-5 w-5 text-slate-600" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 max-w-md">
                        <p className="font-medium text-white truncate">{live.title}</p>
                        {live.description && (<p className="text-sm text-slate-400 truncate">{live.description}</p>)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400">{live.instructor_name || "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-300">{new Date(live.start_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          live.status === "live"
                            ? "bg-red-500/15 text-red-300 border-red-500/40"
                            : live.status === "scheduled"
                              ? "bg-amber-500/15 text-amber-200 border-amber-500/40"
                              : "bg-slate-500/15 text-slate-200 border-slate-500/40"
                        }
                      >
                        {live.status === "live" ? "Ao vivo" : live.status === "scheduled" ? "Agendada" : "Encerrada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-[#16243F]">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#131D37] border-slate-700 text-white">
                          <DropdownMenuItem onClick={() => handleEditClick(live)} className="hover:bg-[#16243F] cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" /> Editar Live
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/cursos`} className="hover:bg-[#16243F] cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> Ver no Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem onClick={() => handleDeleteClick(live.id)} className="hover:bg-red-500/20 text-red-400 cursor-pointer">
                            <Trash2 className="mr-2 h-4 w-4" /> Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0F192F] border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">Tem certeza que deseja deletar esta live? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-700" disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deletando...</>) : ("Deletar")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {liveToEdit && (
        <LiveFormDialog
          open={editDialogOpen}
          onOpenChange={handleEditDialogClose}
          mode="edit"
          initialData={{
            id: liveToEdit.id,
            title: liveToEdit.title,
            description: liveToEdit.description || "",
            instructor_name: liveToEdit.instructor_name || "",
            thumbnail_url: liveToEdit.thumbnail_url || "",
            start_at: liveToEdit.start_at,
            duration_minutes: liveToEdit.duration_minutes ?? 60,
            status: liveToEdit.status,
          }}
        />
      )}
    </>
  )
}
