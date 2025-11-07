"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Fingerprint, LockKeyhole, ShieldCheck } from "lucide-react"

const securityHighlights = [
  {
    icon: ShieldCheck,
    title: "Senha forte",
    description: "Combine letras, números e símbolos para atingir o nível recomendado.",
  },
  {
    icon: Fingerprint,
    title: "Dispositivos confiáveis",
    description: "Revise acessos recentes e desconecte aparelhos desconhecidos.",
  },
  {
    icon: LockKeyhole,
    title: "Rotina preventiva",
    description: "Troque a senha a cada 90 dias e evite reutilizar credenciais.",
  },
] as const

interface ProfileFormProps {
  initialData: {
    name: string
    email: string
    profession?: string
    cro?: string
    company?: string
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [name, setName] = useState(initialData.name)
  const [email, setEmail] = useState(initialData.email)
  const [profession, setProfession] = useState(initialData.profession || "")
  const [cro, setCro] = useState(initialData.cro || "")
  const [company, setCompany] = useState(initialData.company || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setMessage({ type: "error", text: "Usuário não autenticado" })
        return
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          email: email,
          profession: profession,
          cro: cro,
          company: company,
        })
        .eq("id", user.id)

      if (error) {
        throw error
      }

      setMessage({ type: "success", text: "Perfil atualizado com sucesso!" })

      // Refresh the page to show updated data
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage({ type: "error", text: "Erro ao atualizar perfil" })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "As senhas não coincidem" })
      setIsChangingPassword(false)
      return
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "A senha deve ter pelo menos 6 caracteres" })
      setIsChangingPassword(false)
      return
    }

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      setPasswordMessage({ type: "success", text: "Senha alterada com sucesso!" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Error changing password:", error)
      setPasswordMessage({ type: "error", text: "Erro ao alterar senha" })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleReset = () => {
    setName(initialData.name)
    setEmail(initialData.email)
    setProfession(initialData.profession || "")
    setCro(initialData.cro || "")
    setCompany(initialData.company || "")
    setMessage(null)
  }

  return (
    <div className="space-y-8">
      <Card className="relative overflow-hidden border-[#24324F]/60 bg-[#131D37] text-white shadow-2xl shadow-[#0B1627]/40">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute inset-0 bg-[radial-gradient(75%_60%_at_20%_0%,rgba(8,145,178,0.22),transparent),radial-gradient(55%_45%_at_85%_25%,rgba(6,182,212,0.18),transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent)] mix-blend-screen" />
        </div>
        <CardHeader className="relative border-b border-white/10 pb-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 text-[0.65rem] uppercase tracking-[0.25em] text-white">
                Perfil clínico
              </Badge>
              <span className="text-xs text-white/60">Sincronizado com a IA do Odonto GPT</span>
            </div>
            <CardTitle className="text-2xl font-semibold text-white">Informações Pessoais</CardTitle>
            <CardDescription className="max-w-2xl text-white/70">
              Atualize seus dados básicos para que o copiloto entenda o contexto da clínica e personalize as respostas.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="relative pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div
                role="status"
                aria-live="polite"
                className={`rounded-2xl border p-4 text-sm transition-colors ${message.type === "success" ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100" : "border-rose-400/60 bg-rose-500/15 text-rose-100"}`}
              >
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/80">
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 border-white/15 bg-white/5 text-white placeholder:text-white/40"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-white/15 bg-white/5 text-white placeholder:text-white/40"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession" className="text-white/80">
                  Profissão
                </Label>
                <Input
                  id="profession"
                  type="text"
                  autoComplete="organization-title"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Ex: Dentista, Estudante"
                  className="h-11 border-white/15 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cro" className="text-white/80">
                  CRO
                </Label>
                <Input
                  id="cro"
                  type="text"
                  value={cro}
                  onChange={(e) => setCro(e.target.value)}
                  placeholder="Ex: CRO-SP 12345"
                  className="h-11 border-white/15 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="company" className="text-white/80">
                  Empresa/Clínica
                </Label>
                <Input
                  id="company"
                  type="text"
                  autoComplete="organization"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ex: Clínica Odonto Saúde"
                  className="h-11 border-white/15 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#06b6d4] text-[#0B1627] hover:bg-[#0891b2]"
              >
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
                className="border-white/20 text-white hover:border-white hover:bg-white/5"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-[#24324F]/60 bg-[#0F192F] text-white shadow-2xl shadow-[#060d1d]/50">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute inset-0 bg-[radial-gradient(65%_60%_at_10%_0%,rgba(35,153,180,0.28),transparent),radial-gradient(45%_45%_at_80%_40%,rgba(8,145,178,0.18),transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),transparent)] mix-blend-screen" />
        </div>
        <CardHeader className="relative border-b border-white/10 pb-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 text-[0.65rem] uppercase tracking-[0.25em] text-white">
                Segurança
              </Badge>
              <span className="text-xs text-white/60">Monitoramento em tempo real</span>
            </div>
            <CardTitle className="text-2xl font-semibold text-white">Alterar Senha</CardTitle>
            <CardDescription className="max-w-2xl text-white/70">
              Reforce a proteção da conta com senhas fortes e atualizações periódicas. Avisaremos sobre acessos suspeitos.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="relative pt-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <form onSubmit={handlePasswordChange} className="space-y-6">
              {passwordMessage && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`rounded-2xl border p-4 text-sm transition-colors ${passwordMessage.type === "success" ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100" : "border-rose-400/60 bg-rose-500/15 text-rose-100"}`}
                >
                  {passwordMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="currentPassword" className="text-white/80">
                    Senha Atual (opcional)
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-11 border-white/15 bg-white/5 text-white placeholder:text-white/40"
                    placeholder="Digite sua senha atual"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-white/80">
                    Nova Senha
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 border-white/15 bg-white/5 text-white placeholder:text-white/40"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/80">
                    Confirmar Nova Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 border-white/15 bg-white/5 text-white placeholder:text-white/40"
                    placeholder="Repita a nova senha"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                  className="bg-[#06b6d4] text-[#0B1627] hover:bg-[#0891b2]"
                >
                  {isChangingPassword ? "Alterando..." : "Alterar Senha"}
                </Button>
              </div>
            </form>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-transparent to-transparent p-5">
                <p className="text-sm font-semibold text-white">Boas práticas recomendadas</p>
                <div className="mt-4 space-y-4">
                  {securityHighlights.map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.title} className="flex items-start gap-3">
                        <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                          <Icon className="h-4 w-4 text-[#06b6d4]" />
                        </span>
                        <div className="space-y-1 text-white/70">
                          <p className="text-sm font-medium text-white">{item.title}</p>
                          <p className="text-xs">{item.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
