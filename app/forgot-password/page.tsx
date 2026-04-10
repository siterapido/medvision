"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const envReady = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL
    return Boolean(url) && /^https?:\/\//.test(String(url))
  }, [])

  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const missingEnvMessage = !envReady
    ? "Configuração de autenticação ausente: defina NEXT_PUBLIC_NEON_AUTH_BASE_URL (com https://) no ambiente e reinicie o servidor."
    : null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!envReady) return

    setStatus(null)
    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) {
        console.error("reset error:", error)
        setStatus({ type: "error", message: "Não conseguimos enviar o email. Verifique o endereço e tente novamente." })
      } else {
        setStatus({
          type: "success",
          message:
            "Email de recuperação enviado. Verifique sua caixa de entrada (e spam) e siga as instruções para redefinir a senha.",
        })
      }
    } catch (err: unknown) {
      console.error("unexpected reset error:", err)
      const fallback = err instanceof Error ? err.message : "Erro inesperado"
      setStatus({ type: "error", message: fallback })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0F192F] via-[#131D37] to-[#1A2847] p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-grid-pattern"></div>
          <div className="absolute top-24 left-16 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-16 right-16 w-72 h-72 bg-[#2399B4]/20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 space-y-8">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Recuperação protegida
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-cyan-400 bg-clip-text text-transparent">
              com autenticação segura
            </span>
          </h1>
          <p className="text-base text-slate-200 max-w-sm">
            Informe o email cadastrado e te encaminharemos para redefinir sua senha com segurança e rapidez.
          </p>
        </div>
        <div className="relative z-10 text-slate-300 text-sm">
          <p>Estamos sempre monitorando acessos e mantendo os protocolos atualizados para equipes clínicas.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-10 lg:p-12 space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Recuperar</p>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">Esqueceu a senha?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Receba um link seguro para criar uma nova senha e voltar à plataforma.
            </p>
          </div>

          {status && (
            <Alert variant={status.type === "error" ? "destructive" : "default"}>
              {status.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          {missingEnvMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{missingEnvMessage}</AlertDescription>
            </Alert>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email cadastrado
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isSubmitting}
                className="h-12 px-4 bg-slate-50 dark:bg-slate-900/40 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary rounded-xl transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={!envReady || isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enviando...
                </>
              ) : (
                "Enviar link de recuperação"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-slate-600 dark:text-slate-300">
            <Link href="/login" className="font-semibold text-primary hover:text-primary-hover">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
