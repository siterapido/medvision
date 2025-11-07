"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ProfileFormProps {
  initialData: {
    full_name: string
    email: string
    profession?: string
    cro?: string
    company?: string
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialData.full_name)
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
          full_name: fullName,
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
    setFullName(initialData.full_name)
    setEmail(initialData.email)
    setProfession(initialData.profession || "")
    setCro(initialData.cro || "")
    setCompany(initialData.company || "")
    setMessage(null)
  }

  return (
    <div className="space-y-6">
      {/* Informações Pessoais */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Informações Pessoais</CardTitle>
          <CardDescription className="text-slate-600">
            Atualize suas informações de perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div
                className={`rounded-lg p-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}
              >
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-900">
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 border-slate-300 text-slate-900"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-900">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-slate-300 text-slate-900"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession" className="text-slate-900">
                  Profissão
                </Label>
                <Input
                  id="profession"
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Ex: Dentista, Estudante"
                  className="h-11 border-slate-300 text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cro" className="text-slate-900">
                  CRO
                </Label>
                <Input
                  id="cro"
                  type="text"
                  value={cro}
                  onChange={(e) => setCro(e.target.value)}
                  placeholder="Ex: CRO-SP 12345"
                  className="h-11 border-slate-300 text-slate-900"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="company" className="text-slate-900">
                  Empresa/Clínica
                </Label>
                <Input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ex: Clínica Odonto Saúde"
                  className="h-11 border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} disabled={isLoading}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Alterar Senha</CardTitle>
          <CardDescription className="text-slate-600">
            Atualize sua senha de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            {passwordMessage && (
              <div
                className={`rounded-lg p-4 text-sm ${passwordMessage.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}
              >
                {passwordMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="currentPassword" className="text-slate-900">
                  Senha Atual (opcional)
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-11 border-slate-300 text-slate-900"
                  placeholder="Digite sua senha atual"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-slate-900">
                  Nova Senha
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 border-slate-300 text-slate-900"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-900">
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 border-slate-300 text-slate-900"
                  placeholder="Repita a nova senha"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isChangingPassword ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
