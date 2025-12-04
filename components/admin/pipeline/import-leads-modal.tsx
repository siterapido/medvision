"use client"

import { useState } from "react"
import { Upload, Download, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { importLeads } from "@/app/actions/leads"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImportLeadsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/**
 * Gera um CSV de exemplo para download
 */
function downloadExampleCSV() {
  const headers = ["Nome", "Telefone", "Email", "Origem", "Observações"]
  const exampleRows = [
    ["Dr. João Silva", "11987654321", "joao@example.com", "Facebook", "Interessado em implantodontia"],
    ["Maria Santos", "21912345678", "maria@example.com", "Google", ""],
    ["Carlos Oliveira", "11999998888", "", "Indicação", "Cliente antigo"],
  ]

  const csvContent = [
    headers.join(","),
    ...exampleRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", "modelo_importacao_leads.csv")
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function ImportLeadsModal({ open, onOpenChange, onSuccess }: ImportLeadsModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    inserted?: number
    skipped?: number
    errors?: string[]
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setResult({
          success: false,
          message: "Por favor, selecione um arquivo CSV",
        })
        return
      }
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setResult({
        success: false,
        message: "Por favor, selecione um arquivo",
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await importLeads(formData)

      setResult(response)
      
      if (response.success) {
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById("csv-file-input") as HTMLInputElement
        if (fileInput) {
          fileInput.value = ""
        }
        onSuccess?.()
        // Auto-close after 2 seconds on success
        setTimeout(() => {
          onOpenChange(false)
          setResult(null)
        }, 2000)
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Erro inesperado: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFile(null)
      setResult(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Importar Leads via CSV</DialogTitle>
          <DialogDescription className="text-slate-400">
            Faça upload de um arquivo CSV com os dados dos leads. O telefone é obrigatório e será usado como identificador único.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Download Example */}
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-200">Precisa de um modelo?</p>
              <p className="text-xs text-slate-400 mt-0.5">Baixe um arquivo CSV de exemplo</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadExampleCSV}
              className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar modelo
            </Button>
          </div>

          {/* File Input */}
          <div className="space-y-2">
            <label
              htmlFor="csv-file-input"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 mb-2 text-slate-400" />
                <p className="mb-2 text-sm text-slate-300">
                  <span className="font-semibold">Clique para fazer upload</span> ou arraste o arquivo
                </p>
                <p className="text-xs text-slate-500">CSV (máx. 10MB)</p>
              </div>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </label>
            {file && (
              <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-slate-700">
                <span className="text-sm text-slate-300 truncate flex-1">{file.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    const fileInput = document.getElementById("csv-file-input") as HTMLInputElement
                    if (fileInput) {
                      fileInput.value = ""
                    }
                  }}
                  className="ml-2 text-slate-400 hover:text-slate-200"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Result Alert */}
          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className={result.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200" : ""}
            >
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="space-y-1">
                  <p>{result.message}</p>
                  {result.success && result.inserted !== undefined && (
                    <p className="text-xs opacity-80">
                      {result.inserted} leads importados
                      {result.skipped !== undefined && result.skipped > 0 && (
                        <> • {result.skipped} duplicados ignorados</>
                      )}
                    </p>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold">Erros:</p>
                      {result.errors.slice(0, 5).map((error, idx) => (
                        <p key={idx} className="text-xs opacity-80">
                          {error}
                        </p>
                      ))}
                      {result.errors.length > 5 && (
                        <p className="text-xs opacity-60">... e mais {result.errors.length - 5} erros</p>
                      )}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!file || isLoading}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

