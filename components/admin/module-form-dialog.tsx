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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createModuleAction,
  updateModuleAction,
} from "@/app/actions/lesson-actions"
import { Loader2 } from "lucide-react"

interface ModuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  courseId: string
  initialData?: {
    id?: string
    title?: string
    description?: string | null
    order_index?: number | null
    access_type?: "free" | "premium" | null
  }
  onSuccess?: () => void
}

export function ModuleFormDialog({
  open,
  onOpenChange,
  mode,
  courseId,
  initialData,
  onSuccess,
}: ModuleFormDialogProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const buildInitialFormData = () => {
    if (mode === "edit" && initialData) {
      return {
        title: initialData.title || "",
        description: initialData.description || "",
        order_index:
          initialData.order_index !== undefined && initialData.order_index !== null
            ? initialData.order_index.toString()
            : "0",
        access_type: initialData.access_type || "free",
      }
    }

    return {
      title: "",
      description: "",
      order_index: "0",
      access_type: "free",
    }
  }

  const [formData, setFormData] = useState(buildInitialFormData)

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrors({})

    startTransition(async () => {
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        order_index: formData.order_index ? parseInt(formData.order_index) : 0,
        access_type: formData.access_type || "free",
      }

      let result
      if (mode === "create") {
        result = await createModuleAction({
          course_id: courseId,
          ...payload,
        })
      } else if (mode === "edit" && initialData?.id) {
        result = await updateModuleAction({
          id: initialData.id,
          ...payload,
        })
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
      <DialogContent className="max-w-xl bg-[#0F192F] border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">
            {mode === "create" ? "Novo Módulo" : "Editar Módulo"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === "create"
              ? "Organize o curso criando um módulo com título e descrição."
              : "Atualize as informações do módulo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {errors.general && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-400">
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="module_title" className="text-white">
              Título do módulo
            </Label>
            <Input
              id="module_title"
              value={formData.title}
              onChange={(event) => handleInputChange("title", event.target.value)}
              placeholder="Ex: Módulo 1 — Fundamentos"
              className="bg-[#131D37] border-slate-600 text-white"
            />
            {errors.title && <p className="text-sm text-red-400">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="module_description" className="text-white">
              Descrição
            </Label>
            <Textarea
              id="module_description"
              value={formData.description}
              onChange={(event) => handleInputChange("description", event.target.value)}
              placeholder="Opcional: contextualize o objetivo do módulo"
              rows={4}
              className="bg-[#131D37] border-slate-600 text-white resize-none"
            />
            {errors.description && (
              <p className="text-sm text-red-400">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="module_access_type" className="text-white">
              Tipo de acesso
            </Label>
            <Select
              value={formData.access_type}
              onValueChange={(value) => handleInputChange("access_type", value)}
            >
              <SelectTrigger id="module_access_type" className="bg-[#131D37] border-slate-600 text-white">
                <SelectValue placeholder="Selecione o tipo de acesso" />
              </SelectTrigger>
              <SelectContent className="bg-[#0F192F] text-white border-slate-700">
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Módulos premium ficam bloqueados para alunos sem compra/assinatura.
            </p>
            {errors.access_type && (
              <p className="text-sm text-red-400">{errors.access_type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="module_order" className="text-white">
              Ordem
            </Label>
            <Input
              id="module_order"
              type="number"
              min="0"
              value={formData.order_index}
              onChange={(event) => handleInputChange("order_index", event.target.value)}
              className="bg-[#131D37] border-slate-600 text-white"
            />
            <p className="text-xs text-slate-500">
              Define a posição do módulo dentro do curso (0 = primeiro módulo).
            </p>
            {errors.order_index && (
              <p className="text-sm text-red-400">{errors.order_index}</p>
            )}
          </div>

          <DialogFooter className="pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "create" ? "Criando..." : "Atualizando..."}
                </>
              ) : mode === "create" ? (
                "Criar módulo"
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
