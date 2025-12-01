"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { updateUser, updateUserRole } from "@/app/actions/users"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { UserRow } from "./users-manager"

interface UserEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserRow
  onSuccess: () => void
}

export function UserEditDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserEditDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState<"cliente" | "admin">(
    (user.role === "admin" ? "admin" : "cliente") as "cliente" | "admin"
  )

  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    telefone: (user as any).telefone || "",
    cro: user.cro || "",
    especialidade: user.especialidade || "",
    role: user.role || "cliente",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    setStatusMessage(null)
  }

  const handleRoleChange = (value: string) => {
    const role = value as "cliente" | "admin"
    if (role !== formData.role) {
      setNewRole(role)
      setRoleChangeDialogOpen(true)
    }
  }

  const handleRoleConfirm = async () => {
    startTransition(async () => {
      const result = await updateUserRole(user.id, newRole)
      if (result.success) {
        setFormData((prev) => ({ ...prev, role: newRole }))
        setRoleChangeDialogOpen(false)
        setStatusMessage({
          type: "success",
          message: "Role atualizado com sucesso!",
        })
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        setRoleChangeDialogOpen(false)
        setStatusMessage({
          type: "error",
          message: result.error || "Erro ao atualizar role",
        })
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setStatusMessage(null)

    startTransition(async () => {
      const result = await updateUser(user.id, {
        name: formData.name || undefined,
        email: formData.email || undefined,
        telefone: formData.telefone || undefined,
        cro: formData.cro || undefined,
        especialidade: formData.especialidade || undefined,
      })

      if (result.success) {
        setStatusMessage({
          type: "success",
          message: "Usuário atualizado com sucesso!",
        })
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        if (result.fieldErrors) {
          const flattened: Record<string, string> = {}
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            if (messages.length) flattened[field] = messages[0]
          })
          setErrors(flattened)
        }
        if (result.error && !result.fieldErrors) {
          setStatusMessage({
            type: "error",
            message: result.error,
          })
        }
      }
    })
  }

  const trialEndDate = user.trial_ends_at
    ? format(new Date(user.trial_ends_at), "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR,
      })
    : null

  const expiresDate = user.expires_at
    ? format(new Date(user.expires_at), "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR,
      })
    : null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#0F192F] border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Editar Usuário</DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              Atualize as informações do usuário abaixo
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-300 border-b border-slate-700 pb-2">
                Informações Básicas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      handleInputChange("name", e.target.value)
                    }
                    className="bg-[#131D37] border-slate-600 text-white"
                    placeholder="Nome completo do usuário"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-[#131D37] border-slate-600 text-white"
                    placeholder="email@exemplo.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-400">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-slate-300">
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                    className="bg-[#131D37] border-slate-600 text-white"
                    placeholder="(00) 00000-0000"
                  />
                  {errors.telefone && (
                    <p className="text-sm text-red-400">{errors.telefone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cro" className="text-slate-300">
                    CRO
                  </Label>
                  <Input
                    id="cro"
                    value={formData.cro}
                    onChange={(e) => handleInputChange("cro", e.target.value)}
                    className="bg-[#131D37] border-slate-600 text-white"
                    placeholder="Número do CRO"
                  />
                  {errors.cro && (
                    <p className="text-sm text-red-400">{errors.cro}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="especialidade" className="text-slate-300">
                    Especialidade
                  </Label>
                  <Input
                    id="especialidade"
                    value={formData.especialidade}
                    onChange={(e) =>
                      handleInputChange("especialidade", e.target.value)
                    }
                    className="bg-[#131D37] border-slate-600 text-white"
                    placeholder="Especialidade do usuário"
                  />
                  {errors.especialidade && (
                    <p className="text-sm text-red-400">{errors.especialidade}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-300 border-b border-slate-700 pb-2">
                Permissões
              </h3>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-300">
                  Função
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleChange}
                  disabled={isPending}
                >
                  <SelectTrigger className="bg-[#131D37] border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131D37] border-slate-600">
                    <SelectItem value="cliente" className="text-white">
                      Cliente
                    </SelectItem>
                    <SelectItem value="admin" className="text-white">
                      Administrador
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Alterar a função requer confirmação
                </p>
              </div>
            </div>

            {/* Informações de Trial e Assinatura (Read-only) */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-300 border-b border-slate-700 pb-2">
                Informações de Assinatura e Trial
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-400">Status do Trial</Label>
                  <div className="bg-[#131D37] border border-slate-600 rounded-md px-3 py-2 text-sm">
                    {user.trial_used ? (
                      <span className="text-slate-400">Trial já utilizado</span>
                    ) : trialEndDate ? (
                      <span className="text-cyan-400">
                        Trial ativo até {trialEndDate}
                      </span>
                    ) : (
                      <span className="text-slate-400">Trial não iniciado</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400">Plano Atual</Label>
                  <div className="bg-[#131D37] border border-slate-600 rounded-md px-3 py-2 text-sm">
                    <span className="text-slate-300">
                      {user.plan_type || "Gratuito"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400">Status da Assinatura</Label>
                  <div className="bg-[#131D37] border border-slate-600 rounded-md px-3 py-2 text-sm">
                    <span className="text-slate-300">
                      {user.subscription_status || "Sem assinatura"}
                    </span>
                  </div>
                </div>

                {expiresDate && (
                  <div className="space-y-2">
                    <Label className="text-slate-400">Expira em</Label>
                    <div className="bg-[#131D37] border border-slate-600 rounded-md px-3 py-2 text-sm">
                      <span className="text-slate-300">{expiresDate}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mensagens de Status */}
            {statusMessage && (
              <Alert
                className={
                  statusMessage.type === "success"
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }
              >
                <AlertCircle
                  className={`h-4 w-4 ${
                    statusMessage.type === "success"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                />
                <AlertDescription
                  className={
                    statusMessage.type === "success"
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {statusMessage.message}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="border-slate-600 text-white hover:bg-slate-700 w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-cyan-600 hover:bg-cyan-700 text-white w-full sm:w-auto"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Mudança de Role */}
      <AlertDialog open={roleChangeDialogOpen} onOpenChange={setRoleChangeDialogOpen}>
        <AlertDialogContent className="bg-[#0F192F] border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Confirmar Mudança de Função
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja alterar a função deste usuário de{" "}
              <strong className="text-white">
                {formData.role === "admin" ? "Administrador" : "Cliente"}
              </strong>{" "}
              para{" "}
              <strong className="text-white">
                {newRole === "admin" ? "Administrador" : "Cliente"}
              </strong>
              ? Esta ação pode afetar as permissões de acesso do usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-slate-600 text-white hover:bg-slate-700"
              disabled={isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleConfirm}
              disabled={isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

