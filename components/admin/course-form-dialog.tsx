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
import { Loader2, Upload, X, AlertCircle } from "lucide-react"

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
  const [showSizeAlert, setShowSizeAlert] = useState(false)

  const [imageDimensions, setImageDimensions] = useState<{
    width: number
    height: number
    aspectRatio: string
  } | null>(null)

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

    // Validação local de tamanho
    const maxSizeBytes = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSizeBytes) {
      setShowSizeAlert(true)
      setErrors((prev) => ({
        ...prev,
        thumbnail: "A imagem deve ter no máximo 5MB. Reduza o tamanho e tente novamente.",
      }))
      return
    }

    // Validação de dimensões da imagem
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      const src = e.target?.result as string
      img.src = src
      setThumbnailPreview(src) // Preview mesmo com warning

      img.onload = async () => {
        const width = img.width
        const height = img.height
        const aspectRatio = width / height
        const aspectRatioString = (aspectRatio).toFixed(2) + ":1"

        // Armazenar dimensões para exibição
        setImageDimensions({
          width,
          height,
          aspectRatio: aspectRatioString,
        })

        // Validações de dimensão
        const idealWidth = 1280
        const idealHeight = 720
        const minWidth = 640
        const minHeight = 360
        const targetAspectRatio = 16 / 9 // 1.777...
        const aspectRatioTolerance = 0.1 // 10% de tolerância

        let dimensionWarnings: string[] = []

        // Verificar proporção (16:9)
        if (
          aspectRatio < targetAspectRatio - aspectRatioTolerance ||
          aspectRatio > targetAspectRatio + aspectRatioTolerance
        ) {
          dimensionWarnings.push(
            `❌ Proporção incorreta: ${width}×${height} (${(aspectRatio).toFixed(2)}:1). Ideal: 16:9 (1.78:1)`
          )
        }

        // Verificar se está abaixo do mínimo
        if (width < minWidth || height < minHeight) {
          dimensionWarnings.push(
            `❌ Resolução muito baixa: ${width}×${height}. Mínimo recomendado: ${minWidth}×${minHeight}`
          )
        }

        // Verificar se está abaixo do ideal
        if (width < idealWidth || height < idealHeight) {
          if (dimensionWarnings.length === 0) {
            dimensionWarnings.push(
              `⚠️ Resolução abaixo do ideal: ${width}×${height}. Ideal: ${idealWidth}×${idealHeight}`
            )
          }
        }

        // Se houver avisos, mostrar na interface
        if (dimensionWarnings.length > 0) {
          setErrors((prev) => ({
            ...prev,
            thumbnail: dimensionWarnings.join(" | "),
          }))
        } else {
          // Limpar erros se dimensões estiverem OK
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.thumbnail
            return newErrors
          })
        }

        // Continuar com upload mesmo com warnings
        setIsUploading(true)
        const formDataUpload = new FormData()
        formDataUpload.append("file", file)

        const result = await uploadCourseThumbnail(formDataUpload)
        setIsUploading(false)

        if (result.success && result.data) {
          handleInputChange("thumbnail_url", result.data.url)
          setShowSizeAlert(false)
        } else {
          // Verificar se é erro de tamanho de corpo
          if (result.error?.includes("muito grande") || result.error?.includes("Body exceeded")) {
            setShowSizeAlert(true)
          }
          setErrors((prev) => ({ ...prev, thumbnail: result.error || "Erro ao fazer upload" }))
        }
      }
    }

    reader.readAsDataURL(file)
  }

  const handleRemoveThumbnail = () => {
    setThumbnailPreview(null)
    setImageDimensions(null)
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

        {/* Alerta de tamanho de arquivo */}
        {showSizeAlert && (
          <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2 fade-in">
            <div className="bg-red-900/90 border border-red-700 rounded-lg p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <AlertCircle className="h-5 w-5 text-red-300 flex-shrink-0" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-100 mb-1">Arquivo muito grande</h3>
                  <p className="text-sm text-red-200">
                    A imagem deve ter no máximo 5MB. Por favor, reduza o tamanho e tente novamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSizeAlert(false)}
                  className="ml-2 text-red-300 hover:text-red-100 transition-colors flex-shrink-0"
                  aria-label="Fechar alerta"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

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

          {/* Thumbnail */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white">Thumbnail</Label>
              <span className="text-xs text-slate-400">
                <span className="text-cyan-400 font-semibold">Ideal:</span> 1280×720px
              </span>
            </div>
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
            {/* Aviso de dimensões ideais */}
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs space-y-1">
              <p className="font-semibold">💡 Dica para melhor qualidade:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Dimensão ideal: <span className="font-semibold text-cyan-200">1280×720px</span> (proporção 16:9)</li>
                <li>Tamanho ideal: <span className="font-semibold text-cyan-200">200-300KB</span> (use compressor online)</li>
                <li>Formatos recomendados: <span className="font-semibold text-cyan-200">WebP, JPG ou PNG</span></li>
              </ul>
            </div>

            {/* Informações de dimensão detectada */}
            {imageDimensions && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 text-xs">
                <p className="font-semibold mb-2 text-slate-200">📊 Dimensões Detectadas:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Resolução:</span>
                    <span className="font-semibold text-white">
                      {imageDimensions.width} × {imageDimensions.height}px
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Proporção:</span>
                    <span className="font-semibold text-white">
                      {imageDimensions.aspectRatio}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {errors.thumbnail && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-300 font-semibold mb-2">⚠️ Problema detectado:</p>
                <div className="space-y-1 text-sm text-red-300">
                  {errors.thumbnail.split(" | ").map((error, idx) => (
                    <p key={idx} className="flex items-start gap-2">
                      <span className="flex-shrink-0 mt-0.5">•</span>
                      <span>{error}</span>
                    </p>
                  ))}
                </div>
                <p className="text-xs text-red-400 mt-2 italic">
                  Você ainda pode fazer upload, mas a qualidade pode ser prejudicada.
                </p>
              </div>
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
