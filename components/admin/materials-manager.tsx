"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { createMaterial, deleteMaterial, updateMaterial, type MaterialActionResult } from "@/app/actions/materials"
import type { MaterialFormData } from "@/lib/validations/material"
import { materialResourceOptions } from "@/lib/validations/material"
import { Loader2, UploadCloud } from "lucide-react"

export type AdminMaterialRow = {
  id: string
  title: string
  description: string | null
  pages: number
  tags: string[] | null
  resource_type: MaterialFormData["resource_type"]
  file_url: string
  created_at: string
  updated_at?: string | null
  is_available?: boolean
}

interface MaterialsManagerProps {
  materials: AdminMaterialRow[]
}

type StatusMessage = {
  type: "success" | "error"
  message: string
}

const supabase = createClient()

export function MaterialsManager({ materials }: MaterialsManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    pages: "",
    tags: "",
    file_url: "",
    resource_type: materialResourceOptions[0]?.value ?? "ebook",
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string>("")

  const handleInputChange = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploadingFile(true)
    setStatus(null)

    try {
      const extension = file.name.split(".").pop() ?? "bin"
      const uploadPath = `materials/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from("course-assets")
        .upload(uploadPath, file, { cacheControl: "3600", upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from("course-assets").getPublicUrl(uploadPath)
      if (!data?.publicUrl) {
        throw new Error("Não foi possível obter a URL pública")
      }

      setFormState((prev) => ({ ...prev, file_url: data.publicUrl }))
      setUploadedFileName(file.name)
      setStatus({ type: "success", message: "Arquivo enviado com sucesso." })
    } catch (error) {
      console.error("Erro ao enviar material", error)
      setStatus({ type: "error", message: "Não foi possível enviar o arquivo." })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setFieldErrors({})
    setStatus(null)

    const formPayload: MaterialFormData = {
      title: formState.title,
      description: formState.description,
      pages: Number(formState.pages || 0),
      tags: formState.tags,
      file_url: formState.file_url,
      resource_type: formState.resource_type,
    }

    startTransition(async () => {
      const result: MaterialActionResult<{ id: string }> = await createMaterial(formPayload)

      if (result.success) {
        setStatus({ type: "success", message: "Material criado com sucesso." })
        setFormState({
          title: "",
          description: "",
          pages: "",
          tags: "",
          file_url: "",
          resource_type: materialResourceOptions[0]?.value ?? "ebook",
        })
        setUploadedFileName("")
        router.refresh()
        return
      }

      if (result.fieldErrors) {
        const flattened: Record<string, string> = {}
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages.length) {
            flattened[field] = messages[0]
          }
        })
        setFieldErrors(flattened)
      }

      if (result.error && !result.fieldErrors) {
        setStatus({ type: "error", message: result.error })
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr,1.2fr]">
      <Card className="rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0F192F] to-[#131D37] shadow-[0_30px_80px_rgba(2,8,18,0.65)]">
        <CardHeader>
          <CardTitle className="text-white">Upload de materiais</CardTitle>
          <CardDescription className="text-slate-300">
            Insira o título, descrição e o PDF. O arquivo será armazenado no bucket <span className="text-primary">course-assets</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status && (
            <Alert variant={status.type === "success" ? "default" : "destructive"}>
              <AlertTitle>{status.type === "success" ? "Sucesso" : "Erro"}</AlertTitle>
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200">Título do material</label>
              <Input
                value={formState.title}
                onChange={(event) => handleInputChange("title", event.target.value)}
                placeholder="Ex: Checklist de protocolos"
                className="bg-[#16243F] border border-slate-800 text-white"
              />
              {fieldErrors.title && <p className="text-xs text-rose-400">{fieldErrors.title}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200">Descrição</label>
              <Textarea
                value={formState.description}
                onChange={(event) => handleInputChange("description", event.target.value)}
                placeholder="Resumo do conteúdo"
                className="bg-[#16243F] border border-slate-800 text-white"
                rows={3}
              />
              {fieldErrors.description && <p className="text-xs text-rose-400">{fieldErrors.description}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200">Páginas</label>
                <Input
                  type="number"
                  min={0}
                  value={formState.pages}
                  onChange={(event) => handleInputChange("pages", event.target.value)}
                  placeholder="52"
                  className="bg-[#16243F] border border-slate-800 text-white"
                />
                {fieldErrors.pages && <p className="text-xs text-rose-400">{fieldErrors.pages}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200">Tipo de material</label>
                <Select
                  value={formState.resource_type}
                  onValueChange={(value) => handleInputChange("resource_type", value)}
                >
                  <SelectTrigger className="bg-[#16243F] border border-slate-800 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialResourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.resource_type && <p className="text-xs text-rose-400">{fieldErrors.resource_type}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200">Tags (separadas por vírgula)</label>
              <Input
                value={formState.tags}
                onChange={(event) => handleInputChange("tags", event.target.value)}
                placeholder="Gestão, Protocolos"
                className="bg-[#16243F] border border-slate-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200">Arquivo</label>
              <label className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-primary cursor-pointer">
                {uploadingFile ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
                {uploadingFile ? "Enviando..." : "Selecione um arquivo"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {uploadedFileName && (
                <p className="text-xs text-slate-300 truncate">{uploadedFileName}</p>
              )}
              {fieldErrors.file_url && <p className="text-xs text-rose-400">{fieldErrors.file_url}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isPending || uploadingFile}>
              {isPending ? "Salvando..." : "Salvar material"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-slate-800 bg-[#0A131E]/80 shadow-[0_25px_60px_rgba(3,7,18,0.7)]">
        <CardHeader>
          <CardTitle className="text-white">Materiais publicados</CardTitle>
          <CardDescription className="text-slate-400">
            {materials.length} material{materials.length === 1 ? "" : "s"} disponível(is)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {materials.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum material cadastrado ainda.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {materials.map((material) => (
                <MaterialRowItem key={material.id} row={material} onSaved={() => router.refresh()} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MaterialRowItem({ row, onSaved }: { row: AdminMaterialRow; onSaved: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [local, setLocal] = useState<MaterialFormData>({
    title: row.title,
    description: row.description ?? "",
    pages: row.pages,
    tags: (row.tags ?? []).join(", "),
    file_url: row.file_url,
    resource_type: row.resource_type,
    is_available: row.is_available ?? true,
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<StatusMessage | null>(null)

  const handleSave = () => {
    setFieldErrors({})
    setStatus(null)
    startTransition(async () => {
      const result = await updateMaterial(row.id, local)
      if (result.success) {
        setStatus({ type: "success", message: "Material atualizado." })
        setOpenEdit(false)
        onSaved()
        return
      }
      if (result.fieldErrors) {
        const flattened: Record<string, string> = {}
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages.length) flattened[field] = messages[0]
        })
        setFieldErrors(flattened)
      }
      if (result.error && !result.fieldErrors) {
        setStatus({ type: "error", message: result.error })
      }
    })
  }

  const handleDelete = () => {
    setStatus(null)
    startTransition(async () => {
      const result = await deleteMaterial(row.id)
      if (result.success) {
        setOpenDelete(false)
        onSaved()
        return
      }
      if (result.error) setStatus({ type: "error", message: result.error })
    })
  }

  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-[#131C2F] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-semibold text-white truncate">{row.title}</p>
        <Badge className="text-[11px] uppercase tracking-[0.3em]">{row.resource_type}</Badge>
      </div>
      {row.description && (
        <p className="text-sm text-slate-300 line-clamp-2">{row.description}</p>
      )}
      {row.tags && row.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {row.tags.map((tag) => (
            <Badge key={`${row.id}-${tag}`} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{row.pages} página{row.pages === 1 ? "" : "s"}</span>
        <a href={row.file_url} target="_blank" rel="noreferrer" className="text-primary font-semibold">Abrir material</a>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-2">
        <div className="text-xs text-slate-400">{row.created_at ? `Criado: ${new Date(row.created_at).toLocaleDateString()}` : null} {row.updated_at ? `• Atualizado: ${new Date(row.updated_at).toLocaleDateString()}` : null}</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpenEdit(true)} disabled={isPending}>Editar</Button>
          <Button size="sm" variant="destructive" onClick={() => setOpenDelete(true)} disabled={isPending}>Excluir</Button>
        </div>
      </div>

      {status && (
        <Alert variant={status.type === "success" ? "default" : "destructive"}>
          <AlertTitle>{status.type === "success" ? "Sucesso" : "Erro"}</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="bg-[#16243F] border border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Editar material</DialogTitle>
            <DialogDescription>Atualize os campos necessários e salve.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={local.title} onChange={(e) => setLocal({ ...local, title: e.target.value })} className="bg-[#16243F] border border-slate-800 text-white" placeholder="Título" />
            {fieldErrors.title && <p className="text-xs text-rose-400">{fieldErrors.title}</p>}
            <Textarea value={local.description as string} onChange={(e) => setLocal({ ...local, description: e.target.value })} className="bg-[#16243F] border border-slate-800 text-white" rows={3} placeholder="Descrição" />
            <Input type="number" min={0} value={String(local.pages)} onChange={(e) => setLocal({ ...local, pages: Number(e.target.value || 0) })} className="bg-[#16243F] border border-slate-800 text-white" placeholder="Páginas" />
            <Select value={local.resource_type} onValueChange={(value) => setLocal({ ...local, resource_type: value as MaterialFormData["resource_type"] })}>
              <SelectTrigger className="bg-[#16243F] border border-slate-800 text-white"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                {materialResourceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={local.tags as string} onChange={(e) => setLocal({ ...local, tags: e.target.value })} className="bg-[#16243F] border border-slate-800 text-white" placeholder="Tags (vírgulas)" />
            <Input value={local.file_url} onChange={(e) => setLocal({ ...local, file_url: e.target.value })} className="bg-[#16243F] border border-slate-800 text-white" placeholder="Link do arquivo" />
            <div className="flex items-center gap-2 text-sm">
              <Checkbox checked={local.is_available ?? true} onCheckedChange={(v) => setLocal({ ...local, is_available: Boolean(v) })} />
              <span>Disponível</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir material?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
