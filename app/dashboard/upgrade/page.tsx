import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, AlertTriangle, Lock } from "lucide-react"
import { plans } from "@/lib/pricing"
import Link from "next/link"

export default function UpgradePage() {
  // Filtramos os planos mensais e anuais do pricing.ts
  const monthlyPlan = plans.find(p => p.name === "Mensal")
  const annualPlan = plans.find(p => p.name === "Anual")

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-700">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-red-100 text-red-600 mb-4">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
          Seu período de teste gratuito terminou
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Esperamos que você tenha aproveitado os 7 dias de acesso ao Odonto GPT. 
          Para continuar tendo acesso às respostas baseadas em evidências científicas, 
          escolha um dos planos abaixo.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 max-w-5xl w-full">
        {/* Plano Mensal */}
        {monthlyPlan && (
          <Card className="relative overflow-hidden border-2 border-slate-200 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{monthlyPlan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-primary">{monthlyPlan.price}</span>
                <span className="text-muted-foreground">{monthlyPlan.period}</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{monthlyPlan.description}</p>

              <ul className="mt-6 space-y-4">
                {monthlyPlan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button asChild className="w-full" size="lg" variant="outline">
                  <Link href="/dashboard/assinatura">
                    Escolher Mensal
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plano Anual */}
        {annualPlan && (
          <Card className="relative overflow-hidden border-2 border-primary shadow-2xl scale-[1.02] bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
            <div className="absolute top-0 right-0 p-4">
              <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">Mais Popular</Badge>
            </div>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{annualPlan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-primary">{annualPlan.price}</span>
                <span className="text-muted-foreground">{annualPlan.period}</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{annualPlan.description}</p>

              <ul className="mt-6 space-y-4">
                {annualPlan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button asChild className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white font-semibold shadow-lg hover:shadow-xl transition-all" size="lg">
                  <Link href="/dashboard/assinatura">
                    Escolher Anual
                  </Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  Economize com 2 meses grátis
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Precisa de ajuda? <Link href="mailto:suporte@odontogpt.com" className="text-primary underline">Fale com o suporte</Link>
        </p>
      </div>
    </div>
  )
}

