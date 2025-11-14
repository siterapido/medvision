"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createCourse, updateCourse } from "@/app/actions/courses"
import type { CourseFormData } from "@/lib/validations/course"
import { Loader2, UploadCloud, X } from "lucide-react"

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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<CourseFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    area: initialData?.area || "",
    difficulty: initialData?.difficulty || "Iniciante",
    course_type: (initialData?.course_type as "Ondonto GPT" | "Premium") || "Ondonto GPT",
    price: initialData?.price || "",
    tags: initialData?.tags || "",
    duration: initialData?.duration || "",
    thumbnail_url: initialData?.thumbnail_url || "",
  })

  const [comingSoon, setComingSoon] = useState(initialData?.coming_soon || false)
  const [availableAt, setAvailableAt] = useState(initialData?.available_at || "")

  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string>(formData.thumbnail_url || "")
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleThumbnailUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      const ext = file.name.split(".").pop() || "jpg"
      const path = `thumbnails/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage.from("course-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("course-assets").getPublicUrl(path)
      const publicUrl = data.publicUrl
      setFormData((prev) => ({ ...prev, thumbnail_url: publicUrl }))
      setThumbnailPreviewUrl(publicUrl)
      setErrors((prev) => {
        const next = { ...prev }
        delete next.thumbnail_url
        return next
      })
    } catch (uploadError) {
      console.error("❌ [handleThumbnailUpload] erro:", uploadError)
      setErrors((prev) => ({ ...prev, thumbnail_url: "Falha ao enviar a imagem. Tente novamente." }))
    } finally {
      setUploadingImage(false)
    }
  }

  const handleThumbnailClear = () => {
    setFormData((prev) => ({ ...prev, thumbnail_url: "" }))
    setThumbnailPreviewUrl("")
    setErrors((prev) => {
      const next = { ...prev }
      delete next.thumbnail_url
      return next
    })
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que se coming_soon estiver ativo, available_at é obrigatório
    if (comingSoon && !availableAt) {
      setErrors({ available_at: "Data de disponibilidade é obrigatória quando o curso está marcado como 'Em Breve'" })
      return
    }

    console.log("📋 [handleSubmit] Formulário submetido", { mode, formData, comingSoon, availableAt })
    setErrors({})

    startTransition(async () => {
      let result
      console.log("🔄 [handleSubmit] Iniciando transição server action", { mode })

      const submitData = {
        ...formData,
        coming_soon: comingSoon,
        available_at: availableAt || null,
      }

      if (mode === "create") {
        console.log("🚀 [handleSubmit] Chamando createCourse com dados:", submitData)
        result = await createCourse(submitData as any)
      } else if (mode === "edit" && initialData?.id) {
        console.log("✏️ [handleSubmit] Chamando updateCourse com dados:", submitData)
        result = await updateCourse(initialData.id, submitData as any)
      }

      console.log("📝 [handleSubmit] Resultado recebido:", result)

      const fieldErrors =
        result?.fieldErrors && Object.keys(result.fieldErrors).length > 0
          ? result.fieldErrors
          : undefined
      const generalError = result?.error

      if (result?.success) {
        console.log("✅ [handleSubmit] Sucesso! Modal será fechado e página recarregada")
        onOpenChange(false)
        router.refresh()
      } else if (fieldErrors) {
        console.error("❌ [handleSubmit] Erros de validação de campo:", fieldErrors)
        // Converter array de erros em string
        const flatErrors: Record<string, string> = {}
        Object.entries(fieldErrors).forEach(([key, messages]) => {
          if (messages && messages.length > 0) {
            flatErrors[key] = messages[0]
          }
        })
        setErrors(flatErrors)
      } else if (generalError) {
        console.error("❌ [handleSubmit] Erro geral:", generalError)
        setErrors({ general: generalError })
      } else {
        console.error("❌ [handleSubmit] Resultado inválido ou undefined:", result)
        setErrors({ general: "Erro desconhecido ao processar formulário" })
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

            {/* Tipo de Curso */}
            <div className="space-y-2">
              <Label htmlFor="course_type" className="text-white">
                Tipo de Curso <span className="text-red-400">*</span>
              </Label>
              <Select
                value={formData.course_type}
                onValueChange={(value) => handleInputChange("course_type", value)}
              >
                <SelectTrigger className="bg-[#131D37] border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#131D37] border-slate-600">
                  <SelectItem value="Ondonto GPT" className="text-white">
                    🤖 Ondonto GPT
                  </SelectItem>
                  <SelectItem value="Premium" className="text-white">
                    ⭐ Cursos Premium
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.course_type && (
                <p className="text-sm text-red-400">{errors.course_type}</p>
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

          <div className="space-y-2">
            <Label className="text-white">Thumbnail (imagem)</Label>
            {thumbnailPreviewUrl && (
              <div className="relative w-full h-48 overflow-hidden rounded-lg border border-slate-600 bg-slate-900">
                <Image
                  src={thumbnailPreviewUrl}
                  alt="Preview da thumbnail"
                  fill
                  sizes="(max-width: 640px) 100vw, 480px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (file) {
                  await handleThumbnailUpload(file)
                }
              }}
            />
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="bg-[#131D37] text-white border-slate-600 hover:border-white"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando imagem
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Enviar imagem
                  </>
                )}
              </Button>
              {thumbnailPreviewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  className="border border-white/20 text-white"
                  onClick={handleThumbnailClear}
                  disabled={uploadingImage}
                >
                  <X className="mr-2 h-4 w-4" />
                  Remover
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-400">
              O arquivo é enviado para o bucket `course-assets` e a URL pública já é preenchida automaticamente.
            </p>
            {errors.thumbnail_url && (
              <p className="text-sm text-red-400">{errors.thumbnail_url}</p>
            )}
          </div>

          {/* Status "Em Breve" */}
          <div className="border-t border-slate-600 pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="coming_soon"
                  checked={comingSoon}
                  onCheckedChange={(checked) => setComingSoon(checked as boolean)}
                  className="border-slate-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <div className="flex-1">
                  <Label htmlFor="coming_soon" className="text-white cursor-pointer">
                    Marcar como "Em Breve"
                  </Label>
                  <p className="text-xs text-slate-400 mt-1">
                    Ativa o status "Em Breve" no curso, bloqueando o acesso até a data especificada
                  </p>
                </div>
              </div>

              {comingSoon && (
                <div className="space-y-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <Label htmlFor="available_at" className="text-white">
                    Data de Disponibilidade <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="available_at"
                    type="datetime-local"
                    value={availableAt}
                    onChange={(e) => setAvailableAt(e.target.value)}
                    className="bg-[#131D37] border-slate-600 text-white"
                    required={comingSoon}
                  />
                  <p className="text-xs text-amber-200">
                    O curso ficará acessível a partir dessa data e hora
                  </p>
                  {errors.available_at && (
                    <p className="text-sm text-red-400">{errors.available_at}</p>
                  )}
                </div>
              )}
            </div>
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
