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
    <Card className="bg-slate-900 border-slate-800 shadow-none">
      <CardHeader>
        <CardTitle className="text-slate-50">Dados Pessoais</CardTitle>
        <CardDescription className="text-slate-400">
          Atualize suas informações pessoais e profissionais.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-200">Nome Completo</Label>
            <Input
              id="name"
              placeholder="Seu nome"
              {...form.register("name")}
              disabled={isPending}
              className="bg-slate-950 border-slate-800 text-slate-50 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">Email</Label>
            <Input
              id="email"
              {...form.register("email")}
              disabled={true}
              className="bg-slate-950/50 border-slate-800 text-slate-400"
            />
            <p className="text-xs text-slate-500">
              O email não pode ser alterado por aqui.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-slate-200">Telefone / WhatsApp</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                {...form.register("telefone")}
                disabled={isPending}
                className="bg-slate-950 border-slate-800 text-slate-50 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cro" className="text-slate-200">CRO</Label>
              <Input
                id="cro"
                placeholder="Seu CRO"
                {...form.register("cro")}
                disabled={isPending}
                className="bg-slate-950 border-slate-800 text-slate-50 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="especialidade" className="text-slate-200">Especialidade</Label>
            <Input
              id="especialidade"
              placeholder="Ex: Ortodontia, Implantodontia..."
              {...form.register("especialidade")}
              disabled={isPending}
              className="bg-slate-950 border-slate-800 text-slate-50 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-slate-800 px-6 py-4">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all duration-300"
          >
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
