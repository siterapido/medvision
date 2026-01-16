'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import dynamic from "next/dynamic"
import {
  Brain, MessageSquare, Clock, BookOpen, Shield, Zap,
  CheckCircle2, ArrowRight, Award, Sparkles, Microscope,
  Eye, GraduationCap, PenTool, Stethoscope, Activity,
  Target, Users, TrendingUp
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const FAQSection = dynamic(() => import("@/components/landing/faq-section").then(mod => ({ default: mod.FAQSection })), {
  ssr: false,
  loading: () => <div className="w-full py-16 md:py-32 px-4 md:px-6 bg-slate-50"><div className="mx-auto max-w-3xl h-96 animate-pulse bg-slate-200 rounded-xl" /></div>
})

const SectionHeader = dynamic(() => import("@/components/ui/section-header").then(mod => ({ default: mod.SectionHeader })), {
  loading: () => <div className="h-20 bg-transparent animate-pulse" />
})

// Custom font imports via Google Fonts
const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
`

export default function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrollTop / docHeight) * 100
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <style jsx global>{fonts}</style>
      <main className="relative overflow-x-hidden bg-[#FAFAF8]">
        {/* Progress Bar */}
        <motion.div
          className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#D4A373] to-[#0A3D62] z-50"
          style={{ width: `${scrollProgress}%` }}
        />

        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-[#FAFAF8]/80 backdrop-blur-md z-40 border-b border-[#0A3D62]/10">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Logo variant="blue" width={140} height={32} />
            <div className="hidden md:flex items-center gap-8">
              <Link href="#como-funciona" className="text-sm font-medium text-[#0A3D62]/80 hover:text-[#0A3D62] transition-colors">
                Como Funciona
              </Link>
              <Link href="#beneficios" className="text-sm font-medium text-[#0A3D62]/80 hover:text-[#0A3D62] transition-colors">
                Benefícios
              </Link>
              <Link href="#planos" className="text-sm font-medium text-[#0A3D62]/80 hover:text-[#0A3D62] transition-colors">
                Planos
              </Link>
            </div>
            <Button
              size="sm"
              className="bg-[#0A3D62] hover:bg-[#0A3D62]/90 text-white rounded-full px-6 font-medium"
              asChild
            >
              <Link href="/register">Começar Agora</Link>
            </Button>
          </div>
        </nav>

        {/* Hero Section - Editorial Layout */}
        <section className="min-h-screen pt-20 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 right-0 w-[600px] h-[600px] border border-[#0A3D62] rounded-full" />
            <div className="absolute top-40 right-20 w-[400px] h-[400px] border border-[#0A3D62] rounded-full" />
            <div className="absolute bottom-20 left-0 w-[300px] h-[300px] border border-[#D4A373] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text Content - Left */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A373]/10 border border-[#D4A373]/30 rounded-full"
                >
                  <Sparkles className="w-4 h-4 text-[#D4A373]" />
                  <span className="text-sm font-medium text-[#D4A373]">Odontologia de Precisão</span>
                </motion.div>

                <h1 className="font-['Playfair_Display'] text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] text-[#0A3D62]">
                  Sua Equipe de
                  <br />
                  <span className="italic text-[#D4A373]">Especialistas</span>
                  <br />
                  em Odontologia
                </h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="font-['Space_Grotesk'] text-lg md:text-xl text-[#0A3D62]/70 leading-relaxed max-w-xl"
                >
                  Diagnóstico, planejamento, pesquisa e redação clínica. Uma equipe completa de agentes de IA treinados na melhor literatura odontológica, disponível 24/7.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 pt-4"
                >
                  <Button
                    size="lg"
                    className="bg-[#0A3D62] hover:bg-[#0A3D62]/90 text-white rounded-full px-10 text-base font-medium shadow-lg shadow-[#0A3D62]/20"
                    asChild
                  >
                    <Link href="/register">
                      Iniciar Teste Grátis
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-10 text-base font-medium border-2 border-[#0A3D62]/20 hover:bg-[#0A3D62]/5 hover:border-[#0A3D62]/30"
                    asChild
                  >
                    <Link href="#como-funciona">Descobrir Mais</Link>
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center gap-6 pt-6"
                >
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-full border-3 border-white shadow-md bg-slate-200 bg-cover bg-center"
                        style={{ backgroundImage: `url(https://api.dicebear.com/9.x/avataaars/svg?seed=${i})` }}
                      />
                    ))}
                    <div className="w-12 h-12 rounded-full border-3 border-white bg-[#D4A373] flex items-center justify-center text-white text-sm font-bold shadow-md">
                      2k+
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-['Space_Grotesk'] font-semibold text-[#0A3D62]">Profissionais ativos</p>
                    <p className="text-sm text-[#0A3D62]/60">Confiança comprovada</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Visual Content - Right - Asymmetrical */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="relative"
              >
                <div className="relative">
                  {/* Main Card - Positioned Off-Center */}
                  <div className="relative z-10 ml-0 lg:ml-12">
                    <Card className="bg-white border-0 shadow-2xl overflow-hidden">
                      <div className="aspect-[4/5] bg-gradient-to-br from-[#0A3D62] to-[#0A3D62]/80 relative p-8 flex flex-col justify-between">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A373]/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#0A3D62]/30 rounded-full blur-2xl" />

                        {/* Content */}
                        <div className="relative z-10">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm mb-6">
                            <Activity className="w-4 h-4" />
                            <span>Agente Ativo</span>
                          </div>
                          <h3 className="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-white mb-4">
                            Planejamento Clínico
                          </h3>
                          <p className="text-white/80 font-['Space_Grotesk'] text-sm leading-relaxed">
                            Análise completa baseada em evidências científicas das melhores publicações em odontologia
                          </p>
                        </div>

                        <div className="relative z-10 space-y-3">
                          <div className="flex items-center gap-3 text-white/90">
                            <div className="w-8 h-8 rounded-full bg-[#D4A373] flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-medium">Protocolo validado</span>
                          </div>
                          <div className="flex items-center gap-3 text-white/90">
                            <div className="w-8 h-8 rounded-full bg-[#D4A373] flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-medium">Literatura atualizada</span>
                          </div>
                          <div className="flex items-center gap-3 text-white/90">
                            <div className="w-8 h-8 rounded-full bg-[#D4A373] flex items-center justify-center">
                              <Target className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-medium">Precisão diagnóstica</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Floating Elements */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="absolute -top-8 -left-8 lg:left-0 z-20"
                  >
                    <Card className="bg-[#D4A373] border-0 shadow-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white text-xs font-medium">Agente</p>
                          <p className="text-white font-bold">Pesquisador</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="absolute -bottom-6 -right-6 lg:-right-0 z-20"
                  >
                    <Card className="bg-white border-2 border-[#0A3D62]/10 shadow-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0A3D62] flex items-center justify-center">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[#0A3D62]/60 text-xs font-medium">Segurança</p>
                          <p className="text-[#0A3D62] font-bold">100% Validado</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Value Proposition - Editorial Grid */}
        <section className="py-32 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <h2 className="font-['Playfair_Display'] text-4xl md:text-6xl font-bold text-[#0A3D62] mb-6">
                Estudar Muito vs
                <br />
                <span className="italic text-[#D4A373]">Estudar Bem</span>
              </h2>
              <p className="font-['Space_Grotesk'] text-xl text-[#0A3D62]/70 max-w-2xl mx-auto">
                A diferença entre quem perde horas no Google e quem tem respostas precisas em segundos
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              {/* Without */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="absolute -top-4 -left-4 font-['Playfair_Display'] text-8xl font-bold text-red-500/10 select-none">
                  Sem
                </div>
                <Card className="h-full bg-[#FAFAF8] border-2 border-red-100 p-8 md:p-12 relative overflow-hidden">
                  <div className="relative z-10 space-y-6">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#0A3D62]">
                      Sem Odonto Suite
                    </h3>
                    <div className="space-y-4">
                      {[
                        "Perde oportunidades de estágio por insegurança",
                        "Gasta 3h pesquisando o que resolveria em 30s",
                        "Medo de errar prescrições no plantão",
                        "Colegas com 'contatos' ganham as vagas"
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <p className="font-['Space_Grotesk'] text-[#0A3D62]/70 text-sm leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* With */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -top-4 -right-4 font-['Playfair_Display'] text-8xl font-bold text-[#D4A373]/10 select-none">
                  Com
                </div>
                <Card className="h-full bg-[#0A3D62] text-white border-0 p-8 md:p-12 relative overflow-hidden shadow-2xl">
                  {/* Pattern Overlay */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 border border-white/20 rounded-full" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 border border-white/20 rounded-full" />
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="w-16 h-16 rounded-full bg-[#D4A373] flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold">
                      Com Odonto Suite
                    </h3>
                    <div className="space-y-4">
                      {[
                        "Dúvidas de provas em 30s com citações completas",
                        "Confiança de especialista no bolso durante plantão",
                        "5 anos de experiência clínica acessível",
                        "Conquista os melhores estágios disponíveis"
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#D4A373] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                          <p className="font-['Space_Grotesk'] text-white/90 text-sm leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center mt-12"
            >
              <Button
                size="lg"
                className="bg-[#0A3D62] hover:bg-[#0A3D62]/90 text-white rounded-full px-12 shadow-lg shadow-[#0A3D62]/20"
                asChild
              >
                <Link href="/register">
                  Começar Transformação
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Agents Showcase - Grid Layout */}
        <section className="py-32 bg-[#FAFAF8] relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[#D4A373] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A3D62]/5 border border-[#0A3D62]/10 rounded-full mb-6">
                <Users className="w-4 h-4 text-[#0A3D62]" />
                <span className="text-sm font-medium text-[#0A3D62]">Sua Equipe Completa</span>
              </div>
              <h2 className="font-['Playfair_Display'] text-4xl md:text-6xl font-bold text-[#0A3D62] mb-6">
                Especialistas
                <br />
                <span className="italic text-[#D4A373]">Disponíveis 24/7</span>
              </h2>
              <p className="font-['Space_Grotesk'] text-xl text-[#0A3D62]/70 max-w-2xl mx-auto">
                Cada agente treinado para uma função específica, garantindo precisão em cada resposta
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Brain,
                  title: "Planejador",
                  desc: "Planos de tratamento baseados em evidências",
                  color: "bg-purple-500",
                  delay: 0.1
                },
                {
                  icon: BookOpen,
                  title: "Pesquisador",
                  desc: "Literatura científica atualizada",
                  color: "bg-blue-500",
                  delay: 0.2
                },
                {
                  icon: Microscope,
                  title: "Diagnóstico",
                  desc: "Hipóteses precisas com cruzamento de dados",
                  color: "bg-pink-500",
                  delay: 0.3
                },
                {
                  icon: PenTool,
                  title: "Redator",
                  desc: "Textos assertivos para pacientes e laudos",
                  color: "bg-amber-500",
                  delay: 0.4
                }
              ].map((agent, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: agent.delay }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Card className="h-full bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 p-6 relative overflow-hidden">
                    <div className={`absolute inset-0 ${agent.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A3D62] to-[#0A3D62]/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <agent.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#0A3D62] mb-3">
                        {agent.title}
                      </h3>
                      <p className="font-['Space_Grotesk'] text-sm text-[#0A3D62]/70 leading-relaxed">
                        {agent.desc}
                      </p>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#0A3D62] to-[#D4A373] transform scale-x-0 group-hover:scale-x-100 transition-transform" />
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works - Minimal Steps */}
        <section id="como-funciona" className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <h2 className="font-['Playfair_Display'] text-4xl md:text-6xl font-bold text-[#0A3D62] mb-6">
                Clareza em
                <br />
                <span className="italic text-[#D4A373]">3 Passos</span>
              </h2>
              <p className="font-['Space_Grotesk'] text-xl text-[#0A3D62]/70 max-w-2xl mx-auto">
                Enquanto seus colegas estão na página 50 do livro, você já tem a resposta
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-24 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-[#0A3D62]/20 via-[#D4A373]/50 to-[#0A3D62]/20" />

              {[
                {
                  step: "01",
                  icon: MessageSquare,
                  title: "Tire a Dúvida",
                  desc: "Envie pelo WhatsApp a questão que te trava",
                  delay: 0.1
                },
                {
                  step: "02",
                  icon: Brain,
                  title: "Resposta Científica",
                  desc: "Receba em segundos com fundamentação completa",
                  delay: 0.2
                },
                {
                  step: "03",
                  icon: TrendingUp,
                  title: "Destaque-se",
                  desc: "Impressione professores e conquiste os melhores estágios",
                  delay: 0.3
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: item.delay }}
                  className="relative"
                >
                  <div className="relative z-10">
                    <div className="font-['Playfair_Display'] text-7xl font-bold text-[#D4A373]/20 absolute -top-8 -left-2 select-none">
                      {item.step}
                    </div>
                    <Card className="bg-[#FAFAF8] border-0 shadow-lg p-8 pt-12 h-full">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A3D62] to-[#0A3D62]/80 flex items-center justify-center mb-6">
                        <item.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[#0A3D62] mb-4">
                        {item.title}
                      </h3>
                      <p className="font-['Space_Grotesk'] text-[#0A3D62]/70 leading-relaxed">
                        {item.desc}
                      </p>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center mt-16"
            >
              <Button
                size="lg"
                className="bg-[#0A3D62] hover:bg-[#0A3D62]/90 text-white rounded-full px-12 shadow-lg shadow-[#0A3D62]/20"
                asChild
              >
                <Link href="/register">
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Benefits - Editorial Grid */}
        <section id="beneficios" className="py-32 bg-[#FAFAF8]">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <h2 className="font-['Playfair_Display'] text-4xl md:text-6xl font-bold text-[#0A3D62] mb-6">
                O Investimento que
                <br />
                <span className="italic text-[#D4A373]">Acelera sua Jornada</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Zap, title: "Agilidade", desc: "Respostas em segundos" },
                { icon: BookOpen, title: "Educação", desc: "Apoio em provas e residência" },
                { icon: Shield, title: "Segurança", desc: "Baseado em evidências" },
                { icon: Clock, title: "24/7", desc: "Sempre disponível" },
                { icon: Award, title: "Prescrições", desc: "Dosagens corretas" },
                { icon: MessageSquare, title: "WhatsApp", desc: "Interface familiar" }
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Card className="bg-white border-0 shadow-md hover:shadow-xl transition-shadow p-6 h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#0A3D62]/5 flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-6 h-6 text-[#0A3D62]" />
                      </div>
                      <div>
                        <h3 className="font-['Space_Grotesk'] font-semibold text-[#0A3D62] mb-2">{benefit.title}</h3>
                        <p className="font-['Space_Grotesk'] text-sm text-[#0A3D62]/60">{benefit.desc}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Expert Section - Split Layout */}
        <section className="py-32 bg-[#0A3D62] text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] border border-white/30 rounded-full" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] border border-white/30 rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="relative mx-auto w-72 h-72 md:w-96 md:h-96">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4A373]/30 to-transparent" />
                  <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-[#D4A373]/30">
                    <Image
                      src="/Imagens /roniery.jpg"
                      alt="Roniery Costa"
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-8"
              >
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A373]/20 border border-[#D4A373]/30 rounded-full mb-6">
                    <Award className="w-4 h-4 text-[#D4A373]" />
                    <span className="text-sm font-medium text-[#D4A373]">Responsabilidade Técnica</span>
                  </div>
                  <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl font-bold mb-4">
                    Roniery Costa
                  </h2>
                  <p className="font-['Space_Grotesk'] text-white/70 text-lg">
                    CRO 4616/PB • Mestre e Doutor em Odontologia
                  </p>
                </div>

                <blockquote className="font-['Playfair_Display'] text-2xl italic leading-relaxed text-white/90 border-l-4 border-[#D4A373] pl-6">
                  "Criei a Odonto Suite para ser o consultor que eu gostaria de ter tido - acessível 24/7, sem julgamentos, com respostas baseadas na literatura que realmente importa."
                </blockquote>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    "Cirurgião Dentista",
                    "Me. e Dr. em Odontologia",
                    "+ 3.5k alunos online",
                    "Professor universitário"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#D4A373] flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-['Space_Grotesk'] text-sm text-white/90">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing - Minimal Cards */}
        <section id="planos" className="py-32 bg-[#FAFAF8]">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <h2 className="font-['Playfair_Display'] text-4xl md:text-6xl font-bold text-[#0A3D62] mb-6">
                Enquanto Colegas
                <br />
                <span className="italic text-[#D4A373]">Buscam no Google</span>
              </h2>
              <p className="font-['Space_Grotesk'] text-xl text-[#0A3D62]/70 max-w-2xl mx-auto">
                Você já tem a resposta com respaldo científico
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Mensal */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-white border-2 border-[#0A3D62]/10 p-8 h-full flex flex-col relative overflow-hidden">
                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[#0A3D62] mb-2">
                        Mensal Básico
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="font-['Playfair_Display'] text-5xl font-bold text-[#0A3D62]">R$ 39,80</span>
                        <span className="text-[#0A3D62]/60">/mês</span>
                      </div>
                      <p className="font-['Space_Grotesk'] text-sm text-[#D4A373] font-medium mt-2">
                        33% OFF • Lançamento
                      </p>
                    </div>

                    <div className="space-y-4">
                      {[
                        "Consultor 24/7 ilimitado",
                        "Literatura científica",
                        "Prescrições corretas",
                        "Ajuda em provas e estágios",
                        "Live semanal com Q&A"
                      ].map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-[#0A3D62] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                          <span className="font-['Space_Grotesk'] text-sm text-[#0A3D62]/80">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full mt-8 bg-[#0A3D62] hover:bg-[#0A3D62]/90 text-white rounded-full font-medium"
                    asChild
                  >
                    <Link href="/register">Testar Grátis</Link>
                  </Button>
                </Card>
              </motion.div>

              {/* Anual - Featured */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#D4A373] text-white px-6 py-1 rounded-full text-sm font-medium shadow-lg z-10">
                  Mais Popular
                </div>
                <Card className="bg-[#0A3D62] text-white border-0 p-8 h-full flex flex-col shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 border border-white/30 rounded-full" />
                  </div>

                  <div className="relative z-10 flex-1 space-y-6">
                    <div>
                      <h3 className="font-['Playfair_Display'] text-2xl font-bold mb-2">
                        Anual Básico
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="font-['Playfair_Display'] text-5xl font-bold">R$ 387</span>
                        <span className="text-white/60">/ano</span>
                      </div>
                      <p className="font-['Space_Grotesk'] text-sm text-[#D4A373] font-medium mt-2">
                        35% OFF • R$ 32,25/mês
                      </p>
                    </div>

                    <div className="space-y-4">
                      {[
                        "Tudo do Mensal",
                        "🎁 Ebook: Diploma nos EUA",
                        "🎁 Certificado mensal",
                        "🎁 Acesso prioritário"
                      ].map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-[#D4A373] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                          <span className="font-['Space_Grotesk'] text-sm text-white/90">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full mt-8 bg-white hover:bg-white/90 text-[#0A3D62] rounded-full font-medium"
                    asChild
                  >
                    <Link href="/register">Testar Grátis</Link>
                  </Button>
                </Card>
              </motion.div>

              {/* Pro */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-white border-2 border-purple-500 p-8 h-full flex flex-col relative overflow-hidden">
                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="font-['Playfair_Display'] text-2xl font-bold text-purple-600 mb-2">
                        Anual Pro
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="font-['Playfair_Display'] text-5xl font-bold text-purple-600">R$ 597</span>
                        <span className="text-purple-600/60">/ano</span>
                      </div>
                      <p className="font-['Space_Grotesk'] text-sm text-purple-600 font-medium mt-2">
                        25% OFF • R$ 49,75/mês
                      </p>
                    </div>

                    <div className="space-y-4">
                      {[
                        "Tudo do Anual Básico",
                        "🎓 Curso Farmacologia (R$ 367)",
                        "👁️ Odonto Vision",
                        "🎁 Ebook + Certificado",
                        "🎁 Suporte prioritário"
                      ].map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                          <span className="font-['Space_Grotesk'] text-sm text-purple-600/90">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full mt-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium"
                    asChild
                  >
                    <Link href="/register">Testar Grátis</Link>
                  </Button>
                </Card>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center mt-12 space-y-4"
            >
              <p className="font-['Space_Grotesk'] text-sm text-[#0A3D62]/60">Pagamento seguro via Kiwify</p>
              <div className="flex items-center justify-center gap-6 text-xs text-[#0A3D62]/60">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Pagamento Seguro
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  7 dias grátis
                </span>
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Cancele quando quiser
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 bg-[#0A3D62] text-white relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4A373]/10 rounded-full blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <h2 className="font-['Playfair_Display'] text-4xl md:text-6xl font-bold">
                Transforme Sua Prática
                <br />
                <span className="italic text-[#D4A373]">Hoje Mesmo</span>
              </h2>
              <p className="font-['Space_Grotesk'] text-xl text-white/80 max-w-2xl mx-auto">
                Junte-se aos profissionais que já estão usando IA especializada na rotina clínica e acadêmica
              </p>
              <Button
                size="lg"
                className="bg-[#D4A373] hover:bg-[#D4A373]/90 text-white rounded-full px-12 text-lg shadow-xl shadow-[#D4A373]/20"
                asChild
              >
                <Link href="/register">
                  Começar Teste Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <FAQSection />

      </main>
    </>
  )
}
