"use client"

import { useState } from "react"
import { Upload, Download, X, AlertCircle, CheckCircle2, Loader2, ArrowRight, ArrowLeft, FileSpreadsheet } from "lucide-react"
import { importLeadsFromJson, ColumnMapping, SheetMetadata, ImportLeadRow } from "@/app/actions/leads"
import { parseFile, applyMapping, ParsedSheet } from "@/lib/leads/import-parser"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ColumnMappingStep } from "./column-mapping-step"

interface ImportLeadsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/**
 * Gera um CSV de exemplo para download
 */
function downloadExampleCSV() {
  const headers = ["Nome", "Telefone", "Email", "Origem", "Observações", "Estado", "IES"]
  const exampleRows = [
    ["Dr. João Silva", "11987654321", "joao@example.com", "Facebook", "Interessado em implantodontia", "SP", "USP"],
    ["Maria Santos", "21912345678", "maria@example.com", "Google", "", "RJ", "UFRJ"],
    ["Carlos Oliveira", "11999998888", "", "Indicação", "Cliente antigo", "MG", "UFMG"],
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

type Step = "upload" | "mapping" | "review" | "importing" | "success"

export function ImportLeadsModal({ open, onOpenChange, onSuccess }: ImportLeadsModalProps) {
  const [step, setStep] = useState<Step>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [parsedSheet, setParsedSheet] = useState<ParsedSheet | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping | null>(null)
  const [validCount, setValidCount] = useState(0)
  
  const [metadata, setMetadata] = useState<SheetMetadata>({
    name: "",
    description: "",
    updateDuplicates: false,
  })

  const [result, setResult] = useState<{
    success: boolean
    message: string
    inserted?: number
    skipped?: number
    errors?: string[]
  } | null>(null)
  
  const [error, setError] = useState<string | null>(null)

  const resetState = () => {
    setStep("upload")
    setFile(null)
    setParsedSheet(null)
    setMapping(null)
    setValidCount(0)
    setMetadata({ name: "", description: "", updateDuplicates: false })
    setResult(null)
    setError(null)
  }

  const handleClose = () => {
    if (step !== "importing") {
      resetState()
      onOpenChange(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    
    // Auto-fill sheet name from file name
    if (!metadata.name) {
      setMetadata(prev => ({ 
        ...prev, 
        name: selectedFile.name.replace(/\.(csv|xlsx|xls)$/i, "") 
      }))
    }

    try {
      const sheet = await parseFile(selectedFile)
      setParsedSheet(sheet)
    } catch (err) {
      console.error("Erro ao ler arquivo:", err)
      setError(err instanceof Error ? err.message : "Erro ao ler arquivo")
      setFile(null)
      setParsedSheet(null)
    }
  }

  const handleContinueToMapping = () => {
    if (!file || !parsedSheet) {
      setError("Selecione um arquivo válido")
      return
    }
    if (!metadata.name) {
      setError("Defina um nome para a planilha")
      return
    }
    setError(null)
    setStep("mapping")
  }

  const handleContinueToReview = () => {
    if (!mapping || !parsedSheet) return
    if (validCount === 0) {
      setError("Nenhum lead válido encontrado com o mapeamento atual")
      return
    }
    setError(null)
    setStep("review")
  }

  const handleImport = async () => {
    if (!parsedSheet || !mapping) return

    setStep("importing")
    setError(null)

    try {
      // Apply mapping to all rows
      const rows = applyMapping(parsedSheet.rows, mapping)
      
      const response = await importLeadsFromJson(rows, metadata)
      
      setResult(response)
      
      if (response.success) {
        setStep("success")
        onSuccess?.()
        // Auto-close logic could be here, but let user see result first
      } else {
        setError(response.message)
        setStep("review") // Go back to review to try again or fix
      }
    } catch (err) {
      setError(`Erro inesperado: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
      setStep("review")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] bg-slate-900 border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar Leads
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {step === "upload" && "Faça upload de um arquivo CSV ou Excel (.xlsx, .xls) com os dados dos leads."}
            {step === "mapping" && "Mapeie as colunas do seu arquivo para os campos do sistema."}
            {step === "review" && "Revise as configurações antes de finalizar a importação."}
            {step === "importing" && "Processando sua importação..."}
            {step === "success" && "Importação concluída com sucesso!"}
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          {/* STEP 1: UPLOAD */}
          {step === "upload" && (
            <div className="space-y-6">
              {/* Metadata Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sheet-name" className="text-slate-200">Nome da Importação*</Label>
                  <Input 
                    id="sheet-name"
                    value={metadata.name}
                    onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-slate-200"
                    placeholder="Ex: Leads Evento X"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sheet-desc" className="text-slate-200">Descrição (Opcional)</Label>
                  <Input 
                    id="sheet-desc"
                    value={metadata.description || ""}
                    onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-slate-200"
                    placeholder="Ex: Lista obtida no evento..."
                  />
                </div>
              </div>

              {/* File Input */}
              <div className="space-y-2">
                <Label className="text-slate-200">Arquivo de Leads</Label>
                <label
                  htmlFor="file-input"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {file ? (
                      <>
                        <FileSpreadsheet className="h-8 w-8 mb-2 text-emerald-400" />
                        <p className="mb-1 text-sm text-slate-200 font-medium">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mb-2 text-slate-400" />
                        <p className="mb-2 text-sm text-slate-300">
                          <span className="font-semibold">Clique para upload</span> ou arraste
                        </p>
                        <p className="text-xs text-slate-500">CSV, Excel (.xlsx, .xls)</p>
                      </>
                    )}
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {file && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.preventDefault()
                      setFile(null)
                      setParsedSheet(null)
                    }}
                    className="text-xs text-red-400 h-auto p-0 hover:text-red-300 hover:bg-transparent"
                  >
                    Remover arquivo
                  </Button>
                )}
              </div>

              {/* Download Example */}
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">Modelo de Importação</p>
                  <p className="text-xs text-slate-400 mt-0.5">Baixe um exemplo para seguir o formato ideal</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadExampleCSV}
                  className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar CSV
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: MAPPING */}
          {step === "mapping" && parsedSheet && (
            <ColumnMappingStep 
              sheet={parsedSheet}
              onMappingChange={(newMapping, count) => {
                setMapping(newMapping)
                setValidCount(count)
              }}
            />
          )}

          {/* STEP 3: REVIEW */}
          {step === "review" && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 space-y-4">
                <h3 className="text-sm font-medium text-slate-200">Resumo da Importação</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">Arquivo</span>
                    <span className="text-slate-200">{file?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Total de Linhas</span>
                    <span className="text-slate-200">{parsedSheet?.totalRows}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Leads Válidos</span>
                    <span className="text-slate-200 font-medium text-emerald-400">{validCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Colunas Mapeadas</span>
                    <span className="text-slate-200">
                      {Object.values(mapping || {}).filter(Boolean).length} de {Object.keys(mapping || {}).length}
                    </span>
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-200">Atualizar duplicados?</Label>
                    <p className="text-xs text-slate-400">
                      Se encontrar leads com mesmo telefone, atualiza os dados.
                    </p>
                  </div>
                  <Switch
                    checked={metadata.updateDuplicates}
                    onCheckedChange={(checked) => setMetadata(prev => ({ ...prev, updateDuplicates: checked }))}
                  />
                </div>
              </div>

              <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Os leads serão importados com status <strong>Novo Lead</strong>.
                  {metadata.updateDuplicates 
                    ? " Leads existentes serão atualizados com as novas informações." 
                    : " Leads com telefone já cadastrado serão ignorados."}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === "success" && result && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-slate-100">Importação Concluída!</h3>
                <p className="text-slate-400 text-sm">{result.message}</p>
              </div>

              <div className="bg-slate-800/50 rounded p-4 text-sm w-full max-w-sm border border-slate-700">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Inseridos/Atualizados:</span>
                  <span className="text-emerald-400 font-medium">{result.inserted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ignorados:</span>
                  <span className="text-slate-400 font-medium">{result.skipped}</span>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="w-full text-left mt-4">
                  <p className="text-xs font-semibold text-red-400 mb-2">Erros encontrados:</p>
                  <div className="bg-red-950/20 border border-red-900/50 rounded p-3 max-h-32 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-300/80 mb-1 last:mb-0">• {err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-2">
          {step === "success" ? (
            <Button onClick={handleClose} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100">
              Fechar
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (step === "mapping") setStep("upload")
                  else if (step === "review") setStep("mapping")
                  else handleClose()
                }}
                disabled={step === "importing"}
                className="text-slate-400 hover:text-slate-200"
              >
                {step === "upload" ? "Cancelar" : <><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</>}
              </Button>
              
              <Button
                onClick={() => {
                  if (step === "upload") handleContinueToMapping()
                  else if (step === "mapping") handleContinueToReview()
                  else if (step === "review") handleImport()
                }}
                disabled={step === "importing" || !file}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white"
              >
                {step === "importing" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : step === "review" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirmar Importação
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
