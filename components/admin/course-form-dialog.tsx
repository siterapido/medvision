"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
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
import { createCourse, updateCourse, uploadCourseThumbnail } from "@/app/actions/courses"
import type { CourseFormData } from "@/lib/validations/course"
import { Loader2, Upload, X } from "lucide-react"

interface CourseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialData?: Partial<CourseFormData> & { id?: string }
}

export function CourseFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
}: CourseFormDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData?.thumbnail_url || null
  )

  const [formData, setFormData] = useState<CourseFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    area: initialData?.area || "",
    difficulty: initialData?.difficulty || "Iniciante",
    format: initialData?.format || "100% online",
    price: initialData?.price || "",
    tags: initialData?.tags || "",
    duration: initialData?.duration || "",
    thumbnail_url: initialData?.thumbnail_url || "",
  })

  const handleInputChange = (
    field: keyof CourseFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleThumbnailChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview local
    const reader = new FileReader()
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload para Supabase
    setIsUploading(true)
    const formDataUpload = new FormData()
    formDataUpload.append("file", file)

    const result = await uploadCourseThumbnail(formDataUpload)
    setIsUploading(false)

    if (result.success && result.data) {
      handleInputChange("thumbnail_url", result.data.url)
    } else {
      setErrors((prev) => ({ ...prev, thumbnail: result.error || "Erro ao fazer upload" }))
    }
  }

  const handleRemoveThumbnail = () => {
    setThumbnailPreview(null)
    handleInputChange("thumbnail_url", "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    startTransition(async () => {
      let result

      if (mode === "create") {
        result = await createCourse(formData)
      } else if (mode === "edit" && initialData?.id) {
        result = await updateCourse(initialData.id, formData)
      }

      if (result?.success) {
        onOpenChange(false)
        router.refresh()
      } else if (result?.fieldErrors) {
        // Converter array de erros em string
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
            {mode === "create" ? "Novo Curso" : "Editar Curso"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === "create"
              ? "Preencha os dados básicos do curso. Você poderá adicionar aulas depois."
              : "Atualize as informações do curso."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Erro geral */}
          {errors.general && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Título <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Ex: Implantodontia Avançada"
              className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
            />
            {errors.title && (
              <p className="text-sm text-red-400">{errors.title}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descreva o conteúdo e objetivos do curso..."
              rows={4}
              className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500 resize-none"
            />
            {errors.description && (
              <p className="text-sm text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Grid de campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Área */}
            <div className="space-y-2">
              <Label htmlFor="area" className="text-white">
                Área <span className="text-red-400">*</span>
              </Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => handleInputChange("area", e.target.value)}
                placeholder="Ex: Implantodontia"
                className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
              />
              {errors.area && (
                <p className="text-sm text-red-400">{errors.area}</p>
              )}
            </div>

            {/* Dificuldade */}
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-white">
                Dificuldade <span className="text-red-400">*</span>
              </Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) =>
                  handleInputChange("difficulty", value)
                }
              >
                <SelectTrigger className="bg-[#131D37] border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#131D37] border-slate-600">
                  <SelectItem value="Iniciante" className="text-white">
                    Iniciante
                  </SelectItem>
                  <SelectItem value="Intermediário" className="text-white">
                    Intermediário
                  </SelectItem>
                  <SelectItem value="Avançado" className="text-white">
                    Avançado
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.difficulty && (
                <p className="text-sm text-red-400">{errors.difficulty}</p>
              )}
            </div>

            {/* Formato */}
            <div className="space-y-2">
              <Label htmlFor="format" className="text-white">
                Formato <span className="text-red-400">*</span>
              </Label>
              <Select
                value={formData.format}
                onValueChange={(value) => handleInputChange("format", value)}
              >
                <SelectTrigger className="bg-[#131D37] border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#131D37] border-slate-600">
                  <SelectItem value="100% online" className="text-white">
                    100% online
                  </SelectItem>
                  <SelectItem value="Híbrido" className="text-white">
                    Híbrido
                  </SelectItem>
                  <SelectItem value="Presencial" className="text-white">
                    Presencial
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.format && (
                <p className="text-sm text-red-400">{errors.format}</p>
              )}
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <Label htmlFor="price" className="text-white">
                Preço
              </Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="Ex: R$ 1.497"
                className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
              />
              {errors.price && (
                <p className="text-sm text-red-400">{errors.price}</p>
              )}
            </div>

            {/* Duração */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-white">
                Duração
              </Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
                placeholder="Ex: 20 horas"
                className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
              />
              {errors.duration && (
                <p className="text-sm text-red-400">{errors.duration}</p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-white">
                Tags
              </Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
                placeholder="Ex: Implantes, Cirurgia"
                className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
              />
              {errors.tags && (
                <p className="text-sm text-red-400">{errors.tags}</p>
              )}
            </div>
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label className="text-white">Thumbnail</Label>
            {thumbnailPreview ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-[#131D37] border border-slate-600">
                <img
                  src={thumbnailPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveThumbnail}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="thumbnail"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-[#131D37] hover:bg-[#16243F] transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploading ? (
                    <Loader2 className="h-10 w-10 text-cyan-500 animate-spin mb-3" />
                  ) : (
                    <Upload className="h-10 w-10 text-slate-500 mb-3" />
                  )}
                  <p className="mb-2 text-sm text-slate-400">
                    <span className="font-semibold">Clique para fazer upload</span> ou
                    arraste e solte
                  </p>
                  <p className="text-xs text-slate-500">
                    PNG, JPG ou WebP (máx. 5MB)
                  </p>
                </div>
                <input
                  id="thumbnail"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleThumbnailChange}
                  disabled={isUploading}
                />
              </label>
            )}
            {errors.thumbnail && (
              <p className="text-sm text-red-400">{errors.thumbnail}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending || isUploading}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || isUploading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Criando..." : "Salvando..."}
                </>
              ) : mode === "create" ? (
                "Criar Curso"
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
