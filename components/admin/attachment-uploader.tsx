"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { UploadCloud, FileText, FileArchive, Image as ImageIcon, FileSpreadsheet, FileVideo, File, FileType, Trash2, Download } from "lucide-react"
import { kindFromMime, formatBytes } from "@/lib/attachments/mime"
import { ALLOWED_MIME, maxBytesFromEnv } from "@/lib/attachments/validate"

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
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const maxBytes = useMemo(() => maxBytesFromEnv(10), [])

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/lessons/${lessonId}/attachments`, { cache: "no-store" })
        if (!res.ok) throw new Error(await res.text())
        const json = await res.json()
        setAttachments(json.attachments ?? [])
      } catch (err) {
        setErrors("Falha ao carregar anexos.")
      }
    }
    void run()
  }, [lessonId])

  const handlePick = () => inputRef.current?.click()

  const handleUpload = async (file: File) => {
    setErrors(null)
    setUploading(true)
    setProgress(0)

    // Validações client-side básicas
    if (!ALLOWED_MIME.includes(file.type) && !file.type.startsWith("image/")) {
      setErrors("Tipo de arquivo não suportado.")
      setUploading(false)
      return
    }
    if (file.size > maxBytes) {
      setErrors("Arquivo excede o limite permitido.")
      setUploading(false)
      return
    }

    // Envio com XHR para capturar progresso
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", `/api/lessons/${lessonId}/attachments`)
      xhr.responseType = "json"
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload = () => {
        const ok = xhr.status >= 200 && xhr.status < 300
        if (!ok) {
          setErrors(xhr.response?.error ?? "Falha no upload.")
          setUploading(false)
          resolve()
          return
        }
        const att = xhr.response?.attachment
        setAttachments((prev) => (att ? [att, ...prev] : prev))
        setUploading(false)
        setProgress(100)
        resolve()
      }
      xhr.onerror = () => {
        setErrors("Erro de rede durante upload.")
        setUploading(false)
        resolve()
      }
      const fd = new FormData()
      fd.append("file", file)
      xhr.send(fd)
    })
  }

  const removeAttachment = async (id: string) => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/attachments/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      setAttachments((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setErrors("Falha ao remover anexo.")
    }
  }

  const downloadAttachment = async (id: string) => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/attachments/${id}/download`)
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
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex items-center gap-1 rounded-xl border-slate-600 px-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200 hover:bg-slate-800"
          onClick={handlePick}
          disabled={uploading}
        >
          <UploadCloud className="h-3.5 w-3.5" />
          {uploading ? "Enviando..." : "Enviar arquivo"}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-7z-compressed,image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.currentTarget.value = ""
          if (file) void handleUpload(file)
        }}
      />
      {uploading && (
        <div className="rounded-xl border border-slate-800 bg-[#0F192F] p-3">
          <p className="text-xs text-slate-300">Enviando arquivo...</p>
          <Progress value={progress} className="mt-2 h-1.5 rounded-full bg-white/10" />
        </div>
      )}
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
