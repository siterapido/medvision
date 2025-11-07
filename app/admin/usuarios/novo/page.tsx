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
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Convite interno</p>
          <h1 className="text-2xl font-semibold text-white">Cadastrar novo administrador</h1>
          <p className="text-sm text-slate-400">
            Apenas admins autenticados podem acessar esta tela. Compartilhe o link apenas com quem precisa ter acesso.
          </p>
        </div>
        <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10">
          <Link href="/admin">Voltar ao painel</Link>
        </Button>
      </div>

      <Card className="border-white/10 bg-white/5 text-slate-100 backdrop-blur-xl">
        <CardHeader className="gap-1">
          <div className="flex items-center gap-2">
            <UserPlus2 className="h-5 w-5 text-cyan-300" />
            <CardTitle className="text-white">Cadastro rápido</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Defina credenciais provisórias. A pessoa convidada poderá alterar a senha após o primeiro acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">
                Nome completo
              </Label>
              <Input
                id="name"
                placeholder="Ex: Dra. Ana Monteiro"
                value={form.name}
                onChange={handleChange("name")}
                className="border-white/20 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email corporativo
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@odontogpt.com"
                value={form.email}
                onChange={handleChange("email")}
                className="border-white/20 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                Senha temporária
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="mínimo 8 caracteres"
                value={form.password}
                onChange={handleChange("password")}
                minLength={8}
                className="border-white/20 text-white placeholder:text-slate-500"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">
                {error}
              </div>
            )}

            {successData && (
              <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                <p className="flex items-center gap-2 text-emerald-50">
                  <CheckCircle2 className="h-4 w-4" />
                  Admin criado com sucesso!
                </p>
                <p className="text-emerald-50">
                  Envie as credenciais para <span className="font-semibold">{successData.email}</span>.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full rounded-2xl bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Cadastrar admin"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-slate-100 backdrop-blur-xl">
        <CardHeader className="gap-1">
          <div className="flex items-center gap-2">
            <Badge className="border-cyan-400/40 bg-cyan-400/10 text-cyan-100">Link interno</Badge>
            <CardTitle className="text-white">Compartilhe com segurança</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            O link só funciona para usuários logados como admin. Utilize canais internos (Slack, e-mail corporativo) e
            revogue acessos quando necessário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#050b16]/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <code className="break-all text-xs text-slate-200">{inviteLink}</code>
            <Button
              type="button"
              variant="outline"
              onClick={copyLink}
              className="border-cyan-400/40 text-cyan-100 hover:bg-cyan-400/10"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
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
            <Label className="text-slate-200">Mensagem sugerida</Label>
            <Textarea
              readOnly
              value={`Oi! Você foi convidado(a) para administrar o Odonto GPT.\n\n1. Acesse: ${inviteLink}\n2. Informe o email corporativo autorizado\n3. Troque a senha após o primeiro login\n\nDúvidas? Fale com a diretoria.`}
              className="border-white/10 bg-[#040a16] text-slate-200"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
