"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ProfileFormProps {
  initialData: {
    full_name: string
    email: string
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialData.full_name)
  const [email, setEmail] = useState(initialData.email)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
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

  const handleReset = () => {
    setFullName(initialData.full_name)
    setEmail(initialData.email)
    setMessage(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`rounded-lg p-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input
            id="name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
            required
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          {isLoading ? "Salvando..." : "Salvar Alterações"}
        </Button>
        <Button type="button" variant="outline" onClick={handleReset} disabled={isLoading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
