"use client"

import { useState, useTransition, type ChangeEvent } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { createLessonAction, updateLessonAction } from "@/app/actions/lesson-actions"
import { Loader2, Plus, UploadCloud } from "lucide-react"
import type { LessonFormData, LessonMaterialData } from "@/lib/validations/lesson"
import { AttachmentUploader } from "@/components/admin/attachment-uploader"

const DEFAULT_MODULE_TITLE = "Sem módulo"

type ModuleOption = {
  id: string | null
  title: string
}

type MaterialState = LessonMaterialData & { id: string }

const materialOptions: { value: LessonMaterialData["type"]; label: string }[] = [
  { value: "pdf", label: "PDF / Apostila" },
  { value: "slides", label: "Slides" },
  { value: "checklist", label: "Checklist" },
  { value: "video", label: "Vídeo extra" },
  { value: "template", label: "Template" },
  { value: "link", label: "Link externo" },
  { value: "outro", label: "Outro" },
]

const createMaterialState = (material?: LessonMaterialData): MaterialState => ({
  id: crypto.randomUUID(),
  title: material?.title ?? "",
  type: material?.type ?? "pdf",
  url: material?.url ?? "",
  description: material?.description ?? "",
})

interface LessonFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  courseId: string
  modules: ModuleOption[]
  defaultModuleId?: string | null
  initialData?: {
    id?: string
    title?: string
    description?: string | null
    video_url?: string | null
    duration_minutes?: number | null
    module_title?: string
    module_id?: string | null
    order_index?: number
    materials?: LessonMaterialData[] | null
  }
  onSuccess?: () => void
}

export function LessonFormDialog({
  open,
  onOpenChange,
  mode,
  courseId,
  modules,
  defaultModuleId,
  initialData,
  onSuccess,
}: LessonFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const buildInitialMaterials = (): MaterialState[] => {
    if (!initialData?.materials?.length) {
      return []
    }

    return initialData.materials.map((material) => createMaterialState(material))
  }

  const [materials, setMaterials] = useState<MaterialState[]>(buildInitialMaterials)
  const [materialUploadStates, setMaterialUploadStates] = useState<Record<string, boolean>>({})

  const buildInitialFormData = () => {
    const preferredModuleId =
      initialData?.module_id ?? defaultModuleId ?? modules[0]?.id ?? ""
    const moduleSelection =
      modules.find((module) => (module.id ?? "") === preferredModuleId) ??
      modules.find((module) => module.id === null)

    return {
      title: initialData?.title || "",
      description: initialData?.description || "",
      video_url: initialData?.video_url || "",
      duration_minutes: initialData?.duration_minutes?.toString() || "",
      module_id: moduleSelection ? moduleSelection.id ?? "" : preferredModuleId ?? "",
      module_title: moduleSelection
        ? moduleSelection.title
        : initialData?.module_title || DEFAULT_MODULE_TITLE,
    order_index: initialData?.order_index?.toString() || "0",
  }
}

  const [formData, setFormData] = useState(buildInitialFormData)
  const supabase = createClient()

  const addMaterial = () => {
    setMaterials((prev) => [...prev, createMaterialState()])
  }

  const updateMaterial = (materialId: string, patch: Partial<LessonMaterialData>) => {
    setMaterials((prev) =>
      prev.map((material) => (material.id === materialId ? { ...material, ...patch } : material))
    )
  }

  const removeMaterial = (materialId: string) => {
    setMaterials((prev) => prev.filter((material) => material.id !== materialId))
  }

  const handleMaterialFileUpload = async (
    materialId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) {
      return
    }

    setMaterialUploadStates((prev) => ({ ...prev, [materialId]: true }))
    try {
      const ext = file.name.split(".").pop() ?? "bin"
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

      updateMaterial(materialId, { url: data.publicUrl })
      setErrors((prev) => {
        const next = { ...prev }
        delete next.materials
        return next
      })
    } catch (error) {
      console.error("Erro ao enviar material:", error)
      setErrors((prev) => ({
        ...prev,
        materials: "Não foi possível enviar o material. Tente novamente.",
      }))
    } finally {
      setMaterialUploadStates((prev) => {
        const next = { ...prev }
        delete next[materialId]
        return next
      })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleModuleSelect = (value: string) => {
    const normalizedValue = value || ""
    const moduleSelection =
      modules.find((module) => (module.id ?? "") === normalizedValue) ??
      modules.find((module) => module.id === null)

    setFormData((prev) => ({
      ...prev,
      module_id: normalizedValue,
      module_title: moduleSelection?.title || DEFAULT_MODULE_TITLE,
    }))

    if (errors.module_title) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.module_title
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    startTransition(async () => {
      // Preparar dados
      const lessonData: LessonFormData = {
        title: formData.title,
        description: formData.description || undefined,
        video_url: formData.video_url || undefined,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined,
        module_id: formData.module_id || undefined,
        module_title: formData.module_title,
        order_index: parseInt(formData.order_index),
        materials: materials.map(({ id, ...rest }) => rest),
      }

      let result
      if (mode === "create") {
        result = await createLessonAction(courseId, lessonData)
      } else if (mode === "edit" && initialData?.id) {
        result = await updateLessonAction(initialData.id, lessonData)
      }

      if (result?.success) {
        onSuccess?.()
      } else if (result?.fieldErrors) {
        const flatErrors: Record<string, string> = {}
        let hasMaterialErrors = false
        Object.entries(result.fieldErrors).forEach(([key, messages]) => {
          if (messages && messages.length > 0) {
            if (key.startsWith("materials")) {
              hasMaterialErrors = true
              return
            }
            flatErrors[key] = messages[0]
          }
        })
        if (hasMaterialErrors) {
          flatErrors.materials = "Corrija os materiais adicionados."
        }
        setErrors(flatErrors)
      } else if (result?.error) {
        setErrors({ general: result.error })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0F192F] border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">
            {mode === "create" ? "Nova Aula" : "Editar Aula"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === "create"
              ? "Adicione uma nova aula ao curso"
              : "Atualize as informações da aula"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Erro geral */}
          {errors.general && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Título da Aula <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Ex: Introdução ao Implante"
              className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
            />
            {errors.title && <p className="text-sm text-red-400">{errors.title}</p>}
          </div>

          {/* Grid de campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Módulo */}
            <div className="space-y-2">
              <Label htmlFor="module_title" className="text-white">
                Módulo <span className="text-red-400">*</span>
              </Label>
              <Select
                value={formData.module_id || ""}
                onValueChange={handleModuleSelect}
              >
                <SelectTrigger className="bg-[#131D37] border-slate-600 text-white">
                  <SelectValue placeholder="Selecione um módulo" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem
                      key={module.id ?? "sem-modulo"}
                      value={module.id ?? ""}
                    >
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Escolha um módulo existente (ou crie um novo módulo antes de adicionar a aula)
              </p>
              {errors.module_title && (
                <p className="text-sm text-red-400">{errors.module_title}</p>
              )}
            </div>

            {/* Duração */}
            <div className="space-y-2">
              <Label htmlFor="duration_minutes" className="text-white">
                Duração (minutos)
              </Label>
              <Input
                id="duration_minutes"
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => handleInputChange("duration_minutes", e.target.value)}
                placeholder="Ex: 45"
                className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
              />
              {errors.duration_minutes && (
                <p className="text-sm text-red-400">{errors.duration_minutes}</p>
              )}
            </div>
          </div>

          {/* Ordem */}
          <div className="space-y-2">
            <Label htmlFor="order_index" className="text-white">
              Ordem/Posição <span className="text-red-400">*</span>
            </Label>
            <Input
              id="order_index"
              type="number"
              min="0"
              value={formData.order_index}
              onChange={(e) => handleInputChange("order_index", e.target.value)}
              placeholder="Ex: 0"
              className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500">
              Número que determina a ordem da aula no curso (0 = primeira aula)
            </p>
            {errors.order_index && (
              <p className="text-sm text-red-400">{errors.order_index}</p>
            )}
          </div>

          {/* URL do vídeo */}
          <div className="space-y-2">
            <Label htmlFor="video_url" className="text-white">
              URL do Vídeo (YouTube, Vimeo, Bunny)
            </Label>
            <Input
              id="video_url"
              type="url"
              value={formData.video_url}
              onChange={(e) => handleInputChange("video_url", e.target.value)}
              placeholder="https://iframe.mediadelivery.net/embed/... ou https://{zona}.b-cdn.net/..."
              className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
            />
            {errors.video_url && (
              <p className="text-sm text-red-400">{errors.video_url}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Descrição / Objetivo da Aula
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descreva o que será ensinado nesta aula..."
              rows={4}
              className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500 resize-none"
            />
            {errors.description && (
              <p className="text-sm text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Anexos da aula (apenas no modo edição, após existir ID da aula) */}
          {mode === "edit" && initialData?.id && (
            <div className="space-y-2 rounded-2xl border border-slate-700 bg-[#0A111F] p-4">
              <AttachmentUploader lessonId={initialData.id} />
            </div>
          )}

          <div className="space-y-4 rounded-2xl border border-slate-700 bg-[#0A111F] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white">Materiais vinculados</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex items-center gap-1 rounded-xl border-slate-600 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 hover:bg-slate-800"
                onClick={addMaterial}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar material
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Adicione PDFs, checklists, links e templates que devem ficar disponíveis junto com a aula.
            </p>
            {materials.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-400">
                Nenhum material vinculado ainda. Clique em “Adicionar material” para começar.
              </div>
            ) : (
              <div className="space-y-4">
                {materials.map((material) => {
                  const isUploading = materialUploadStates[material.id] ?? false
                  const fileInputId = `lesson-material-${material.id}`
                  return (
                    <div key={material.id} className="rounded-2xl border border-slate-800 bg-[#0F192F] p-4">
                      <div className="grid gap-3 md:grid-cols-[1.1fr,220px,180px]">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400">Título</Label>
                          <Input
                            value={material.title}
                            onChange={(event) =>
                              updateMaterial(material.id, { title: event.target.value })
                            }
                            placeholder="Ex.: Checklist de imagens"
                            className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400">Tipo</Label>
                          <Select
                            value={material.type}
                            onValueChange={(value) => updateMaterial(material.id, { type: value })}
                          >
                            <SelectTrigger className="bg-[#131D37] border-slate-600 text-white">
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
                          <Label className="text-xs text-slate-400">URL / arquivo</Label>
                          <div className="flex gap-2">
                            <Input
                              value={material.url}
                              onChange={(event) =>
                                updateMaterial(material.id, { url: event.target.value })
                              }
                              placeholder="https://..."
                              className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500 flex-1"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 rounded-xl border-slate-600 px-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200 hover:bg-slate-800"
                              onClick={() => document.getElementById(fileInputId)?.click()}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <Loader2 className="h-3 w-3 animate-spin text-[#06b6d4]" />
                              ) : (
                                <UploadCloud className="h-3.5 w-3.5 text-slate-200" />
                              )}
                              {isUploading ? "Enviando" : "Upload"}
                            </Button>
                          </div>
                          <input
                            id={fileInputId}
                            type="file"
                            className="hidden"
                            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-7z-compressed,image/*"
                            onChange={(event) => handleMaterialFileUpload(material.id, event)}
                          />
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <Label className="text-xs text-slate-400">Descrição</Label>
                        <Textarea
                          value={material.description ?? ""}
                          onChange={(event) =>
                            updateMaterial(material.id, { description: event.target.value })
                          }
                          rows={2}
                          className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500 resize-none"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-xs text-rose-400 hover:bg-rose-500/10"
                          onClick={() => removeMaterial(material.id)}
                        >
                          Remover material
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {errors.materials && <p className="text-sm text-red-400">{errors.materials}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Criando..." : "Salvando..."}
                </>
              ) : mode === "create" ? (
                "Criar Aula"
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
