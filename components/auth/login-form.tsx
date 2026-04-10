"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { resolveUserRole } from "@/lib/auth/roles"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

type LoginFormProps = {
  /** Card claro (branco) ou escuro — alinhar com o container da página de login */
  variant?: "light" | "dark"
}

export function LoginForm({ variant = "light" }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const envReady = true

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
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

      console.log("[Login] Tentando login com:", trimmedEmail)

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (signInError) {
        console.error("Login error details:", {
          message: signInError.message,
          status: signInError.status,
          name: signInError.name
        })

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
        let profileRow: { role?: string } | null = null
        try {
          const res = await fetch("/api/profile/self", { credentials: "include" })
          if (res.ok) {
            profileRow = await res.json()
          }
        } catch (e) {
          console.warn("[auth] Could not load profile after login", e)
        }

        const resolvedRole = resolveUserRole(profileRow?.role, data.user)
        const destination = resolvedRole === "admin" ? "/admin" : "/dashboard"

        router.replace(destination)
      }
    } catch (err: unknown) {
      console.error("Unexpected error:", err)
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

  const isLight = variant === "light"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Erro */}
      {error && (
        <Alert
          variant="destructive"
          className={cn(
            isLight
              ? "border-red-200 bg-red-50 text-red-800 [&>svg]:text-red-600"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          )}
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label
          htmlFor="email"
          className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-slate-300")}
        >
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
          className={cn(
            "h-12 px-4 rounded-xl transition-all",
            isLight
              ? "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
              : "bg-[#0F172A]/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#34d399] focus:ring-[#34d399]/20"
          )}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="password"
            className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-slate-300")}
          >
            Senha
          </Label>
          <Link
            href="/forgot-password"
            prefetch={false}
            className={cn(
              "text-xs font-medium transition-colors",
              isLight
                ? "text-emerald-700 hover:text-emerald-800"
                : "text-[#34d399] hover:text-[#6ee7b7]"
            )}
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
            className={cn(
              "h-12 px-4 pr-12 rounded-xl transition-all",
              isLight
                ? "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                : "bg-[#0F172A]/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#34d399] focus:ring-[#34d399]/20"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-50",
              isLight
                ? "text-slate-400 hover:text-slate-600"
                : "text-slate-500 hover:text-slate-300"
            )}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className={cn(
          "w-full h-12 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] border-0 text-white",
          isLight && "shadow-emerald-900/15 hover:shadow-emerald-900/25 focus-visible:ring-2 focus-visible:ring-emerald-600/40"
        )}
        style={{
          background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        }}
        disabled={isLoading || !envReady}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            {envReady ? "Entrar na plataforma" : "Configuração pendente"}
            {envReady && <ArrowRight className="ml-2 h-5 w-5" />}
          </>
        )}
      </Button>
    </form>
  )
}
