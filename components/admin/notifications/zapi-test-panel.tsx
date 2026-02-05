"use client"

import { useState, useEffect, useCallback } from "react"
import { Send, Loader2, CheckCircle, XCircle, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

interface InstanceStatus {
  configured: boolean
  connected: boolean
  smartphoneConnected?: boolean
  session?: string
  error?: string
  checkedAt?: string
}

export function ZApiTestPanel() {
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("Olá! Esta é uma mensagem de teste do OdontoGPT via Z-API.")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  const [instanceStatus, setInstanceStatus] = useState<InstanceStatus | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  // Check configuration on mount
  useEffect(() => {
    fetch("/api/test/zapi")
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => setConfig({ configured: false }))
  }, [])

  // Check instance connection status
  const checkInstanceStatus = useCallback(async () => {
    setCheckingStatus(true)
    try {
      const res = await fetch("/api/admin/zapi/status")
      const data = await res.json()
      setInstanceStatus(data)
    } catch {
      setInstanceStatus({ configured: false, connected: false, error: "Falha na verificação" })
    } finally {
      setCheckingStatus(false)
    }
  }, [])

  // Check status on mount
  useEffect(() => {
    checkInstanceStatus()
  }, [checkInstanceStatus])

  async function handleTest() {
    if (!phone || !message) {
      toast.error("Preencha o telefone e a mensagem")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/test/zapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      })

      const data = await res.json()

      if (data.success) {
        setResult({ success: true, data })
        toast.success("Mensagem enviada com sucesso!")
      } else {
        setResult({ success: false, error: data.error, details: data.details })
        toast.error(`Erro: ${data.error}`)
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message })
      toast.error("Erro ao enviar mensagem")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Instance Connection Status */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-base">Status da Conexão</CardTitle>
              <CardDescription className="text-slate-400">
                Status da instância Z-API (WhatsApp)
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkInstanceStatus}
              disabled={checkingStatus}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${checkingStatus ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {instanceStatus ? (
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                instanceStatus.connected
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500"
              }`}>
                {instanceStatus.connected ? (
                  <Wifi className="h-5 w-5" />
                ) : (
                  <WifiOff className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {instanceStatus.connected ? "Conectado" : "Desconectado"}
                </span>
              </div>
              {instanceStatus.smartphoneConnected !== undefined && (
                <div className="text-sm text-slate-400">
                  Smartphone: {instanceStatus.smartphoneConnected ? "Conectado" : "Desconectado"}
                </div>
              )}
              {instanceStatus.error && (
                <div className="text-sm text-red-400">{instanceStatus.error}</div>
              )}
              {instanceStatus.checkedAt && (
                <div className="text-xs text-slate-500 ml-auto">
                  {new Date(instanceStatus.checkedAt).toLocaleTimeString("pt-BR")}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando status...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Message Panel */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Teste Z-API</CardTitle>
          <CardDescription className="text-slate-400">
            Envie uma mensagem de teste via WhatsApp usando a Z-API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration Status */}
          {config && (
            <Alert className={config.configured ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}>
              <div className="flex items-center gap-2">
                {config.configured ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <div className="space-y-1">
                  <AlertDescription className={config.configured ? "text-emerald-500" : "text-red-500"}>
                    {config.configured
                      ? "Z-API configurada corretamente"
                      : "Z-API não configurada. Verifique as variáveis de ambiente (INSTANCE_ID, TOKEN e CLIENT_TOKEN)."}
                  </AlertDescription>
                  <p className="text-xs text-slate-400">
                    Instância: {config.instanceId || "not set"} · Token: {config.token || "not set"} · Client-Token: {config.clientToken || "not set"}
                  </p>
                </div>
              </div>
            </Alert>
          )}

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Número de WhatsApp
            </label>
            <Input
              placeholder="5511999999999 ou 11999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500">
              Formato: DDI + DDD + Número (ex: 5511999999999 ou 11999999999)
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Mensagem</label>
            <Textarea
              placeholder="Digite sua mensagem de teste..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleTest}
            disabled={loading || !phone || !message}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Mensagem de Teste
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                : "bg-red-500/10 border-red-500/30 text-red-500"
            }`}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold mb-2">
                    {result.success ? "Sucesso!" : "Erro"}
                  </p>
                  {result.success ? (
                    <pre className="text-xs bg-slate-900/50 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  ) : (
                    <div>
                      <p className="text-sm mb-1">{result.error}</p>
                      {result.details && (
                        <pre className="text-xs bg-slate-900/50 p-2 rounded overflow-auto mt-2">
                          {result.details}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
