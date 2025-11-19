"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { bulkActionLives } from "@/app/actions/lives"
import { LivesTable } from "@/components/admin/lives-table"
import { LiveFormDialog } from "@/components/admin/live-form-dialog"
import { Plus, Search, Filter, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface Live {
  id: string
  title: string
  description: string | null
  instructor: string | null
  thumbnail_url: string | null
  status: "agendada" | "realizada" | "cancelada"
  is_published: boolean
  scheduled_at: string
  created_at: string
  updated_at?: string
}

interface LiveManagementProps {
  lives: Live[]
  adminName: string
}

export function LiveManagement({ lives, adminName }: LiveManagementProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [pubFilter, setPubFilter] = useState<string>("all")
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  const filteredLives = useMemo(() => {
    return lives.filter((live) => {
      const matchesSearch = searchQuery
        ? live.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (live.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
        : true

      const matchesStatus =
        statusFilter === "all" ? true : live.status === (statusFilter as any)

      const matchesPublished =
        pubFilter === "all" ? true : pubFilter === "published" ? live.is_published : !live.is_published

      return matchesSearch && matchesStatus && matchesPublished
    })
  }, [lives, searchQuery, statusFilter, pubFilter])

  const stats = useMemo(() => {
    return {
      total: lives.length,
      published: lives.filter((l) => l.is_published).length,
      agendada: lives.filter((l) => l.status === "agendada").length,
      realizada: lives.filter((l) => l.status === "realizada").length,
      cancelada: lives.filter((l) => l.status === "cancelada").length,
    }
  }, [lives])

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    startTransition(async () => {
      const result = await bulkActionLives({ liveIds: selectedIds, action: "delete" })
      if (result.success) {
        setSelectedIds([])
        setBulkDeleteDialogOpen(false)
        router.refresh()
      }
    })
  }

  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return
    startTransition(async () => {
      const result = await bulkActionLives({ liveIds: selectedIds, action: "publish" })
      if (result.success) {
        setSelectedIds([])
        router.refresh()
      }
    })
  }

  const handleBulkUnpublish = async () => {
    if (selectedIds.length === 0) return
    startTransition(async () => {
      const result = await bulkActionLives({ liveIds: selectedIds, action: "unpublish" })
      if (result.success) {
        setSelectedIds([])
        router.refresh()
      }
    })
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setPubFilter("all")
  }

  const hasActiveFilters = searchQuery || statusFilter !== "all" || pubFilter !== "all"

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131D37] border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total de Lives</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <span className="text-2xl">🎥</span>
            </div>
          </div>
        </div>
        <div className="bg-[#131D37] border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Publicadas</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stats.published}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-[#131D37] border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Agendadas</p>
              <p className="text-2xl font-bold text-amber-300 mt-1">{stats.agendada}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>
        <div className="bg-[#131D37] border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Realizadas / Canceladas</p>
              <p className="text-2xl font-bold text-slate-300 mt-1">{stats.realizada + stats.cancelada}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-slate-500/10 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Buscar lives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-[#131D37] border-slate-600 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent className="bg-[#131D37] border-slate-600">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              <SelectItem value="agendada" className="text-white">Agendada</SelectItem>
              <SelectItem value="realizada" className="text-white">Realizada</SelectItem>
              <SelectItem value="cancelada" className="text-white">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={pubFilter} onValueChange={setPubFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-[#131D37] border-slate-600 text-white">
              <SelectValue placeholder="Publicação" />
            </SelectTrigger>
            <SelectContent className="bg-[#131D37] border-slate-600">
              <SelectItem value="all" className="text-white">Todos os status</SelectItem>
              <SelectItem value="published" className="text-white">Publicadas</SelectItem>
              <SelectItem value="draft" className="text-white">Rascunhos</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={handleResetFilters} className="text-slate-400 hover:text-white">
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" />
            Nova Live
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-cyan-600 text-white">{selectedIds.length} selecionada{selectedIds.length > 1 ? "s" : ""}</Badge>
            <span className="text-sm text-slate-300">Aplicar ações em lote:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleBulkPublish} disabled={isPending} className="border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Publicar
            </Button>
            <Button size="sm" variant="outline" onClick={handleBulkUnpublish} disabled={isPending} className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <XCircle className="h-4 w-4 mr-2" /> Despublicar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBulkDeleteDialogOpen(true)} disabled={isPending} className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20">
              <Trash2 className="h-4 w-4 mr-2" /> Deletar
            </Button>
          </div>
        </div>
      )}

      <LivesTable lives={filteredLives} selectedIds={selectedIds} onSelectChange={setSelectedIds} />

      {filteredLives.length === 0 && lives.length > 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">Nenhuma live encontrada com os filtros aplicados</p>
          <Button variant="ghost" onClick={handleResetFilters} className="mt-4 text-cyan-500 hover:text-cyan-400">Limpar filtros</Button>
        </div>
      )}

      <LiveFormDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} mode="create" />

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0F192F] border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar Exclusão em Lote</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja deletar {selectedIds.length} live{selectedIds.length > 1 ? "s" : ""}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-700" disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deletando...</>) : ("Deletar Todos")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}