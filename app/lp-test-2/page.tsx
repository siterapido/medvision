'use client'

import { useState, useEffect, useRef } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import dynamic from "next/dynamic"
import {
  Brain, MessageSquare, Clock, BookOpen, Shield, Zap,
  CheckCircle2, Star, ArrowRight, Award, TrendingUp,
  XCircle, Video, Sparkles, Microscope, Eye, GraduationCap, PenTool,
  Target, Users, HelpCircle, Check, MessageCircle
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { motion, useScroll, useTransform } from "framer-motion"
import { FadeIn, StaggerContainer, StaggerItem, HoverCard, ScaleIn } from "@/components/ui/animations"
import { AgentHeroVisual } from "@/components/landing/agent-hero-visual"
import { AnimatedAgentIcons } from "@/components/landing/animated-agent-icons"
import { ScrollProgress } from "@/components/landing/scroll-animations"
import { AgentDemoResearch } from "@/components/landing/agent-demo-research"
import { AgentDemoVision } from "@/components/landing/agent-demo-vision"
import { AgentDemoSummary } from "@/components/landing/agent-demo-summary"
import { AgentDemoPractice } from "@/components/landing/agent-demo-practice"
import { AgentDemoWrite } from "@/components/landing/agent-demo-write"
import { AgentDemoFlow } from "@/components/landing/agent-demo-flow"
import { AgentDemoGPT } from "@/components/landing/agent-demo-gpt"
import { LazyVideoWrapper } from "@/components/video/lazy-video-wrapper"
import { YouTubePlayer } from "@/components/video/youtube-player"

const FAQSection = dynamic(() => import("@/components/landing/faq-section").then(mod => ({ default: mod.FAQSection })), {
  ssr: false,
  loading: () => <div className="w-full py-16 md:py-32 px-4 md:px-6 bg-faq-section"><div className="mx-auto max-w-3xl h-96 animate-pulse bg-slate-800/20 rounded-xl" /></div>
})

const SectionHeader = dynamic(() => import("@/components/ui/section-header").then(mod => ({ default: mod.SectionHeader })), {
  loading: () => <div className="h-20 bg-transparent animate-pulse" />
})

const WorkflowCard = ({ step, index, total }: { step: any, index: number, total: number }) => {
  const container = useRef(null);

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start end', 'start start']
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <div
      ref={container}
      className="h-[80vh] w-full flex items-start justify-center sticky top-[15vh]" // top ajustado para centralizar melhor
      style={{ zIndex: index + 1 }}
    >
      <motion.div
        style={{
          scale: index === total - 1 ? 1 : scale, // O último não diminui
          opacity: index === total - 1 ? 1 : opacity, // O último não some
          top: 0
        }}
        className="relative w-full max-w-[800px]"
      >
        <Card className="relative bg-[#0F172A] border-[#22d3ee]/20 backdrop-blur-xl transition-colors overflow-hidden shadow-2xl h-[50vh] flex flex-col justify-center">
          {/* Glow elements */}
          <div
            className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-20 transition-opacity"
            style={{ backgroundColor: step.color }}
          />

          <CardContent className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left h-full justify-center">
            <div
              className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text opacity-20 select-none leading-none shrink-0"
              style={{ backgroundImage: `linear-gradient(to bottom, ${step.color}, transparent)` }}
            >
              {step.number}
            </div>
            <div className="space-y-4 pt-2 flex flex-col h-full justify-center">
              <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">{step.title}</h3>
              <p className="text-slate-300 text-lg leading-relaxed max-w-xl">
                {step.desc}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default function LandingPage() {
  const showTestimonials = false
  const [showStickyCTA, setShowStickyCTA] = useState(false)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const heroSection = document.getElementById('hero-section')
    if (!heroSection) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky CTA when hero is less than 20% visible
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

      {/* Sticky CTA Mobile */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{
          y: showStickyCTA ? 0 : 100,
          opacity: showStickyCTA ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 p-4 bg-[#0F192F]/95 backdrop-blur-xl border-t border-[#22d3ee]/20 z-50 md:hidden safe-area-inset-bottom"
      >
        <Button
          size="lg"
          className="w-full rounded-full py-4 text-base font-semibold shadow-[0_-5px_30px_rgba(34,211,238,0.3)] border-0 text-white"
          style={{
            background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)'
          }}
          asChild
        >
          <Link href="/register">
            Testar Grátis Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
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
            }}
          />

          {/* Nebula Layer 2: Subtle purple accent - center right */}
          <div
            className="absolute w-[600px] h-[600px] top-[30%] -right-[150px] opacity-[0.03]"
            style={{
              background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
              filter: 'blur(120px)',
            }}
          />

          {/* Nebula Layer 3: Deep cyan - bottom */}
          <div
            className="absolute w-[1000px] h-[500px] -bottom-[100px] left-[20%] opacity-[0.035]"
            style={{
              background: 'radial-gradient(ellipse, #0891b2 0%, transparent 70%)',
              filter: 'blur(100px)',
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

        {/* Hero Section */}
        <section id="hero-section" className="relative w-full min-h-[85vh] md:min-h-[90vh] flex items-center justify-center py-10 md:py-32 px-4 md:px-6 overflow-hidden z-10">
          <div className="container mx-auto">
            {/* Logo Mobile */}
            <div className="flex justify-start md:hidden mb-8">
              <Logo variant="white" width={140} height={30} />
            </div>

            <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center max-w-7xl mx-auto">

              {/* Text Content */}
              <div className="space-y-4 md:space-y-8 text-center lg:text-left order-1 relative z-10">
                <div className="flex justify-center lg:justify-start mb-6 hidden md:flex">
                  <Logo variant="white" width={160} height={35} />
                </div>

                <FadeIn delay={0.1} direction="up">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-[#22d3ee] text-sm font-semibold mb-2 md:mb-4 backdrop-blur-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Inteligência Artificial Especializada</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
                    Domine a Odontologia <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22d3ee] to-[#67e8f9]">
                      Sem o Medo de Errar
                    </span>
                  </h1>
                </FadeIn>

                <FadeIn delay={0.2} direction="up">
                  <p className="text-base sm:text-xl text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                    <span className="hidden sm:inline">O parceiro de estudos que todo estudante sonha. </span>Tire dúvidas de provas, ganhe segurança na clínica e escreva trabalhos acadêmicos em segundos.
                    <span className="block mt-2 font-medium text-slate-100">Seu professor particular disponível 24/7.</span>
                  </p>
                </FadeIn>

                <FadeIn delay={0.3} direction="up">
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                    <Button
                      size="xl"
                      className="rounded-full px-10 py-4 text-lg font-semibold shadow-[0_10px_40px_rgba(8,145,178,0.25)] hover:scale-105 active:scale-95 transition-all border-0 text-white w-full sm:w-auto"
                      style={{
                        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)'
                      }}
                      asChild
                    >
                      <Link href="/register">
                        Testar Grátis Agora
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button
                      size="xl"
                      variant="outline"
                      className="rounded-full px-10 py-4 text-lg font-medium border-2 border-[rgba(8,145,178,0.5)] text-white hover:bg-[rgba(8,145,178,0.1)] hover:border-[#0891b2] transition-colors w-full sm:w-auto"
                      asChild
                    >
                      <Link href="#como-funciona">
                        Ver como funciona
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-400">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0F192F] bg-slate-200 bg-cover bg-center" style={{ backgroundImage: `url(https://api.dicebear.com/9.x/avataaars/svg?seed=${i})` }} />
                      ))}
                      <div className="w-8 h-8 rounded-full border-2 border-[#0F192F] bg-slate-800 flex items-center justify-center text-xs font-bold text-white">+2k</div>
                    </div>
                    <span>Dentistas já usam o Odonto GPT</span>
                  </div>
                </FadeIn>
              </div>

              {/* Hero Visual */}
              <div className="order-2 lg:order-2 relative z-0 flex justify-center lg:justify-end mt-12 lg:mt-0">
                <FadeIn delay={0.2} className="w-full max-w-[280px] sm:max-w-md lg:max-w-2xl">
                  {/* Providing a dark mode glow context for the visual if needed, though the component might handle it */}
                  <AgentHeroVisual />
                </FadeIn>
              </div>

            </div>
          </div>
        </section>

        {/* Trusted By / Logos Section could go here */}

        {/* Comparison Section */}
        <section className="w-full py-12 md:py-20 px-4 md:px-6 relative z-10">

          <div className="container mx-auto max-w-6xl relative z-10">
            <SectionHeader
              label="Realidade Acadêmica"
              icon={Brain}
              title="A Diferença Entre Estudar Muito e Estudar Bem"
              description="A Odonto GPT não substitui seu estudo, ela o potencializa. Veja a diferença na prática."
              align="center"
              className="mb-8 md:mb-16"
            />

            <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
              {/* Sem Odonto GPT */}
              <FadeIn direction="right" delay={0.1} className="relative group">
                <Card className="transition-all duration-300 border-2 bg-transparent hover:scale-95 group-hover:shadow-lg group-hover:shadow-destructive/20 group-hover:animate-wobble border-[rgba(239,68,68,0.2)] hover:border-destructive/50 overflow-hidden">
                  {/* Glow vermelho (hover) */}
                  <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-85 transition-opacity duration-300 bg-[radial-gradient(ellipse,_rgba(239,68,68,0.35)_0%,_transparent_90%)] blur-[140px]" />

                  <CardContent className="p-8 md:p-10 pt-10 md:pt-12 space-y-6 text-base relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <span className="inline-flex items-center justify-center rounded-md p-1.5 bg-destructive/10 ring-1 ring-destructive/40">
                        <XCircle className="h-8 w-8 text-destructive" />
                      </span>
                      <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-destructive">Estudante Sem Odonto GPT</h3>
                    </div>

                    <div className="space-y-4 text-sm md:text-base text-slate-300">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                        <span>Perde oportunidades de estágio por insegurança nas respostas</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                        <span>Gasta 3h pesquisando o que poderia resolver em 30 segundos</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                        <span>Fica com medo de errar prescrições e passar vergonha no plantão</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                        <span>Assiste colegas com &quot;contatos&quot; ganharem as melhores vagas</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              {/* Com Odonto GPT */}
              <FadeIn direction="left" delay={0.2} className="relative group">
                {/* Intense edge glow */}
                <div aria-hidden className="absolute -inset-6 -z-10 rounded-2xl bg-gradient-to-br from-[#2399B4]/40 via-[#2399B4]/20 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

                <Card className="transition-all duration-300 border-[3px] border-[#2399B4] hover:scale-105 hover:shadow-[0_10px_40px_rgba(35,153,180,0.2)] bg-[#16243F] overflow-hidden relative">
                  {/* Glow intenso #2399B4 */}
                  <div className="absolute inset-0 -z-10 opacity-90 group-hover:opacity-100 transition-all duration-300 bg-[radial-gradient(ellipse,_rgba(35,153,180,0.6)_0%,_rgba(35,153,180,0.2)_60%,_transparent_100%)] blur-[140px]" />

                  <CardContent className="p-8 md:p-10 pt-10 md:pt-12 space-y-6 text-base relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <span className="inline-flex items-center justify-center rounded-md p-1.5 bg-[#2399B4]/10 ring-1 ring-[#2399B4]/40">
                        <CheckCircle2 className="h-8 w-8 text-[#22d3ee]" />
                      </span>
                      <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-[#22d3ee]">Estudante Com Odonto GPT</h3>
                    </div>

                    <div className="space-y-4 text-sm md:text-base text-white">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-6 w-6 text-[#22d3ee] shrink-0 mt-0.5" />
                        <span>Tira dúvidas de provas em 30s com citações que impressionam professores</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-6 w-6 text-[#22d3ee] shrink-0 mt-0.5" />
                        <span>Chega no plantão com a confiança de quem tem um especialista no bolso</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-6 w-6 text-[#22d3ee] shrink-0 mt-0.5" />
                        <span>Acessa conhecimento equivalente a 5 anos de experiência clínica</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-6 w-6 text-[#22d3ee] shrink-0 mt-0.5" />
                        <span>Conquista os melhores estágios enquanto outros ainda estão estudando</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>

            <div className="flex justify-center mt-10">
              <Link href="/register">
                <Button
                  size="lg"
                  variant="cta"
                  className="shadow-[0_10px_40px_rgba(8,145,178,0.25)] hover:scale-105 active:scale-95 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)'
                  }}
                >
                  Começar Teste Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Video Testimonials Section (desativada temporariamente) */}
        {showTestimonials && (
          <section className="w-full py-16 md:py-32 px-4 md:px-6 bg-testimonials-section">
            <div className="container mx-auto max-w-6xl space-y-12 md:space-y-16">
              <SectionHeader
                label="Histórias Reais de Sucesso"
                icon={Video}
                title="Resultados Reais: Segurança, Velocidade e Acertos"
                description="Veja como a Odonto GPT está transformando a jornada acadêmica de estudantes que já estão colhendo os frutos"
                align="center"
              />

              <div className="grid md:grid-cols-3 gap-8 items-start">
                {/* Video 1 */}
                <Card className="h-full text-center bg-transparent border-0 shadow-none">
                  <CardContent className="p-0 space-y-3">
                    <div className="relative mx-auto w-full max-w-[300px]">
                      <LazyVideoWrapper
                        threshold={0.2}
                        rootMargin="100px"
                        placeholder={
                          <div className="aspect-[9/16] bg-gray-900 rounded-3xl flex items-center justify-center border-2 border-[#2399B4]">
                            <div className="text-white/40 text-sm">Carregando...</div>
                          </div>
                        }
                      >
                        <YouTubePlayer
                          videoId="loPD53clzR4"
                          title="Depoimento Dr. Carlos Silva - Odonto GPT"
                          aspect="portrait"
                          className="rounded-3xl border-2 border-[#2399B4] hover:border-[#2399B4] shadow-none"
                          controls={0}
                        />
                      </LazyVideoWrapper>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Dr. Carlos Silva</h3>
                      <p className="text-sm text-muted-foreground">Cirurgião-Dentista</p>
                      <div className="flex justify-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Video 2 */}
                <Card className="h-full text-center bg-transparent border-0 shadow-none">
                  <CardContent className="p-0 space-y-3">
                    <div className="relative mx-auto w-full max-w-[300px]">
                      <LazyVideoWrapper
                        threshold={0.2}
                        rootMargin="100px"
                        placeholder={
                          <div className="aspect-[9/16] bg-gray-900 rounded-3xl flex items-center justify-center border-2 border-[#2399B4]">
                            <div className="text-white/40 text-sm">Carregando...</div>
                          </div>
                        }
                      >
                        <YouTubePlayer
                          videoId="loPD53clzR4"
                          title="Depoimento Dra. Ana Oliveira - Odonto GPT"
                          aspect="portrait"
                          className="rounded-3xl border-2 border-[#2399B4] hover:border-[#2399B4] shadow-none"
                          controls={0}
                        />
                      </LazyVideoWrapper>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Dra. Ana Oliveira</h3>
                      <p className="text-sm text-muted-foreground">8º Período</p>
                      <div className="flex justify-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Video 3 */}
                <Card className="h-full text-center bg-transparent border-0 shadow-none">
                  <CardContent className="p-0 space-y-3">
                    <div className="relative mx-auto w-full max-w-[300px]">
                      <LazyVideoWrapper
                        threshold={0.2}
                        rootMargin="100px"
                        placeholder={
                          <div className="aspect-[9/16] bg-gray-900 rounded-3xl flex items-center justify-center border-2 border-[#2399B4]">
                            <div className="text-white/40 text-sm">Carregando...</div>
                          </div>
                        }
                      >
                        <YouTubePlayer
                          videoId="loPD53clzR4"
                          title="Depoimento Dr. Rodrigo Santos - Odonto GPT"
                          aspect="portrait"
                          className="rounded-3xl border-2 border-[#2399B4] hover:border-[#2399B4] shadow-none"
                          controls={0}
                        />
                      </LazyVideoWrapper>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Dr. Rodrigo Santos</h3>
                      <p className="text-sm text-muted-foreground">Residente</p>
                      <div className="flex justify-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Removed 'Ver mais depoimentos' button per request */}
            </div>
          </section>
        )}

        {/* Agents Team Section */}
        <section className="w-full py-12 md:py-20 px-4 md:px-6 relative z-20">
          <div className="mx-auto max-w-6xl space-y-12">
            <SectionHeader
              label="Sua Equipe Completa"
              icon={Brain}
              title="Especialistas Disponíveis 24/7"
              description="Cada agente da Odonto GPT foi treinado para uma função específica, garantindo precisão e profundidade em cada resposta."
              align="center"
            />

            {/* Animated Agent Icons */}
            <div className="mb-16">
              <AnimatedAgentIcons />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                {
                  icon: Brain,
                  title: "Planejador Clínico",
                  desc: "Estrutura planos de tratamento completos baseados nas melhores evidências.",
                  color: "text-purple-400",
                  bg: "bg-purple-500/10"
                },
                {
                  icon: BookOpen,
                  title: "Pesquisador",
                  desc: "Busca na literatura científica as respostas mais atuais para suas dúvidas.",
                  color: "text-blue-400",
                  bg: "bg-blue-500/10"
                },
                {
                  icon: Shield,
                  title: "Diagnóstico",
                  desc: "Ajuda a cruzar sinais e sintomas para hipóteses diagnósticas precisas.",
                  color: "text-pink-400",
                  bg: "bg-pink-500/10"
                },
                {
                  icon: Zap,
                  title: "Redator",
                  desc: "Escreve textos para pacientes, laudos e documentos com linguagem assertiva.",
                  color: "text-amber-400",
                  bg: "bg-amber-500/10"
                }
              ].map((agent, i) => (
                <HoverCard key={i} className="h-full">
                  <Card className="border-0 shadow-lg shadow-slate-900/50 h-full relative overflow-hidden group bg-[#16243F] border-[rgba(8,145,178,0.2)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#16243F] to-[#0F192F] z-0" />
                    <CardContent className="pt-8 space-y-4 relative z-10">
                      <div className={`h-12 w-12 rounded-xl ${agent.bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                        <agent.icon className={`h-6 w-6 ${agent.color}`} />
                      </div>
                      <h3 className="text-xl font-bold text-white">{agent.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {agent.desc}
                      </p>
                    </CardContent>
                    <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${agent.color.split('-')[1]}-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </Card>
                </HoverCard>
              ))}
            </div>
          </div>
        </section>

        {/* Agent Demos Section - Interactive Animated Demonstrations */}
        <section className="w-full relative z-10">
          <div className="py-16 text-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              className="mx-auto max-w-3xl"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(6,182,212,0.1)] border border-[rgba(6,182,212,0.3)] mb-6">
                <Sparkles className="w-4 h-4 text-[#22d3ee]" />
                <span className="text-[#22d3ee] font-semibold text-sm">Veja em Ação</span>
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Seus Especialistas<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22d3ee] via-[#3b82f6] to-[#a855f7]">
                  Trabalhando por Você
                </span>
              </h2>
              <p className="text-lg text-slate-400 mb-8">
                Role para baixo e veja cada agente demonstrando suas habilidades em tempo real
              </p>
            </motion.div>
          </div>

          {/* Demo sections */}
          <AgentDemoFlow />
          <AgentDemoGPT />
          <AgentDemoResearch />
          <AgentDemoVision />
          <AgentDemoSummary />
          <AgentDemoPractice />
          <AgentDemoWrite />
        </section>

        {/* How it Works Section */}
        <section id="como-funciona" className="w-full py-12 md:py-20 px-4 md:px-6 relative z-10">
          {/* Subtle decorative glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2399B4] rounded-full blur-[180px] opacity-[0.06] pointer-events-none" />

          <div className="container mx-auto max-w-6xl relative z-10">
            <SectionHeader
              label="Simples e Poderoso"
              icon={Zap}
              title="Fluxo de Trabalho Otimizado"
              description="Do planejamento à execução, a Odonto GPT se integra perfeitamente à sua rotina clínica."
              align="center"
              className="mb-16"
            />

            <div className="flex flex-col items-center relative max-w-4xl mx-auto min-h-[300vh]">
              {[
                { number: "01", title: "Dúvida na Clínica ou nos Estudos?", desc: "Seja um paciente complexo na clínica da faculdade ou uma questão difícil de prova. Digite ou mande áudio.", color: "#0891b2" },
                { number: "02", title: "Sua 'Cola' Oficial", desc: "Nossos agentes buscam na literatura validada e te entregam a resposta pronta, com referências para você citar.", color: "#06b6d4" },
                { number: "03", title: "Nota 10 e Elogio do Professor", desc: "Tenha diagnósticos precisos e trabalhos acadêmicos escritos com linguagem técnica impecável.", color: "#22d3ee" }
              ].map((step, i) => (
                <WorkflowCard key={i} step={step} index={i} total={3} />
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="w-full py-12 md:py-20 px-4 md:px-6 relative z-10">

          <div className="container mx-auto max-w-6xl relative z-10">
            <SectionHeader
              label="Por que Odonto GPT?"
              icon={Target}
              title="Vantagens Competitivas"
              description="Uma ferramenta completa para elevar o nível do seu atendimento."
              align="center"
              className="mb-16"
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Clock, title: "Adeus Noites em Claro", desc: "Escreva seus trabalhos e TCC 10x mais rápido com ajuda dos agentes." },
                { icon: Shield, title: "Segurança no Plantão", desc: "Nunca mais trave na frente do paciente ou do professor supervisor." },
                { icon: Award, title: "Destaque da Turma", desc: "Suas respostas em sala e discussões de caso em outro nível." },
                { icon: BookOpen, title: "Biblioteca Infinita", desc: "Não gaste com livros caros. Toda a literatura que você precisa está aqui." },
                { icon: Zap, title: "Estudos para Provas", desc: "Crie resumos e questionários de estudo automaticamente." },
                { icon: Users, title: "Networking", desc: "Conquiste os melhores estágios demonstrando conhecimento avançado." },
              ].map((benefit, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <Card className="bg-[#16243F] border-[rgba(8,145,178,0.2)] hover:border-[#0891b2] transition-colors relative overflow-hidden group hover:shadow-lg hover:shadow-[#0891b2]/10 h-full">
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0891b2]/0 via-[#0891b2]/5 to-[#0891b2]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                    <CardContent className="p-6 flex flex-col items-start gap-4 relative z-10">
                      <div className="p-3 rounded-lg bg-[#0891b2]/10">
                        <benefit.icon className="w-6 h-6 text-[#22d3ee]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                        <p className="text-slate-400 text-sm">{benefit.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Expert Section - Roniery Costa */}
        <section id="especialista" className="w-full py-12 md:py-20 px-4 md:px-6 relative z-10">

          <div className="container mx-auto max-w-6xl relative z-10">
            <SectionHeader
              label="Responsabilidade Técnica"
              icon={Award}
              title="Conhecimento com Respaldo de Quem Entende da Área"
              description="Por trás de cada resposta da Odonto GPT, está a experiência de um profissional que já viveu suas dúvidas e desafios"
              align="center"
            />

            <div className="grid md:grid-cols-2 gap-12 items-center mt-12 bg-[#16243F]/50 p-8 rounded-3xl border border-[#2399B4]/20 backdrop-blur-sm">
              <FadeIn direction="right" delay={0.1} className="space-y-6">
                <div className="relative flex justify-center">
                  <div className="relative w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-[#0891b2]/30 to-[#06b6d4]/30 rounded-full overflow-hidden shadow-[0_20px_60px_rgba(35,153,180,0.3)] border-4 border-[#1A2847]/50 flex items-center justify-center p-1">
                    <div className="w-full h-full rounded-full overflow-hidden relative">
                      <Image
                        src="/Imagens /roniery.jpg"
                        alt="Roniery Costa - Responsável Técnico da Odonto GPT"
                        width={320}
                        height={320}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  {/* Decorative element */}
                  <div className="absolute -bottom-4 -right-4 bg-[#16243F] border border-[#2399B4]/30 p-3 rounded-2xl shadow-xl flex items-center gap-3">
                    <div className="bg-[#2399B4]/20 p-2 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-[#22d3ee]" />
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
                  <p className="text-[#22d3ee] font-medium text-lg">Responsável Técnico</p>
                </div>

                <div className="space-y-4">
                  <p className="text-lg font-medium text-slate-200 leading-relaxed relative">
                    <span className="text-6xl absolute -top-6 -left-4 text-[#2399B4]/20 font-serif">"</span>
                    Criei a Odonto GPT para ser o consultor que eu gostaria de ter tido durante minha formação -
                    acessível 24/7, sem julgamentos, e com respostas fundamentadas na literatura que realmente importa.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-[#22d3ee]" />
                    <span>Cirurgião dentista</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-[#22d3ee]" />
                    <span>Me. e Dr. em Odontologia</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-[#22d3ee]" />
                    <span>+ 3.5k alunos online</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-[#22d3ee]" />
                    <span>Professor universitário</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#1A2847]">
                  <p className="text-sm text-slate-400 italic">
                    "Cada resposta que você recebe passa pela minha curadoria técnica, garantindo que
                    esteja sempre alinhada com as melhores práticas da odontologia moderna."
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="planos" className="w-full py-12 md:py-20 px-4 md:px-6 relative z-10">

          <div className="mx-auto max-w-6xl space-y-10 md:space-y-12">
            <SectionHeader
              label="Sua Vantagem Competitiva"
              icon={TrendingUp}
              title="Enquanto Seus Colegas Ainda Estão no Google, Você Já Tem a Resposta"
              description="Acesso ilimitado ao consultor de odontologia 24/7 que vai te fazer economizar horas de estudo e te poupar de constrangimentos na clínica"
              align="center"
            />

            {/* Planos Anuais - Centralized */}
            <div className="flex flex-col lg:flex-row justify-center gap-6 md:gap-8 max-w-5xl mx-auto">

              {/* Plano Anual - Mais Econômico */}
              <ScaleIn delay={0.2} className="h-full">
                <Card className="relative overflow-hidden p-8 md:p-10 transition-all border-[3px] shadow-2xl md:scale-[1.04] w-full min-h-[480px] flex flex-col h-full bg-[#16243F] border-[#2399B4] hover:shadow-[0_20px_60px_rgba(35,153,180,0.3)]">
                  {/* Spotlight Bg */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(8,145,178,0.15)_0%,_transparent_70%)]" />

                  {/* Fita de oferta especial */}
                  <div className="pointer-events-none absolute -right-14 top-6 rotate-45 z-10">
                    <span className="bg-[#06b6d4] text-white px-16 py-1 text-xs font-semibold shadow-md">Oferta Especial</span>
                  </div>
                  <div className="text-center mb-5 relative z-10">
                    <div className="flex justify-center mb-2">
                      <span className="bg-[#0891b2] text-white px-3 py-1 rounded-full text-xs font-semibold">ESCOLHA INTELIGENTE</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1 text-white">Plano Anual Básico</h3>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs md:text-sm text-slate-400 line-through">Valor original: R$ 597/ano</span>
                      <span className="text-xs md:text-sm font-semibold tracking-wide text-[#22d3ee]">35% OFF - Preço de Lançamento</span>
                    </div>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl md:text-4xl font-extrabold text-[#22d3ee]">R$ 387</span>
                      <span className="text-slate-400">/ano</span>
                    </div>
                    <div className="mt-2 text-xs md:text-sm font-medium text-[#22d3ee]">Economize R$ 210 (R$ 32,25/mês)</div>
                  </div>

                  <ul className="space-y-3 mb-6 flex-grow relative z-10">
                    {[
                      "Consultor 24/7 no WhatsApp",
                      "Respostas fundamentadas em literatura",
                      "Prescrições com dosagens corretas",
                      "Ajuda em provas e estágios",
                      "Live exclusiva toda quarta-feira",
                      <>🎁 <strong>Ebook exclusivo:</strong> Validação nos EUA</>,
                      <>🎁 <strong>Certificado mensal</strong> de participação</>,
                      <>🎁 <strong>Acesso prioritário</strong> a novidades</>
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-white">
                        <Check className="w-5 h-5 text-[#22d3ee] flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto space-y-4 relative z-10">
                    <p className="text-center text-sm font-medium text-[#22d3ee]">
                      Inclui teste grátis de 7 dias
                    </p>
                    <Link href="/register" className="block">
                      <Button className="w-full shadow-lg border-0" size="lg" style={{ background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)' }}>
                        Começar Teste Grátis
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </ScaleIn>

              {/* Plano Anual Pro - Odonto Vision */}
              <ScaleIn delay={0.3} className="h-full">
                <Card className="relative overflow-hidden p-8 md:p-10 transition-all border-2 shadow-2xl md:scale-[1.04] w-full min-h-[480px] flex flex-col h-full bg-[#16243F] border-purple-500 hover:shadow-[0_20px_60px_rgba(168,85,247,0.2)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(168,85,247,0.15)_0%,_transparent_70%)]" />

                  {/* Fita de oferta especial */}
                  <div className="pointer-events-none absolute -right-14 top-6 rotate-45 z-10">
                    <span className="bg-purple-600 text-white px-16 py-1 text-xs font-semibold shadow-md">PLANO PRO</span>
                  </div>
                  <div className="text-center mb-5 relative z-10">
                    <div className="flex justify-center mb-2">
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">MELHOR CUSTO-BENEFÍCIO</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1 text-white">Plano Anual Pro</h3>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs md:text-sm text-slate-400 line-through">Valor original: R$ 797/ano</span>
                      <span className="text-xs md:text-sm font-semibold tracking-wide text-purple-400">25% OFF - Preço de Lançamento</span>
                    </div>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl md:text-4xl font-extrabold text-purple-400">R$ 597</span>
                      <span className="text-slate-400">/ano</span>
                    </div>
                    <div className="mt-2 text-xs md:text-sm font-medium text-purple-400">Economize R$ 200 (R$ 49,75/mês)</div>
                    <div className="mt-3 p-2 bg-purple-900/30 rounded-lg border border-purple-500/30">
                      <p className="text-xs font-semibold text-purple-300">+ Curso de Farmacologia: R$ 367</p>
                      <p className="text-xs text-purple-400 mt-1">Valor total: R$ 964 (economize R$ 567)</p>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6 flex-grow relative z-10">
                    {[
                      "Tudo do Plano Básico",
                      <>🎓 <strong>Curso Completo de Farmacologia</strong></>
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-white">
                        <Check className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                    <li className="col-span-full mt-4">
                      <div className="p-4 bg-[#0F192F] rounded-xl border border-cyan-500/30 shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-50" />
                        <div className="flex items-center gap-3 mb-3 relative z-10">
                          <div className="p-2 rounded-lg bg-cyan-900/50 border border-cyan-500/30">
                            <Eye className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Novo</div>
                            <div className="font-bold text-sm text-white">Odonto Vision (Beta)</div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed relative z-10">
                          Envie fotos de casos clínicos e raio-x para análise instantânea de nossa IA.
                        </p>
                      </div>
                    </li>
                  </ul>

                  <div className="mt-auto space-y-4">
                    <p className="text-center text-sm font-medium text-purple-600">
                      Inclui teste grátis de 7 dias
                    </p>
                    <Link href="/register" className="block">
                      <Button className="w-full shadow-lg bg-purple-600 hover:bg-purple-700 text-white" size="lg">
                        Começar Teste Grátis
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </ScaleIn>
            </div>

            {/* Trust indicators */}
            <div className="mt-16 text-center">
              <p className="text-sm text-muted-foreground mb-4">Pagamento seguro via kiwify</p>
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Pagamento Seguro
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  7 dias grátis
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Cancele quando quiser
                </span>
              </div>
            </div>
          </div>
        </section >

        {/* FAQ Section */}
        <section className="w-full py-12 md:py-20 px-4 md:px-6 relative z-10">

          <div className="container mx-auto max-w-4xl relative z-10">
            <SectionHeader
              label="Dúvidas Comuns"
              icon={HelpCircle}
              title="Perguntas Frequentes"
              description="Tudo que você precisa saber sobre a Odonto GPT"
              align="center"
              className="mb-12"
            />

            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  question: "A IA substitui meu estudo?",
                  answer: "Não. A Odonto GPT é uma ferramenta de produtividade e suporte à decisão. Ela ajuda você a encontrar informações confiáveis rapidamente, mas o julgamento clínico final é sempre seu."
                },
                {
                  question: "As respostas têm referência bibliográfica?",
                  answer: "Sim! Diferente do ChatGPT comum, nossos agentes são instruídos a citar a fonte das informações sempre que possível, baseando-se em artigos científicos, guidelines e livros de referência da odontologia."
                },
                {
                  question: "Funciona no celular?",
                  answer: "Perfeitamente. Você pode usar tanto nossa plataforma web quanto a integração via WhatsApp, que é ideal para consultas rápidas durante o atendimento clínico ou aulas."
                },
                {
                  question: "Posso cancelar quando quiser?",
                  answer: "Sim, sem multas ou fidelidade. Você tem total liberdade e ainda conta com 7 dias de garantia incondicional no primeiro pagamento."
                },
                {
                  question: "Serve para todas as especialidades?",
                  answer: "Sim. A base de conhecimento abrange desde clínica geral até especialidades como Endodontia, Ortodontia, Periodontia, Cirurgia e Harmonização Orofacial."
                }
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-0 rounded-lg bg-[#16243F] px-4">
                  <AccordionTrigger className="text-left font-medium text-white hover:text-[#22d3ee] hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-400 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-12 md:py-16 px-4 md:px-6 bg-[#060A14]/90 backdrop-blur-sm border-t border-white/5 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-2 md:col-span-1 space-y-4">
                <Logo variant="white" width={140} height={35} />
                <p className="text-slate-400 text-sm leading-relaxed">
                  Sua equipe de especialistas em odontologia, disponível 24/7 para impulsionar sua carreira e seus estudos.
                </p>
                <div className="flex gap-4">
                  {/* Social placeholder */}
                  <div className="w-8 h-8 rounded-full bg-[#16243F] flex items-center justify-center text-slate-400 hover:bg-[#0891b2] hover:text-white transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#16243F] flex items-center justify-center text-slate-400 hover:bg-[#0891b2] hover:text-white transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465 1.067-.047 1.407-.06 3.808-.06zm0 1.838c-2.58 0-2.891.01-3.883.056-.997.045-1.532.228-1.888.366-.47.183-.809.43-1.109.731-.295.295-.538.629-.719 1.108-.138.356-.321.891-.367 1.889-.045.996-.056 1.307-.056 3.891 0 2.58.011 2.895.056 3.891.045.998.228 1.533.367 1.889.183.479.424.813.719 1.108.295.295.629.538 1.109.719.356.138.891.322 1.888.368.992.045 1.303.056 3.883.056 2.58 0 2.895-.011 3.883-.056.996-.045 1.533-.228 1.889-.368.479-.183.813-.424 1.108-.719.295-.295.538-.629.719-1.108.138-.356.322-.891.368-1.889.045-0.996.056-1.307.056-3.891 0-2.58-.011-2.891-.056-3.891-.045-.997-.228-1.532-.368-1.889-.183-.47-.43-.809-.731-1.109-.295-.295-.629-.538-1.108-.719-.356-.138-.891-.321-1.889-.366-0.992-.046-1.307-.057-3.883-.057zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 1.838a4.324 4.324 0 110 8.648 4.324 4.324 0 010-8.648zm0 2.003a2.32 2.32 0 100 4.64 2.32 2.32 0 000-4.64z" clipRule="evenodd" /></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-white">Produto</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="#como-funciona" className="hover:text-[#22d3ee] transition-colors">Como Funciona</Link></li>
                  <li><Link href="#planos" className="hover:text-[#22d3ee] transition-colors">Planos</Link></li>
                  <li><Link href="#especialista" className="hover:text-[#22d3ee] transition-colors">Especialista</Link></li>
                  <li><Link href="/register" className="hover:text-[#22d3ee] transition-colors">Teste Grátis</Link></li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-white">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/termos" className="hover:text-[#22d3ee] transition-colors">Termos de Uso</Link></li>
                  <li><Link href="/privacidade" className="hover:text-[#22d3ee] transition-colors">Política de Privacidade</Link></li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-white">Contato</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Suporte 24/7
                  </li>
                  <li>contato@odontosuite.com.br</li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-[#16243F] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
              <p>&copy; {new Date().getFullYear()} Odonto GPT. Todos os direitos reservados.</p>
              <div className="flex gap-4">
                <span>Feito com ❤️ para dentistas</span>
              </div>
            </div>
          </div>
        </footer>

      </div >
    </main >
  )
}
