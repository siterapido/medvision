"use client"

import { useMemo, useState } from "react"
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
  duration: string | null
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
const formatOptions = ["100% online", "Híbrido", "Presencial"]
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
  format: "Híbrido",
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
  const shortName = adminName.split(" ")[0] ?? adminName
  const isLastStep = currentStep === workflowSteps.length - 1
  const isFirstStep = currentStep === 0
  const currentStepId = workflowSteps[currentStep].id
  const stepErrors = useMemo<StepErrors>(() => {
    const basicsErrors: string[] = []
    if (!courseBasics.title.trim()) basicsErrors.push("Informe o título do curso.")
    if (!courseBasics.area.trim()) basicsErrors.push("Defina a área ou especialidade.")
    if (!courseBasics.duration.trim()) basicsErrors.push("Informe a carga horária.")
    if (!courseBasics.description.trim()) basicsErrors.push("Escreva a descrição para o catálogo.")
    if (!courseBasics.thumbnailUrl.trim()) basicsErrors.push("Adicione a URL da capa/thumbnail.")

    const lessonsErrors: string[] = []
    const isYouTubeUrl = (url: string) => {
      const yt = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i
      return yt.test(url.trim())
    }

    modules.forEach((module, moduleIndex) => {
      if (!module.title.trim()) {
        lessonsErrors.push(`Nome do módulo ${moduleIndex + 1} é obrigatório.`)
      }

      module.lessons.forEach((lesson, lessonIndex) => {
        if (!lesson.title.trim()) {
          lessonsErrors.push(`Aula ${lessonIndex + 1} do módulo ${moduleIndex + 1} precisa de título.`)
        }
        if (!lesson.duration.trim()) {
          lessonsErrors.push(`Informe a duração da aula ${lessonIndex + 1} no módulo ${moduleIndex + 1}.`)
        }
        if (!lesson.videoUrl.trim()) {
          lessonsErrors.push(`Inclua o link do YouTube da aula ${lessonIndex + 1} no módulo ${moduleIndex + 1}.`)
        } else if (!isYouTubeUrl(lesson.videoUrl)) {
          lessonsErrors.push(`Use um link válido do YouTube na aula ${lessonIndex + 1} do módulo ${moduleIndex + 1}.`)
        }
      })
    })

    const materialsErrors: string[] = []
    modules.forEach((module, moduleIndex) => {
      module.lessons.forEach((lesson, lessonIndex) => {
        lesson.materials.forEach((material, materialIndex) => {
          if (!material.title.trim()) {
            materialsErrors.push(
              `Material ${materialIndex + 1} da aula ${lessonIndex + 1} no módulo ${moduleIndex + 1} precisa de título.`
            )
          }
          if (!material.url.trim()) {
            materialsErrors.push(
              `Material ${materialIndex + 1} da aula ${lessonIndex + 1} no módulo ${moduleIndex + 1} precisa de link ou arquivo.`
            )
          }
        })
      })
    })

    return {
      basics: basicsErrors,
      lessons: lessonsErrors,
      materials: materialsErrors,
    }
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
    <Card className="rounded-2xl border border-[#24324F] bg-gradient-to-br from-[#131D37] to-[#16243F]">
      <CardHeader>
        <CardTitle className="text-white">Cadastro rápido</CardTitle>
        <CardDescription className="text-[#cbd5e1]/70">
          {shortName}, preencha os detalhes essenciais do curso. Assim que publicar, ele aparece automaticamente na área de cursos para os alunos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-white font-semibold">Título do curso <span className="text-rose-400">*</span></label>
            <Input
              value={courseBasics.title}
              onChange={(event) => handleCourseField("title", event.target.value)}
              placeholder="Ex.: Sedação consciente na prática clínica"
              className={cn("bg-white text-slate-900 border-[#24324F] placeholder:text-slate-400 focus-visible:ring-[#0891b2]/50", stepTouched.basics && !courseBasics.title.trim() && "border border-rose-400/60 focus-visible:ring-rose-400/40")}
              aria-invalid={stepTouched.basics && !courseBasics.title.trim()}
            />
            {stepTouched.basics && !courseBasics.title.trim() && (
              <p className="text-xs text-rose-300">Informe o título do curso.</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white font-semibold">Área / especialidade <span className="text-rose-400">*</span></label>
            <Input
              value={courseBasics.area}
              onChange={(event) => handleCourseField("area", event.target.value)}
              placeholder="Ex.: Cirurgia oral, DTM"
              className={cn("bg-white text-slate-900 border-sky-600/50 placeholder:text-slate-400", stepTouched.basics && !courseBasics.area.trim() && "border border-rose-400/60 focus-visible:ring-rose-400/40")}
              aria-invalid={stepTouched.basics && !courseBasics.area.trim()}
            />
            {stepTouched.basics && !courseBasics.area.trim() && (
              <p className="text-xs text-rose-300">Defina a especialidade principal.</p>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm text-white font-semibold">Formato</label>
            <Select value={courseBasics.format} onValueChange={(value) => handleCourseField("format", value)}>
              <SelectTrigger className="bg-white text-slate-900 border-sky-600/50">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white font-semibold">Carga horária <span className="text-rose-400">*</span></label>
            <Input
              value={courseBasics.duration}
              onChange={(event) => handleCourseField("duration", event.target.value)}
              placeholder="12h"
              className={cn("bg-white text-slate-900 border-sky-600/50 placeholder:text-slate-400", stepTouched.basics && !courseBasics.duration.trim() && "border border-rose-400/60 focus-visible:ring-rose-400/40")}
              aria-invalid={stepTouched.basics && !courseBasics.duration.trim()}
            />
            {stepTouched.basics && !courseBasics.duration.trim() && (
              <p className="text-xs text-rose-300">Informe a carga horária estimada.</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white font-semibold">Nível</label>
            <Select value={courseBasics.difficulty} onValueChange={(value) => handleCourseField("difficulty", value)}>
              <SelectTrigger className="bg-white text-slate-900 border-sky-600/50">
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
            <label className="text-sm text-slate-700">Investimento sugerido</label>
            <Input
              value={courseBasics.price}
              onChange={(event) => handleCourseField("price", event.target.value)}
              placeholder="Ex.: R$ 1.497"
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-700">Thumb / capa <span className="text-rose-500">*</span></label>
            {courseBasics.thumbnailUrl ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <img src={courseBasics.thumbnailUrl} alt="Capa do curso" className="h-14 w-24 rounded-md object-cover" />
                <span className="text-xs text-slate-600 break-all">{courseBasics.thumbnailUrl}</span>
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
              className={cn(
                "w-full rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50",
                stepTouched.basics && !courseBasics.thumbnailUrl.trim() && "border-rose-400/60",
              )}
              disabled={uploadingThumb}
              onClick={() => document.getElementById("thumb-file")?.click()}
              aria-invalid={stepTouched.basics && !courseBasics.thumbnailUrl.trim()}
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
            {stepTouched.basics && !courseBasics.thumbnailUrl.trim() && (
              <p className="text-xs text-rose-700">Envie uma imagem para definir a capa do curso.</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-700">Descrição para o catálogo <span className="text-rose-500">*</span></label>
          <Textarea
            value={courseBasics.description}
            onChange={(event) => handleCourseField("description", event.target.value)}
            rows={4}
            placeholder="Conte em 2-3 frases o resultado clínico, diferenciais e para quem é o curso."
            className={cn("bg-white", stepTouched.basics && !courseBasics.description.trim() && "border border-rose-400/60 focus-visible:ring-rose-400/40")}
            aria-invalid={stepTouched.basics && !courseBasics.description.trim()}
          />
          {stepTouched.basics && !courseBasics.description.trim() && (
            <p className="text-xs text-rose-700">Descreva o curso para o catálogo.</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-700">Tags (separe por vírgula)</label>
          <Input
            value={courseBasics.tags}
            onChange={(event) => handleCourseField("tags", event.target.value)}
            placeholder="ex.: implantodontia, fluxo digital, IA"
            className="bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <Badge className="border-[#0891b2]/30 bg-[#0891b2]/10 text-[#0e7490]">
            {totalLessons} aulas mapeadas
          </Badge>
          <span className="rounded-full border border-slate-200 px-3 py-1">Formato {courseBasics.format}</span>
          <span className="rounded-full border border-slate-200 px-3 py-1">Nível {courseBasics.difficulty}</span>
        </div>
      </CardContent>
    </Card>
  )

  const renderModulesCard = () => (
    <Card className="rounded-2xl border border-[#0891b2]/20 bg-white">
      <CardHeader>
        <CardTitle className="text-[#0e7490]">Módulos e aulas</CardTitle>
        <CardDescription className="text-slate-600">
          Estruture cada aula com link do vídeo, objetivos e anexos. Essa estrutura vai direto para o player do aluno.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {modules.map((module) => {
          const moduleTitleError = stepTouched.lessons && !module.title.trim()
          return (
            <div key={module.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-3">
                  <Input
                    value={module.title}
                    onChange={(event) => updateModule(module.id, { title: event.target.value })}
                    className={cn("bg-white", moduleTitleError && "border border-rose-400/60 focus-visible:ring-rose-400/40")}
                    placeholder="Nome do módulo"
                    aria-invalid={moduleTitleError}
                  />
                  {moduleTitleError && <p className="text-xs text-rose-200">Nomeie o módulo para organizar as aulas.</p>}
                  <Input
                    type="date"
                    value={module.releaseDate}
                    onChange={(event) => updateModule(module.id, { releaseDate: event.target.value })}
                    className="bg-white"
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
                    <div key={lesson.id} className="rounded-2xl border border-[#0891b2]/20 bg-white p-4">
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
                          <label className="text-xs uppercase tracking-wide text-slate-600">Nome da aula <span className="text-rose-500">*</span></label>
                          <Input
                            value={lesson.title}
                            onChange={(event) => updateLesson(module.id, lesson.id, { title: event.target.value })}
                            className={cn("bg-white", lessonTitleError && "border border-rose-400/60 focus-visible:ring-rose-400/40")}
                            aria-invalid={lessonTitleError}
                          />
                          {lessonTitleError && (
                            <p className="text-xs text-rose-200">Informe o título desta aula.</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wide text-slate-600">Duração (min) <span className="text-rose-500">*</span></label>
                            <Input
                              type="number"
                              min={1}
                              value={lesson.duration}
                              onChange={(event) => updateLesson(module.id, lesson.id, { duration: event.target.value })}
                              className={cn("bg-white", lessonDurationError && "border border-rose-400/60 focus-visible:ring-rose-400/40")}
                              aria-invalid={lessonDurationError}
                            />
                            {lessonDurationError && (
                              <p className="text-xs text-rose-700">Informe a duração estimada.</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wide text-slate-600">Liberação</label>
                            <Input
                              type="date"
                              value={lesson.releaseDate}
                              onChange={(event) => updateLesson(module.id, lesson.id, { releaseDate: event.target.value })}
                              className="bg-white"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-600">Link do vídeo (YouTube) <span className="text-rose-500">*</span></label>
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-[#0891b2]" />
                          <Input
                            value={lesson.videoUrl}
                            onChange={(event) => updateLesson(module.id, lesson.id, { videoUrl: event.target.value })}
                            onBlur={(event) =>
                              updateLesson(module.id, lesson.id, { videoUrl: normalizeYouTubeUrl(event.target.value) })
                            }
                            placeholder="Cole o link do YouTube (watch, youtu.be ou shorts)"
                            className={cn("bg-white", lessonVideoError && "border border-rose-400/60 focus-visible:ring-rose-400/40")}
                            aria-invalid={lessonVideoError}
                          />
                        </div>
                        {lessonVideoError && (
                          <p className="text-xs text-rose-700">Cole um link válido do YouTube (watch, youtu.be ou shorts).</p>
                        )}
                      </div>
                      <div className="mt-3 space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-600">Resumo / objetivo da aula</label>
                        <Textarea
                          value={lesson.notes}
                          onChange={(event) => updateLesson(module.id, lesson.id, { notes: event.target.value })}
                          rows={2}
                          className="bg-white"
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
                            const materialTitleError = stepTouched.materials && !material.title.trim()
                            const materialUrlError = stepTouched.materials && !material.url.trim()
                            return (
                              <div key={material.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="grid gap-3 md:grid-cols-3">
                                  <div className="space-y-2">
                                    <label className="text-xs text-slate-600">Título <span className="text-rose-500">*</span></label>
                                    <Input
                                      value={material.title}
                                      onChange={(event) =>
                                        updateMaterial(module.id, lesson.id, material.id, { title: event.target.value })
                                      }
                                      className={cn("bg-white", materialTitleError && "border border-rose-400/60 focus-visible:ring-rose-400/40")}
                                      aria-invalid={materialTitleError}
                                    />
                                    {materialTitleError && (
                                      <p className="text-xs text-rose-200">Preencha o nome do material.</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs text-slate-600">Tipo</label>
                                    <Select
                                      value={material.type}
                                      onValueChange={(value: CourseResourceType) =>
                                        updateMaterial(module.id, lesson.id, material.id, { type: value })
                                      }
                                    >
                                      <SelectTrigger className="bg-white">
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
                                    <label className="text-xs text-slate-600">URL / arquivo <span className="text-rose-500">*</span></label>
                                    <Input
                                      value={material.url}
                                      onChange={(event) =>
                                        updateMaterial(module.id, lesson.id, material.id, { url: event.target.value })
                                      }
                                      placeholder="https://..."
                                      className={cn("bg-white", materialUrlError && "border border-rose-400/60 focus-visible:ring-rose-400/40")}
                                      aria-invalid={materialUrlError}
                                    />
                                    {materialUrlError && (
                                      <p className="text-xs text-rose-700">Inclua o link ou caminho do arquivo.</p>
                                    )}
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
                                    className="bg-white"
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

  const renderPreviewCard = () => (
    <Card className="rounded-2xl border border-[#0891b2]/20 bg-white">
      <CardHeader>
        <CardTitle className="text-[#0e7490]">Pré-visualização</CardTitle>
        <CardDescription className="text-slate-600">
          Como o curso aparece para você e para os alunos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-600">Curso</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {courseBasics.title || "Sem título"}
          </h3>
          <p className="text-sm text-slate-600">{courseBasics.description || "Descrição aparecerá aqui."}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(courseBasics.tags || "").split(",").slice(0, 4).map((tag) => (
              <Badge key={tag} className="border-slate-200 bg-slate-50 text-slate-700">
                {tag.trim() || "Tag"}
              </Badge>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-600">
            <div>
              <p className="text-slate-500">Carga horária</p>
              <p className="text-slate-900">{courseBasics.duration || "—"}</p>
            </div>
            <div>
              <p className="text-slate-500">Nível</p>
              <p className="text-slate-900">{courseBasics.difficulty}</p>
            </div>
            <div>
              <p className="text-slate-500">Aulas</p>
              <p className="text-slate-900">{totalLessons}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-600">Linha editorial</p>
          <p className="text-sm text-slate-700">
            {modules[0]?.lessons[0]?.notes
              ? modules[0].lessons[0].notes.slice(0, 120)
              : "Use os campos acima para escrever o storytelling da primeira aula."}
          </p>
        </div>
      </CardContent>
    </Card>
  )

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
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-500">
              <span>{course.duration || "—"}</span>
            </div>
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
          <Badge className="border-[#0891b2]/30 bg-[#0891b2]/10 text-[#0e7490]">{courseBasics.format}</Badge>
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
          Dica: use o botão "Próxima etapa" para voltar e ajustar qualquer informação antes de publicar.
        </p>
      </CardContent>
    </Card>
  )

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div className="space-y-4">
          {renderStepAlert("basics")}
          <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
            {renderBasicsCard()}
            {renderPreviewCard()}
          </div>
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
        <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          <div className="space-y-6">
            {renderPreviewCard()}
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
      const duration = courseBasics.duration || `${totalLessons * 20} min`
      const courseInsert = {
        title: courseBasics.title.trim(),
        description: courseBasics.description.trim() || null,
        duration,
        thumbnail_url: courseBasics.thumbnailUrl || null,
        lessons_count: totalLessons,
      }

      const { data: newCourse, error: courseError } = await supabase
        .from("courses")
        .insert(courseInsert)
        .select("id, title, description, duration, lessons_count, thumbnail_url, updated_at")
        .single()

      if (courseError) {
        throw courseError
      }

      const lessonsPayload = modules.flatMap((module, moduleIndex) =>
        module.lessons.map((lesson, lessonIndex) => ({
          id: lesson.id,
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

      if (lessonsPayload.length) {
        const { error: lessonError } = await supabase.from("lessons").insert(lessonsPayload)
        if (lessonError) {
          throw lessonError
        }
      }

      const resourcesPayload = modules.flatMap((module, moduleIndex) =>
        module.lessons.flatMap((lesson, lessonIndex) =>
          lesson.materials.map((material, materialIndex) => ({
            course_id: newCourse.id,
            lesson_id: lesson.id,
            title: material.title.trim(),
            resource_type: material.type,
            description: material.description?.trim() || null,
            url: material.url.trim(),
            position: moduleIndex * 100 + lessonIndex * 10 + materialIndex,
          }))
        )
      )

      if (resourcesPayload.length) {
        const { error: resourceError } = await supabase.from("course_resources").insert(resourcesPayload)
        if (resourceError) {
          throw resourceError
        }
      }

      const normalizedLessons: CourseLessonRow[] = lessonsPayload.map((lesson) => ({
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

      setStatus({ type: "success", message: "Curso publicado no catálogo e sincronizado com a área de cursos." })
      resetForms()
    } catch (error) {
      console.error(error)
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
          <CardTitle className="text-[#0891b2] font-bold">Fluxo guiado</CardTitle>
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
            className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50"
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
