"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Sparkles, User, Mail, Phone, Lock, Briefcase } from "lucide-react"
import { motion } from "framer-motion"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { DEFAULT_ROLE, resolveUserRole } from "@/lib/auth/roles"
import { DEFAULT_TRIAL_DAYS, calculateTrialEndDate, normalizeTrialDays } from "@/lib/trial"
import { createClient } from "@/lib/supabase/client"

type RegisterFormProps = {
  trialDays?: number
}

export function RegisterForm({ trialDays = DEFAULT_TRIAL_DAYS }: RegisterFormProps) {
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

  const normalizedTrialDays = normalizeTrialDays(trialDays)
  const trialLabel = `${normalizedTrialDays} dia${normalizedTrialDays > 1 ? "s" : ""}`

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

        if (data.session) {
          const now = new Date()
          const trialEnd = calculateTrialEndDate(now, normalizedTrialDays)

          // Busca o pipeline_stage atual para preservá-lo
          const { data: currentProfile } = await supabase
            .from("profiles")
            .select("pipeline_stage")
            .eq("id", data.user.id)
            .single()

          const { error: trialUpdateError } = await supabase
            .from("profiles")
            .update({
              trial_started_at: now.toISOString(),
              trial_ends_at: trialEnd.toISOString(),
              trial_used: false,
              // Preserva o pipeline_stage se já existir, caso contrário define como 'novo_usuario'
              pipeline_stage: currentProfile?.pipeline_stage || "novo_usuario",
            })
            .eq("id", data.user.id)

          if (trialUpdateError) {
            console.warn("[auth] Não foi possível ajustar o trial escolhido", trialUpdateError)
          }
        }

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
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Trial Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 p-2 rounded-full">
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-300">
              {trialLabel} de acesso gratuito
            </p>
            <p className="text-xs text-emerald-400/70">
              Sem cartão de crédito. Acesso completo imediato.
            </p>
          </div>
        </div>
      </motion.div>

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

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Nome Completo
        </Label>
        <div className="relative flex items-center">
          <User className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <Input
            id="name"
            type="text"
            placeholder="Dr. João Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading || success}
            className="h-12 pl-12 pr-4 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 rounded-xl transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </motion.div>

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Email
        </Label>
        <div className="relative flex items-center">
          <Mail className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading || success}
            className="h-12 pl-12 pr-4 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 rounded-xl transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </motion.div>

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Label htmlFor="whatsapp" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          WhatsApp
        </Label>
        <div className="relative flex items-center">
          <Phone className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <Input
            id="whatsapp"
            type="tel"
            placeholder="(11) 99999-9999"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            required
            disabled={isLoading || success}
            className="h-12 pl-12 pr-4 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 rounded-xl transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </motion.div>

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Label htmlFor="occupation" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Ocupação
        </Label>
        <div className="relative">
          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
          <Select
            value={occupation}
            onValueChange={setOccupation}
            disabled={isLoading || success}
            required
          >
            <SelectTrigger className="h-12 pl-12 pr-4 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 rounded-xl transition-all text-slate-700 dark:text-slate-300">
              <SelectValue placeholder="Selecione sua ocupação" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
              <SelectItem value="Cirurgião-Dentista">Cirurgião-Dentista</SelectItem>
              <SelectItem value="Estudante">Estudante</SelectItem>
              <SelectItem value="Empresário">Empresário</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {occupation === "Estudante" && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Label htmlFor="institution" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Instituição de Ensino
          </Label>
          <div className="relative flex items-center">
            <Briefcase className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <Input
              id="institution"
              type="text"
              placeholder="Nome da Universidade/Faculdade"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              required
              disabled={isLoading || success}
              className="h-12 pl-12 pr-4 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 rounded-xl transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </motion.div>
      )}

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Senha
        </Label>
        <div className="relative flex items-center">
          <Lock className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={isLoading || success}
            className="h-12 pl-12 pr-12 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 rounded-xl transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading || success}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors disabled:opacity-50"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </motion.div>

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Confirmar Senha
        </Label>
        <div className="relative flex items-center">
          <Lock className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Digite a senha novamente"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            disabled={isLoading || success}
            className="h-12 pl-12 pr-12 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 rounded-xl transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading || success}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors disabled:opacity-50"
            aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.button
          type="submit"
          disabled={isLoading || success}
          className="w-full h-12 rounded-full py-3 text-base font-semibold shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all border-0 text-white disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            background: success
              ? 'linear-gradient(135deg, #059669 0%, #0d9488 100%)'
              : 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
          }}
          whileHover={!isLoading && !success ? { scale: 1.05 } : {}}
          whileTap={!isLoading && !success ? { scale: 0.95 } : {}}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Criando conta...
            </span>
          ) : success ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Conta criada!
            </span>
          ) : (
            `Começar teste de ${trialLabel}`
          )}
        </motion.button>
      </motion.div>
    </form>
  )
}
