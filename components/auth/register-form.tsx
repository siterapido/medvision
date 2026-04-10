"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Sparkles, ArrowRight } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { bootstrapProfileAfterSignup } from "@/app/actions/register-bootstrap"
import { DEFAULT_ROLE, resolveUserRole } from "@/lib/auth/roles"
import { DEFAULT_TRIAL_DAYS, normalizeTrialDays } from "@/lib/trial"
import { createClient } from "@/lib/supabase/client"
import { CAKTO_BASIC_ANNUAL_PLAN_ID, CAKTO_PRO_ANNUAL_PLAN_ID } from "@/lib/cakto"

type RegisterFormProps = {
  trialDays?: number
}

// Mapeamento de planos para IDs da Cakto
const PLAN_CHECKOUT_MAP: Record<string, { id: string; name: string }> = {
  basic: { id: CAKTO_BASIC_ANNUAL_PLAN_ID, name: "Plano Basico Anual" },
  pro: { id: CAKTO_PRO_ANNUAL_PLAN_ID, name: "Plano Pro Anual" },
}

export function RegisterForm({ trialDays = DEFAULT_TRIAL_DAYS }: RegisterFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  const normalizedTrialDays = normalizeTrialDays(trialDays)
  const trialLabel = `${normalizedTrialDays} dia${normalizedTrialDays > 1 ? "s" : ""}`

  // Verificar se veio de um plano específico
  const planParam = searchParams.get('plan')
  const selectedPlan = planParam && PLAN_CHECKOUT_MAP[planParam] ? PLAN_CHECKOUT_MAP[planParam] : null
  const isCheckoutFlow = !!selectedPlan

  // Pré-preencher campos com dados da landing page
  useEffect(() => {
    const emailParam = searchParams.get('email')
    const whatsappParam = searchParams.get('whatsapp')

    if (emailParam) setEmail(emailParam)
    if (whatsappParam) setWhatsapp(whatsappParam)
  }, [searchParams])

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
            trial_days: normalizedTrialDays,
            trial_form: `${normalizedTrialDays}d`,
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

        const boot = await bootstrapProfileAfterSignup({
          name,
          email,
          whatsapp,
          profession: occupation,
          institution: occupation === "Estudante" ? institution : null,
          trialDays: normalizedTrialDays,
        })
        if (boot.error) {
          console.warn("[auth] bootstrap perfil:", boot.error)
        }

        // Se o email foi confirmado automaticamente (depende da configuração do Neon Auth)
        if (data.user.email_confirmed_at || data.session) {
          // Se veio de um plano, redirecionar para o checkout da Cakto
          if (isCheckoutFlow && selectedPlan) {
            const checkoutUrl = `https://pay.cakto.com.br/${selectedPlan.id}?email=${encodeURIComponent(email)}`
            setTimeout(() => {
              window.location.href = checkoutUrl
            }, 1500)
          } else {
            // Fluxo normal: ir para o dashboard
            let profileRow: { role?: string } | null = null
            try {
              const res = await fetch("/api/profile/self", { credentials: "include" })
              if (res.ok) profileRow = await res.json()
            } catch (e) {
              console.warn("[auth] Could not load profile role after signup", e)
            }

            const resolvedRole = resolveUserRole(profileRow?.role, data.user)
            const destination = resolvedRole === "admin" ? "/admin" : "/dashboard"

            setTimeout(() => {
              router.replace(destination)
            }, 2000)
          }
        } else {
          // Se veio de um plano mas precisa confirmar email, salvar o plano em localStorage
          if (isCheckoutFlow && selectedPlan) {
            localStorage.setItem('pendingCheckout', JSON.stringify({
              planId: selectedPlan.id,
              email: email
            }))
          }
          // Mostrar mensagem de confirmação de email
          setTimeout(() => {
            router.push("/login?message=confirm-email")
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
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Banner - Checkout ou Trial */}
      {isCheckoutFlow && selectedPlan ? (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-2 rounded-full">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-400">
                {selectedPlan.name}
              </p>
              <p className="text-xs text-emerald-400/70">
                Crie sua conta para finalizar a compra
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#22d3ee]/10 via-[#0891b2]/10 to-[#22d3ee]/10 border border-[#22d3ee]/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#22d3ee]/20 to-[#0891b2]/20 p-2 rounded-full">
              <Sparkles className="h-4 w-4 text-[#22d3ee]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#22d3ee]">
                {trialLabel} de acesso gratuito
              </p>
              <p className="text-xs text-[#22d3ee]/70">
                Sem cartao de credito. Acesso completo imediato.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            {isCheckoutFlow
              ? "Conta criada! Redirecionando para o pagamento..."
              : "Conta criada com sucesso! Verifique seu email para confirmar o cadastro."
            }
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-slate-300">
          Nome Completo
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Dr. Joao Silva"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading || success}
          className="h-12 px-4 bg-[#0F172A]/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#22d3ee] focus:ring-[#22d3ee]/20 rounded-xl transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-slate-300">
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
          className="h-12 px-4 bg-[#0F172A]/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#22d3ee] focus:ring-[#22d3ee]/20 rounded-xl transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp" className="text-sm font-medium text-slate-300">
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
          className="h-12 px-4 bg-[#0F172A]/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#22d3ee] focus:ring-[#22d3ee]/20 rounded-xl transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="occupation" className="text-sm font-medium text-slate-300">
          Ocupacao
        </Label>
        <Select
          value={occupation}
          onValueChange={setOccupation}
          disabled={isLoading || success}
          required
        >
          <SelectTrigger className="h-12 px-4 bg-[#0F172A]/80 border-slate-700 text-white focus:border-[#22d3ee] focus:ring-[#22d3ee]/20 rounded-xl transition-all [&>span]:text-slate-500 [&>span]:data-[placeholder]:text-slate-500">
            <SelectValue placeholder="Selecione sua ocupacao" />
          </SelectTrigger>
          <SelectContent className="bg-[#0F172A] border-slate-700">
            <SelectItem value="Cirurgião-Dentista" className="text-white hover:bg-slate-800 focus:bg-slate-800">Cirurgiao-Dentista</SelectItem>
            <SelectItem value="Estudante" className="text-white hover:bg-slate-800 focus:bg-slate-800">Estudante</SelectItem>
            <SelectItem value="Empresário" className="text-white hover:bg-slate-800 focus:bg-slate-800">Empresario</SelectItem>
            <SelectItem value="Outro" className="text-white hover:bg-slate-800 focus:bg-slate-800">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {occupation === "Estudante" && (
        <div className="space-y-2">
          <Label htmlFor="institution" className="text-sm font-medium text-slate-300">
            Instituicao de Ensino
          </Label>
          <Input
            id="institution"
            type="text"
            placeholder="Nome da Universidade/Faculdade"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            required
            disabled={isLoading || success}
            className="h-12 px-4 bg-[#0F172A]/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#22d3ee] focus:ring-[#22d3ee]/20 rounded-xl transition-all"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-slate-300">
          Senha
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Minimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={isLoading || success}
            className="h-12 px-4 pr-12 bg-[#0F172A]/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#22d3ee] focus:ring-[#22d3ee]/20 rounded-xl transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading || success}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300">
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
            className="h-12 px-4 pr-12 bg-[#0F172A]/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#22d3ee] focus:ring-[#22d3ee]/20 rounded-xl transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading || success}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
            aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || success}
        className="w-full h-12 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] border-0 text-white disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background: success
            ? 'linear-gradient(135deg, #059669 0%, #0d9488 100%)'
            : isCheckoutFlow
              ? 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
              : 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)'
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Criando conta...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="h-5 w-5" />
            {isCheckoutFlow ? "Redirecionando para pagamento..." : "Conta criada!"}
          </>
        ) : (
          <>
            {isCheckoutFlow ? "Criar conta e continuar" : `Comecar teste de ${trialLabel}`}
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </form>
  )
}
