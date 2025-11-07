"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Copy, Loader2, UserPlus2 } from "lucide-react"

type FormState = {
  name: string
  email: string
  password: string
}

type ApiResponse = {
  id: string | null
  email: string | null
  name: string | null
  role: string
}

const initialForm: FormState = {
  name: "",
  email: "",
  password: "",
}

export default function AdminInvitePage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<ApiResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [appUrl, setAppUrl] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(window.location.origin)
    }
  }, [])

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessData(null)

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      const payload = await response.json()

      if (!response.ok) {
        setError(payload?.error || "Não foi possível concluir o cadastro.")
        return
      }

      setSuccessData(payload as ApiResponse)
      setForm(initialForm)
    } catch (err) {
      console.error(err)
      setError("Erro inesperado. Tente novamente em instantes.")
    } finally {
      setLoading(false)
    }
  }

  const inviteLink = appUrl ? `${appUrl}/admin/usuarios/novo` : "/admin/usuarios/novo"

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 lg:px-0">
      <div className="flex flex-col gap-4 sm:items-center sm:justify-between sm:flex-row">
        <div>
          <p className="text-sm text-slate-500 font-semibold uppercase tracking-wide">Convite interno</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Cadastrar novo administrador</h1>
          <p className="text-sm text-slate-600 mt-2 max-w-lg">
            Apenas admins autenticados podem acessar esta tela. Compartilhe o link apenas com quem precisa ter acesso.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl border-sky-300/50 text-slate-700 hover:bg-sky-50 whitespace-nowrap">
          <Link href="/admin">Voltar ao painel</Link>
        </Button>
      </div>

      <Card className="rounded-2xl border border-sky-200/50 bg-white shadow-sm">
        <CardHeader className="gap-2 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-cyan-100">
              <UserPlus2 className="h-5 w-5 text-[#0891b2]" />
            </div>
            <CardTitle className="text-slate-900">Cadastro rápido</CardTitle>
          </div>
          <CardDescription className="text-slate-600">
            Defina credenciais provisórias. A pessoa convidada poderá alterar a senha após o primeiro acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-semibold">
                Nome completo
              </Label>
              <Input
                id="name"
                placeholder="Ex: Dra. Ana Monteiro"
                value={form.name}
                onChange={handleChange("name")}
                className="rounded-lg border-sky-200/50 text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">
                Email corporativo
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@odontogpt.com"
                value={form.email}
                onChange={handleChange("email")}
                className="rounded-lg border-sky-200/50 text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-semibold">
                Senha temporária
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="mínimo 8 caracteres"
                value={form.password}
                onChange={handleChange("password")}
                minLength={8}
                className="rounded-lg border-sky-200/50 text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500/50"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-300/50 bg-rose-50 p-4 text-sm text-rose-800">
                <p className="font-semibold">Erro ao registrar</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            )}

            {successData && (
              <div className="rounded-lg border border-emerald-300/50 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="flex items-center gap-2 font-semibold text-emerald-900">
                  <CheckCircle2 className="h-5 w-5" />
                  Admin criado com sucesso!
                </p>
                <p className="text-xs mt-2 text-emerald-800">
                  Envie as credenciais para <span className="font-semibold">{successData.email}</span>.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold hover:from-sky-600 hover:to-cyan-600 shadow-md"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Registrando...
                </>
              ) : (
                "Cadastrar admin"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-sky-200/50 bg-white shadow-sm">
        <CardHeader className="gap-2 pb-4">
          <div className="flex items-center gap-2">
            <Badge className="border-sky-300/60 bg-sky-100 text-sky-900 font-semibold">Link interno</Badge>
            <CardTitle className="text-slate-900">Compartilhe com segurança</CardTitle>
          </div>
          <CardDescription className="text-slate-600">
            O link só funciona para usuários logados como admin. Utilize canais internos (Slack, e-mail corporativo) e
            revogue acessos quando necessário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-slate-300/50 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <code className="break-all text-xs text-slate-700 font-mono bg-white rounded px-3 py-2 border border-slate-200/50">{inviteLink}</code>
            <Button
              type="button"
              variant="outline"
              onClick={copyLink}
              className="rounded-lg border-sky-300/50 text-slate-700 hover:bg-sky-50"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar link
                </>
              )}
            </Button>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Mensagem sugerida</Label>
            <Textarea
              readOnly
              value={`Oi! Você foi convidado(a) para administrar o Odonto GPT.\n\n1. Acesse: ${inviteLink}\n2. Informe o email corporativo autorizado\n3. Troque a senha após o primeiro login\n\nDúvidas? Fale com a diretoria.`}
              className="rounded-lg border-sky-200/50 bg-slate-50 text-slate-700 resize-none focus-visible:ring-sky-500/50"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
