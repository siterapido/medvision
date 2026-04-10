'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { FadeIn } from "@/components/ui/animations"
import { ArrowRight, Sparkles, Shield, Lock, CheckCircle2 } from "lucide-react"
import { AgentHeroVisual } from "@/components/landing/agent-hero-visual"
import { CAKTO_BASIC_ANNUAL_PLAN_ID, CAKTO_PRO_ANNUAL_PLAN_ID } from "@/lib/cakto"

const BASIC_CHECKOUT_URL = `https://pay.cakto.com.br/${CAKTO_BASIC_ANNUAL_PLAN_ID}`
const PRO_CHECKOUT_URL = `https://pay.cakto.com.br/${CAKTO_PRO_ANNUAL_PLAN_ID}`

export function PaidHeroSection() {
  return (
    <section id="hero-section" className="relative w-full min-h-[85vh] md:min-h-[90vh] flex items-center justify-center py-20 md:py-32 px-4 md:px-6 overflow-hidden z-10">
      <div className="container mx-auto">
        {/* Logo Mobile */}
        <div className="flex justify-start md:hidden mb-8">
          <Logo variant="white" width={140} height={30} />
        </div>

        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center max-w-7xl mx-auto">

          {/* Left Column - Sales Copy */}
          <div className="space-y-4 md:space-y-8 text-center lg:text-left order-1 relative z-10">
            <div className="flex justify-center lg:justify-start mb-6 hidden md:flex">
              <Logo variant="white" width={160} height={35} />
            </div>

            <FadeIn delay={0.1} direction="up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold mb-2 md:mb-4 backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                <span>Acesso Imediato Apos o Pagamento</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
                Sua IA especializada<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  em Odontologia
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2} direction="up">
              <div className="space-y-3">
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                  Inteligencia artificial especifica para odontologia com base em livros e artigos cientificos.
                </p>
                <p className="text-base text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  <span className="text-emerald-400 font-semibold">+2.000 profissionais</span> ja transformaram seus estudos e atendimentos com a MedVision.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.3} direction="up">
              <div className="flex flex-col sm:flex-row gap-4 mt-8 max-w-lg mx-auto lg:mx-0">
                <a href={BASIC_CHECKOUT_URL} className="flex-1">
                  <Button
                    size="lg"
                    className="w-full rounded-full py-6 text-base font-semibold shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all border-0 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
                    }}
                  >
                    Assinar Plano Basico
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
                <a href={PRO_CHECKOUT_URL} className="flex-1">
                  <Button
                    size="lg"
                    className="w-full rounded-full py-6 text-base font-semibold shadow-[0_10px_40px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95 transition-all border-0 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)'
                    }}
                  >
                    Assinar Plano Pro
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Pagamento Seguro</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Acesso imediato</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Garantia de 7 dias</span>
                </div>
              </div>
            </FadeIn>

            {/* Social Proof */}
            <FadeIn delay={0.4} direction="up">
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-400">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0F192F] bg-slate-200 bg-cover bg-center" style={{ backgroundImage: `url(https://api.dicebear.com/9.x/avataaars/svg?seed=${i})` }} />
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-[#0F192F] bg-slate-800 flex items-center justify-center text-xs font-bold text-white">+2k</div>
                </div>
                <span>Dentistas ja usam MedVision</span>
              </div>
            </FadeIn>
          </div>

          {/* Right Column - Hero Visual */}
          <div className="order-2 lg:order-2 relative z-0 flex justify-center lg:justify-end mt-12 lg:mt-0">
            <FadeIn delay={0.2} className="w-full max-w-[280px] sm:max-w-md lg:max-w-2xl">
              <AgentHeroVisual />
            </FadeIn>
          </div>

        </div>
      </div>
    </section>
  )
}
