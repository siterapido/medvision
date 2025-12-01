"use client"

import { useState, useEffect } from "react"
import { Send, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

export function ZApiTestPanel() {
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("Olá! Esta é uma mensagem de teste do OdontoGPT via Z-API.")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)

  // Verificar configuração ao montar
  useEffect(() => {
    fetch("/api/test/zapi")
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => setConfig({ configured: false }))
  }, [])

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
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Teste Z-API</CardTitle>
          <CardDescription className="text-slate-400">
            Envie uma mensagem de teste via WhatsApp usando a Z-API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status da Configuração */}
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

          {/* Telefone */}
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

          {/* Mensagem */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Mensagem</label>
            <Textarea
              placeholder="Digite sua mensagem de teste..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
            />
          </div>

          {/* Botão de Envio */}
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

          {/* Resultado */}
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
