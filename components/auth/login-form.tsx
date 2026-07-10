"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { resolveUserRole } from "@/lib/auth/roles"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        if (
          signInError.status === 503 &&
          signInError.message?.toLowerCase().includes("neon_auth_base_url")
        ) {
          setError(
            "Login indisponível no servidor: configuração de autenticação ausente (NEON_AUTH_BASE_URL).",
          )
          return
        }

        const errMsg = signInError.message.toLowerCase()
        if (
          errMsg.includes("invalid login credentials") ||
          errMsg.includes("invalid email or password") ||
          (signInError as { code?: string }).code === "INVALID_EMAIL_OR_PASSWORD"
        ) {
          setError("Email ou senha incorretos. Por favor, tente novamente.")
        } else if (
          errMsg.includes("failed to retrieve user session") ||
          errMsg.includes("no active session found")
        ) {
          setError(
            "Login aceito, mas a sessão não foi salva no navegador. Tente novamente, use outro navegador ou limpe os cookies do site.",
          )
        } else if (errMsg.includes("email not confirmed") || errMsg.includes("email not verified")) {
          setError("Por favor, confirme seu email antes de fazer login.")
        } else {
          setError("Erro ao fazer login. Por favor, tente novamente.")
        }
        return
      }

      if (data.user) {
        let profileRow: { role?: string } | null = null
        try {
          const res = await fetch("/api/profile/self", { credentials: "include" })
          if (res.status === 401) {
            setError(
              "Login concluído, mas a sessão não ficou ativa no servidor (cookie não persistiu). " +
                "Em dev, acesse a app pela mesma origem que o navegador está usando e confirme se NEON_AUTH_BASE_URL está no .env.local.",
            )
            return
          }
          if (res.ok) {
            profileRow = await res.json()
          }
        } catch (err) {
          console.warn("[auth] Could not load profile after login", err)
        }

        const resolvedRole = resolveUserRole(profileRow?.role, data.user)
        const destination = resolvedRole === "admin" ? "/admin" : "/dashboard"
        router.replace(destination)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.toLowerCase().includes("missing")) {
        setError("Configuração de autenticação ausente. Verifique NEON_AUTH_BASE_URL no servidor.")
      } else {
        setError("Erro inesperado. Por favor, tente novamente.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert
          variant="destructive"
          className="border-red-200 bg-red-50 text-red-800 [&>svg]:text-red-600"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-ink">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="email"
          className="h-12 rounded-xl border-border bg-surface px-4 text-foreground placeholder:text-muted-foreground focus:border-signal focus:ring-signal/20"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium text-ink">
            Senha
          </Label>
          <Link
            href="/forgot-password"
            prefetch={false}
            className="text-xs font-medium text-signal transition-colors hover:text-signal/80"
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
            autoComplete="current-password"
            className="h-12 rounded-xl border-border bg-surface px-4 pr-12 text-foreground placeholder:text-muted-foreground focus:border-signal focus:ring-signal/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-xl bg-signal font-semibold text-surface-raised transition-colors hover:bg-signal/90 focus-visible:ring-2 focus-visible:ring-signal/30"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  )
}
