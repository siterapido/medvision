"use client"

import { useMemo, useState, type ChangeEvent } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Loader2, Plus, UploadCloud, Video } from "lucide-react"

export type CourseResourceType = "pdf" | "slides" | "checklist" | "link" | "video" | "template" | "outro"

export type LessonMaterial = {
  id: string
  title: string
  type: CourseResourceType
  url: string
  description?: string
}

export type LessonForm = {
  id: string
  title: string
  duration: string
  videoUrl: string
  notes: string
  releaseDate: string
  materials: LessonMaterial[]
}

export type ModuleForm = {
  id: string
  title: string
  releaseDate: string
  lessons: LessonForm[]
}

export type CourseLessonRow = {
  id: string
  title: string
  module_title: string | null
  duration_minutes: number | null
  video_url: string | null
  materials: LessonMaterial[] | null
  available_at: string | null
}

export type CourseRowWithLessons = {
  id: string
  title: string
  description: string | null
  lessons_count: number | null
  thumbnail_url: string | null
  updated_at: string | null
  lessons: CourseLessonRow[] | null
}

type CourseWorkspaceProps = {
  adminName: string
  existingCourses: CourseRowWithLessons[]
}

type StatusMessage = {
  type: "success" | "error"
  message: string
}

const difficultyOptions = ["Iniciante", "Intermediário", "Avançado"]
const courseTypeOptions = [
  { value: "Ondonto GPT", label: "🤖 Ondonto GPT" },
  { value: "Premium", label: "⭐ Cursos Premium" },
]
const materialOptions: { value: CourseResourceType; label: string }[] = [
  { value: "pdf", label: "PDF / Apostila" },
  { value: "slides", label: "Slides" },
  { value: "checklist", label: "Checklist" },
  { value: "template", label: "Template" },
  { value: "video", label: "Vídeo extra" },
  { value: "link", label: "Link externo" },
  { value: "outro", label: "Outro" },
]

const workflowSteps = [
  { id: "basics", title: "Estrutura", helper: "Título, promessa e capa" },
  { id: "lessons", title: "Aulas", helper: "Módulos, vídeos e cronograma" },
  { id: "materials", title: "Revisão", helper: "Anexos e publicação" },
] as const

const darkFieldClass =
  "bg-[#16243F] text-white border border-[#1F2B4B] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-[#06b6d4] focus-visible:border-[#06b6d4]"
const darkSelectTriggerClass =
  "bg-[#16243F] text-white border border-[#1F2B4B] focus-visible:ring-2 focus-visible:ring-[#06b6d4] focus-visible:border-[#06b6d4]"

type WorkflowStep = (typeof workflowSteps)[number]
type WorkflowStepId = WorkflowStep["id"]

const createInitialStepTouched = () =>
  workflowSteps.reduce<Record<WorkflowStepId, boolean>>((acc, step) => {
    acc[step.id] = false
    return acc
  }, {} as Record<WorkflowStepId, boolean>)

type StepErrors = Record<WorkflowStepId, string[]>

const defaultCourse = {
  title: "",
  area: "",
  duration: "12h",
  difficulty: "Intermediário",
  course_type: "Ondonto GPT",
  price: "",
  thumbnailUrl: "",
  description: "",
  tags: "implantodontia, monitoria, IA clínica",
}

const createLesson = (): LessonForm => ({
  id: crypto.randomUUID(),
  title: "Nova aula",
  duration: "20",
  videoUrl: "",
  notes: "",
  releaseDate: "",
  materials: [],
})

const createModule = (index: number): ModuleForm => ({
  id: crypto.randomUUID(),
  title: `Módulo ${index + 1}`,
  releaseDate: "",
  lessons: [createLesson()],
})

export function CourseWorkspace({ adminName, existingCourses }: CourseWorkspaceProps) {
  const [courseBasics, setCourseBasics] = useState({ ...defaultCourse })
  const [modules, setModules] = useState<ModuleForm[]>([createModule(0)])
  const [recentCourses, setRecentCourses] = useState(existingCourses)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [stepTouched, setStepTouched] = useState<Record<WorkflowStepId, boolean>>(createInitialStepTouched)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [materialUploadStates, setMaterialUploadStates] = useState<Record<string, boolean>>({})
  const shortName = adminName.split(" ")[0] ?? adminName
  const isLastStep = currentStep === workflowSteps.length - 1
  const isFirstStep = currentStep === 0
  const currentStepId = workflowSteps[currentStep].id
  const stepErrors = useMemo<StepErrors>(() => {
    const errors: StepErrors = {
      basics: [],
      lessons: [],
      materials: [],
    }

    // Validate basics step
    if (!courseBasics.title.trim()) {
      errors.basics.push("Título do curso é obrigatório")
    }
    if (!courseBasics.area.trim()) {
      errors.basics.push("Área/especialidade é obrigatória")
    }
    if (!courseBasics.description.trim()) {
      errors.basics.push("Descrição do curso é obrigatória")
    }
    if (!courseBasics.thumbnailUrl) {
      errors.basics.push("Imagem de capa é obrigatória")
    }

    // Validate lessons step
    modules.forEach((module, moduleIndex) => {
      if (!module.title.trim()) {
        errors.lessons.push(`Módulo ${moduleIndex + 1}: título é obrigatório`)
      }

      module.lessons.forEach((lesson, lessonIndex) => {
        if (!lesson.title.trim()) {
          errors.lessons.push(`Módulo ${moduleIndex + 1}, Aula ${lessonIndex + 1}: título é obrigatório`)
        }
        if (!lesson.duration.trim() || Number(lesson.duration) <= 0) {
          errors.lessons.push(`Módulo ${moduleIndex + 1}, Aula ${lessonIndex + 1}: duração válida é obrigatória`)
        }
        if (!lesson.videoUrl.trim()) {
          errors.lessons.push(`Módulo ${moduleIndex + 1}, Aula ${lessonIndex + 1}: link do vídeo é obrigatório`)
        }
      })
    })

    // Validate materials - only if materials exist
    modules.forEach((module, moduleIndex) => {
      module.lessons.forEach((lesson, lessonIndex) => {
        lesson.materials.forEach((material, materialIndex) => {
          if (!material.title.trim()) {
            errors.materials.push(`Módulo ${moduleIndex + 1}, Aula ${lessonIndex + 1}, Material ${materialIndex + 1}: título é obrigatório`)
          }
          if (!material.url.trim()) {
            errors.materials.push(`Módulo ${moduleIndex + 1}, Aula ${lessonIndex + 1}, Material ${materialIndex + 1}: URL é obrigatória`)
          }
        })
      })
    })

    return errors
  }, [courseBasics, modules])

  const markStepTouched = (stepId: WorkflowStepId) => {
    setStepTouched((prev) => {
      if (prev[stepId]) return prev
      return { ...prev, [stepId]: true }
    })
  }

  const goToStep = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, workflowSteps.length - 1))
    setCurrentStep(nextIndex)
  }

  const handleNext = () => {
    const errors = stepErrors[currentStepId]
    if (errors?.length) {
      markStepTouched(currentStepId)
      setStatus({ type: "error", message: `Revise os campos obrigatórios da etapa "${workflowSteps[currentStep].title}".` })
      return
    }
    setStatus(null)
    if (!isLastStep) {
      goToStep(currentStep + 1)
    }
  }
  const handlePrev = () => {
    if (!isFirstStep) {
      setStatus(null)
      goToStep(currentStep - 1)
    }
  }

  const totalLessons = useMemo(() => modules.reduce((total, mod) => total + mod.lessons.length, 0), [modules])
  const allMaterials = useMemo(
    () =>
      modules.flatMap((mod) =>
        mod.lessons.flatMap((lesson) =>
          lesson.materials.map((material) => ({
            ...material,
            lessonTitle: lesson.title,
            moduleTitle: mod.title,
          }))
        )
      ),
    [modules]
  )

  const supabase = createClient()

  const handleThumbnailFile = async (file: File) => {
    try {
      setUploadingThumb(true)
      const ext = file.name.split(".").pop() || "jpg"
      const path = `thumbnails/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage.from("course-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("course-assets").getPublicUrl(path)
      const publicUrl = data.publicUrl
      setCourseBasics((prev) => ({ ...prev, thumbnailUrl: publicUrl }))
      setStatus({ type: "success", message: "Imagem enviada. Capa atualizada." })
    } catch (err) {
      console.error(err)
      setStatus({
        type: "error",
        message: "Falha ao enviar imagem. Verifique o bucket 'course-assets' no Supabase.",
      })
    } finally {
      setUploadingThumb(false)
    }
  }

  const handleMaterialFileUpload = async (
    moduleId: string,
    lessonId: string,
    materialId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) {
      return
    }

    setMaterialUploadStates((prev) => ({ ...prev, [materialId]: true }))
    setStatus(null)

    try {
      const ext = file.name.split(".").pop() || "bin"
      const path = `materials/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage.from("course-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from("course-assets").getPublicUrl(path)
      if (!data?.publicUrl) {
        throw new Error("Não foi possível obter a URL pública do arquivo")
      }

      updateMaterial(moduleId, lessonId, materialId, { url: data.publicUrl })
      setStatus({ type: "success", message: `Arquivo "${file.name}" anexado com sucesso.` })
    } catch (error) {
      console.error("Erro ao enviar material:", error)
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível fazer o upload do material. Tente novamente.",
      })
    } finally {
      setMaterialUploadStates((prev) => {
        const next = { ...prev }
        delete next[materialId]
        return next
      })
    }
  }

  const normalizeYouTubeUrl = (url: string) => {
    const trimmed = url.trim()
    const short = trimmed.match(/^https?:\/\/youtu\.be\/([A-Za-z0-9_-]{6,})/)
    if (short) return `https://www.youtube.com/watch?v=${short[1]}`
    const watch = trimmed.match(/[?&]v=([A-Za-z0-9_-]{6,})/)
    if (watch) return `https://www.youtube.com/watch?v=${watch[1]}`
    const shorts = trimmed.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/)
    if (shorts) return `https://www.youtube.com/watch?v=${shorts[1]}`
    return trimmed
  }

  const renderStepAlert = (stepId: WorkflowStepId) => {
    const errors = stepErrors[stepId]
    if (!errors?.length || !stepTouched[stepId]) {
      return null
    }

    const extra = Math.max(errors.length - 3, 0)

    return (
      <Alert variant="destructive" className="border-rose-300/50 bg-rose-50 text-rose-900">
        <AlertCircle className="text-rose-600" />
        <AlertTitle className="text-rose-900">Complete os campos obrigatórios</AlertTitle>
        <AlertDescription>
          <ul className="list-disc space-y-1 pl-4 text-xs text-rose-800 mt-2">
            {errors.slice(0, 3).map((message, index) => (
              <li key={`${stepId}-${index}`}>{message}</li>
            ))}
            {extra > 0 && <li>+{extra} itens pendentes.</li>}
          </ul>
        </AlertDescription>
      </Alert>
    )
  }

  const renderBasicsCard = () => (
    <Card className="rounded-2xl border border-[#24324F] bg-gradient-to-br from-[#0F192F] to-[#131D37] shadow-[0_25px_45px_rgba(3,7,18,0.8)]">
      <CardHeader>
        <CardTitle className="text-white">Cadastro rápido</CardTitle>
        <CardDescription className="text-slate-200">
          {shortName}, preencha os detalhes essenciais do curso. Assim que publicar, ele aparece automaticamente na área de cursos para os alunos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-slate-200 font-semibold">Título do curso</label>
            <Input
              value={courseBasics.title}
              onChange={(event) => handleCourseField("title", event.target.value)}
              placeholder="Ex.: Sedação consciente na prática clínica"
              className="bg-[#16243F] text-white border border-[#1F2B4B] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-[#06b6d4] focus-visible:border-[#06b6d4]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200 font-semibold">Área / especialidade</label>
            <Input
              value={courseBasics.area}
              onChange={(event) => handleCourseField("area", event.target.value)}
              placeholder="Ex.: Cirurgia oral, DTM"
              className="bg-[#16243F] text-white border border-[#1F2B4B] placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-[#06b6d4] focus-visible:border-[#06b6d4]"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm text-slate-200 font-semibold">Tipo de Curso</label>
            <Select value={courseBasics.course_type} onValueChange={(value) => handleCourseField("course_type", value)}>
              <SelectTrigger className={darkSelectTriggerClass}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {courseTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200 font-semibold">Carga horária</label>
            <Input
              value={courseBasics.duration}
              onChange={(event) => handleCourseField("duration", event.target.value)}
              placeholder="12h"
              className={darkFieldClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200 font-semibold">Nível</label>
            <Select value={courseBasics.difficulty} onValueChange={(value) => handleCourseField("difficulty", value)}>
            <SelectTrigger className={darkSelectTriggerClass}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {difficultyOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-slate-200 font-semibold">Investimento sugerido</label>
            <Input
              value={courseBasics.price}
              onChange={(event) => handleCourseField("price", event.target.value)}
              placeholder="Ex.: R$ 1.497"
              className={darkFieldClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200 font-semibold">Thumb / capa</label>
            {courseBasics.thumbnailUrl ? (
              <div className="flex items-center gap-3 rounded-xl border border-[#1F2B4B] bg-[#0F162A] p-3">
                <img src={courseBasics.thumbnailUrl} alt="Capa do curso" className="h-14 w-24 rounded-md object-cover" />
                <span className="text-xs text-slate-400 break-all">{courseBasics.thumbnailUrl}</span>
              </div>
            ) : null}
            <input
              id="thumb-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) await handleThumbnailFile(file)
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl border border-[#1F2B4B] bg-[#16243F] text-white hover:bg-[#1f2d4f]"
              disabled={uploadingThumb}
              onClick={() => document.getElementById("thumb-file")?.click()}
            >
              {uploadingThumb ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando imagem...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" /> Enviar imagem
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-200 font-semibold">Descrição para o catálogo</label>
          <Textarea
            value={courseBasics.description}
            onChange={(event) => handleCourseField("description", event.target.value)}
            rows={4}
            placeholder="Conte em 2-3 frases o resultado clínico, diferenciais e para quem é o curso."
            className={darkFieldClass}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-200 font-semibold">Tags (separe por vírgula)</label>
          <Input
            value={courseBasics.tags}
            onChange={(event) => handleCourseField("tags", event.target.value)}
            placeholder="ex.: implantodontia, fluxo digital, IA"
            className={darkFieldClass}
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge className="border-[#0891b2]/30 bg-[#0891b2]/10 text-[#0891b2]">
            {totalLessons} aulas mapeadas
          </Badge>
          <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-slate-700">Tipo {courseBasics.course_type}</span>
          <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-slate-700">Nível {courseBasics.difficulty}</span>
        </div>
      </CardContent>
    </Card>
  )

  const renderModulesCard = () => (
    <Card className="rounded-2xl border border-[#24324F] bg-[#0F192F] shadow-[0_25px_45px_rgba(3,7,18,0.8)]">
      <CardHeader>
        <CardTitle className="text-white">Módulos e aulas</CardTitle>
        <CardDescription className="text-slate-300">
          Estruture cada aula com link do vídeo, objetivos e anexos. Essa estrutura vai direito para o player do aluno.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {modules.map((module) => {
          const moduleTitleError = stepTouched.lessons && !module.title.trim()
          return (
          <div key={module.id} className="rounded-2xl border border-[#1F2B4B] bg-[#131d37] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-3">
                  <Input
                    value={module.title}
                    onChange={(event) => updateModule(module.id, { title: event.target.value })}
                    className={darkFieldClass}
                    placeholder="Nome do módulo"
                  />
                  <Input
                    type="date"
                    value={module.releaseDate}
                    onChange={(event) => updateModule(module.id, { releaseDate: event.target.value })}
                    className={darkFieldClass}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => addLesson(module.id)} className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50">
                    <Plus className="h-4 w-4" /> Aula
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeModuleBlock(module.id)}
                    className="rounded-xl text-slate-500 hover:text-slate-900"
                    disabled={modules.length === 1}
                  >
                    Remover
                  </Button>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {module.lessons.map((lesson, lessonIndex) => {
                  const lessonTitleError = stepTouched.lessons && !lesson.title.trim()
                  const lessonDurationError = stepTouched.lessons && !lesson.duration.trim()
                  const lessonVideoError = stepTouched.lessons && !lesson.videoUrl.trim()
                  return (
                    <div key={lesson.id} className="rounded-2xl border border-[#1F2B4B] bg-[#16243F] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#0e7490]">Aula {lessonIndex + 1}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLesson(module.id, lesson.id)}
                          className="text-xs text-slate-500 hover:text-slate-900"
                          disabled={module.lessons.length === 1}
                        >
                          Remover aula
                        </Button>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wide text-slate-400">Nome da aula</label>
                          <Input
                            value={lesson.title}
                            onChange={(event) => updateLesson(module.id, lesson.id, { title: event.target.value })}
                            className={darkFieldClass}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wide text-slate-400">Duração (min)</label>
                            <Input
                              type="number"
                              min={1}
                              value={lesson.duration}
                              onChange={(event) => updateLesson(module.id, lesson.id, { duration: event.target.value })}
                              className={darkFieldClass}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wide text-slate-400">Liberação</label>
                            <Input
                              type="date"
                              value={lesson.releaseDate}
                              onChange={(event) => updateLesson(module.id, lesson.id, { releaseDate: event.target.value })}
                              className={darkFieldClass}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-400">Link do vídeo (YouTube)</label>
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-[#0891b2]" />
                          <Input
                            value={lesson.videoUrl}
                            onChange={(event) => updateLesson(module.id, lesson.id, { videoUrl: event.target.value })}
                            onBlur={(event) =>
                              updateLesson(module.id, lesson.id, { videoUrl: normalizeYouTubeUrl(event.target.value) })
                            }
                            placeholder="Cole o link do YouTube (watch, youtu.be ou shorts)"
                            className={darkFieldClass}
                          />
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-400">Resumo / objetivo da aula</label>
                        <Textarea
                          value={lesson.notes}
                          onChange={(event) => updateLesson(module.id, lesson.id, { notes: event.target.value })}
                          rows={2}
                          className={darkFieldClass}
                        />
                      </div>
                      <Collapsible className="mt-4">
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50">
                            <Plus className="mr-1 h-4 w-4" /> Gerenciar materiais ({lesson.materials.length})
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          {lesson.materials.map((material) => {
                            const isMaterialUploading = materialUploadStates[material.id] ?? false
                            const materialFileInputId = `material-file-${material.id}`
                            return (
                              <div key={material.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="grid gap-3 md:grid-cols-3">
                                  <div className="space-y-2">
                                    <label className="text-xs text-slate-400">Título</label>
                                    <Input
                                      value={material.title}
                                      onChange={(event) =>
                                        updateMaterial(module.id, lesson.id, material.id, { title: event.target.value })
                                      }
                                      className={darkFieldClass}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs text-slate-400">Tipo</label>
                                    <Select
                                      value={material.type}
                                      onValueChange={(value: CourseResourceType) =>
                                        updateMaterial(module.id, lesson.id, material.id, { type: value })
                                      }
                                    >
                              <SelectTrigger className={darkSelectTriggerClass}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {materialOptions.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs text-slate-400">URL / arquivo</label>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        value={material.url}
                                        onChange={(event) =>
                                          updateMaterial(module.id, lesson.id, material.id, { url: event.target.value })
                                        }
                                        placeholder="https://..."
                                        className={`${darkFieldClass} flex-1`}
                                      />
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="flex items-center gap-1 rounded-xl border-slate-300 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 hover:bg-slate-50"
                                        onClick={() => document.getElementById(materialFileInputId)?.click()}
                                        disabled={isMaterialUploading}
                                      >
                                        {isMaterialUploading ? (
                                          <Loader2 className="h-4 w-4 animate-spin text-[#0891b2]" />
                                        ) : (
                                          <UploadCloud className="h-4 w-4 text-[#0891b2]" />
                                        )}
                                        {isMaterialUploading ? "Enviando" : "Upload"}
                                      </Button>
                                    </div>
                                    <input
                                      id={materialFileInputId}
                                      type="file"
                                      className="hidden"
                                      accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-7z-compressed,image/*"
                                      onChange={(event) =>
                                        handleMaterialFileUpload(module.id, lesson.id, material.id, event)
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="mt-3 grid gap-2">
                                  <Textarea
                                    value={material.description ?? ""}
                                    onChange={(event) =>
                                      updateMaterial(module.id, lesson.id, material.id, { description: event.target.value })
                                    }
                                    rows={2}
                                    placeholder="Resumo ou instruções de uso"
                                    className={darkFieldClass}
                                  />
                                  <div className="flex justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs text-rose-700 hover:text-rose-800"
                                      onClick={() => removeMaterial(module.id, lesson.id, material.id)}
                                    >
                                      Remover material
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-dashed border-slate-300 text-slate-700 hover:bg-slate-50"
                        onClick={() => addMaterial(module.id, lesson.id)}
                      >
                        <Plus className="mr-1 h-4 w-4" /> Adicionar material
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                  </div>
                )
              })}
              </div>
            </div>
          )
        })}
        <Button
          type="button"
          variant="outline"
          onClick={addModuleBlock}
          className="w-full rounded-xl border-dashed border-slate-300 py-6 text-slate-700 hover:bg-slate-50"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo módulo
        </Button>
      </CardContent>
    </Card>
  )

  const renderPreviewCard = () => null

  const renderMaterialsCard = () => (
    <Card className="rounded-2xl border border-[#0891b2]/20 bg-white">
      <CardHeader>
        <CardTitle className="text-[#0e7490]">Materiais anexados</CardTitle>
        <CardDescription className="text-slate-600">
          {allMaterials.length
            ? "Arquivos serão listados na aula correspondente."
            : "Adicione checklists, PDFs e links para cada aula."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {allMaterials.length ? (
          <ScrollArea className="max-h-72">
            <div className="space-y-3 pr-2">
              {allMaterials.map((material) => (
                <div key={material.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <UploadCloud className="h-4 w-4 text-[#0891b2]" />
                    <span className="font-medium text-slate-900">{material.title}</span>
                    <Badge className="border-slate-200 bg-slate-50 text-xs capitalize text-slate-700">
                      {material.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {material.moduleTitle} · {material.lessonTitle}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-600">{material.url || "Sem link"}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            Nenhum material anexado ainda. Use o botão dentro de cada aula para subir PDFs, checklists e templates.
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderRecentCoursesCard = () => (
    <Card className="rounded-2xl border border-[#0891b2]/20 bg-white">
      <CardHeader>
        <CardTitle className="text-[#0e7490]">Últimos cursos cadastrados</CardTitle>
        <CardDescription className="text-slate-600">
          Referência rápida para garantir consistência de tom e estrutura.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentCourses.length === 0 && (
          <p className="text-sm text-slate-600">Nenhum curso disponível ainda.</p>
        )}
        {recentCourses.slice(0, 4).map((course) => (
          <div key={course.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{course.title}</p>
              <span className="text-xs text-slate-500">{course.lessons_count ?? 0} aulas</span>
            </div>
            <p className="mt-1 text-xs text-slate-600 line-clamp-2">
              {course.description || "Sem descrição"}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )

  const renderReviewSummaryCard = () => (
    <Card className="rounded-2xl border border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-[#0e7490]">Checklist final</CardTitle>
        <CardDescription className="text-slate-600">
          Revise antes de liberar para o catálogo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-700">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-600">Título</p>
            <p className="font-semibold text-slate-900">{courseBasics.title || "Sem título"}</p>
          </div>
          <Badge className="border-[#0891b2]/30 bg-[#0891b2]/10 text-[#0e7490]">{courseBasics.course_type}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-600">Módulos / aulas</p>
            <p className="text-xl font-semibold text-[#0891b2]">{modules.length} / {totalLessons}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-600">Materiais anexados</p>
            <p className="text-xl font-semibold text-[#0891b2]">{allMaterials.length}</p>
          </div>
        </div>
        <p className="text-xs text-slate-600">
          Dica: use o botão &quot;Próxima etapa&quot; para voltar e ajustar qualquer informação antes de publicar.
        </p>
      </CardContent>
    </Card>
  )

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div className="space-y-4">
          {renderStepAlert("basics")}
          {renderBasicsCard()}
        </div>
      )
    }

    if (currentStep === 1) {
      return (
        <div className="space-y-4">
          {renderStepAlert("lessons")}
          <div className="space-y-6">{renderModulesCard()}</div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {renderStepAlert("materials")}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {renderMaterialsCard()}
          </div>
          <div className="space-y-6">
            {renderReviewSummaryCard()}
            {renderRecentCoursesCard()}
          </div>
        </div>
      </div>
    )
  }

  const handleCourseField = (field: keyof typeof defaultCourse, value: string) => {
    setCourseBasics((prev) => ({ ...prev, [field]: value }))
  }

  const updateModule = (moduleId: string, patch: Partial<ModuleForm>) => {
    setModules((prev) => prev.map((module) => (module.id === moduleId ? { ...module, ...patch } : module)))
  }

  const updateLesson = (moduleId: string, lessonId: string, patch: Partial<LessonForm>) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.id !== moduleId) return module
        return {
          ...module,
          lessons: module.lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, ...patch } : lesson)),
        }
      })
    )
  }

  const addLesson = (moduleId: string) => {
    setModules((prev) =>
      prev.map((module) => (module.id === moduleId ? { ...module, lessons: [...module.lessons, createLesson()] } : module))
    )
  }

  const removeLesson = (moduleId: string, lessonId: string) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.id !== moduleId) return module
        const filtered = module.lessons.filter((lesson) => lesson.id !== lessonId)
        return { ...module, lessons: filtered.length ? filtered : [createLesson()] }
      })
    )
  }

  const addModuleBlock = () => {
    setModules((prev) => [...prev, createModule(prev.length)])
  }

  const removeModuleBlock = (moduleId: string) => {
    setModules((prev) => (prev.length === 1 ? prev : prev.filter((module) => module.id !== moduleId)))
  }

  const addMaterial = (moduleId: string, lessonId: string) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.id !== moduleId) return module
        return {
          ...module,
          lessons: module.lessons.map((lesson) =>
            lesson.id === lessonId
              ? {
                  ...lesson,
                  materials: [
                    ...lesson.materials,
                    {
                      id: crypto.randomUUID(),
                      title: "Checklist",
                      type: "pdf",
                      url: "",
                      description: "",
                    },
                  ],
                }
              : lesson
          ),
        }
      })
    )
  }

  const updateMaterial = (moduleId: string, lessonId: string, materialId: string, patch: Partial<LessonMaterial>) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.id !== moduleId) return module
        return {
          ...module,
          lessons: module.lessons.map((lesson) => {
            if (lesson.id !== lessonId) return lesson
            return {
              ...lesson,
              materials: lesson.materials.map((material) =>
                material.id === materialId ? { ...material, ...patch } : material
              ),
            }
          }),
        }
      })
    )
  }

  const removeMaterial = (moduleId: string, lessonId: string, materialId: string) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.id !== moduleId) return module
        return {
          ...module,
          lessons: module.lessons.map((lesson) => {
            if (lesson.id !== lessonId) return lesson
            return {
              ...lesson,
              materials: lesson.materials.filter((material) => material.id !== materialId),
            }
          }),
        }
      })
    )
  }

  const resetForms = () => {
    setCourseBasics({ ...defaultCourse })
    setModules([createModule(0)])
    setStepTouched(createInitialStepTouched())
    setStatus(null)
    setCurrentStep(0)
  }

  const handlePublish = async () => {
    const blockingStep = workflowSteps.find((step) => stepErrors[step.id]?.length)
    if (blockingStep) {
      markStepTouched(blockingStep.id)
      setStatus({ type: "error", message: `Finalize os campos obrigatórios da etapa "${blockingStep.title}" antes de publicar.` })
      const targetIndex = workflowSteps.findIndex((step) => step.id === blockingStep.id)
      goToStep(targetIndex)
      return
    }

    setSaving(true)
    setStatus(null)

    try {
      // Calculate total duration from all lessons
      const totalDurationMinutes = modules.reduce((total, module) => {
        return total + module.lessons.reduce((sum, lesson) => {
          return sum + (Number(lesson.duration) || 0)
        }, 0)
      }, 0)
      const totalHours = Math.floor(totalDurationMinutes / 60)
      const remainingMinutes = totalDurationMinutes % 60
      const durationText = remainingMinutes > 0
        ? `${totalHours}h${remainingMinutes}min`
        : `${totalHours}h`

      const courseInsert = {
        title: courseBasics.title.trim(),
        description: courseBasics.description.trim(),
        thumbnail_url: courseBasics.thumbnailUrl,
        area: courseBasics.area.trim() || null,
        difficulty: courseBasics.difficulty,
        course_type: courseBasics.course_type,
        price: courseBasics.price.trim() || null,
        tags: courseBasics.tags.trim() || null,
        duration: courseBasics.duration || durationText,
        lessons_count: 0, // Will be updated by trigger
        is_published: true,
      }

      const { data: newCourse, error: courseError } = await supabase
        .from("courses")
        .insert(courseInsert)
        .select("id, title, description, area, difficulty, course_type, price, tags, duration, lessons_count, thumbnail_url, is_published, published_at, updated_at")
        .single()

      if (courseError) {
        console.error("Course insert error:", courseError)
        throw new Error(`Erro ao criar curso: ${courseError.message}`)
      }

      const lessonsPayload = modules.flatMap((module, moduleIndex) =>
        module.lessons.map((lesson, lessonIndex) => ({
          course_id: newCourse.id,
          title: lesson.title.trim() || `Aula ${lessonIndex + 1}`,
          description: lesson.notes.trim() || null,
          video_url: lesson.videoUrl || null,
          order_index: moduleIndex * 100 + lessonIndex,
          duration_minutes: Number(lesson.duration) || null,
          module_title: module.title,
          materials: lesson.materials.map(({ id: _id, ...rest }) => rest),
          available_at: lesson.releaseDate ? new Date(lesson.releaseDate).toISOString() : null,
        }))
      )

      let insertedLessons: any[] = []
      if (lessonsPayload.length) {
        const { data: lessonData, error: lessonError } = await supabase
          .from("lessons")
          .insert(lessonsPayload)
          .select("id, title, module_title, duration_minutes, video_url, materials, available_at, order_index")

        if (lessonError) {
          console.error("Lesson insert error:", lessonError)
          // Try to cleanup the created course
          await supabase.from("courses").delete().eq("id", newCourse.id)
          throw new Error(`Erro ao criar aulas: ${lessonError.message}`)
        }
        insertedLessons = lessonData || []
      }

      // Insert course resources if there are materials
      const resourcesPayload = modules.flatMap((module, moduleIndex) =>
        module.lessons.flatMap((lesson, lessonIndex) => {
          const insertedLesson = insertedLessons.find(
            (inserted) => inserted.order_index === moduleIndex * 100 + lessonIndex
          )

          if (!insertedLesson) {
            console.warn(`Lesson not found for module ${moduleIndex}, lesson ${lessonIndex}`)
            return []
          }

          return lesson.materials.map((material, materialIndex) => ({
            course_id: newCourse.id,
            lesson_id: insertedLesson.id,
            title: material.title.trim(),
            resource_type: material.type,
            description: material.description?.trim() || null,
            url: material.url.trim(),
            position: moduleIndex * 100 + lessonIndex * 10 + materialIndex,
          }))
        })
      ).filter(r => r.lesson_id) // Remove any without lesson_id

      if (resourcesPayload.length > 0) {
        const { error: resourceError } = await supabase
          .from("course_resources")
          .insert(resourcesPayload)

        if (resourceError) {
          console.error("Resource insert error:", resourceError)
          // Don't fail the whole operation for resources, just warn
          console.warn("Alguns materiais não puderam ser salvos:", resourceError.message)
        }
      }

      const normalizedLessons: CourseLessonRow[] = insertedLessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        module_title: lesson.module_title,
        duration_minutes: lesson.duration_minutes,
        video_url: lesson.video_url,
        materials: lesson.materials as LessonMaterial[],
        available_at: lesson.available_at,
      }))

      setRecentCourses((prev) => [
        {
          ...newCourse,
          lessons: normalizedLessons,
        },
        ...prev,
      ])

      const successMessage = resourcesPayload.length > 0
        ? `✓ Curso publicado com sucesso! ${insertedLessons.length} aulas e ${resourcesPayload.length} materiais foram adicionados.`
        : `✓ Curso publicado com sucesso! ${insertedLessons.length} aulas foram adicionadas.`

      setStatus({ type: "success", message: successMessage })

      // Reset form after a short delay to let user see the success message
      setTimeout(() => {
        resetForms()
      }, 2000)
    } catch (error) {
      console.error("Error publishing course:", error)
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o curso. Revise os campos obrigatórios."
      setStatus({ type: "error", message })
    } finally {
      setSaving(false)
    }
  }

  const completionPercentage = Math.round(((currentStep + 1) / workflowSteps.length) * 100)

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-sky-200/50 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-900 font-bold">Fluxo guiado</CardTitle>
          <CardDescription className="text-slate-600">
            Publique em {workflowSteps.length} etapas sem sair desta tela.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {workflowSteps.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              const hasErrors = stepTouched[step.id] && (stepErrors[step.id]?.length ?? 0) > 0
              const baseStyles = hasErrors
                ? "border-rose-300/50 bg-rose-50"
                : isActive
                  ? "border-sky-300/60 bg-sky-50"
                  : isCompleted
                    ? "border-emerald-300/50 bg-emerald-50"
                    : "border-slate-200 bg-white"
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    markStepTouched(step.id)
                    goToStep(index)
                  }}
                  className={cn("rounded-xl border px-4 py-3 text-left transition", baseStyles)}
                >
                  <p className="text-xs uppercase tracking-wide text-slate-600">Etapa {index + 1}</p>
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  <p className="text-xs text-slate-600">{step.helper}</p>
                  {hasErrors && (
                    <p className="mt-2 flex items-center gap-1 text-xs font-medium text-rose-900">
                      <AlertCircle className="h-3.5 w-3.5" /> Campos obrigatórios pendentes
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {renderStepContent()}

      {status && (
        <div
          className={`rounded-xl border px-4 py-4 text-sm ${
            status.type === "success"
              ? "border-emerald-300/50 bg-emerald-50 text-emerald-900"
              : "border-rose-300/50 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {status.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600" />
            )}
            <span className="font-medium">{status.message}</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-600">
            Etapa {currentStep + 1} de {workflowSteps.length}
          </p>
          <p className="text-sm text-slate-900">{workflowSteps[currentStep].title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            className="text-sm text-slate-600 hover:text-slate-900"
            onClick={resetForms}
            disabled={saving}
          >
            Resetar formulário
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-slate-300 text-slate-900 hover:bg-slate-50"
            onClick={handlePrev}
            disabled={isFirstStep}
          >
            Voltar
          </Button>
          {isLastStep ? (
            <Button
              onClick={handlePublish}
              disabled={saving}
              variant="blue"
              className="rounded-xl px-6"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {saving ? "Publicando" : "Publicar curso"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              variant="blue"
              className="rounded-xl px-6"
            >
              Próxima etapa
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
