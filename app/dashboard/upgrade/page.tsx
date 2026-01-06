import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Lock, Sparkles, Zap, ShieldCheck, ArrowRight } from "lucide-react"
import { plans } from "@/lib/pricing"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function UpgradePage() {
  const monthlyPlan = plans.find(p => p.id === "monthly")
  const annualPlan = plans.find(p => p.id === "annual")

  return (
    <div className="w-full bg-[#0B1121] flex flex-col items-center py-12 px-4 md:px-8 animate-in fade-in zoom-in duration-500 relative">
      
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      {/* Alerta de Bloqueio */}
      <div className="relative z-10 bg-[#131D37]/80 backdrop-blur-sm border border-red-900/30 rounded-xl p-4 max-w-2xl w-full text-center mb-8 shadow-lg shadow-black/20 mt-4">
        <div className="inline-flex items-center justify-center p-2 rounded-full bg-red-950/50 text-red-400 mb-3 ring-1 ring-red-900/50">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          Seu período de teste gratuito terminou
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Para continuar tendo acesso às respostas baseadas em evidências científicas e ao chat com especialistas, escolha um plano abaixo.
        </p>
      </div>

      {/* Cabeçalho de Vendas */}
      <div className="relative z-10 text-center max-w-3xl mx-auto mb-8 space-y-2">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Evolua sua prática clínica com <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Odonto GPT</span>
        </h2>
        <p className="text-lg text-slate-400">
          Junte-se a milhares de dentistas que tomam decisões mais seguras todos os dias.
        </p>
      </div>

      {/* Grid de Planos */}
      <div className="relative z-10 grid gap-6 lg:grid-cols-2 max-w-4xl w-full items-start">
        
        {/* Plano Mensal */}
        {monthlyPlan && (
          <Card className="relative bg-[#131D37] border-slate-800 text-white shadow-xl hover:border-slate-700 transition-all duration-300">
            <CardHeader className="pb-4 px-5 pt-5">
              <CardTitle className="text-xl font-bold text-white">{monthlyPlan.name}</CardTitle>
              <CardDescription className="text-slate-400 text-sm">{monthlyPlan.description || "Flexibilidade total para você."}</CardDescription>
            </CardHeader>
            <CardContent className="pb-4 px-5">
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-white">{monthlyPlan.price}</span>
                <span className="text-slate-400 text-sm">/mês</span>
              </div>
              <ul className="space-y-2.5">
                {monthlyPlan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-slate-300">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-xs leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-3 px-5 pb-5 bg-[#0F1629] border-t border-slate-800/50">
              <Button asChild className="w-full border-slate-700 text-white hover:bg-slate-800 hover:text-cyan-400 transition-colors h-10 text-sm" variant="outline">
                <Link href="/dashboard/assinatura">
                  Assinar Mensal
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Plano Anual - Destaque */}
        {annualPlan && (
          <Card className="relative border-2 border-cyan-500/50 shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)] scale-[1.02] z-10 bg-[#131D37]">
            <div className="absolute -top-3 left-0 right-0 flex justify-center">
              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 border-0 text-white px-3 py-0.5 text-xs font-semibold shadow-lg shadow-cyan-500/20">
                Melhor Custo-Benefício
              </Badge>
            </div>
            <CardHeader className="pb-4 px-5 pt-7">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold text-white">{annualPlan.name}</CardTitle>
                  <CardDescription className="text-cyan-400 text-sm font-medium mt-0.5">
                    Economize 2 meses assinando agora
                  </CardDescription>
                </div>
                <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="pb-4 px-5">
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-white">{annualPlan.price}</span>
                <span className="text-slate-400 text-sm">/ano</span>
              </div>
              <ul className="space-y-2.5">
                {annualPlan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-slate-200 font-medium">
                    <div className="rounded-full bg-cyan-950/50 p-0.5 shrink-0 mt-0.5 border border-cyan-900/50">
                      <Check className="h-2.5 w-2.5 text-cyan-400" />
                    </div>
                    <span className="text-xs leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-4 px-5 pb-5 bg-gradient-to-b from-transparent to-cyan-950/20 flex flex-col gap-3">
              <Button asChild className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 h-10 text-sm border-0" size="lg">
                <Link href="/dashboard/assinatura" className="flex items-center justify-center gap-2">
                  Quero o Plano Anual
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <p className="text-center text-xs text-slate-500 w-full">
                Cobrança única de R$ 240,00 • Acesso imediato
              </p>
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Rodapé de Confiança */}
      <div className="relative z-10 mt-16 mb-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full text-center px-4">
        <div className="flex flex-col items-center gap-2 group">
          <div className="p-3 rounded-full bg-slate-800/50 group-hover:bg-cyan-950/30 transition-colors">
            <ShieldCheck className="h-6 w-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-200">Compra Segura</h3>
          <p className="text-sm text-slate-500">Seus dados protegidos.</p>
        </div>
        <div className="flex flex-col items-center gap-2 group">
          <div className="p-3 rounded-full bg-slate-800/50 group-hover:bg-cyan-950/30 transition-colors">
            <Zap className="h-6 w-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-200">Acesso Imediato</h3>
          <p className="text-sm text-slate-500">Liberação automática.</p>
        </div>
        <div className="flex flex-col items-center gap-2 group">
          <div className="p-3 rounded-full bg-slate-800/50 group-hover:bg-cyan-950/30 transition-colors">
            <div className="h-6 w-6 flex items-center justify-center font-bold text-slate-400 group-hover:text-cyan-400 transition-colors">?</div>
          </div>
          <h3 className="font-semibold text-slate-200">Suporte Dedicado</h3>
          <p className="text-sm text-slate-500">
            <Link href="mailto:suporte@odontogpt.com" className="text-cyan-500 hover:text-cyan-400 hover:underline">Fale conosco</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
