import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { Check, Sparkles, Crown } from "lucide-react"

export default async function AssinaturaPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user subscription
  const { data: subscription } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single()

  const currentPlan =
    subscription?.plan === "monthly"
      ? "Mensal"
      : subscription?.plan === "annual"
        ? "Anual"
        : "Free"

  const isActive = subscription?.status === "active"

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="px-6 pt-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Assinatura</h1>
        <p className="text-slate-600">Gerencie seu plano e informações de pagamento</p>
      </div>

      {/* Plano Atual */}
      <div className="px-6">
        <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Plano Atual
                </CardTitle>
                <CardDescription className="text-slate-600 mt-2">
                  Você está no plano <span className="font-semibold text-slate-900">{currentPlan}</span>
                </CardDescription>
              </div>
              <Badge
                className={
                  isActive
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-slate-100 text-slate-800 border-slate-200"
                }
                variant="outline"
              >
                {isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {currentPlan === "Free" ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Você está usando o plano gratuito. Faça upgrade para desbloquear todos os recursos!
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-green-600" />
                    Acesso limitado ao Chat de IA
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-green-600" />
                    Alguns cursos disponíveis
                  </li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Obrigado por ser um membro premium! Você tem acesso completo a todos os recursos.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-green-600" />
                    Acesso ilimitado ao Chat de IA
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-green-600" />
                    Todos os cursos disponíveis
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-green-600" />
                    Certificados de conclusão
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-green-600" />
                    Suporte prioritário
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Planos Disponíveis */}
      <div className="px-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
          {/* Plano Mensal */}
          <Card className="border-slate-200 hover:border-primary transition-colors relative overflow-hidden">
            <CardHeader className="pb-8">
              <CardTitle className="text-slate-900 text-2xl">Plano Mensal</CardTitle>
              <CardDescription className="text-slate-600">
                Perfeito para começar sua jornada
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-slate-900">R$ 30</span>
                <span className="text-slate-600">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Acesso ilimitado ao Chat de IA</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Todos os cursos disponíveis</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Certificados de conclusão</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Suporte por email</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Atualizações mensais</span>
                </li>
              </ul>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-6">
                {currentPlan === "Mensal" ? "Plano Atual" : "Assinar Plano Mensal"}
              </Button>
            </CardContent>
          </Card>

          {/* Plano Anual */}
          <Card className="border-primary shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
              MAIS POPULAR
            </div>
            <CardHeader className="pb-8 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardTitle className="text-slate-900 text-2xl flex items-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                Plano Anual
              </CardTitle>
              <CardDescription className="text-slate-600">
                Melhor custo-benefício com economia de 33%
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-slate-900">R$ 240</span>
                <span className="text-slate-600">/ano</span>
                <div className="mt-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                    Economize R$ 120/ano
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">Tudo do plano mensal</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Economize 33% no valor total</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Acesso prioritário a novos cursos</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Suporte prioritário</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Sessões de mentoria exclusivas</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Material complementar em PDF</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Certificados premium</span>
                </li>
              </ul>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-6 shadow-lg">
                {currentPlan === "Anual" ? "Plano Atual" : "Assinar Plano Anual"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
