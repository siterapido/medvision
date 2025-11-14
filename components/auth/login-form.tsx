"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, AlertCircle, Mail, CheckCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { resolveUserRole } from "@/lib/auth/roles"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(true) // Magic Link como padrão
  const [emailSent, setEmailSent] = useState(false)

  const envReady = useMemo(() => {
    const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const validUrl = hasUrl && /^https?:\/\//.test(String(process.env.NEXT_PUBLIC_SUPABASE_URL))
    return hasUrl && hasAnon && validUrl
  }, [])

  const missingEnvMessage = envReady
    ? null
    : "Configuração do Supabase ausente: defina NEXT_PUBLIC_SUPABASE_URL (com https://) e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local e reinicie o servidor."

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(missingEnvMessage)

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!envReady) {
      return
    }

    setIsLoading(true)
    setError(null)
    setEmailSent(false)

    try {
      const supabase = createClient()
      const trimmedEmail = email.trim()

      if (!trimmedEmail) {
        setError("Informe um email válido antes de continuar.")
        setIsLoading(false)
        return
      }

      // Enviar Magic Link
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })

      if (magicLinkError) {
        console.error("Magic link error:", magicLinkError)
        setError("Erro ao enviar email. Por favor, tente novamente.")
        return
      }

      setEmailSent(true)
    } catch (err: unknown) {
      console.error("Unexpected error:", err)
      setError("Erro inesperado. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!envReady) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const trimmedEmail = email.trim()

      if (!trimmedEmail) {
        setError("Informe um email válido antes de continuar.")
        setIsLoading(false)
        return
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (signInError) {
        console.error("Login error:", signInError)

        // Mensagens de erro em português
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Email ou senha incorretos. Por favor, tente novamente.")
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("Por favor, confirme seu email antes de fazer login.")
        } else {
          setError("Erro ao fazer login. Por favor, tente novamente.")
        }
        return
      }

      if (data.user) {
        const { data: profileRow, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle()

        if (profileError) {
          console.warn("[auth] Could not load profile role after login", profileError)
        }

        const resolvedRole = resolveUserRole(profileRow?.role, data.user)
        const destination = resolvedRole === "admin" ? "/admin" : "/dashboard"

        router.replace(destination)
      }
    } catch (err: unknown) {
      console.error("Unexpected error:", err)
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.toLowerCase().includes("missing supabase environment variables")) {
        setError(
          "Configuração do Supabase ausente: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local e reinicie o servidor."
        )
      } else {
        setError("Erro inesperado. Por favor, tente novamente.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Toggle entre Magic Link e Senha */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setUseMagicLink(true)
            setEmailSent(false)
            setError(null)
          }}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            useMagicLink
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Mail className="inline-block w-4 h-4 mr-2" />
          Acesso por Email
        </button>
        <button
          type="button"
          onClick={() => {
            setUseMagicLink(false)
            setEmailSent(false)
            setError(null)
          }}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            !useMagicLink
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Login com Senha
        </button>
      </div>

      {/* Mensagem de Sucesso (Email Enviado) */}
      {emailSent && (
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Email enviado!</strong>
            <br />
            Verifique sua caixa de entrada e clique no link para acessar sua conta.
            <br />
            <span className="text-xs text-green-600 dark:text-green-400 mt-1 block">
              Não recebeu? Verifique o spam ou tente novamente em alguns minutos.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Formulário de Magic Link */}
      {useMagicLink && (
        <form onSubmit={handleMagicLinkSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email-magic" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Seu Email
            </Label>
            <Input
              id="email-magic"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || emailSent}
              className="h-12 px-4 bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary rounded-xl transition-all"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enviaremos um link de acesso para seu email
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
            disabled={isLoading || !envReady || emailSent}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : emailSent ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Email Enviado
              </>
            ) : (
              <>
                <Mail className="mr-2 h-5 w-5" />
                {envReady ? "Receber Link de Acesso" : "Configuração pendente"}
              </>
            )}
          </Button>
        </form>
      )}

      {/* Formulário de Login com Senha */}
      {!useMagicLink && (
        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </Label>
            <Input
              id="email-password"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="h-12 px-4 bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary rounded-xl transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Senha
              </Label>
              <Link
                href="/forgot-password"
                prefetch={false}
                className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 px-4 pr-12 bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary rounded-xl transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
            disabled={isLoading || !envReady}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Entrando...
              </>
            ) : (
              envReady ? "Entrar na plataforma" : "Configuração pendente"
            )}
          </Button>
        </form>
      )}
    </div>
  )
}
