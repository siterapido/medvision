"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProfileForm() {
  const [name, setName] = useState("Dr. João Silva")
  const [email, setEmail] = useState("joao.silva@email.com")
  const [phone, setPhone] = useState("(11) 98765-4321")
  const [specialty, setSpecialty] = useState("Implantodontia")
  const [cro, setCro] = useState("SP 12345")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialty">Especialidade</Label>
          <Input
            id="specialty"
            type="text"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cro">CRO</Label>
          <Input id="cro" type="text" value={cro} onChange={(e) => setCro(e.target.value)} className="h-11" />
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
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setName("Dr. João Silva")
            setEmail("joao.silva@email.com")
            setPhone("(11) 98765-4321")
            setSpecialty("Implantodontia")
            setCro("SP 12345")
          }}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
