"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { CourseFormDialog } from "./course-form-dialog"
import { deleteCourse, togglePublishCourse } from "@/app/actions/courses"
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Loader2,
  Video,
} from "lucide-react"
import Link from "next/link"
import type { CourseFormData } from "@/lib/validations/course"

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
  coming_soon?: boolean
  available_at?: string | null
}

interface CoursesTableProps {
  courses: Course[]
  selectedIds: string[]
  onSelectChange: (ids: string[]) => void
}

export function CoursesTable({
  courses,
  selectedIds,
  onSelectChange,
}: CoursesTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null)

  const allSelected = courses.length > 0 && selectedIds.length === courses.length
  const someSelected = selectedIds.length > 0 && !allSelected

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectChange(courses.map((c) => c.id))
    } else {
      onSelectChange([])
    }
  }

  const handleSelectOne = (courseId: string, checked: boolean) => {
    if (checked) {
      onSelectChange([...selectedIds, courseId])
    } else {
      onSelectChange(selectedIds.filter((id) => id !== courseId))
    }
  }

  const handleTogglePublish = async (course: Course) => {
    setLoadingId(course.id)
    startTransition(async () => {
      const result = await togglePublishCourse(course.id, course.is_published)
      setLoadingId(null)
      if (result.success) {
        router.refresh()
      }
    })
  }

  const handleDeleteClick = (courseId: string) => {
    setCourseToDelete(courseId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return

    startTransition(async () => {
      const result = await deleteCourse(courseToDelete)
      if (result.success) {
        setDeleteDialogOpen(false)
        setCourseToDelete(null)
        // Remove da seleção se estava selecionado
        if (selectedIds.includes(courseToDelete)) {
          onSelectChange(selectedIds.filter((id) => id !== courseToDelete))
        }
        router.refresh()
      }
    })
  }

  const handleEditClick = (course: Course) => {
    setCourseToEdit(course)
    setEditDialogOpen(true)
  }

  const handleEditDialogClose = () => {
    setEditDialogOpen(false)
    setCourseToEdit(null)
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
                <TableHead className="text-white">Área</TableHead>
                <TableHead className="text-white text-center">Aulas</TableHead>
                <TableHead className="text-white text-center">Status</TableHead>
                <TableHead className="text-white text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-40 text-center text-slate-400"
                  >
                    Nenhum curso encontrado
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow
                    key={course.id}
                    className="border-slate-700 hover:bg-[#131D37]"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(course.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(course.id, checked as boolean)
                        }
                        aria-label={`Selecionar ${course.title}`}
                        className="border-slate-600 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="w-16 h-12 rounded overflow-hidden bg-slate-800">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-slate-600" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 max-w-md">
                        <p className="font-medium text-white truncate">
                          {course.title}
                        </p>
                        {course.description && (
                          <p className="text-sm text-slate-400 truncate">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                      >
                        {course.area}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-slate-300">
                        {course.lessons_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublish(course)}
                        disabled={loadingId === course.id}
                        className="h-auto p-0 hover:bg-transparent"
                      >
                        {loadingId === course.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                        ) : course.is_published ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30 cursor-pointer">
                            Publicado
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-slate-600 text-slate-400 hover:bg-slate-700 cursor-pointer"
                          >
                            Rascunho
                          </Badge>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-[#16243F]"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#131D37] border-slate-700 text-white"
                        >
                          <DropdownMenuItem
                            onClick={() => handleEditClick(course)}
                            className="hover:bg-[#16243F] cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Curso
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/cursos/${course.id}/aulas`}
                              className="hover:bg-[#16243F] cursor-pointer"
                            >
                              <Video className="mr-2 h-4 w-4" />
                              Gerenciar Aulas
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/cursos/${course.id}`}
                              className="hover:bg-[#16243F] cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver no Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(course.id)}
                            className="hover:bg-red-500/20 text-red-400 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deletar
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

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0F192F] border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja deletar este curso? Esta ação não pode ser
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
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Edição */}
      {courseToEdit && (
        <CourseFormDialog
          open={editDialogOpen}
          onOpenChange={handleEditDialogClose}
          mode="edit"
          initialData={{
            id: courseToEdit.id,
            title: courseToEdit.title,
            description: courseToEdit.description || "",
            area: courseToEdit.area,
            difficulty: courseToEdit.difficulty as any,
            course_type: courseToEdit.course_type as any,
            price: courseToEdit.price || "",
            tags: courseToEdit.tags || "",
            duration: courseToEdit.duration || "",
            thumbnail_url: courseToEdit.thumbnail_url || "",
            coming_soon: courseToEdit.coming_soon || false,
            available_at: courseToEdit.available_at || null,
          }}
        />
      )}
    </>
  )
}
