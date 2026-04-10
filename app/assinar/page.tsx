'use client'

import { useState, useEffect, useRef } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import dynamic from "next/dynamic"
import {
  Brain, Shield, Zap,
  CheckCircle2, ArrowRight, Award, TrendingUp,
  XCircle, Sparkles, Eye, GraduationCap,
  Check, Lock
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { motion } from "framer-motion"
import { FadeIn, StaggerContainer, StaggerItem, HoverCard, ScaleIn } from "@/components/ui/animations"
import { AgentHeroVisual } from "@/components/landing/agent-hero-visual"
import { ScrollProgress } from "@/components/landing/scroll-animations"
import { AgentDemoResearch } from "@/components/landing/agent-demo-research"
import { AgentDemoSummary } from "@/components/landing/agent-demo-summary"
import { AgentDemoPractice } from "@/components/landing/agent-demo-practice"
import { AgentDemoWrite } from "@/components/landing/agent-demo-write"
import { AgentDemoFlow } from "@/components/landing/agent-demo-flow"
import { AgentDemoGPT } from "@/components/landing/agent-demo-gpt"
import { LazyVideoWrapper } from "@/components/video/lazy-video-wrapper"
import { YouTubePlayer } from "@/components/video/youtube-player"
import { useIsMobile } from "@/lib/hooks/use-mobile"
import { LogoScroll } from "@/components/landing/logo-scroll"
import { SpecialistsGrid } from "@/components/landing/specialists-grid"
import { AiVisionSection } from "@/components/landing/ai-vision-section"
import { PaidHeroSection } from "@/components/landing/paid-hero-section"
import { CAKTO_BASIC_ANNUAL_PLAN_ID, CAKTO_PRO_ANNUAL_PLAN_ID } from "@/lib/cakto"

const BASIC_CHECKOUT_URL = `https://pay.cakto.com.br/${CAKTO_BASIC_ANNUAL_PLAN_ID}`
const PRO_CHECKOUT_URL = `https://pay.cakto.com.br/${CAKTO_PRO_ANNUAL_PLAN_ID}`

const FAQSection = dynamic(() => import("@/components/landing/faq-section").then(mod => ({ default: mod.FAQSection })), {
  ssr: false,
  loading: () => <div className="w-full py-16 md:py-32 px-4 md:px-6 bg-faq-section"><div className="mx-auto max-w-3xl h-96 animate-pulse bg-slate-800/20 rounded-xl" /></div>
})

const SectionHeader = dynamic(() => import("@/components/ui/section-header").then(mod => ({ default: mod.SectionHeader })), {
  loading: () => <div className="h-20 bg-transparent animate-pulse" />
})



export default function PaidLandingPage() {
  const [showStickyCTA, setShowStickyCTA] = useState(false)
  const heroRef = useRef<HTMLElement>(null)


  useEffect(() => {
    const heroSection = document.getElementById('hero-section')
    if (!heroSection) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyCTA(!entry.isIntersecting || entry.intersectionRatio < 0.2)
      },
      { threshold: [0, 0.2, 0.5, 1] }
    )

    observer.observe(heroSection)
    return () => observer.disconnect()
  }, [])

  return (
    <main className="relative">
      {/* Scroll Progress Indicator */}
      <ScrollProgress />

      {/* Sticky CTA Mobile - Direct to checkout */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{
          y: showStickyCTA ? 0 : 100,
          opacity: showStickyCTA ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 p-4 bg-[#0F192F]/95 backdrop-blur-xl border-t border-emerald-500/20 z-50 md:hidden safe-area-inset-bottom"
        style={{ willChange: "transform, opacity" }}
      >
        <a href={BASIC_CHECKOUT_URL}>
          <Button
            size="lg"
            className="w-full rounded-full py-4 text-base font-semibold shadow-[0_-5px_30px_rgba(16,185,129,0.3)] border-0 text-white"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
            }}
          >
            Assinar Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </a>
      </motion.div>

      <div className="relative min-h-screen bg-[#080D19] text-white">

        {/* ATMOSPHERIC BACKGROUND SYSTEM - Deep Space Aesthetic */}
        <div className="fixed inset-0 z-0 pointer-events-none">

          {/* Base: Pure deep dark with subtle warm undertone */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 150% 100% at 50% 0%, #0D1628 0%, #080D19 50%, #060A14 100%)
              `
            }}
          />

          {/* Nebula Layer 1: Large diffuse cyan glow - top left */}
          <div
            className="absolute w-[800px] h-[800px] -top-[200px] -left-[200px] opacity-[0.04]"
            style={{
              background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
              filter: 'blur(100px)',
              willChange: 'transform',
              backfaceVisibility: 'hidden'
            }}
          />

          {/* Nebula Layer 2: Subtle purple accent - center right */}
          <div
            className="absolute w-[600px] h-[600px] top-[30%] -right-[150px] opacity-[0.03]"
            style={{
              background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
              filter: 'blur(120px)',
              willChange: 'transform',
              backfaceVisibility: 'hidden'
            }}
          />

          {/* Nebula Layer 3: Deep cyan - bottom */}
          <div
            className="absolute w-[1000px] h-[500px] -bottom-[100px] left-[20%] opacity-[0.035]"
            style={{
              background: 'radial-gradient(ellipse, #0891b2 0%, transparent 70%)',
              filter: 'blur(100px)',
              willChange: 'transform',
              backfaceVisibility: 'hidden'
            }}
          />

          {/* Subtle noise texture for depth */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
            }}
          />

          {/* Minimal star field - tiny dots */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                radial-gradient(1px 1px at 20% 15%, rgba(255,255,255,0.4) 0%, transparent 100%),
                radial-gradient(1px 1px at 40% 35%, rgba(255,255,255,0.3) 0%, transparent 100%),
                radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,0.35) 0%, transparent 100%),
                radial-gradient(1px 1px at 80% 40%, rgba(255,255,255,0.25) 0%, transparent 100%),
                radial-gradient(1px 1px at 10% 60%, rgba(255,255,255,0.3) 0%, transparent 100%),
                radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,0.35) 0%, transparent 100%),
                radial-gradient(1px 1px at 50% 70%, rgba(255,255,255,0.2) 0%, transparent 100%),
                radial-gradient(1px 1px at 70% 85%, rgba(255,255,255,0.3) 0%, transparent 100%),
                radial-gradient(1px 1px at 90% 55%, rgba(255,255,255,0.25) 0%, transparent 100%),
                radial-gradient(1.5px 1.5px at 25% 45%, rgba(6,182,212,0.6) 0%, transparent 100%),
                radial-gradient(1.5px 1.5px at 75% 65%, rgba(139,92,246,0.5) 0%, transparent 100%)
              `,
              backgroundSize: '100% 100%',
            }}
          />

          {/* Tech Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
              maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 0%, transparent 85%)'
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.2) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 0%, transparent 90%)'
            }}
          />
        </div>

        {/* Hero Section - Paid Signup (no trial) */}
        <PaidHeroSection />

        {/* Logo Scroll Section */}
        <LogoScroll />

        {/* Specialists Section */}
        <section className="w-full py-20 md:py-32 px-4 md:px-6 relative z-20 bg-[#080D19]">
          <div className="mx-auto max-w-6xl space-y-12">
            <SectionHeader
              label="Sua Equipe Completa"
              icon={Brain}
              title="Especialistas Disponíveis 24/7"
              description="Cada agente da MedVision foi treinado para uma função específica, garantindo precisão e profundidade em cada resposta."
              align="center"
            />

            <SpecialistsGrid />
          </div>
        </section>

        {/* AI Vision Section */}
        <AiVisionSection />

        {/* Agent Demos Section */}
        <section className="w-full relative z-10">
          <div className="py-16 text-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              className="mx-auto max-w-3xl"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-sm">Veja em Acao</span>
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Seus Especialistas<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                  Trabalhando por Voce
                </span>
              </h2>
              <p className="text-lg text-slate-400 mb-8">
                Role para baixo e veja cada agente demonstrando suas habilidades em tempo real
              </p>
            </motion.div>
          </div>

          <AgentDemoFlow />
          <AgentDemoGPT />
          <AgentDemoResearch />
          <AgentDemoSummary />
          <AgentDemoPractice />
          <AgentDemoWrite />
        </section>

        {/* Comparison Section */}
        <section className="w-full py-20 md:py-32 px-4 md:px-6 relative z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-500 rounded-full blur-[250px] opacity-[0.03] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#22d3ee] rounded-full blur-[250px] opacity-[0.04] pointer-events-none" />

          <div className="container mx-auto max-w-7xl relative z-10">
            <FadeIn direction="up" delay={0.1}>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold text-sm">Realidade Academica</span>
                </span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1]">
                  A Diferenca Entre Estudar<br />
                  <span className="text-slate-400">Muito</span> e Estudar{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Bem</span>
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed">
                  A MedVision nao substitui seu estudo, ela o potencializa. Veja a diferenca na pratica.
                </p>
              </div>
            </FadeIn>

            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
              {/* Sem MedVision */}
              <FadeIn direction="right" delay={0.2}>
                <div className="group relative h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  <div className="relative h-full bg-[#0F172A]/80 border border-slate-800 rounded-2xl p-8 lg:p-10 backdrop-blur-sm hover:border-red-500/30 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800/50">
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <XCircle className="w-7 h-7 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Sem MedVision</h3>
                        <p className="text-sm text-red-400/80">O caminho mais dificil</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {[
                        { text: "Perde oportunidades de estagio por inseguranca nas respostas", emphasis: "inseguranca" },
                        { text: "Gasta 3h pesquisando o que poderia resolver em 30 segundos", emphasis: "3h pesquisando" },
                        { text: "Fica com medo de errar prescricoes e passar vergonha no plantao", emphasis: "medo de errar" },
                        { text: "Assiste colegas com \"contatos\" ganharem as melhores vagas", emphasis: "melhores vagas" }
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-4 group/item">
                          <div className="mt-1 p-1 rounded-full bg-red-500/10 shrink-0">
                            <XCircle className="w-4 h-4 text-red-400" />
                          </div>
                          <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
                            {item.text.split(item.emphasis).map((part, idx, arr) => (
                              <span key={idx}>
                                {part}
                                {idx < arr.length - 1 && (
                                  <span className="text-red-400 font-medium">{item.emphasis}</span>
                                )}
                              </span>
                            ))}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800/50">
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <div className="flex -space-x-1">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border-2 border-[#0F172A] flex items-center justify-center text-[10px] text-slate-400">
                              &#128532;
                            </div>
                          ))}
                        </div>
                        <span>Milhares ainda estudam assim...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Com MedVision */}
              <FadeIn direction="left" delay={0.3}>
                <div className="group relative h-full">
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

                  <div className="relative h-full bg-[#0F172A] border-0 rounded-2xl p-8 lg:p-10">
                    <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-emerald-400/20">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-400/10 border border-emerald-400/30">
                          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">Com MedVision</h3>
                          <p className="text-sm text-emerald-400/80">A vantagem competitiva</p>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        Recomendado
                      </span>
                    </div>

                    <div className="space-y-5">
                      {[
                        { text: "Tira duvidas de provas em 30s com citacoes que impressionam professores", emphasis: "30s" },
                        { text: "Chega no plantao com a confianca de quem tem um especialista no bolso", emphasis: "confianca" },
                        { text: "Acessa conhecimento equivalente a 5 anos de experiencia clinica", emphasis: "5 anos" },
                        { text: "Conquista os melhores estagios enquanto outros ainda estao estudando", emphasis: "melhores estagios" }
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-4 group/item">
                          <div className="mt-1 p-1 rounded-full bg-emerald-400/10 shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </div>
                          <p className="text-white text-sm lg:text-base leading-relaxed">
                            {item.text.split(item.emphasis).map((part, idx, arr) => (
                              <span key={idx}>
                                {part}
                                {idx < arr.length - 1 && (
                                  <span className="text-emerald-400 font-semibold">{item.emphasis}</span>
                                )}
                              </span>
                            ))}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-emerald-400/20">
                      <div className="flex items-center gap-3 text-sm text-emerald-400/80">
                        <div className="flex -space-x-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-emerald-400/20 border-2 border-[#0F172A] flex items-center justify-center text-[10px]">
                              &#128640;
                            </div>
                          ))}
                        </div>
                        <span>+2.000 estudantes ja transformaram seus estudos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* CTA - Direct to checkout */}
            <FadeIn direction="up" delay={0.4}>
              <div className="flex justify-center mt-12">
                <a href="#planos">
                  <Button
                    size="lg"
                    className="rounded-full px-10 py-6 text-lg font-semibold shadow-[0_10px_40px_rgba(16,185,129,0.25)] hover:shadow-[0_20px_60px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95 transition-all border-0 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
                    }}
                  >
                    Ver Planos e Assinar
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="como-funciona" className="w-full py-20 md:py-32 px-4 md:px-6 relative z-10 overflow-hidden">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-[#2399B4] rounded-full blur-[200px] opacity-[0.04] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500 rounded-full blur-[180px] opacity-[0.03] pointer-events-none" />

          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

              {/* Left Column */}
              <FadeIn direction="right" delay={0.1}>
                <div className="space-y-8 lg:sticky lg:top-32">
                  <div className="space-y-6">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1]">
                      A Era do Estudo<br />
                      <span className="text-slate-400">Solitario</span>{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Acabou.</span>
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                      Quem estuda sozinho e substituido pela proxima turma. Quem domina <span className="text-white font-semibold">IA aplicada a Odontologia</span> constroi carreiras que evoluem junto com a tecnologia.
                    </p>
                    <p className="text-base text-slate-300">
                      Criamos o <span className="font-bold text-emerald-400">ESTUDANTE INTELIGENTE</span>: o profissional que usa IA como aliada, responde com confianca e entrega resultados em minutos.
                    </p>
                  </div>

                  <div className="bg-[#0F172A]/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                        <Zap className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-white font-bold text-lg">O Novo Metodo</span>
                    </div>

                    <div className="space-y-4">
                      {[
                        { from: "Horas no Google", to: "Respostas em Segundos" },
                        { from: "Decorar formulas", to: "Dominar Contexto Clinico" },
                        { from: "Medo de errar", to: "Confianca com Respaldo" },
                        { from: "Resumos manuais", to: "Material de Estudo Instantaneo" }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="text-slate-500 line-through min-w-[140px]">De: {item.from}</span>
                          <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-emerald-400 font-medium">Para: {item.to}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Right Column - Feature Cards */}
              <div className="space-y-5">
                <FadeIn direction="left" delay={0.2}>
                  <div className="group relative bg-[#0F172A] border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30">
                            <Brain className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Agentes Especializados</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Autonomia e Especializacao</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                          ATIVO 24/7
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        7 agentes treinados especificamente para odontologia. Cada um domina uma area: pesquisa cientifica, diagnostico, prescricao, redacao academica e mais.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["Pesquisador", "Diagnostico", "Prescricao", "Resumos", "+3"].map((tag, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 text-xs font-medium border border-slate-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </FadeIn>

                <FadeIn direction="left" delay={0.3}>
                  <div className="group relative bg-[#0F172A] border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-500/30">
                            <Eye className="w-6 h-6 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Med Vision</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Analise por Imagem</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-medium">
                          BETA
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        Envie fotos de casos clinicos e radiografias. Nossa IA analisa e sugere hipoteses diagnosticas com base em padroes visuais.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["Raio-X", "Fotos Intraorais", "Tomografias", "Modelos"].map((tag, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 text-xs font-medium border border-slate-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </FadeIn>

                <FadeIn direction="left" delay={0.4}>
                  <div className="group relative bg-[#0F172A] border border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30">
                            <GraduationCap className="w-6 h-6 text-amber-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Acelerador Academico</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Provas e TCC</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                          POPULAR
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        Resumos automaticos, questoes de prova explicadas, redacao de TCC e artigos. Linguagem tecnica que impressiona bancas e professores.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["Resumos", "Questoes", "TCC", "Artigos", "Seminarios"].map((tag, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 text-xs font-medium border border-slate-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </FadeIn>

                <FadeIn direction="left" delay={0.5}>
                  <div className="group relative bg-[#0F172A] border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30">
                            <Shield className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Suporte na Clinica</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Decisoes Seguras</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        Prescricoes com dosagens corretas, planos de tratamento baseados em evidencias e respostas rapidas para emergencias.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["Prescricoes", "Emergencias", "Protocolos", "Evidencias"].map((tag, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 text-xs font-medium border border-slate-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>

        {/* Expert Section - Roniery Costa */}
        <section id="especialista" className="w-full py-20 md:py-32 px-4 md:px-6 relative z-10">
          <div className="container mx-auto max-w-6xl relative z-10">
            <SectionHeader
              label="Responsabilidade Tecnica"
              icon={Award}
              title="Conhecimento com Respaldo de Quem Entende da Area"
              description="Por tras de cada resposta da MedVision, esta a experiencia de um profissional que ja viveu suas duvidas e desafios"
              align="center"
            />

            <div className="grid md:grid-cols-2 gap-12 items-center mt-12 bg-[#16243F]/50 p-8 rounded-3xl border border-emerald-500/20 backdrop-blur-sm">
              <FadeIn direction="right" delay={0.1} className="space-y-6">
                <div className="relative flex justify-center">
                  <div className="relative w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-full overflow-hidden shadow-[0_20px_60px_rgba(16,185,129,0.3)] border-4 border-[#1A2847]/50 flex items-center justify-center p-1">
                    <div className="w-full h-full rounded-full overflow-hidden relative">
                      <Image
                        src="/Imagens /roniery.jpg"
                        alt="Roniery Costa - Responsavel Tecnico da MedVision"
                        width={320}
                        height={320}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-[#16243F] border border-emerald-500/30 p-3 rounded-2xl shadow-xl flex items-center gap-3">
                    <div className="bg-emerald-500/20 p-2 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">CRO</div>
                      <div className="font-bold text-white">4616/PB</div>
                    </div>
                  </div>
                </div>
              </FadeIn>

              <FadeIn direction="left" delay={0.2} className="space-y-6">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">Roniery Costa</h3>
                  <p className="text-emerald-400 font-medium text-lg">Responsavel Tecnico</p>
                </div>

                <div className="space-y-4">
                  <p className="text-lg font-medium text-slate-200 leading-relaxed relative">
                    <span className="text-6xl absolute -top-6 -left-4 text-emerald-500/20 font-serif">&quot;</span>
                    Cada resposta que voce recebe passa pela minha curadoria tecnica, garantindo que
                    esteja sempre alinhada com as melhores praticas da odontologia moderna.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Cirurgiao dentista</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Me. e Dr. em Odontologia</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>+ 3.5k alunos online</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Professor universitario</span>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Pricing Section - Direct to Cakto Checkout */}
        <section id="planos" className="w-full py-20 md:py-32 px-4 md:px-6 relative z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-[250px] opacity-[0.03] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500 rounded-full blur-[250px] opacity-[0.03] pointer-events-none" />

          <div className="container mx-auto max-w-6xl relative z-10">
            <FadeIn direction="up" delay={0.1}>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold text-sm">Planos e Precos</span>
                </span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1]">
                  Invista no Seu<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                    Futuro Profissional
                  </span>
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed">
                  Escolha o plano ideal e tenha acesso imediato apos o pagamento. Sua conta e criada automaticamente.
                </p>
              </div>
            </FadeIn>

            {/* Pricing Cards - Direct checkout links */}
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
              {/* Plano Basico Anual */}
              <FadeIn direction="right" delay={0.2}>
                <div className="group relative h-full">
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl opacity-100" />
                  <div className="relative h-full bg-[#0F172A] rounded-2xl p-8 flex flex-col">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                        Mais Popular
                      </span>
                    </div>

                    <div className="text-center mb-6 pt-4">
                      <h3 className="text-2xl font-bold text-white mb-2">Plano Basico Anual</h3>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-sm text-slate-500 line-through">R$ 597</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">35% OFF</span>
                      </div>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl md:text-5xl font-bold text-emerald-400">12x</span>
                        <span className="text-3xl md:text-4xl font-bold text-emerald-400">R$ 44,99</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-2">
                        ou <span className="font-semibold text-white">R$ 387</span> a vista
                      </p>
                      <p className="text-xs text-emerald-400 mt-1">Equivalente a R$ 32,25/mes</p>
                    </div>

                    <ul className="space-y-3 mb-8 flex-grow">
                      {[
                        "Consultor 24/7 no WhatsApp - sem limite",
                        "Respostas fundamentadas em literatura cientifica",
                        "Prescricoes com dosagens corretas",
                        "Ajuda em provas, estagios e casos clinicos",
                        "Live exclusiva toda quarta-feira"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <a href={BASIC_CHECKOUT_URL} className="block">
                      <Button
                        size="lg"
                        className="w-full rounded-full py-6 text-base font-semibold shadow-[0_10px_40px_rgba(16,185,129,0.3)] border-0 text-white"
                        style={{
                          background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
                        }}
                      >
                        Assinar Plano Basico
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </a>
                  </div>
                </div>
              </FadeIn>

              {/* Plano Pro Anual */}
              <FadeIn direction="left" delay={0.3}>
                <div className="group relative h-full">
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl opacity-100" />
                  <div className="relative h-full bg-[#0F172A] rounded-2xl p-8 flex flex-col">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full bg-purple-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                        Completo
                      </span>
                    </div>

                    <div className="text-center mb-6 pt-4">
                      <h3 className="text-2xl font-bold text-white mb-2">Plano Pro Anual</h3>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-sm text-slate-500 line-through">R$ 797</span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs font-bold">25% OFF</span>
                      </div>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl md:text-5xl font-bold text-purple-400">12x</span>
                        <span className="text-3xl md:text-4xl font-bold text-purple-400">R$ 69,41</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-2">
                        ou <span className="font-semibold text-white">R$ 597</span> a vista
                      </p>
                      <p className="text-xs text-purple-400 mt-1">Equivalente a R$ 49,75/mes</p>
                    </div>

                    <ul className="space-y-3 mb-8 flex-grow">
                      {[
                        "Tudo do Plano Basico",
                        "Med Vision: analise de radiografias e tomografias",
                        "Biblioteca premium de casos clinicos",
                        "Suporte prioritario",
                        "Ebook: Como Validar Diploma nos EUA",
                        "Certificado mensal de participacao"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <a href={PRO_CHECKOUT_URL} className="block">
                      <Button
                        size="lg"
                        className="w-full rounded-full py-6 text-base font-semibold shadow-[0_10px_40px_rgba(168,85,247,0.3)] border-0 text-white"
                        style={{
                          background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)'
                        }}
                      >
                        Assinar Plano Pro
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </a>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Trust Badges */}
            <FadeIn direction="up" delay={0.4}>
              <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Pagamento Seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span>Acesso imediato</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Garantia de 7 dias</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection />

        {/* CTA Footer - Direct to checkout */}
        <section className="w-full py-12 px-4 md:px-6 relative overflow-hidden z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent" />

          <div className="container mx-auto max-w-4xl relative z-10 text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Pronto para Transformar sua <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                Jornada na Odontologia?
              </span>
            </h2>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
              Junte-se a milhares de estudantes e profissionais que ja estao usando a IA para estudar melhor e atender com mais seguranca.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a href={BASIC_CHECKOUT_URL}>
                <Button
                  size="xl"
                  className="rounded-full px-12 py-6 text-xl font-bold shadow-[0_10px_40px_rgba(16,185,129,0.25)] hover:scale-105 transition-all border-0 text-white w-full sm:w-auto"
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
                  }}
                >
                  Assinar Agora
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </a>
            </div>
            <p className="text-sm text-slate-500">
              Sua conta e criada automaticamente apos o pagamento. Garantia de 7 dias.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
