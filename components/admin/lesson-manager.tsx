"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Edit, FileText, GripVertical, Loader2, Plus, Trash2, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LessonFormDialog } from "@/components/admin/lesson-form-dialog"
import { ModuleFormDialog } from "@/components/admin/module-form-dialog"
import {
  deleteLessonAction,
  deleteModuleAction,
} from "@/app/actions/lesson-actions"
import type { LessonMaterialData } from "@/lib/validations/lesson"

export type LessonData = {
  id: string
  title: string
  description: string | null
  video_url: string | null
  duration_minutes: number | null
  module_title: string
  module_id: string | null
  order_index: number
  materials: LessonMaterialData[]
  available_at: string | null
}

export type ModuleWithLessons = {
  id: string | null
  title: string
  description: string | null
  order_index: number
  lessons: LessonData[]
}

interface LessonManagerProps {
  courseId: string
  courseTitle: string
  modules: ModuleWithLessons[]
  modulesEnabled?: boolean
}

export function LessonManager({ courseId, courseTitle, modules, modulesEnabled }: LessonManagerProps) {
  const isModulesEnabled = modulesEnabled ?? true
  const modulesDisabledTitle =
    "Ative a tabela lesson_modules (migration 013) no banco para criar e editar módulos."
  const courseDashboardHref = `/dashboard/cursos/${encodeURIComponent(courseId)}`

  const router = useRouter()
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<LessonData | null>(null)
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null)
  const [isDeletingLesson, setIsDeletingLesson] = useState(false)
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<ModuleWithLessons | null>(null)
  const [moduleDeleteTarget, setModuleDeleteTarget] = useState<ModuleWithLessons | null>(null)
  const [isDeletingModule, setIsDeletingModule] = useState(false)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(
    modules[0]?.id ?? null
  )

  useEffect(() => {
    setActiveModuleId(modules[0]?.id ?? null)
  }, [modules])

  const allLessons = modules.flatMap((module) => module.lessons)
  const now = new Date()
  const moduleCount = modules.filter((module) => module.id !== null).length
  const videoCount = allLessons.filter((lesson) => Boolean(lesson.video_url)).length
  const upcomingCount = allLessons.filter((lesson) => {
    if (!lesson.available_at) return false
    const when = new Date(lesson.available_at)
    return when > now
  }).length

  const moduleOptions = modules.map((module) => ({
    id: module.id,
    title: module.title,
  }))
  const moduleKey = moduleOptions.map((module) => module.id ?? "null").join(",")
  const lessonDialogKey = `${editingLesson?.id ?? "new"}-${activeModuleId ?? "null"}-${moduleKey}`

  const openLessonDialog = (moduleId: string | null | undefined) => {
    setActiveModuleId(moduleId ?? null)
    setEditingLesson(null)
    setIsLessonDialogOpen(true)
  }

  const handleDeleteLesson = async () => {
    if (!deletingLessonId) return
    setIsDeletingLesson(true)
    try {
      const result = await deleteLessonAction(deletingLessonId)
      if (result.success) {
        setDeletingLessonId(null)
        router.refresh()
      } else {
        alert(result.error || "Erro ao deletar aula")
      }
    } catch (error) {
      console.error(error)
      alert("Erro ao deletar aula")
    } finally {
      setIsDeletingLesson(false)
    }
  }

  const handleDeleteModule = async () => {
    if (!moduleDeleteTarget?.id) return
    setIsDeletingModule(true)
    try {
      const result = await deleteModuleAction(moduleDeleteTarget.id)
      if (result.success) {
        setModuleDeleteTarget(null)
        router.refresh()
      } else {
        alert(result.error || "Erro ao deletar módulo")
      }
    } catch (error) {
      console.error(error)
      alert("Erro ao deletar módulo")
    } finally {
      setIsDeletingModule(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#131D37] border-slate-700">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white text-2xl">Gerenciar Aulas</CardTitle>
              <CardDescription className="text-slate-400">
                Organize módulos e aulas do curso&nbsp;
                <span className="text-cyan-400">{courseTitle}</span>.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  if (!isModulesEnabled) return
                  setEditingModule(null)
                  setIsModuleDialogOpen(true)
                }}
                disabled={!isModulesEnabled}
                variant="solid"
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                title={!isModulesEnabled ? modulesDisabledTitle : undefined}
              >
                <Plus className="h-4 w-4" />
                Novo módulo
              </Button>
              <Button
                onClick={() => openLessonDialog(activeModuleId)}
                variant="outline"
                className="border-cyan-500/60 text-cyan-400 hover:bg-cyan-500/10"
              >
                <Plus className="h-4 w-4" />
                Nova aula
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
              {allLessons.length} {allLessons.length === 1 ? "aula" : "aulas"}
            </Badge>
            <Badge className="bg-slate-800 text-slate-200 border-slate-700">
              {moduleCount} {moduleCount === 1 ? "módulo" : "módulos"}
            </Badge>
            <Badge className="bg-emerald-700/10 text-emerald-300 border-emerald-500/40">
              {videoCount} vídeo{videoCount === 1 ? "" : "s"}
            </Badge>
            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/40">
              {upcomingCount} agendada{upcomingCount === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {modules.length === 0 ? (
        <Card className="bg-[#131D37] border-slate-700">
          <CardContent className="py-12 text-center space-y-3">
            <FileText className="h-12 w-12 text-slate-600 mx-auto" />
            <p className="text-slate-400">Nenhum módulo ou aula cadastrado ainda.</p>
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => {
                  setEditingModule(null)
                  setIsModuleDialogOpen(true)
                }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Plus className="h-4 w-4" />
                Criar módulo
              </Button>
              <Button
                variant="outline"
                onClick={() => openLessonDialog(null)}
                className="border-slate-600 text-white hover:bg-slate-800"
              >
                Adicionar aula
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Comece criando um módulo para depois organizar o conteúdo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {modules.map((module) => (
            <Card key={module.id ?? "sem-modulo"} className="bg-[#131D37] border-slate-700">
              <CardHeader className="flex flex-col gap-3 pb-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg text-cyan-400 leading-tight">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-sm">
                      {module.description || (module.id === null ? "Aulas sem módulo definido" : "Módulo organizado")}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-slate-800 text-slate-200 border-slate-700/50">
                      {module.lessons.length} {module.lessons.length === 1 ? "aula" : "aulas"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openLessonDialog(module.id)}
                      className="border-slate-600 text-slate-200 hover:bg-slate-800"
                    >
                      Adicionar aula
                    </Button>
                    {module.id && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingModule(module)
                            setIsModuleDialogOpen(true)
                          }}
                          className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setModuleDeleteTarget(module)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {module.lessons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-slate-700 rounded-2xl bg-slate-900/40 p-8 text-center">
                    <p className="text-slate-400">Este módulo ainda não tem aulas.</p>
                    <Button
                      variant="outline"
                      onClick={() => openLessonDialog(module.id)}
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeira aula
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {module.lessons
                      .slice()
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-4 rounded-lg bg-[#0F192F] border border-slate-700/50 hover:border-slate-600 transition-colors group"
                        >
                          <div className="cursor-move text-slate-600 group-hover:text-slate-500">
                            <GripVertical className="h-5 w-5" />
                          </div>
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-400">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-medium truncate">{lesson.title}</h4>
                              {lesson.video_url && (
                                <Video className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                              {lesson.duration_minutes && (
                                <>
                                  <span>{Math.floor(lesson.duration_minutes / 60) > 0 ? `${Math.floor(lesson.duration_minutes / 60)}h${lesson.duration_minutes % 60 > 0 ? ` ${lesson.duration_minutes % 60}min` : ""}` : `${lesson.duration_minutes}min`}</span>
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
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="border-cyan-500/40 text-cyan-100 hover:bg-cyan-500/10"
                            >
                              <Link href={`${courseDashboardHref}?lesson=${encodeURIComponent(lesson.id)}`}>
                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                Ver no curso
                              </Link>
                            </Button>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingLesson(lesson)
                                  setIsLessonDialogOpen(true)
                                }}
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
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LessonFormDialog
        key={lessonDialogKey}
        open={isLessonDialogOpen}
        onOpenChange={(open) => {
          setIsLessonDialogOpen(open)
          if (!open) setEditingLesson(null)
        }}
        mode={editingLesson ? "edit" : "create"}
        courseId={courseId}
        modules={moduleOptions}
        defaultModuleId={activeModuleId}
        initialData={
          editingLesson
            ? {
                ...editingLesson,
              }
            : undefined
        }
        onSuccess={() => {
          setIsLessonDialogOpen(false)
          setEditingLesson(null)
          router.refresh()
        }}
      />

      {isModulesEnabled && (
        <ModuleFormDialog
          key={editingModule?.id ?? "new"}
          open={isModuleDialogOpen}
          onOpenChange={(open) => {
            setIsModuleDialogOpen(open)
            if (!open) setEditingModule(null)
          }}
          mode={editingModule ? "edit" : "create"}
          courseId={courseId}
          initialData={
            editingModule
              ? {
                  id: editingModule.id ?? undefined,
                  title: editingModule.title,
                  description: editingModule.description,
                  order_index: editingModule.order_index,
                }
              : undefined
          }
          onSuccess={() => {
            setIsModuleDialogOpen(false)
            setEditingModule(null)
            router.refresh()
          }}
        />
      )}

      <AlertDialog
        open={!!deletingLessonId}
        onOpenChange={(open) => !open && setDeletingLessonId(null)}
      >
        <AlertDialogContent className="bg-[#0F192F] border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Deletar aula?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação é permanente e remove o conteúdo da plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeletingLesson}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLesson}
              disabled={isDeletingLesson}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingLesson ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar aula"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!moduleDeleteTarget}
        onOpenChange={(open) => !open && setModuleDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-[#0F192F] border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir módulo?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              O módulo será removido e as aulas ficarão sem associação definida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeletingModule}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteModule}
              disabled={isDeletingModule}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingModule ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir módulo"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
