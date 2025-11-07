"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { resolveUserRole } from "@/lib/auth/roles"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [envReady, setEnvReady] = useState(true)

  // Pré-checagem de variáveis públicas no bundle do cliente
  useEffect(() => {
    const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const validUrl = hasUrl && /^https?:\/\//.test(String(process.env.NEXT_PUBLIC_SUPABASE_URL))
    const ok = hasUrl && hasAnon && validUrl
    setEnvReady(ok)
    if (!ok) {
      setError(
        "Configuração do Supabase ausente: defina NEXT_PUBLIC_SUPABASE_URL (com https://) e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local e reinicie o servidor."
      )
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!envReady) {
        // Evita tentativa de login se env estiver ausente
        return
      }
      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
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
        setIsLoading(false)
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
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
        className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] mt-6"
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
  )
}
