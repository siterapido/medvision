"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfile, type UpdateProfileData } from "@/app/actions/profile"

const profileFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email().optional(),
  telefone: z.string().optional().or(z.literal("")),
  cro: z.string().optional().or(z.literal("")),
  especialidade: z.string().optional().or(z.literal("")),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  initialData: {
    name?: string | null
    email?: string | null
    telefone?: string | null
    cro?: string | null
    especialidade?: string | null
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isPending, setIsPending] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: initialData.name || "",
      email: initialData.email || "",
      telefone: initialData.telefone || "",
      cro: initialData.cro || "",
      especialidade: initialData.especialidade || "",
    },
  })

  async function onSubmit(data: ProfileFormValues) {
    setIsPending(true)
    try {
      // Don't send email as we're not updating it
      const payload: UpdateProfileData = {
        name: data.name,
        telefone: data.telefone || null,
        cro: data.cro || null,
        especialidade: data.especialidade || null,
      }

      const result = await updateProfile(payload)

      if (result.success) {
        toast.success("Perfil atualizado com sucesso!")
      } else {
        toast.error(result.error || "Erro ao atualizar perfil")
      }
    } catch (error) {
      toast.error("Ocorreu um erro inesperado")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Pessoais</CardTitle>
        <CardDescription>
          Atualize suas informações pessoais e profissionais.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              placeholder="Seu nome"
              {...form.register("name")}
              disabled={isPending}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              {...form.register("email")}
              disabled={true}
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado por aqui.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone / WhatsApp</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                {...form.register("telefone")}
                disabled={isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cro">CRO</Label>
              <Input
                id="cro"
                placeholder="Seu CRO"
                {...form.register("cro")}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="especialidade">Especialidade</Label>
            <Input
              id="especialidade"
              placeholder="Ex: Ortodontia, Implantodontia..."
              {...form.register("especialidade")}
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t px-6 py-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
