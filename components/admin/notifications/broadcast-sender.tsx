"use client"

import { useState, useMemo, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Radio,
  Send,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import type { NotificationTemplate } from "./types"

interface Profile {
  id: string
  name: string | null
  email: string | null
  whatsapp: string | null
  plan_type?: string | null
  pipeline_stage?: string | null
}

interface BroadcastSenderProps {
  initialUsers: Profile[]
  initialTemplates: NotificationTemplate[]
}

interface BroadcastResult {
  total: number
  sent: number
  failed: number
  details: Array<{
    userId: string
    success: boolean
    error?: string
  }>
}

const PIPELINE_STAGES = [
  { value: "cadastro", label: "Cadastro" },
  { value: "trial", label: "Trial" },
  { value: "engajado", label: "Engajado" },
  { value: "pre_conversao", label: "Pré-Conversão" },
  { value: "convertido", label: "Convertido" },
  { value: "risco_churn", label: "Risco de Churn" },
  { value: "recuperacao", label: "Recuperação" },
  { value: "perdido", label: "Perdido" },
]

const PLAN_TYPES = [
  { value: "free", label: "Free/Trial" },
  { value: "pro", label: "Pro" },
  { value: "premium", label: "Premium" },
]

export function BroadcastSender({
  initialUsers,
  initialTemplates,
}: BroadcastSenderProps) {
  const [isPending, startTransition] = useTransition()
  const [messageType, setMessageType] = useState<"template" | "custom">("custom")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [customMessage, setCustomMessage] = useState("")
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])
  const [result, setResult] = useState<BroadcastResult | null>(null)
  const [progress, setProgress] = useState(0)

  // Filtrar apenas templates de WhatsApp
  const whatsappTemplates = useMemo(
    () => initialTemplates.filter((t) => t.channel === "whatsapp" && t.active),
    [initialTemplates]
  )

  // Filtrar usuários com WhatsApp baseado nos filtros selecionados
  const filteredUsers = useMemo(() => {
    let users = initialUsers.filter((u) => u.whatsapp)

    if (selectedStages.length > 0) {
      users = users.filter((u) => u.pipeline_stage && selectedStages.includes(u.pipeline_stage))
    }

    if (selectedPlans.length > 0) {
      users = users.filter((u) => u.plan_type && selectedPlans.includes(u.plan_type))
    }

    return users
  }, [initialUsers, selectedStages, selectedPlans])

  const handleStageToggle = (stage: string) => {
    setSelectedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    )
  }

  const handlePlanToggle = (plan: string) => {
    setSelectedPlans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
    )
  }

  const getMessage = () => {
    if (messageType === "template") {
      const template = whatsappTemplates.find((t) => t.id === selectedTemplate)
      return template?.content || ""
    }
    return customMessage
  }

  const handleBroadcast = () => {
    const message = getMessage()
    if (!message.trim()) return
    if (filteredUsers.length === 0) return

    startTransition(async () => {
      setResult(null)
      setProgress(0)

      try {
        const response = await fetch("/api/admin/notifications/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userIds: filteredUsers.map((u) => u.id),
            message,
            templateId: messageType === "template" ? selectedTemplate : undefined,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          setResult(data)
          setProgress(100)
        } else {
          setResult({
            total: filteredUsers.length,
            sent: 0,
            failed: filteredUsers.length,
            details: [],
          })
        }
      } catch (error) {
        console.error("Broadcast error:", error)
        setResult({
          total: filteredUsers.length,
          sent: 0,
          failed: filteredUsers.length,
          details: [],
        })
      }
    })
  }

  const isValid =
    getMessage().trim().length > 0 && filteredUsers.length > 0 && !isPending

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Configuração */}
      <Card className="bg-slate-900/70 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <Radio className="h-5 w-5 text-emerald-400" />
            Configurar Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de mensagem */}
          <div className="space-y-3">
            <Label className="text-slate-300">Tipo de Mensagem</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                size="sm"
                variant={messageType === "custom" ? "default" : "outline"}
                onClick={() => setMessageType("custom")}
                className={
                  messageType === "custom"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "border-slate-700 text-slate-300"
                }
              >
                Mensagem Personalizada
              </Button>
              <Button
                type="button"
                size="sm"
                variant={messageType === "template" ? "default" : "outline"}
                onClick={() => setMessageType("template")}
                className={
                  messageType === "template"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "border-slate-700 text-slate-300"
                }
              >
                Usar Template
              </Button>
            </div>
          </div>

          {/* Seleção de template ou mensagem */}
          {messageType === "template" ? (
            <div className="space-y-2">
              <Label className="text-slate-300">Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Selecione um template..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {whatsappTemplates.map((template) => (
                    <SelectItem
                      key={template.id}
                      value={template.id}
                      className="text-white hover:bg-slate-700"
                    >
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                    {whatsappTemplates.find((t) => t.id === selectedTemplate)?.content}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-slate-300">Mensagem</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Digite sua mensagem... Use {{name}} para incluir o nome do usuário."
                className="min-h-[120px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">
                Variáveis disponíveis: {"{{name}}"}, {"{{email}}"}
              </p>
            </div>
          )}

          {/* Filtros */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <Label className="text-slate-300">Filtros (opcional)</Label>

            <div className="space-y-2">
              <p className="text-sm text-slate-400">Estágio do Pipeline:</p>
              <div className="flex flex-wrap gap-2">
                {PIPELINE_STAGES.map((stage) => (
                  <div key={stage.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`stage-${stage.value}`}
                      checked={selectedStages.includes(stage.value)}
                      onCheckedChange={() => handleStageToggle(stage.value)}
                      className="border-slate-600 data-[state=checked]:bg-emerald-600"
                    />
                    <label
                      htmlFor={`stage-${stage.value}`}
                      className="text-sm text-slate-300 cursor-pointer"
                    >
                      {stage.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-400">Tipo de Plano:</p>
              <div className="flex flex-wrap gap-4">
                {PLAN_TYPES.map((plan) => (
                  <div key={plan.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`plan-${plan.value}`}
                      checked={selectedPlans.includes(plan.value)}
                      onCheckedChange={() => handlePlanToggle(plan.value)}
                      className="border-slate-600 data-[state=checked]:bg-emerald-600"
                    />
                    <label
                      htmlFor={`plan-${plan.value}`}
                      className="text-sm text-slate-300 cursor-pointer"
                    >
                      {plan.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview e Envio */}
      <Card className="bg-slate-900/70 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <Users className="h-5 w-5 text-emerald-400" />
            Preview do Envio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contagem de destinatários */}
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div>
              <p className="text-sm text-slate-400">Destinatários</p>
              <p className="text-2xl font-semibold text-white">{filteredUsers.length}</p>
            </div>
            <Badge
              variant="outline"
              className={
                filteredUsers.length > 0
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  : "border-amber-500/30 text-amber-400 bg-amber-500/10"
              }
            >
              {filteredUsers.length > 0 ? "Pronto para enviar" : "Nenhum destinatário"}
            </Badge>
          </div>

          {/* Preview da mensagem */}
          {getMessage() && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Preview da mensagem:</p>
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{getMessage()}</p>
              </div>
            </div>
          )}

          {/* Progresso */}
          {isPending && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                <p className="text-sm text-slate-400">Enviando mensagens...</p>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Resultado */}
          {result && (
            <Alert
              className={
                result.failed === 0
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : result.sent === 0
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-amber-500/30 bg-amber-500/10"
              }
            >
              {result.failed === 0 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : result.sent === 0 ? (
                <XCircle className="h-4 w-4 text-red-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-400" />
              )}
              <AlertTitle className="text-white">
                {result.failed === 0
                  ? "Broadcast concluído!"
                  : result.sent === 0
                    ? "Falha no broadcast"
                    : "Broadcast parcial"}
              </AlertTitle>
              <AlertDescription className="text-slate-300">
                {result.sent} de {result.total} mensagens enviadas
                {result.failed > 0 && `. ${result.failed} falhas.`}
              </AlertDescription>
            </Alert>
          )}

          {/* Botão de envio */}
          <Button
            onClick={handleBroadcast}
            disabled={!isValid}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar para {filteredUsers.length} usuários
              </>
            )}
          </Button>

          <p className="text-xs text-center text-slate-500">
            As mensagens serão enviadas via WhatsApp usando a Z-API.
            O envio respeita o rate limit de 20 mensagens por minuto.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
