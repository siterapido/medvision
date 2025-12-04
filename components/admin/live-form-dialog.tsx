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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createLive, updateLive } from "@/app/actions/lives"
import type { LiveFormData } from "@/lib/validations/live"
import { Loader2, UploadCloud, X, CalendarClock } from "lucide-react"

interface LiveFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialData?: Partial<LiveFormData> & { id?: string }
}

export function LiveFormDialog({ open, onOpenChange, mode, initialData }: LiveFormDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const toDatetimeLocal = (value?: string) => {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
  }

  const [formData, setFormData] = useState<LiveFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    instructor_name: initialData?.instructor_name || "",
    thumbnail_url: initialData?.thumbnail_url || "",
    live_url: initialData?.live_url || "",
    start_at: toDatetimeLocal(initialData?.start_at as string) || "",
    duration_minutes: initialData?.duration_minutes ?? 60,
    status: (initialData?.status as any) || "scheduled",
    is_featured: initialData?.is_featured ?? false,
  })

  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string>(formData.thumbnail_url || "")
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleThumbnailUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      const ext = file.name.split(".").pop() || "jpg"
      const path = `thumbnails/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage.from("live-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("live-assets").getPublicUrl(path)
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

  const handleInputChange = (field: keyof LiveFormData, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }))
    if (errors[field as string]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field as string]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    startTransition(async () => {
      let result
      if (mode === "create") {
        result = await createLive(formData)
      } else if (mode === "edit" && initialData?.id) {
        result = await updateLive(initialData.id, formData)
      }

      const fieldErrors = result?.fieldErrors && Object.keys(result.fieldErrors).length > 0 ? result.fieldErrors : undefined
      const generalError = result?.error

      if (result?.success) {
        onOpenChange(false)
        router.refresh()
      } else if (fieldErrors) {
        const flatErrors: Record<string, string> = {}
        Object.entries(fieldErrors).forEach(([key, messages]) => {
          if (messages && messages.length > 0) flatErrors[key] = messages[0]
        })
        setErrors(flatErrors)
      } else if (generalError) {
        setErrors({ general: generalError })
      } else {
        setErrors({ general: "Erro desconhecido ao processar formulário" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0F192F] border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">{mode === "create" ? "Nova Live" : "Editar Live"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === "create" ? "Preencha os dados da live." : "Atualize as informações da live."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{errors.general}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Título <span className="text-red-400">*</span></Label>
            <Input id="title" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} placeholder="Ex: Live sobre Protologia" className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500" />
            {errors.title && <p className="text-sm text-red-400">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Descrição</Label>
            <Textarea id="description" value={formData.description || ""} onChange={(e) => handleInputChange("description", e.target.value)} placeholder="Descreva o conteúdo e objetivos da live..." rows={4} className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500 resize-none" />
            {errors.description && <p className="text-sm text-red-400">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="live_url" className="text-white">Link da Live</Label>
            <Input
              id="live_url"
              type="url"
              value={formData.live_url || ""}
              onChange={(e) => handleInputChange("live_url", e.target.value)}
              placeholder="https://youtube.com/live/... ou https://zoom.us/j/..."
              className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-400">URL da plataforma onde a live será transmitida (YouTube, Zoom, etc.)</p>
            {errors.live_url && <p className="text-sm text-red-400">{errors.live_url}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instructor" className="text-white">Instrutor <span className="text-red-400">*</span></Label>
              <Input id="instructor" value={formData.instructor_name} onChange={(e) => handleInputChange("instructor_name", e.target.value)} placeholder="Ex: Dr. João Silva" className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500" />
              {errors.instructor_name && <p className="text-sm text-red-400">{errors.instructor_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_at" className="text-white">Data/Horário <span className="text-red-400">*</span></Label>
              <Input id="start_at" type="datetime-local" value={formData.start_at as any} onChange={(e) => handleInputChange("start_at", e.target.value)} className="bg-[#131D37] border-slate-600 text-white" />
              <p className="text-xs text-slate-400 flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Deve ser uma data futura</p>
              {errors.start_at && <p className="text-sm text-red-400">{errors.start_at}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_minutes" className="text-white">Duração (minutos)</Label>
              <Input
                id="duration_minutes"
                type="number"
                min={15}
                max={600}
                value={formData.duration_minutes}
                onChange={(e) => handleInputChange("duration_minutes", Number(e.target.value))}
                className="bg-[#131D37] border-slate-600 text-white"
              />
              {errors.duration_minutes && <p className="text-sm text-red-400">{errors.duration_minutes}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-white">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className="bg-[#131D37] border-slate-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#131D37] border-slate-600">
                  <SelectItem value="scheduled" className="text-white">Agendada</SelectItem>
                  <SelectItem value="live" className="text-white">Ao vivo</SelectItem>
                  <SelectItem value="completed" className="text-white">Encerrada</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-red-400">{errors.status}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Thumbnail (imagem)</Label>
            {thumbnailPreviewUrl && (
              <div className="relative w-full h-48 overflow-hidden rounded-lg border border-slate-600 bg-slate-900">
                <Image src={thumbnailPreviewUrl} alt="Preview da thumbnail" fill sizes="(max-width: 640px) 100vw, 480px" className="object-cover" unoptimized />
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
                if (file) await handleThumbnailUpload(file)
              }}
            />
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" className="bg-[#131D37] text-white border-slate-600 hover:border-white" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                {uploadingImage ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando imagem</>) : (<><UploadCloud className="mr-2 h-4 w-4" />Enviar imagem</>)}
              </Button>
              {thumbnailPreviewUrl && (
                <Button type="button" variant="ghost" className="border border-white/20 text-white" onClick={handleThumbnailClear} disabled={uploadingImage}>
                  <X className="mr-2 h-4 w-4" />Remover
                </Button>
              )}
            </div>
            {errors.thumbnail_url && <p className="text-sm text-red-400">{errors.thumbnail_url}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} className="border-slate-600 text-white hover:bg-slate-700">Cancelar</Button>
            <Button type="submit" disabled={isPending} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              {isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{mode === "create" ? "Criando..." : "Salvando..."}</>) : (mode === "create" ? "Criar Live" : "Salvar Alterações")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
