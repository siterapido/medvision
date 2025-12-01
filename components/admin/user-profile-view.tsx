"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  CreditCard,
  ShoppingBag,
  Key,
  Send,
  Edit,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { DEFAULT_TRIAL_DAYS, getRemainingTrialDays, getTrialDurationFromDates } from "@/lib/trial"
import {
  resetUserPassword,
  sendPasswordResetEmail,
  updateUserPlan,
  updateUser,
  updateUserRole,
} from "@/app/actions/users"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UserProfile {
  id: string
  email: string
  name: string | null
  telefone?: string | null
  cro: string | null
  especialidade: string | null
  role: string | null
  plan_type: string | null
  subscription_status: string | null
  trial_used: boolean | null
  trial_started_at: string | null
  trial_ends_at: string | null
  expires_at: string | null
  last_payment_date: string | null
  payment_method: string | null
  created_at: string
  updated_at: string | null
}

interface Purchase {
  id: string
  transaction_id: string
  amount: number | null
  status: string
  created_at: string
  course: {
    id: string
    title: string
    image_url: string | null
  } | null
}

interface PaymentHistory {
  id: string
  transaction_id: string
  amount: number
  currency: string
  status: string
  payment_method: string | null
  created_at: string
}

interface Subscription {
  id: string
  plan_type: string
  status: string
  started_at: string
  expires_at: string | null
}

interface UserProfileViewProps {
  user: UserProfile
  purchases: Purchase[]
  paymentHistory: PaymentHistory[]
  subscription: Subscription | null
}

export function UserProfileView({
  user,
  purchases,
  paymentHistory,
  subscription,
}: UserProfileViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  // Estados para diálogos
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [sendResetEmailDialogOpen, setSendResetEmailDialogOpen] = useState(false)
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [newPlanType, setNewPlanType] = useState<"free" | "monthly" | "annual">(
    (user.plan_type as "free" | "monthly" | "annual") || "free"
  )
  const [newSubscriptionStatus, setNewSubscriptionStatus] = useState<
    "free" | "active" | "canceled" | "past_due" | "refunded"
  >((user.subscription_status as "free" | "active" | "canceled" | "past_due" | "refunded") || "free")

  // Estados para edição inline
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    telefone: user.telefone || "",
    cro: user.cro || "",
    especialidade: user.especialidade || "",
    role: user.role || "cliente",
  })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState<"cliente" | "admin">(
    (user.role === "admin" ? "admin" : "cliente") as "cliente" | "admin"
  )

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setStatusMessage({
        type: "error",
        message: "A senha deve ter pelo menos 8 caracteres",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({
        type: "error",
        message: "As senhas não coincidem",
      })
      return
    }

    startTransition(async () => {
      const result = await resetUserPassword(user.id, newPassword)
      if (result.success) {
        setStatusMessage({
          type: "success",
          message: "Senha redefinida com sucesso!",
        })
        setResetPasswordDialogOpen(false)
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => {
          setStatusMessage(null)
        }, 3000)
      } else {
        setStatusMessage({
          type: "error",
          message: result.error || "Erro ao redefinir senha",
        })
      }
    })
  }

  const handleSendResetEmail = async () => {
    startTransition(async () => {
      const result = await sendPasswordResetEmail(user.email)
      if (result.success) {
        setStatusMessage({
          type: "success",
          message: "Email de redefinição enviado com sucesso!",
        })
        setSendResetEmailDialogOpen(false)
        setTimeout(() => {
          setStatusMessage(null)
        }, 3000)
      } else {
        setStatusMessage({
          type: "error",
          message: result.error || "Erro ao enviar email",
        })
      }
    })
  }

  const handleChangePlan = async () => {
    startTransition(async () => {
      const result = await updateUserPlan(user.id, {
        plan_type: newPlanType,
        subscription_status: newSubscriptionStatus,
      })
      if (result.success) {
        setStatusMessage({
          type: "success",
          message: "Plano atualizado com sucesso!",
        })
        setChangePlanDialogOpen(false)
        router.refresh()
        setTimeout(() => {
          setStatusMessage(null)
        }, 3000)
      } else {
        setStatusMessage({
          type: "error",
          message: result.error || "Erro ao atualizar plano",
        })
      }
    })
  }

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }))
    if (editErrors[field]) {
      setEditErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    setStatusMessage(null)
  }

  const handleRoleChange = (value: string) => {
    const role = value as "cliente" | "admin"
    if (role !== editFormData.role) {
      setNewRole(role)
      setRoleChangeDialogOpen(true)
    }
  }

  const handleRoleConfirm = async () => {
    startTransition(async () => {
      const result = await updateUserRole(user.id, newRole)
      if (result.success) {
        setEditFormData((prev) => ({ ...prev, role: newRole }))
        setRoleChangeDialogOpen(false)
        setStatusMessage({
          type: "success",
          message: "Função atualizada com sucesso!",
        })
        router.refresh()
        setTimeout(() => {
          setStatusMessage(null)
        }, 3000)
      } else {
        setRoleChangeDialogOpen(false)
        setStatusMessage({
          type: "error",
          message: result.error || "Erro ao atualizar função",
        })
      }
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditErrors({})
    setStatusMessage(null)

    startTransition(async () => {
      const result = await updateUser(user.id, {
        name: editFormData.name || undefined,
        email: editFormData.email || undefined,
        telefone: editFormData.telefone || undefined,
        cro: editFormData.cro || undefined,
        especialidade: editFormData.especialidade || undefined,
      })

      if (result.success) {
        setStatusMessage({
          type: "success",
          message: "Usuário atualizado com sucesso!",
        })
        setIsEditing(false)
        router.refresh()
        setTimeout(() => {
          setStatusMessage(null)
        }, 3000)
      } else {
        if (result.fieldErrors) {
          const flattened: Record<string, string> = {}
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            if (messages.length) flattened[field] = messages[0]
          })
          setEditErrors(flattened)
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

  const handleCancelEdit = () => {
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      telefone: user.telefone || "",
      cro: user.cro || "",
      especialidade: user.especialidade || "",
      role: user.role || "cliente",
    })
    setEditErrors({})
    setIsEditing(false)
    setStatusMessage(null)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "approved":
      case "paid":
      case "active":
        return (
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            {status === "active" ? "Ativo" : "Concluído"}
          </Badge>
        )
      case "pending":
      case "waiting":
        return (
          <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
            Pendente
          </Badge>
        )
      case "failed":
      case "refused":
      case "canceled":
        return (
          <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-400">
            {status === "canceled" ? "Cancelado" : "Falhou"}
          </Badge>
        )
      case "refunded":
        return (
          <Badge className="border-purple-500/30 bg-purple-500/10 text-purple-400">
            Reembolsado
          </Badge>
        )
      default:
        return (
          <Badge className="border-slate-500/30 bg-slate-500/10 text-slate-400">
            {status}
          </Badge>
        )
    }
  }

  const getPlanBadge = (planType: string | null, status: string | null) => {
    if (planType === "free" || !planType) {
      return (
        <Badge variant="outline" className="border-slate-600 text-slate-400 bg-slate-800/50">
          Gratuito
        </Badge>
      )
    }
    if (status === "active") {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          {planType === "monthly" ? "Mensal" : planType === "annual" ? "Anual" : planType}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
        {planType === "monthly" ? "Mensal" : planType === "annual" ? "Anual" : planType}
      </Badge>
    )
  }

  const getTrialDisplay = () => {
    const trialDuration = getTrialDurationFromDates(
      user.trial_started_at,
      user.trial_ends_at,
      DEFAULT_TRIAL_DAYS
    )

    if (user.plan_type && user.plan_type !== "free") {
      return <span className="text-emerald-300">Plano ativo; trial não aplicável.</span>
    }

    if (!user.trial_ends_at) {
      return <span className="text-slate-400">Trial não iniciado (padrão {trialDuration} dias)</span>
    }

    if (user.trial_used) {
      return <span className="text-slate-400">Trial de {trialDuration} dia{trialDuration !== 1 ? "s" : ""} já utilizado</span>
    }

    const daysRemaining = getRemainingTrialDays(user.trial_ends_at)
    const trialEndDate = format(new Date(user.trial_ends_at), "dd/MM/yyyy", { locale: ptBR })

    if (daysRemaining > 0) {
      return (
        <span className="text-cyan-400">
          {daysRemaining} dia{daysRemaining !== 1 ? "s" : ""} restante{daysRemaining !== 1 ? "s" : ""} de {trialDuration} (até {trialEndDate})
        </span>
      )
    }

    if (new Date(user.trial_ends_at) > new Date()) {
      return (
        <span className="text-cyan-400">
          Trial de {trialDuration} dia{trialDuration !== 1 ? "s" : ""} ativo até {trialEndDate}
        </span>
      )
    }

    return (
      <span className="text-slate-400">
        Trial de {trialDuration} dia{trialDuration !== 1 ? "s" : ""} expirou em {trialEndDate}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mensagem de Status */}
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
              statusMessage.type === "success" ? "text-green-400" : "text-red-400"
            }`}
          />
          <AlertDescription
            className={
              statusMessage.type === "success" ? "text-green-400" : "text-red-400"
            }
          >
            {statusMessage.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Botão Voltar */}
      <Link href="/admin/usuarios">
        <Button variant="ghost" className="text-slate-400 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Lista de Usuários
        </Button>
      </Link>

      {/* Informações Básicas */}
      <Card className="bg-[#0F192F] border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-400" />
                Informações do Usuário
              </CardTitle>
              <CardDescription className="text-slate-400">
                Dados pessoais e de cadastro
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="border-slate-600 text-white hover:bg-slate-700"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResetPasswordDialogOpen(true)}
                    className="border-slate-600 text-white hover:bg-slate-700"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Redefinir Senha
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSendResetEmailDialogOpen(true)}
                    className="border-slate-600 text-white hover:bg-slate-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Email
                  </Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="border-slate-600 text-white hover:bg-slate-700"
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-slate-300">
                    Nome Completo
                  </Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => handleEditInputChange("name", e.target.value)}
                    className="bg-[#131D37] border-slate-600 text-white"
                    placeholder="Nome completo do usuário"
                  />
                  {editErrors.name && (
                    <p className="text-sm text-red-400">{editErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-slate-300 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => handleEditInputChange("email", e.target.value)}
                    className="bg-[#131D37] border-slate-600 text-white"
                    placeholder="email@exemplo.com"
                  />
                  {editErrors.email && (
                    <p className="text-sm text-red-400">{editErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-telefone" className="text-slate-300 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <Input
                    id="edit-telefone"
                    value={editFormData.telefone}
                    onChange={(e) => handleEditInputChange("telefone", e.target.value)}
                    className="bg-[#131D37] border-slate-600 text-white"
                    placeholder="(00) 00000-0000"
                  />
                  {editErrors.telefone && (
                    <p className="text-sm text-red-400">{editErrors.telefone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-cro" className="text-slate-300">
                    CRO
                  </Label>
                  <Input
                    id="edit-cro"
                    value={editFormData.cro}
                    onChange={(e) => handleEditInputChange("cro", e.target.value)}
                    className="bg-[#131D37] border-slate-600 text-white"
                    placeholder="Número do CRO"
                  />
                  {editErrors.cro && (
                    <p className="text-sm text-red-400">{editErrors.cro}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-especialidade" className="text-slate-300">
                    Especialidade
                  </Label>
                  <Input
                    id="edit-especialidade"
                    value={editFormData.especialidade}
                    onChange={(e) => handleEditInputChange("especialidade", e.target.value)}
                    className="bg-[#131D37] border-slate-600 text-white"
                    placeholder="Especialidade do usuário"
                  />
                  {editErrors.especialidade && (
                    <p className="text-sm text-red-400">{editErrors.especialidade}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role" className="text-slate-300">
                    Função
                  </Label>
                  <Select
                    value={editFormData.role}
                    onValueChange={handleRoleChange}
                    disabled={isPending}
                  >
                    <SelectTrigger
                      id="edit-role"
                      className="bg-[#131D37] border-slate-600 text-white"
                    >
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

                <div className="space-y-1">
                  <Label className="text-slate-400 text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Cadastrado em
                  </Label>
                  <p className="text-white">
                    {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-slate-400 text-sm">Nome</Label>
                <p className="text-white">{user.name || "Não informado"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <p className="text-white">{user.email}</p>
              </div>
              {user.telefone && (
                <div className="space-y-1">
                  <Label className="text-slate-400 text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <p className="text-white">{user.telefone}</p>
                </div>
              )}
              {user.cro && (
                <div className="space-y-1">
                  <Label className="text-slate-400 text-sm">CRO</Label>
                  <p className="text-white">{user.cro}</p>
                </div>
              )}
              {user.especialidade && (
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-slate-400 text-sm">Especialidade</Label>
                  <p className="text-white">{user.especialidade}</p>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-slate-400 text-sm">Função</Label>
                <div>
                  {user.role === "admin" ? (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      Administrador
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-slate-600 text-slate-400 bg-slate-800/50"
                    >
                      Cliente
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Cadastrado em
                </Label>
                <p className="text-white">
                  {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assinatura e Plano */}
      <Card className="bg-[#0F192F] border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-cyan-400" />
                Assinatura e Plano
              </CardTitle>
              <CardDescription className="text-slate-400">
                Status da assinatura e informações de pagamento
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewPlanType((user.plan_type as "free" | "monthly" | "annual") || "free")
                setNewSubscriptionStatus(
                  (user.subscription_status as "free" | "active" | "canceled" | "past_due" | "refunded") || "free"
                )
                setChangePlanDialogOpen(true)
              }}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              <Edit className="mr-2 h-4 w-4" />
              Alterar Plano
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-slate-400 text-sm">Plano Atual</Label>
              <div>{getPlanBadge(user.plan_type, user.subscription_status)}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-sm">Status da Assinatura</Label>
              <div>{getStatusBadge(user.subscription_status || "free")}</div>
            </div>
            {user.expires_at && (
              <div className="space-y-1">
                <Label className="text-slate-400 text-sm">Expira em</Label>
                <p className="text-white">
                  {format(new Date(user.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
            {user.last_payment_date && (
              <div className="space-y-1">
                <Label className="text-slate-400 text-sm">Último Pagamento</Label>
                <p className="text-white">
                  {format(new Date(user.last_payment_date), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            )}
            {user.payment_method && (
              <div className="space-y-1">
                <Label className="text-slate-400 text-sm">Método de Pagamento</Label>
                <p className="text-white">{user.payment_method}</p>
              </div>
            )}
            {user.trial_ends_at && (
              <div className="space-y-1">
                <Label className="text-slate-400 text-sm">Trial</Label>
                <p className="text-white">
                  {getTrialDisplay()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compras de Cursos */}
      <Card className="bg-[#0F192F] border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-cyan-400" />
            Compras de Cursos ({purchases.length})
          </CardTitle>
          <CardDescription className="text-slate-400">
            Histórico de cursos adquiridos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhuma compra de curso encontrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-4 text-slate-400 text-sm">Data</th>
                    <th className="text-left py-2 px-4 text-slate-400 text-sm">Curso</th>
                    <th className="text-left py-2 px-4 text-slate-400 text-sm">Transação</th>
                    <th className="text-right py-2 px-4 text-slate-400 text-sm">Valor</th>
                    <th className="text-right py-2 px-4 text-slate-400 text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-slate-800">
                      <td className="py-3 px-4 text-white text-sm">
                        {format(new Date(purchase.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4 text-white text-sm">
                        {purchase.course?.title || "Curso Removido"}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs font-mono">
                        {purchase.transaction_id}
                      </td>
                      <td className="py-3 px-4 text-right text-white text-sm">
                        {purchase.amount ? formatCurrency(Number(purchase.amount)) : "-"}
                      </td>
                      <td className="py-3 px-4 text-right">{getStatusBadge(purchase.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Pagamentos */}
      <Card className="bg-[#0F192F] border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cyan-400" />
            Histórico de Pagamentos ({paymentHistory.length})
          </CardTitle>
          <CardDescription className="text-slate-400">
            Todas as transações registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentHistory.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhum pagamento encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-4 text-slate-400 text-sm">Data</th>
                    <th className="text-left py-2 px-4 text-slate-400 text-sm">Transação</th>
                    <th className="text-right py-2 px-4 text-slate-400 text-sm">Valor</th>
                    <th className="text-left py-2 px-4 text-slate-400 text-sm">Método</th>
                    <th className="text-right py-2 px-4 text-slate-400 text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-800">
                      <td className="py-3 px-4 text-white text-sm">
                        {format(new Date(payment.created_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs font-mono">
                        {payment.transaction_id}
                      </td>
                      <td className="py-3 px-4 text-right text-white text-sm">
                        {formatCurrency(Number(payment.amount))} {payment.currency}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-sm">
                        {payment.payment_method || "-"}
                      </td>
                      <td className="py-3 px-4 text-right">{getStatusBadge(payment.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo: Redefinir Senha */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="bg-[#0F192F] border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription className="text-slate-400">
              Defina uma nova senha para {user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-[#131D37] border-slate-600 text-white"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#131D37] border-slate-600 text-white"
                placeholder="Digite a senha novamente"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setResetPasswordDialogOpen(false)}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                "Redefinir Senha"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: Enviar Email de Redefinição */}
      <AlertDialog open={sendResetEmailDialogOpen} onOpenChange={setSendResetEmailDialogOpen}>
        <AlertDialogContent className="bg-[#0F192F] border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Enviar Email de Redefinição</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Um email com link para redefinição de senha será enviado para {user.email}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendResetEmail}
              disabled={isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Email"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo: Alterar Plano */}
      <Dialog open={changePlanDialogOpen} onOpenChange={setChangePlanDialogOpen}>
        <DialogContent className="bg-[#0F192F] border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
            <DialogDescription className="text-slate-400">
              Atualize o plano e status da assinatura do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="planType">Tipo de Plano</Label>
              <Select
                value={newPlanType}
                onValueChange={(value) => setNewPlanType(value as "free" | "monthly" | "annual")}
              >
                <SelectTrigger className="bg-[#131D37] border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#131D37] border-slate-600">
                  <SelectItem value="free" className="text-white">
                    Gratuito
                  </SelectItem>
                  <SelectItem value="monthly" className="text-white">
                    Mensal
                  </SelectItem>
                  <SelectItem value="annual" className="text-white">
                    Anual
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscriptionStatus">Status da Assinatura</Label>
              <Select
                value={newSubscriptionStatus}
                onValueChange={(value) =>
                  setNewSubscriptionStatus(
                    value as "free" | "active" | "canceled" | "past_due" | "refunded"
                  )
                }
              >
                <SelectTrigger className="bg-[#131D37] border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#131D37] border-slate-600">
                  <SelectItem value="free" className="text-white">
                    Gratuito
                  </SelectItem>
                  <SelectItem value="active" className="text-white">
                    Ativo
                  </SelectItem>
                  <SelectItem value="canceled" className="text-white">
                    Cancelado
                  </SelectItem>
                  <SelectItem value="past_due" className="text-white">
                    Atrasado
                  </SelectItem>
                  <SelectItem value="refunded" className="text-white">
                    Reembolsado
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setChangePlanDialogOpen(false)}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePlan}
              disabled={isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar Plano"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: Confirmação de Mudança de Role */}
      <AlertDialog open={roleChangeDialogOpen} onOpenChange={setRoleChangeDialogOpen}>
        <AlertDialogContent className="bg-[#0F192F] border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar Mudança de Função</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja alterar a função deste usuário de{" "}
              <strong className="text-white">
                {editFormData.role === "admin" ? "Administrador" : "Cliente"}
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
    </div>
  )
}
