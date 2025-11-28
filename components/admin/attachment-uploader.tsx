"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { UploadCloud, FileText, FileArchive, Image as ImageIcon, FileSpreadsheet, FileVideo, File, FileType, Trash2, Download } from "lucide-react"
import { kindFromMime, formatBytes } from "@/lib/attachments/mime"
import { isUuid } from "@/lib/validations/uuid"

type AttachmentRow = {
  id: string
  file_name: string
  mime_type: string
  size_bytes: number
  storage_path: string
  created_at: string
}

export function AttachmentUploader({ lessonId }: { lessonId: string }) {
  const [attachments, setAttachments] = useState<AttachmentRow[]>([])
  const [errors, setErrors] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [link, setLink] = useState("")
  const [fileName, setFileName] = useState("")

  useEffect(() => {
    const run = async () => {
      if (!isUuid(lessonId)) {
        setErrors("Aula ainda não salva. Salve a aula antes de enviar anexos.")
        setAttachments([])
        return
      }
      try {
        const res = await fetch(`/api/lessons/${lessonId}/attachments`, { cache: "no-store" })
        if (res.status === 401) {
          setErrors("Sua sessão expirou. Faça login novamente.")
          setAttachments([])
          return
        }
        if (res.status === 403) {
          setErrors("Você não tem permissão para visualizar anexos desta aula.")
          setAttachments([])
          return
        }
        if (!res.ok) {
          const msg = await res.text().catch(() => "")
          throw new Error(msg || "Erro ao listar anexos.")
        }
        const json = await res.json()
        setAttachments(json.attachments ?? [])
      } catch (err) {
        const msg = err instanceof Error ? err.message : null
        setErrors(msg || "Falha ao carregar anexos.")
      }
    }
    void run()
  }, [lessonId])

  const handleAddLink = async () => {
    const url = link.trim()
    if (!url) {
      setErrors("Informe a URL do arquivo no Bunny.")
      return
    }
    if (!isUuid(lessonId)) {
      setErrors("Aula ainda não salva. Salve a aula antes de enviar anexos.")
      return
    }
    setErrors(null)
    setAdding(true)

    try {
      const res = await fetch(`/api/lessons/${lessonId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, file_name: fileName.trim() || undefined }),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setErrors(json?.error || "Não foi possível salvar o anexo.")
        setAdding(false)
        return
      }

      const att = json?.attachment
      setAttachments((prev) => (att ? [att, ...prev] : prev))
      setLink("")
      setFileName("")
    } catch (err) {
      setErrors("Falha ao salvar anexo.")
    } finally {
      setAdding(false)
    }
  }

  const removeAttachment = async (id: string) => {
    if (!isUuid(lessonId)) {
      setErrors("Aula ainda não salva. Salve a aula antes de enviar anexos.")
      return
    }
    try {
      const res = await fetch(`/api/lessons/${lessonId}/attachments/${id}`, { method: "DELETE" })
      if (res.status === 401) {
        setErrors("Sua sessão expirou. Faça login novamente.")
        return
      }
      if (res.status === 403) {
        setErrors("Você não tem permissão para remover anexos.")
        return
      }
      if (!res.ok) throw new Error(await res.text())
      setAttachments((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setErrors("Falha ao remover anexo.")
    }
  }

  const downloadAttachment = async (id: string) => {
    if (!isUuid(lessonId)) {
      setErrors("Aula ainda não salva. Salve a aula antes de baixar anexos.")
      return
    }
    try {
      const res = await fetch(`/api/lessons/${lessonId}/attachments/${id}/download`)
      if (res.status === 401) {
        setErrors("Sua sessão expirou. Faça login novamente.")
        return
      }
      if (res.status === 403) {
        setErrors("Você não tem permissão para baixar anexos desta aula.")
        return
      }
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      const url: string | undefined = json.url
      if (url) {
        const a = document.createElement("a")
        a.href = url
        a.rel = "noopener"
        a.target = "_blank"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (err) {
      setErrors("Falha ao preparar download.")
    }
  }

  const IconFor = ({ kind }: { kind: ReturnType<typeof kindFromMime> }) => {
    const cls = "h-4 w-4"
    switch (kind) {
      case "pdf":
        return <FileText className={cls} />
      case "doc":
        return <FileType className={cls} />
      case "ppt":
        return <FileVideo className={cls} />
      case "xls":
        return <FileSpreadsheet className={cls} />
      case "image":
        return <ImageIcon className={cls} />
      case "zip":
        return <FileArchive className={cls} />
      default:
        return <File className={cls} />
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-slate-400">Anexos da aula</Label>
      </div>
      <div className="rounded-xl border border-slate-800 bg-[#0F192F] p-3 space-y-3">
        <div className="space-y-2">
          <Label className="text-xs text-slate-400">Link do arquivo (Bunny CDN)</Label>
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://odontogpt.b-cdn.net/pasta/arquivo.pdf"
            className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-slate-400">Nome do arquivo (opcional)</Label>
          <Input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Checklist Pré-Operatório.pdf"
            className="bg-[#131D37] border-slate-600 text-white placeholder:text-slate-500"
          />
        </div>
        <Button
          type="button"
          size="sm"
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
          onClick={handleAddLink}
          disabled={adding}
        >
          <UploadCloud className="h-4 w-4" />
          {adding ? "Salvando..." : "Salvar link"}
        </Button>
      </div>
      {errors && <p className="text-sm text-red-400">{errors}</p>}
      <div className="space-y-2">
        {attachments.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum anexo ainda.</p>
        ) : (
          attachments.map((att) => {
            const kind = kindFromMime(att.mime_type)
            return (
              <div key={att.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0F192F] p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <IconFor kind={kind} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{att.file_name}</p>
                  <p className="text-xs text-slate-400">
                    {att.mime_type} • {formatBytes(att.size_bytes)} • {new Date(att.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-white/70 hover:bg-white/10"
                    onClick={() => void downloadAttachment(att.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-rose-400 hover:bg-rose-500/10"
                    onClick={() => void removeAttachment(att.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
