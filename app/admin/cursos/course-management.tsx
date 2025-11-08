"use client"

import { useState, useMemo, useTransition } from "react"
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
import { CourseFormDialog } from "@/components/admin/course-form-dialog"
import { CoursesTable } from "@/components/admin/courses-table"
import { bulkActionCourses } from "@/app/actions/courses"
import {
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"

interface Course {
  id: string
  title: string
  description: string | null
  area: string
  difficulty: string
  course_type: string
  price: string | null
  tags: string | null
  duration: string | null
  thumbnail_url: string | null
  is_published: boolean
  lessons_count: number
  created_at: string
  updated_at?: string
}

interface CourseManagementProps {
  courses: Course[]
}

export function CourseManagement({ courses }: CourseManagementProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Estado da UI
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [areaFilter, setAreaFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // Extrair áreas únicas para o filtro
  const uniqueAreas = useMemo(() => {
    const areas = new Set(courses.map((c) => c.area))
    return Array.from(areas).sort()
  }, [courses])

  // Filtrar cursos
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Filtro de busca
      const matchesSearch = searchQuery
        ? course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchQuery.toLowerCase())
        : true

      // Filtro de área
      const matchesArea =
        areaFilter === "all" ? true : course.area === areaFilter

      // Filtro de status
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "published"
          ? course.is_published
          : !course.is_published

      return matchesSearch && matchesArea && matchesStatus
    })
  }, [courses, searchQuery, areaFilter, statusFilter])

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: courses.length,
      published: courses.filter((c) => c.is_published).length,
      draft: courses.filter((c) => !c.is_published).length,
      totalLessons: courses.reduce((acc, c) => acc + c.lessons_count, 0),
    }
  }, [courses])

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return

    startTransition(async () => {
      const result = await bulkActionCourses({
        courseIds: selectedIds,
        action: "delete",
      })

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
      const result = await bulkActionCourses({
        courseIds: selectedIds,
        action: "publish",
      })

      if (result.success) {
        setSelectedIds([])
        router.refresh()
      }
    })
  }

  const handleBulkUnpublish = async () => {
    if (selectedIds.length === 0) return

    startTransition(async () => {
      const result = await bulkActionCourses({
        courseIds: selectedIds,
        action: "unpublish",
      })

      if (result.success) {
        setSelectedIds([])
        router.refresh()
      }
    })
  }

  // Resetar filtros
  const handleResetFilters = () => {
    setSearchQuery("")
    setAreaFilter("all")
    setStatusFilter("all")
  }

  const hasActiveFilters = searchQuery || areaFilter !== "all" || statusFilter !== "all"

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131D37] border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total de Cursos</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
        </div>

        <div className="bg-[#131D37] border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Publicados</p>
              <p className="text-2xl font-bold text-green-400 mt-1">
                {stats.published}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#131D37] border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Rascunhos</p>
              <p className="text-2xl font-bold text-slate-400 mt-1">
                {stats.draft}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-slate-500/10 flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
        </div>

        <div className="bg-[#131D37] border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total de Aulas</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">
                {stats.totalLessons}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <span className="text-2xl">🎓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          {/* Busca */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Buscar cursos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Filtro por área */}
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-[#131D37] border-slate-600 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Todas as áreas" />
            </SelectTrigger>
            <SelectContent className="bg-[#131D37] border-slate-600">
              <SelectItem value="all" className="text-white">
                Todas as áreas
              </SelectItem>
              {uniqueAreas.map((area) => (
                <SelectItem key={area} value={area} className="text-white">
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-[#131D37] border-slate-600 text-white">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent className="bg-[#131D37] border-slate-600">
              <SelectItem value="all" className="text-white">
                Todos os status
              </SelectItem>
              <SelectItem value="published" className="text-white">
                Publicados
              </SelectItem>
              <SelectItem value="draft" className="text-white">
                Rascunhos
              </SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={handleResetFilters}
              className="text-slate-400 hover:text-white"
            >
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Botão criar curso */}
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white whitespace-nowrap"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Curso
        </Button>
      </div>

      {/* Barra de ações em lote */}
      {selectedIds.length > 0 && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-cyan-600 text-white">
              {selectedIds.length} selecionado{selectedIds.length > 1 ? "s" : ""}
            </Badge>
            <span className="text-sm text-slate-300">
              Aplicar ações em lote:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkPublish}
              disabled={isPending}
              className="border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Publicar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkUnpublish}
              disabled={isPending}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Despublicar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(true)}
              disabled={isPending}
              className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </Button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <CoursesTable
        courses={filteredCourses}
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
      />

      {/* Resultados da busca */}
      {filteredCourses.length === 0 && courses.length > 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">
            Nenhum curso encontrado com os filtros aplicados
          </p>
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className="mt-4 text-cyan-500 hover:text-cyan-400"
          >
            Limpar filtros
          </Button>
        </div>
      )}

      {/* Dialog de criação */}
      <CourseFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        mode="create"
      />

      {/* Dialog de confirmação de deleção em lote */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-[#0F192F] border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Confirmar Exclusão em Lote
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja deletar {selectedIds.length} curso
              {selectedIds.length > 1 ? "s" : ""}? Esta ação não pode ser
              desfeita e todas as aulas associadas também serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-slate-600 text-white hover:bg-slate-700"
              disabled={isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar Todos"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
