"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, CheckCircle2, UserCheck, ArrowRight } from "lucide-react"

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
import { DEFAULT_ROLE } from "@/lib/auth/roles"
import { calculateTrialEndDate } from "@/lib/trial"
import { createClient } from "@/lib/supabase/client"

const ATTENDANCE_TRIAL_DAYS = 7

export function AttendanceForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [occupation, setOccupation] = useState("")
  const [institution, setInstitution] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    // Validações básicas
    if (!name || !email || !whatsapp) {
      setError("Por favor, preencha todos os campos obrigatórios.")
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

      // Gera uma senha temporária forte
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}${Date.now().toString(36)}!`

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            name,
            whatsapp,
            profession: occupation,
            institution: occupation === "Estudante" ? institution : null,
            role: DEFAULT_ROLE,
            trial_days: ATTENDANCE_TRIAL_DAYS,
            trial_form: "lista-presenca",
            source: "attendance_form",
          },
        },
      })

      if (signUpError) {
        console.error("Registration error:", signUpError)

        // Mensagens de erro em português
        if (signUpError.message.includes("already registered") || signUpError.message.includes("User already registered")) {
          // Se o usuário já existe, apenas registra a presença
          setSuccess(true)
          setTimeout(() => {
            router.push("/login?message=attendance_registered")
          }, 3000)
          return
        } else if (signUpError.message.includes("valid email")) {
          setError("Por favor, insira um email válido.")
        } else {
          setError("Erro ao registrar presença. Por favor, tente novamente.")
        }
        setIsLoading(false)
        return
      }

      if (data.user) {
        // Cadastro bem-sucedido
        setSuccess(true)

        // Configura o trial de 7 dias
        const now = new Date()
        const trialEnd = calculateTrialEndDate(now, ATTENDANCE_TRIAL_DAYS)

        const { error: trialUpdateError } = await supabase
          .from("profiles")
          .update({
            trial_started_at: now.toISOString(),
            trial_ends_at: trialEnd.toISOString(),
            trial_used: false,
            pipeline_stage: "lista_presenca",
          })
          .eq("id", data.user.id)

        if (trialUpdateError) {
          console.warn("[attendance] Não foi possível configurar o trial", trialUpdateError)
        }

        // Redireciona após 3 segundos
        setTimeout(() => {
          router.push("/login?message=attendance_success")
        }, 3000)
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("Erro inesperado. Por favor, tente novamente.")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
            Presença confirmada! Verifique seu email para acessar sua conta e o Odonto GPT.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-slate-300">
          Nome Completo *
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Dr. João Silva"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading || success}
          className="h-12 px-4 bg-[#0F172A]/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#22d3ee] focus:ring-[#22d3ee]/20 rounded-xl transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-slate-300">
          Email *
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
          WhatsApp *
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
          Ocupação *
        </Label>
        <Select
          value={occupation}
          onValueChange={setOccupation}
          disabled={isLoading || success}
          required
        >
          <SelectTrigger className="h-12 px-4 bg-[#0F172A]/80 border-slate-700 text-white focus:border-[#22d3ee] focus:ring-[#22d3ee]/20 rounded-xl transition-all [&>span]:text-slate-500 [&>span]:data-[placeholder]:text-slate-500">
            <SelectValue placeholder="Selecione sua ocupação" />
          </SelectTrigger>
          <SelectContent className="bg-[#0F172A] border-slate-700">
            <SelectItem value="Cirurgião-Dentista" className="text-white hover:bg-slate-800 focus:bg-slate-800">Cirurgião-Dentista</SelectItem>
            <SelectItem value="Estudante" className="text-white hover:bg-slate-800 focus:bg-slate-800">Estudante</SelectItem>
            <SelectItem value="Empresário" className="text-white hover:bg-slate-800 focus:bg-slate-800">Empresário</SelectItem>
            <SelectItem value="Outro" className="text-white hover:bg-slate-800 focus:bg-slate-800">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {occupation === "Estudante" && (
        <div className="space-y-2">
          <Label htmlFor="institution" className="text-sm font-medium text-slate-300">
            Instituição de Ensino *
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

      {/* Info box */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
        <p className="text-xs text-slate-400 text-center">
          Ao confirmar sua presença, você receberá um email com suas credenciais de acesso ao Odonto GPT.
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || success}
        className="w-full h-12 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] border-0 text-white disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background: success
            ? 'linear-gradient(135deg, #059669 0%, #0d9488 100%)'
            : 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)'
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Confirmando presença...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="h-5 w-5" />
            Presença confirmada!
          </>
        ) : (
          <>
            <UserCheck className="h-5 w-5" />
            Confirmar presença e ganhar 7 dias
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </form>
  )
}
