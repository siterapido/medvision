"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Video, FileText, Trash2, Edit, GripVertical } from "lucide-react"
import { LessonFormDialog } from "./lesson-form-dialog"
import { deleteLessonAction } from "@/app/actions/lesson-actions"
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

export type LessonData = {
  id: string
  title: string
  description: string | null
  video_url: string | null
  duration_minutes: number | null
  module_title: string
  order_index: number
  materials: any[] | null
  available_at: string | null
}

type LessonManagerProps = {
  courseId: string
  courseTitle: string
  lessons: LessonData[]
}

export function LessonManager({ courseId, courseTitle, lessons: initialLessons }: LessonManagerProps) {
  const router = useRouter()
  const [lessons, setLessons] = useState<LessonData[]>(initialLessons)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<LessonData | null>(null)
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Agrupar aulas por módulo
  const lessonsByModule = lessons.reduce((acc, lesson) => {
    const module = lesson.module_title || "Sem módulo"
    if (!acc[module]) {
      acc[module] = []
    }
    acc[module].push(lesson)
    return acc
  }, {} as Record<string, LessonData[]>)

  const handleDeleteLesson = async () => {
    if (!deletingLessonId) return

    setIsDeleting(true)
    try {
      const result = await deleteLessonAction(deletingLessonId)
      if (result.success) {
        setLessons(lessons.filter((l) => l.id !== deletingLessonId))
        setDeletingLessonId(null)
        router.refresh()
      } else {
        alert(result.error || "Erro ao deletar aula")
      }
    } catch (error) {
      console.error(error)
      alert("Erro ao deletar aula")
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "Sem duração"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ""}`
    }
    return `${mins}min`
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <Card className="bg-[#131D37] border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl">Gerenciar Aulas</CardTitle>
              <CardDescription className="text-slate-400">
                Adicione, edite e organize as aulas do curso <span className="text-cyan-400">{courseTitle}</span>
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Aula
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                {lessons.length} {lessons.length === 1 ? "aula" : "aulas"}
              </Badge>
              <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-400">
                {Object.keys(lessonsByModule).length} {Object.keys(lessonsByModule).length === 1 ? "módulo" : "módulos"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de aulas agrupadas por módulo */}
      {Object.keys(lessonsByModule).length === 0 ? (
        <Card className="bg-[#131D37] border-slate-700">
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <FileText className="h-12 w-12 text-slate-600 mx-auto" />
              <p className="text-slate-400">Nenhuma aula cadastrada ainda</p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                variant="outline"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeira aula
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(lessonsByModule)
            .sort(([, a], [, b]) => (a[0]?.order_index || 0) - (b[0]?.order_index || 0))
            .map(([moduleName, moduleLessons]) => (
              <Card key={moduleName} className="bg-[#131D37] border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-cyan-400">{moduleName}</CardTitle>
                  <CardDescription className="text-slate-500">
                    {moduleLessons.length} {moduleLessons.length === 1 ? "aula" : "aulas"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {moduleLessons
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-4 rounded-lg bg-[#0F192F] border border-slate-700/50 hover:border-slate-600 transition-colors group"
                        >
                          {/* Drag handle */}
                          <div className="cursor-move text-slate-600 group-hover:text-slate-500">
                            <GripVertical className="h-5 w-5" />
                          </div>

                          {/* Número da aula */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                            <span className="text-xs font-semibold text-cyan-400">{index + 1}</span>
                          </div>

                          {/* Info da aula */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-medium truncate">{lesson.title}</h4>
                              {lesson.video_url && (
                                <Video className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              {lesson.duration_minutes && (
                                <>
                                  <span>{formatDuration(lesson.duration_minutes)}</span>
                                  <span>•</span>
                                </>
                              )}
                              {lesson.materials && lesson.materials.length > 0 && (
                                <>
                                  <span>{lesson.materials.length} materiais</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>Ordem: {lesson.order_index}</span>
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingLesson(lesson)}
                              className="text-slate-400 hover:text-white hover:bg-slate-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingLessonId(lesson.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Dialog de criar aula */}
      <LessonFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
        courseId={courseId}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          router.refresh()
        }}
      />

      {/* Dialog de editar aula */}
      {editingLesson && (
        <LessonFormDialog
          open={true}
          onOpenChange={(open) => !open && setEditingLesson(null)}
          mode="edit"
          courseId={courseId}
          initialData={editingLesson}
          onSuccess={() => {
            setEditingLesson(null)
            router.refresh()
          }}
        />
      )}

      {/* Dialog de confirmação de delete */}
      <AlertDialog open={!!deletingLessonId} onOpenChange={(open) => !open && setDeletingLessonId(null)}>
        <AlertDialogContent className="bg-[#0F192F] border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Deletar aula?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação não pode ser desfeita. A aula será removida permanentemente do curso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLesson}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
