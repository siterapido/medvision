"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { DEFAULT_ROLE, resolveUserRole } from "@/lib/auth/roles"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [occupation, setOccupation] = useState("")
  const [institution, setInstitution] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    // Validação de senha
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.")
      setIsLoading(false)
      return
    }

    if (!whatsapp) {
      setError("O WhatsApp é obrigatório.")
      setIsLoading(false)
      return
    }

    if (!occupation) {
      setError("Selecione sua ocupação.")
      setIsLoading(false)
      return
    }

    if (occupation === "Estudante" && !institution) {
      setError("Informe sua instituição de ensino.")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            whatsapp,
            profession: occupation,
            institution: occupation === "Estudante" ? institution : null,
            role: DEFAULT_ROLE,
          },
        },
      })

      if (signUpError) {
        console.error("Registration error:", signUpError)

        // Mensagens de erro em português
        if (signUpError.message.includes("already registered")) {
          setError("Este email já está cadastrado. Tente fazer login.")
        } else if (signUpError.message.includes("Password should be")) {
          setError("A senha deve ter pelo menos 8 caracteres.")
        } else if (signUpError.message.includes("valid email")) {
          setError("Por favor, insira um email válido.")
        } else {
          setError("Erro ao criar conta. Por favor, tente novamente.")
        }
        setIsLoading(false)
        return
      }

      if (data.user) {
        // Cadastro bem-sucedido
        setSuccess(true)

        // Se o email foi confirmado automaticamente (depende da configuração do Supabase)
        if (data.user.email_confirmed_at || data.session) {
          const { data: profileRow, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .maybeSingle()

          if (profileError) {
            console.warn("[auth] Could not load profile role after signup", profileError)
          }

          const resolvedRole = resolveUserRole(profileRow?.role, data.user)
          const destination = resolvedRole === "admin" ? "/admin" : "/dashboard"

          setTimeout(() => {
            router.replace(destination)
          }, 2000)
        } else {
          // Mostrar mensagem de confirmação de email
          setTimeout(() => {
            router.push("/login")
          }, 3000)
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("Erro inesperado. Por favor, tente novamente.")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      {/* Trial Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-full">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              7 Dias de Acesso Gratuito
            </p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
              Sem cartão de crédito. Acesso completo imediato.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            Conta criada com sucesso! Verifique seu email para confirmar o cadastro.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Nome Completo
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Dr. João Silva"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading || success}
          className="h-12 px-4 bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary rounded-xl transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading || success}
          className="h-12 px-4 bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary rounded-xl transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp" className="text-sm font-medium">
          WhatsApp
        </Label>
        <Input
          id="whatsapp"
          type="tel"
          placeholder="(11) 99999-9999"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          required
          disabled={isLoading || success}
          className="h-12 px-4 bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary rounded-xl transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="occupation" className="text-sm font-medium">
          Ocupação
        </Label>
        <Select
          value={occupation}
          onValueChange={setOccupation}
          disabled={isLoading || success}
          required
        >
          <SelectTrigger className="h-12 px-4 bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary rounded-xl transition-all">
            <SelectValue placeholder="Selecione sua ocupação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cirurgião-Dentista">Cirurgião-Dentista</SelectItem>
            <SelectItem value="Estudante">Estudante</SelectItem>
            <SelectItem value="Empresário">Empresário</SelectItem>
            <SelectItem value="Outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {occupation === "Estudante" && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
          <Label htmlFor="institution" className="text-sm font-medium">
            Instituição de Ensino
          </Label>
          <Input
            id="institution"
            type="text"
            placeholder="Nome da Universidade/Faculdade"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            required
            disabled={isLoading || success}
            className="h-12 px-4 bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary rounded-xl transition-all"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Senha
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={isLoading || success}
            className="h-12 px-4 pr-12 bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary rounded-xl transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading || success}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirmar Senha
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Digite a senha novamente"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            disabled={isLoading || success}
            className="h-12 px-4 pr-12 bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary rounded-xl transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading || success}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
            aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
        disabled={isLoading || success}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Criando conta...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Conta criada!
          </>
        ) : (
          "Começar Teste Grátis"
        )}
      </Button>
    </form>
  )
}
