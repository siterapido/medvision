'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import dynamic from "next/dynamic"
import {
  Brain, MessageSquare, Clock, BookOpen, Shield, Zap,
  CheckCircle2, Star, ArrowRight, Award, TrendingUp,
  XCircle, Video, Sparkles, Microscope, Eye, GraduationCap, PenTool
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { motion } from "framer-motion"
import { FadeIn, StaggerContainer, StaggerItem, HoverCard, ScaleIn } from "@/components/ui/animations"
import { AgentHeroVisual } from "@/components/landing/agent-hero-visual"
import { AnimatedAgentIcons } from "@/components/landing/animated-agent-icons"
import { ScrollProgress } from "@/components/landing/scroll-animations"
import { AgentDemoResearch } from "@/components/landing/agent-demo-research"
import { AgentDemoVision } from "@/components/landing/agent-demo-vision"
import { AgentDemoSummary } from "@/components/landing/agent-demo-summary"
import { AgentDemoPractice } from "@/components/landing/agent-demo-practice"
import { AgentDemoWrite } from "@/components/landing/agent-demo-write"

const FAQSection = dynamic(() => import("@/components/landing/faq-section").then(mod => ({ default: mod.FAQSection })), {
  ssr: false,
  loading: () => <div className="w-full py-16 md:py-32 px-4 md:px-6 bg-faq-section"><div className="mx-auto max-w-3xl h-96 animate-pulse bg-slate-800/20 rounded-xl" /></div>
})

const SectionHeader = dynamic(() => import("@/components/ui/section-header").then(mod => ({ default: mod.SectionHeader })), {
  loading: () => <div className="h-20 bg-transparent animate-pulse" />
})

export default function LandingPage() {
  const showTestimonials = false
  return (
    <main className="relative overflow-x-hidden">
      {/* Scroll Progress Indicator */}
      <ScrollProgress />

      <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

        {/* Decorative background elements */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-cyan-500/10 to-transparent rounded-[100%] blur-[100px]" />
          <div className="absolute top-[20%] right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
          <div className="absolute top-[40%] left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
        </div>

        {/* Hero Section */}
        <section className="w-full min-h-[90vh] flex items-center justify-center py-12 md:py-20 px-4 md:px-6 relative">
          <div className="container mx-auto">
            {/* Logo Mobile */}
            <div className="flex justify-start md:hidden mb-8">
              <Logo variant="blue" width={140} height={30} />
            </div>

            <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center max-w-7xl mx-auto">

              {/* Text Content */}
              <div className="space-y-6 md:space-y-8 text-left order-2 lg:order-1 relative z-10">
                <div className="hidden lg:flex justify-start mb-6">
                  <Logo variant="blue" width={160} height={35} />
                </div>

                <FadeIn delay={0.1} direction="up">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100/50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 text-sm font-semibold mb-4">
                    <Sparkles className="w-4 h-4" />
                    <span>Inteligência Artificial Especializada</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                    Sua Equipe de <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-500">
                      Especialistas em Odontologia
                    </span>
                  </h1>
                </FadeIn>

                <FadeIn delay={0.2} direction="up">
                  <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                    Diagnóstico, planejamento, pesquisa e redação clínica. Tenha acesso imediato a uma equipe completa de agentes de IA treinados na melhor literatura odontológica.
                    <span className="block mt-2 font-medium text-slate-800 dark:text-slate-200">Disponível 24/7 no seu WhatsApp e Web.</span>
                  </p>
                </FadeIn>

                <FadeIn delay={0.3} direction="up">
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      size="xl"
                      className="rounded-full px-8 text-lg font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0"
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
                      className="rounded-full px-8 text-lg font-medium border-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                      asChild
                    >
                      <Link href="#como-funciona">
                        Ver como funciona
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-6 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 bg-cover bg-center" style={{ backgroundImage: `url(https://api.dicebear.com/9.x/avataaars/svg?seed=${i})` }} />
                      ))}
                      <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 flex items-center justify-center text-xs font-bold">+2k</div>
                    </div>
                    <span>Dentistas já usam o Odonto Suite</span>
                  </div>
                </FadeIn>
              </div>

              {/* Hero Visual */}
              <div className="order-1 lg:order-2 relative z-0 flex justify-center lg:justify-end">
                <FadeIn delay={0.2} className="w-full max-w-2xl">
                  <AgentHeroVisual />
                </FadeIn>
              </div>

            </div>
          </div>
        </section>

        {/* Trusted By / Logos Section could go here */}

        {/* Comparison Section */}
        <section className="w-full py-20 px-4 md:px-6 bg-white dark:bg-slate-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 dark:bg-slate-900/50 skew-x-12 translate-x-32 -z-0" />
          <div className="container mx-auto max-w-6xl relative z-10">
            <SectionHeader
              label="Realidade Acadêmica"
              icon={Brain}
              title="A Diferença Entre Estudar Muito e Estudar Bem"
              description="A Odonto Suite não substitui seu estudo, ela o potencializa. Veja a diferença na prática."
              align="center"
              className="mb-16"
            />

            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Sem Odonto GPT */}
              <FadeIn direction="right" delay={0.1} className="relative group">
                {/* Alert red cloud gradient on hover (radial) - blur reduzido para melhor performance */}
                <div
                  aria-hidden
                  className="absolute -z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[240%] rounded-[50%] opacity-0 group-hover:opacity-70 blur-[80px] transition-all duration-300 group-hover:scale-105 bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.35)_0%,_rgba(239,68,68,0.22)_50%,_transparent_90%)]"
                />
                {/* Subtle edge glow that intensifies on hover - blur reduzido */}
                <div aria-hidden className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-destructive/10 to-transparent blur-xl transition-all duration-300 group-hover:from-destructive/25" />
                <Card className="transition-all duration-300 border-2 hover:scale-95 hover:shadow-md hover:border-destructive/50 group-hover:shadow-lg group-hover:shadow-destructive/20 group-hover:animate-wobble">
                  <CardContent className="p-8 md:p-10 pt-10 md:pt-12 space-y-6 text-base">
                    <div className="flex items-center gap-3 mb-8">
                      <span className="inline-flex items-center justify-center rounded-md p-1.5 bg-destructive/10 ring-1 ring-destructive/40">
                        <XCircle className="h-8 w-8 text-destructive" />
                      </span>
                      <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-destructive">Estudante Sem Odonto Suite</h3>
                    </div>

                    <div className="space-y-4 text-sm md:text-base">
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
                {/* Cloud gradient behind card (highlight) in #2399B4 - blur reduzido para melhor performance */}
                <div
                  aria-hidden
                  className="absolute -z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[220%] h-[300%] rounded-[50%] opacity-75 group-hover:opacity-90 blur-[80px] transition-all duration-300 group-hover:scale-110 bg-[radial-gradient(ellipse_at_center,_rgba(35,153,180,0.6)_0%,_rgba(35,153,180,0.4)_30%,_rgba(35,153,180,0.2)_60%,_transparent_100%)]"
                />
                {/* Intense edge glow matching #2399B4 - blur reduzido */}
                <div aria-hidden className="absolute -inset-6 -z-10 rounded-2xl bg-gradient-to-br from-[#2399B4]/40 via-[#2399B4]/20 to-transparent blur-2xl" />
                <Card className="transition-all duration-300 border-2 border-[#2399B4] border-[3px] hover:scale-105 hover:shadow-md hover:shadow-[#2399B4]/20 bg-[radial-gradient(ellipse_at_center,_rgba(35,153,180,0.1)_0%,_rgba(35,153,180,0.05)_50%,_transparent_70%)]">
                  <CardContent className="p-8 md:p-10 pt-10 md:pt-12 space-y-6 text-base">
                    <div className="flex items-center gap-3 mb-8">
                      <span className="inline-flex items-center justify-center rounded-md p-1.5 bg-[#2399B4]/10 ring-1 ring-[#2399B4]/40">
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                      </span>
                      <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Estudante Com Odonto Suite</h3>
                    </div>

                    <div className="space-y-4 text-sm md:text-base">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                        <span>Tira dúvidas de provas em 30s com citações que impressionam professores</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                        <span>Chega no plantão com a confiança de quem tem um especialista no bolso</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                        <span>Acessa conhecimento equivalente a 5 anos de experiência clínica</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                        <span>Conquista os melhores estágios enquanto outros ainda estão estudando</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>

            <div className="flex justify-center mt-10">
              <Link href="/register">
                <Button size="lg" variant="cta">
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
                description="Veja como a Odonto Suite está transformando a jornada acadêmica de estudantes que já estão colhendo os frutos"
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
                          title="Depoimento Dr. Carlos Silva - Odonto Suite"
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
                          title="Depoimento Dra. Ana Oliveira - Odonto Suite"
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
                          title="Depoimento Dr. Rodrigo Santos - Odonto Suite"
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
        <section className="w-full py-20 px-4 md:px-6 bg-slate-50 dark:bg-slate-900/50">
          <div className="mx-auto max-w-6xl space-y-12">
            <SectionHeader
              label="Sua Equipe Completa"
              icon={Brain}
              title="Especialistas Disponíveis 24/7"
              description="Cada agente da Odonto Suite foi treinado para uma função específica, garantindo precisão e profundidade em cada resposta."
              align="center"
            />

            {/* Animated Agent Icons */}
            <div className="mb-16">
              <AnimatedAgentIcons />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Brain,
                  title: "Planejador Clínico",
                  desc: "Estrutura planos de tratamento completos baseados nas melhores evidências.",
                  color: "text-purple-500",
                  bg: "bg-purple-500/10"
                },
                {
                  icon: BookOpen,
                  title: "Pesquisador",
                  desc: "Busca na literatura científica as respostas mais atuais para suas dúvidas.",
                  color: "text-blue-500",
                  bg: "bg-blue-500/10"
                },
                {
                  icon: Shield,
                  title: "Diagnóstico",
                  desc: "Ajuda a cruzar sinais e sintomas para hipóteses diagnósticas precisas.",
                  color: "text-pink-500",
                  bg: "bg-pink-500/10"
                },
                {
                  icon: Zap,
                  title: "Redator",
                  desc: "Escreve textos para pacientes, laudos e documentos com linguagem assertiva.",
                  color: "text-amber-500",
                  bg: "bg-amber-500/10"
                }
              ].map((agent, i) => (
                <HoverCard key={i} className="h-full">
                  <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 h-full relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 z-0" />
                    <CardContent className="pt-8 space-y-4 relative z-10">
                      <div className={`h-12 w-12 rounded-xl ${agent.bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                        <agent.icon className={`h-6 w-6 ${agent.color}`} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{agent.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
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
        <section className="w-full bg-slate-950">
          <div className="py-16 text-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              className="mx-auto max-w-3xl"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 mb-6">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 font-semibold text-sm">Veja em Ação</span>
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Seus Especialistas<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
                  Trabalhando por Você
                </span>
              </h2>
              <p className="text-lg text-slate-400">
                Role para baixo e veja cada agente demonstrando suas habilidades em tempo real
              </p>
            </motion.div>
          </div>

          {/* Demo sections */}
          <AgentDemoResearch />
          <AgentDemoVision />
          <AgentDemoSummary />
          <AgentDemoPractice />
          <AgentDemoWrite />
        </section>

        {/* How it Works */}
        <section id="como-funciona" className="w-full py-16 md:py-32 px-4 md:px-6 bg-how-it-works-section">
          <div className="container mx-auto max-w-5xl space-y-10 md:space-y-12">
            <SectionHeader
              label="Transformação em 3 Passos"
              icon={Zap}
              title="Clareza clínica em menos de 1 minuto"
              description="Enquanto seus colegas ainda estão na página 50 do livro, você já tem a resposta com respaldo científico"
              align="center"
            />

            <StaggerContainer className="grid md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <StaggerItem className="relative">
                <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg z-10 scale-in-center">
                  1
                </div>
                <HoverCard>
                  <Card className="pt-12 border-2 hover:shadow-lg transition-shadow h-full">
                    <CardContent className="space-y-4">
                      <MessageSquare className="h-10 w-10 text-primary" />
                      <h3 className="text-xl font-bold">Tire a Dúvida que Te Travava</h3>
                      <p className="text-muted-foreground">Aquela questão de prova ou caso clínico que tira seu sono - mande pelo WhatsApp</p>
                    </CardContent>
                  </Card>
                </HoverCard>
              </StaggerItem>

              {/* Step 2 */}
              <StaggerItem className="relative">
                <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg z-10">
                  2
                </div>
                <HoverCard>
                  <Card className="pt-12 border-2 hover:shadow-lg transition-shadow h-full">
                    <CardContent className="space-y-4">
                      <Brain className="h-10 w-10 text-primary" />
                      <h3 className="text-xl font-bold">Resposta com Respaldo Científico</h3>
                      <p className="text-muted-foreground">Em segundos, receba a resposta fundamentada na literatura que seus professores exigem</p>
                    </CardContent>
                  </Card>
                </HoverCard>
              </StaggerItem>

              {/* Step 3 */}
              <StaggerItem className="relative">
                <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg z-10">
                  3
                </div>
                <HoverCard>
                  <Card className="pt-12 border-2 hover:shadow-lg transition-shadow h-full">
                    <CardContent className="space-y-4">
                      <CheckCircle2 className="h-10 w-10 text-primary" />
                      <h3 className="text-xl font-bold">Destaque-se na Multidão</h3>
                      <p className="text-muted-foreground">
                        Chegue na frente com conhecimento que impressiona professores e conquista os melhores estágios
                      </p>
                    </CardContent>
                  </Card>
                </HoverCard>
              </StaggerItem>
            </StaggerContainer>

            <div className="text-center pt-8">
              <Link href="/register">
                <Button size="lg" aria-label="Começar teste grátis" variant="cta">
                  Começar Teste Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section id="beneficios" className="w-full py-16 md:py-32 px-4 md:px-6 bg-benefits-section">
          <div className="mx-auto max-w-6xl space-y-10 md:space-y-12">
            <SectionHeader
              label="Sua Jornada de Sucesso"
              icon={Star}
              title="O investimento que acelera sua jornada na Odontologia"
              description="Enquanto seus colegas ainda estão tentando decifrar livros sozinhos, você já está aplicando o conhecimento na prática"
              align="center"
            />

            <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StaggerItem>
                <HoverCard className="h-full">
                  <Card className="border-2 hover:shadow-lg transition-shadow h-full">
                    <CardContent className="pt-6 space-y-3">
                      <Zap className="h-8 w-8 text-primary" />
                      <h3 className="text-lg font-bold">Agilidade Clínica</h3>
                      <p className="text-sm text-muted-foreground">Respostas em segundos durante atendimentos.</p>
                    </CardContent>
                  </Card>
                </HoverCard>
              </StaggerItem>

              <StaggerItem>
                <HoverCard className="h-full">
                  <Card className="border-2 hover:shadow-lg transition-shadow h-full">
                    <CardContent className="pt-6 space-y-3">
                      <BookOpen className="h-8 w-8 text-primary" />
                      <h3 className="text-lg font-bold">Apoio Educacional</h3>
                      <p className="text-sm text-muted-foreground">Ajuda em estudos, residência e provas.</p>
                    </CardContent>
                  </Card>
                </HoverCard>
              </StaggerItem>

              <StaggerItem>
                <HoverCard className="h-full">
                  <Card className="border-2 hover:shadow-lg transition-shadow h-full">
                    <CardContent className="pt-6 space-y-3">
                      <Shield className="h-8 w-8 text-primary" />
                      <h3 className="text-lg font-bold">Respostas Seguras</h3>
                      <p className="text-sm text-muted-foreground">Baseadas em literatura e evidências científicas.</p>
                    </CardContent>
                  </Card>
                </HoverCard>
              </StaggerItem>

              <StaggerItem>
                <HoverCard className="h-full">
                  <Card className="border-2 hover:shadow-lg transition-shadow h-full">
                    <CardContent className="pt-6 space-y-3">
                      <Clock className="h-8 w-8 text-primary" />
                      <h3 className="text-lg font-bold">Disponibilidade 24/7</h3>
                      <p className="text-sm text-muted-foreground">Ilimitado via WhatsApp, sempre que precisar.</p>
                    </CardContent>
                  </Card>
                </HoverCard>
              </StaggerItem>

              <StaggerItem>
                <HoverCard className="h-full">
                  <Card className="border-2 hover:shadow-lg transition-shadow h-full">
                    <CardContent className="pt-6 space-y-3">
                      <Award className="h-8 w-8 text-primary" />
                      <h3 className="text-lg font-bold">Prescrições Personalizadas</h3>
                      <p className="text-sm text-muted-foreground">Sugestões com dosagens adequadas.</p>
                    </CardContent>
                  </Card>
                </HoverCard>
              </StaggerItem>

              <StaggerItem>
                <HoverCard className="h-full">
                  <Card className="border-2 hover:shadow-lg transition-shadow h-full">
                    <CardContent className="pt-6 space-y-3">
                      <MessageSquare className="h-8 w-8 text-primary" />
                      <h3 className="text-lg font-bold">Interface Familiar</h3>
                      <p className="text-sm text-muted-foreground">Funciona no WhatsApp, sem aprender nada novo.</p>
                    </CardContent>
                  </Card>
                </HoverCard>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* Expert Section - Roniery Costa */}
        <section id="especialista" className="w-full py-16 md:py-32 px-4 md:px-6 bg-expert-section">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              label="Responsabilidade Técnica"
              icon={Award}
              title="Conhecimento com Respaldo de Quem Entende da Área"
              description="Por trás de cada resposta da Odonto Suite, está a experiência de um profissional que já viveu suas dúvidas e desafios"
              align="center"
            />

            <div className="grid md:grid-cols-2 gap-12 items-center mt-12">
              <FadeIn direction="right" delay={0.1} className="space-y-6">
                <div className="relative flex justify-center">
                  <div className="relative w-72 h-72 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full overflow-hidden shadow-2xl border-2 border-white/20 flex items-center justify-center">
                    <Image
                      src="/Imagens /roniery.jpg"
                      alt="Roniery Costa - Responsável Técnico da Odonto Suite"
                      width={288}
                      height={288}
                      className="w-72 h-72 object-contain object-center"
                    />
                  </div>
                </div>
              </FadeIn>

              <FadeIn direction="left" delay={0.2} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-primary">Roniery Costa</h3>
                  <p className="text-muted-foreground">Responsável Técnico - CRO 4616/PB</p>
                </div>

                <div className="space-y-4">
                  <p className="text-lg font-semibold text-white leading-relaxed border-l-4 border-primary pl-4 py-2 bg-primary/5">
                    &quot;Criei a Odonto Suite para ser o consultor que eu gostaria de ter tido durante minha formação -
                    acessível 24/7, sem julgamentos, e com respostas fundamentadas na literatura que realmente importa.&quot;
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>🧑🏻‍⚕️ Cirurgião dentista</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>🎓 Me. e Dr. em Odontologia</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>📚 + 3.5k alunos online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>🏆 Professor universitário</span>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-muted-foreground italic">
                    &quot;Cada resposta que você recebe passa pela minha curadoria técnica, garantindo que
                    esteja sempre alinhada com as melhores práticas da odontologia moderna.&quot;
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="planos" className="w-full py-16 md:py-32 px-4 md:px-6 bg-pricing-section">
          <div className="mx-auto max-w-6xl space-y-10 md:space-y-12">
            <SectionHeader
              label="Sua Vantagem Competitiva"
              icon={TrendingUp}
              title="Enquanto Seus Colegas Ainda Estão no Google, Você Já Tem a Resposta"
              description="Acesso ilimitado ao consultor de odontologia 24/7 que vai te fazer economizar horas de estudo e te poupar de constrangimentos na clínica"
              align="center"
            />

            {/* Planos Mensal, Anual Básico e Anual Pro */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
              {/* Plano Mensal */}
              <HoverCard>
                <Card className="relative overflow-hidden p-8 md:p-10 transition-all border-2 border-border hover:border-primary/50 w-full min-h-[480px] flex flex-col h-full">
                  <div className="text-center mb-5">
                    <h3 className="text-xl font-bold mb-1">Plano Mensal Básico</h3>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs md:text-sm text-muted-foreground line-through">Valor original: R$ 59,90/mês</span>
                      <span className="text-xs md:text-sm font-semibold tracking-wide text-accent">33% OFF - Preço de Lançamento</span>
                    </div>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl md:text-4xl font-extrabold text-primary">R$ 39,80</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6 flex-grow">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Consultor 24/7 no WhatsApp - sem limite de perguntas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Respostas fundamentadas em literatura científica</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Prescrições com dosagens corretas e protocolos atualizados</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Ajuda em provas, estágios e casos clínicos complexos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Live exclusiva toda quarta-feira com Q&A</span>
                    </li>
                  </ul>

                  <div className="mt-auto space-y-4">
                    <p className="text-center text-sm font-medium text-primary">
                      Inclui teste grátis de 7 dias
                    </p>
                    <Link href="/register" className="block">
                      <Button className="w-full shadow-lg" size="lg" variant="cta">
                        Começar Teste Grátis
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </HoverCard>

              {/* Plano Anual - Mais Econômico */}
              <ScaleIn delay={0.2} className="h-full">
                <Card className="relative overflow-hidden p-8 md:p-10 transition-all border-2 border-primary shadow-2xl md:scale-[1.04] bg-gradient-to-b from-primary/10 to-transparent w-full min-h-[480px] flex flex-col h-full">
                  {/* Fita de oferta especial apenas no plano anual */}
                  <div className="pointer-events-none absolute -right-14 top-6 rotate-45 z-10">
                    <span className="bg-accent text-accent-foreground px-16 py-1 text-xs font-semibold shadow-md">Oferta Especial</span>
                  </div>
                  <div className="text-center mb-5">
                    <div className="flex justify-center mb-2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">ESCOLHA INTELIGENTE</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">Plano Anual Básico</h3>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs md:text-sm text-muted-foreground line-through">Valor original: R$ 597/ano</span>
                      <span className="text-xs md:text-sm font-semibold tracking-wide text-accent">35% OFF - Preço de Lançamento</span>
                    </div>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl md:text-4xl font-extrabold text-primary">R$ 387</span>
                      <span className="text-muted-foreground">/ano</span>
                    </div>
                    <div className="mt-2 text-xs md:text-sm font-medium text-primary">Preço de lançamento • Economize R$ 210 (equivalente a R$ 32,25/mês)</div>
                  </div>

                  <ul className="space-y-3 mb-6 flex-grow">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Consultor 24/7 no WhatsApp - sem limite de perguntas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Respostas fundamentadas em literatura científica</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Prescrições com dosagens corretas e protocolos atualizados</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Ajuda em provas, estágios e casos clínicos complexos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Live exclusiva toda quarta-feira com Q&A</span>
                    </li>

                    {/* Bônus exclusivos do anual */}
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">🎁 <strong>Ebook exclusivo:</strong> Como Validar Seu Diploma nos EUA</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">🎁 <strong>Certificado mensal</strong> de participação nas lives</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">🎁 <strong>Acesso prioritário</strong> a novas funcionalidades</span>
                    </li>
                  </ul>

                  <div className="mt-auto space-y-4">
                    <p className="text-center text-sm font-medium text-primary">
                      Inclui teste grátis de 7 dias
                    </p>
                    <Link href="/register" className="block">
                      <Button className="w-full shadow-lg" size="lg" variant="cta">
                        Começar Teste Grátis
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </ScaleIn>

              {/* Plano Anual Pro - Odonto Vision */}
              <ScaleIn delay={0.3} className="h-full">
                <Card className="relative overflow-hidden p-8 md:p-10 transition-all border-2 border-purple-500 shadow-2xl md:scale-[1.04] bg-gradient-to-b from-purple-500/10 to-transparent w-full min-h-[480px] flex flex-col h-full">
                  {/* Fita de oferta especial */}
                  <div className="pointer-events-none absolute -right-14 top-6 rotate-45 z-10">
                    <span className="bg-purple-600 text-white px-16 py-1 text-xs font-semibold shadow-md">PLANO PRO</span>
                  </div>
                  <div className="text-center mb-5">
                    <div className="flex justify-center mb-2">
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">MELHOR CUSTO-BENEFÍCIO</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">Plano Anual Pro - Odonto Vision</h3>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs md:text-sm text-muted-foreground line-through">Valor original: R$ 797/ano</span>
                      <span className="text-xs md:text-sm font-semibold tracking-wide text-purple-600">25% OFF - Preço de Lançamento</span>
                    </div>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl md:text-4xl font-extrabold text-purple-600">R$ 597</span>
                      <span className="text-muted-foreground">/ano</span>
                    </div>
                    <div className="mt-2 text-xs md:text-sm font-medium text-purple-600">Preço de lançamento • Economize R$ 200 (equivalente a R$ 49,75/mês)</div>
                    <div className="mt-3 p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">+ Curso de Farmacologia: R$ 367</p>
                      <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">Valor total: R$ 964 (economize R$ 567)</p>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6 flex-grow">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm"><strong>Tudo do Plano Básico</strong> (consultor 24/7, respostas científicas, prescrições, lives)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">🎓 <strong>Curso Completo de Farmacologia</strong> (valor R$ 367)</span>
                    </li>
                    {/* Destaque Especial Odonto Vision */}
                    <li className="col-span-full">
                      <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-xl border-2 border-cyan-300 dark:border-cyan-700 shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-cyan-500 rounded-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-cyan-900 dark:text-cyan-100">👁️ Odonto Vision</h4>
                            <p className="text-xs text-cyan-700 dark:text-cyan-300">Exclusivo do Plano PRO</p>
                          </div>
                        </div>
                        <p className="text-sm text-cyan-800 dark:text-cyan-200 leading-relaxed mb-3">
                          <strong>Análise inteligente de imagens radiográficas com IA.</strong> Envie radiografias panorâmicas, periapicais e tomografias para receber análises detalhadas, identificação de achados clínicos e sugestões de diagnóstico diferencial.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-200 dark:bg-cyan-800 text-cyan-900 dark:text-cyan-100">
                            ✓ Radiografias Panorâmicas
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-200 dark:bg-cyan-800 text-cyan-900 dark:text-cyan-100">
                            ✓ Periapicais
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-200 dark:bg-cyan-800 text-cyan-900 dark:text-cyan-100">
                            ✓ Tomografias
                          </span>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">🎁 <strong>Ebook exclusivo:</strong> Como Validar Seu Diploma nos EUA</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">🎁 <strong>Certificado mensal</strong> de participação nas lives</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">🎁 <strong>Acesso prioritário</strong> a novas funcionalidades</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">🎁 <strong>Suporte prioritário</strong> via WhatsApp</span>
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
        </section>

        {/* Final CTA */}
        <section className="w-full py-16 md:py-32 px-4 md:px-6 bg-final-cta-section">
          <div className="container mx-auto max-w-4xl text-center space-y-6 md:space-y-8">
            <SectionHeader
              label="Comece agora"
              icon={ArrowRight}
              title="Transforme sua prática hoje mesmo"
              description="Junte-se aos profissionais que já estão usando IA especializada na rotina clínica e acadêmica."
              align="center"
            />
            <Link href="/register">
              <Button
                size="xl"
                aria-label="Começar Agora"
                variant="cta"
                className="group shadow-primary/25"
              >
                Começar Teste Grátis
                <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <FAQSection />

      </div>
    </main>
  )
}
