"use client"

import { useState, useTransition } from "react"
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
import { createLessonAction, updateLessonAction } from "@/app/actions/lesson-actions"
import { Loader2 } from "lucide-react"
import type { LessonFormData } from "@/lib/validations/lesson"

interface LessonFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  courseId: string
  initialData?: {
    id?: string
    title?: string
    description?: string | null
    video_url?: string | null
    duration_minutes?: number | null
    module_title?: string
    order_index?: number
  }
  onSuccess?: () => void
}

export function LessonFormDialog({
  open,
  onOpenChange,
  mode,
  courseId,
  initialData,
  onSuccess,
}: LessonFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    video_url: initialData?.video_url || "",
    duration_minutes: initialData?.duration_minutes?.toString() || "",
    module_title: initialData?.module_title || "Módulo 1",
    order_index: initialData?.order_index?.toString() || "0",
  })

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
        module_title: formData.module_title,
        order_index: parseInt(formData.order_index),
        materials: [],
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
        Object.entries(result.fieldErrors).forEach(([key, messages]) => {
          if (messages && messages.length > 0) {
            flatErrors[key] = messages[0]
          }
        })
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
              <Input
                id="module_title"
                value={formData.module_title}
                onChange={(e) => handleInputChange("module_title", e.target.value)}
                placeholder="Ex: Módulo 1 - Fundamentos"
                className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
              />
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
              URL do Vídeo (YouTube, Vimeo, etc)
            </Label>
            <Input
              id="video_url"
              type="url"
              value={formData.video_url}
              onChange={(e) => handleInputChange("video_url", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
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
