 
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  Brain,
  MessageSquare,
  Clock,
  BookOpen,
  Shield,
  Zap,
  CheckCircle2,
  Star,
  Sparkles,
  ArrowRight,
  Award,
  TrendingUp,
  XCircle,
  PlayCircle,
  Video,
  HelpCircle,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { YouTubePlayer } from "@/components/video/youtube-player"
import { SectionHeader } from "@/components/ui/section-header"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-background via-cyan-50/30 to-background">


      {/* Decorative animated background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-animated-gradient opacity-[0.18] blur-[80px] w-[60vw] h-[60vh] max-w-[800px] rounded-full mx-auto mt-[-80px]" />
      </div>

      {/* Hero Section */}
      <section className="w-full min-h-screen bg-hero-section text-white flex items-center justify-center py-20">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Text Content - Left Side */}
          <div className="space-y-8 text-left">
            {/* Logo acima do título */}
            <div className="flex justify-center md:justify-start mb-6">
              <Logo width={140} height={30} />
            </div>
            
            <h1 className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100 text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
              Inteligência Artificial para{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-cyan-400 bg-clip-text text-transparent">
                Odontologia
              </span>
            </h1>

            <p className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200 text-xl md:text-2xl text-slate-300 text-balance leading-relaxed">
              Suporte clínico e educacional via WhatsApp. Dúvidas, prescrições e orientações baseadas em literatura
              científica.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
              <Link href="/register">
                <Button
                  size="xl"
                  aria-label="Contratar Odonto GPT"
                  variant="cta"
                  className="group shadow-primary/25"
                >
                  Contratar Odonto GPT
                  <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="#planos">
                <Button size="xl" variant="outline" aria-label="Ver Planos">
                  Ver Planos
                </Button>
              </Link>
            </div>

            {/* Social Proof Metrics removidos conforme solicitado */}
          </div>

          {/* VSL - Right Side */}
          <div className="relative space-y-6">
            <YouTubePlayer
              videoId="loPD53clzR4"
              title="VSL Odonto GPT"
              aspect="landscape"
              playButtonSize="xl"
              controls={0}
              autoPlayOnLoad
              hideOverlayControls
              className="w-full rounded-2xl border-2 border-[#21839B]/30 shadow-lg"
            />

            {/* Features abaixo do vídeo com ícones contextuais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Brain className="h-5 w-5 text-primary" />
                <span className="font-medium">IA Odontológica</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-medium">Base científica</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="font-medium">WhatsApp 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Comparison Section */}
      <section className="w-full py-20 md:py-32 bg-dentista-section">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader
            label="Comparativo"
            icon={CheckCircle2}
            title="Dentista, pare de perder tempo"
            description="Compare a rotina sem e com o Odonto GPT. Tenha orientação confiável baseada em literatura odontológica, direto no WhatsApp."
            align="center"
            className="mb-12"
          />

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Sem Odonto GPT */}
            <div className="relative group">
              {/* Alert red cloud gradient on hover (radial) */}
              <div
                aria-hidden
                className="absolute -z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[240%] rounded-[50%] opacity-0 group-hover:opacity-85 blur-[140px] transition-all duration-300 group-hover:scale-105 bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.35)_0%,_rgba(239,68,68,0.22)_50%,_transparent_90%)]"
              />
              {/* Subtle edge glow that intensifies on hover */}
              <div aria-hidden className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-destructive/10 to-transparent blur-2xl transition-all duration-300 group-hover:from-destructive/25" />
              <Card className="transition-all duration-300 border-2 hover:scale-95 hover:shadow-md hover:border-destructive/50 group-hover:shadow-lg group-hover:shadow-destructive/20 group-hover:animate-wobble">
                <CardContent className="p-8 md:p-10 pt-10 md:pt-12 space-y-6 text-base">
                <div className="flex items-center gap-3 mb-8">
                  <span className="inline-flex items-center justify-center rounded-md p-1.5 bg-destructive/10 ring-1 ring-destructive/40">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-destructive">Sem Odonto GPT</h3>
                </div>

                <div className="space-y-4 text-sm md:text-base">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                    <span>Perder horas buscando informações em livros e sites</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                    <span>Insegurança em atendimentos e plantões</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                    <span>Usar chatbots genéricos para casos odontológicos complexos</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                    <span>Maior risco de erros por esquecimento ou falta de atualização</span>
                  </div>
                </div>
                </CardContent>
              </Card>
            </div>

            {/* Com Odonto GPT */}
            <div className="relative group">
              {/* Cloud gradient behind card (highlight) in #2399B4 - INTENSO */}
              <div
                aria-hidden
                className="absolute -z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[220%] h-[300%] rounded-[50%] opacity-90 group-hover:opacity-100 blur-[140px] transition-all duration-300 group-hover:scale-110 bg-[radial-gradient(ellipse_at_center,_rgba(35,153,180,0.6)_0%,_rgba(35,153,180,0.4)_30%,_rgba(35,153,180,0.2)_60%,_transparent_100%)]"
              />
              {/* Intense edge glow matching #2399B4 - always visible */}
              <div aria-hidden className="absolute -inset-6 -z-10 rounded-2xl bg-gradient-to-br from-[#2399B4]/40 via-[#2399B4]/20 to-transparent blur-3xl" />
              <Card className="transition-all duration-300 border-2 border-[#2399B4] border-[3px] hover:scale-105 hover:shadow-md hover:shadow-[#2399B4]/20 bg-[radial-gradient(ellipse_at_center,_rgba(35,153,180,0.1)_0%,_rgba(35,153,180,0.05)_50%,_transparent_70%)]">
                <CardContent className="p-8 md:p-10 pt-10 md:pt-12 space-y-6 text-base">
                <div className="flex items-center gap-3 mb-8">
                  <span className="inline-flex items-center justify-center rounded-md p-1.5 bg-[#2399B4]/10 ring-1 ring-[#2399B4]/40">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Com Odonto GPT</h3>
                </div>

                <div className="space-y-4 text-sm md:text-base">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <span>Respostas baseadas em livros e artigos odontológicos atualizados</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <span>Assistente 24h no WhatsApp: clareza e segurança em decisões clínicas</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <span>IA especializada em odontologia, calibrada para protocolos da área</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <span>Redução de erros: orientações, prescrições e protocolos sempre à mão</span>
                  </div>
                </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-center mt-10">
            <Link href="#planos">
              <Button size="lg" variant="cta">
                Ver Planos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Video Testimonials Section */}
      <section className="w-full py-20 md:py-32 bg-testimonials-section">
        <div className="container mx-auto max-w-6xl space-y-16">
          <SectionHeader
            label="Depoimentos em Vídeo"
            icon={Video}
            title="Veja o que nossos usuários estão dizendo"
            description="Profissionais reais compartilhando suas experiências com o Odonto GPT"
            align="center"
          />

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {/* Video 1 */}
            <Card className="h-full text-center rounded-3xl border-[#21839B]/30 bg-[rgba(35,153,180,0.08)] hover:bg-[rgba(35,153,180,0.12)] transition-colors shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-center">
                  <span className="inline-flex items-center justify-center rounded-full p-2 bg-[#2399B4]/15 ring-1 ring-[#2399B4]/40">
                    <MessageSquare className="h-5 w-5 text-[#2399B4]" />
                  </span>
                </div>
                <div className="relative mx-auto w-full max-w-[300px]">
                  <YouTubePlayer
                    videoId="loPD53clzR4"
                    title="Depoimento Dr. Carlos Silva - Odonto GPT"
                    aspect="portrait"
                    className="rounded-3xl border-2 border-[#21839B]/30"
                    controls={0}
                  />
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
            <Card className="h-full text-center rounded-3xl border-[#21839B]/30 bg-[rgba(35,153,180,0.08)] hover:bg-[rgba(35,153,180,0.12)] transition-colors shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-center">
                  <span className="inline-flex items-center justify-center rounded-full p-2 bg-[#2399B4]/15 ring-1 ring-[#2399B4]/40">
                    <MessageSquare className="h-5 w-5 text-[#2399B4]" />
                  </span>
                </div>
                <div className="relative mx-auto w-full max-w-[300px]">
                  <YouTubePlayer
                    videoId="loPD53clzR4"
                    title="Depoimento Dra. Ana Oliveira - Odonto GPT"
                    aspect="portrait"
                    className="rounded-3xl border-2 border-[#21839B]/30"
                    controls={0}
                  />
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
            <Card className="h-full text-center rounded-3xl border-[#21839B]/30 bg-[rgba(35,153,180,0.08)] hover:bg-[rgba(35,153,180,0.12)] transition-colors shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-center">
                  <span className="inline-flex items-center justify-center rounded-full p-2 bg-[#2399B4]/15 ring-1 ring-[#2399B4]/40">
                    <MessageSquare className="h-5 w-5 text-[#2399B4]" />
                  </span>
                </div>
                <div className="relative mx-auto w-full max-w-[300px]">
                  <YouTubePlayer
                    videoId="loPD53clzR4"
                    title="Depoimento Dr. Rodrigo Santos - Odonto GPT"
                    aspect="portrait"
                    className="rounded-3xl border-2 border-[#21839B]/30"
                    controls={0}
                  />
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

          <div className="text-center pt-8">
            <Link href="#planos">
              <Button 
                size="lg" 
                variant="outline"
              >
                Ver mais depoimentos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What is Odonto GPT */}
      <section className="w-full py-20 md:py-32 bg-how-it-works-section">
        <div className="mx-auto max-w-5xl space-y-12">
          <SectionHeader
            label="O que é o Odonto GPT?"
            icon={Brain}
            title="Revolucione seus estudos e prática odontológica"
            description="Com o Odonto GPT, você tem uma IA treinada exclusivamente em odontologia, integrada ao WhatsApp. Ela responde dúvidas, sugere prescrições e oferece orientações clínicas com base em livros e artigos científicos."
            align="center"
          />

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="interactive-card border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-8 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Base Científica</h3>
                <p className="text-muted-foreground">
                  Respostas fundamentadas em literatura reconhecida e evidências científicas atualizadas.
                </p>
              </CardContent>
            </Card>

            <Card className="interactive-card border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-8 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Acesso Imediato</h3>
                <p className="text-muted-foreground">
                  Disponível 24/7 via WhatsApp. Respostas rápidas quando você mais precisa.
                </p>
              </CardContent>
            </Card>

            <Card className="interactive-card border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-8 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Especializada</h3>
                <p className="text-muted-foreground">
                  IA calibrada exclusivamente para odontologia, não é um chatbot genérico.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="w-full py-20 md:py-32 bg-how-it-works-section">
        <div className="container mx-auto max-w-5xl space-y-12">
          <SectionHeader
            label="Como funciona"
            icon={MessageSquare}
            title="Três passos simples para revolucionar sua prática"
            align="center"
          />

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg">
                1
              </div>
              <Card className="interactive-card pt-12 border-2 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <MessageSquare className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-bold">Envie sua dúvida</h3>
                  <p className="text-muted-foreground">Via WhatsApp: procedimentos, medicamentos ou casos clínicos.</p>
                </CardContent>
              </Card>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg">
                2
              </div>
              <Card className="interactive-card pt-12 border-2 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <Brain className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-bold">IA responde</h3>
                  <p className="text-muted-foreground">A IA processa sua dúvida com base em evidências científicas.</p>
                </CardContent>
              </Card>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg">
                3
              </div>
              <Card className="interactive-card pt-12 border-2 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-bold">Receba orientação</h3>
                  <p className="text-muted-foreground">
                    Receba prescrições, protocolos clínicos e conteúdos educacionais.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="text-center pt-8">
            <Link href="#planos">
              <Button size="lg" aria-label="Abrir planos" variant="cta">
                Pronto para começar?
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="w-full py-20 md:py-32 bg-benefits-section">
        <div className="mx-auto max-w-6xl space-y-12">
          <SectionHeader
            label="Benefícios"
            icon={Zap}
            title="Por que escolher o Odonto GPT?"
            align="center"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="interactive-card border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <Zap className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Agilidade Clínica</h3>
                <p className="text-sm text-muted-foreground">Respostas em segundos durante atendimentos.</p>
              </CardContent>
            </Card>

            <Card className="interactive-card border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Apoio Educacional</h3>
                <p className="text-sm text-muted-foreground">Ajuda em estudos, residência e provas.</p>
              </CardContent>
            </Card>

            <Card className="interactive-card border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <Shield className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Respostas Seguras</h3>
                <p className="text-sm text-muted-foreground">Baseadas em literatura e evidências científicas.</p>
              </CardContent>
            </Card>

            <Card className="interactive-card border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <Clock className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Disponibilidade 24/7</h3>
                <p className="text-sm text-muted-foreground">Ilimitado via WhatsApp, sempre que precisar.</p>
              </CardContent>
            </Card>

            <Card className="interactive-card border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <Award className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Prescrições Personalizadas</h3>
                <p className="text-sm text-muted-foreground">Sugestões com dosagens adequadas.</p>
              </CardContent>
            </Card>

            <Card className="interactive-card border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <MessageSquare className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Interface Familiar</h3>
                <p className="text-sm text-muted-foreground">Funciona no WhatsApp, sem aprender nada novo.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      

      {/* Pricing */}
      <section id="planos" className="w-full py-20 md:py-32 bg-pricing-section">
        <div className="mx-auto max-w-6xl space-y-12">
          <SectionHeader
            label="Planos"
            icon={TrendingUp}
            title="Escolha seu plano"
            align="center"
          />
          <div className="text-center">
            <Badge className="bg-gradient-to-r from-destructive/10 to-warning/10 text-destructive border-destructive/20 px-4 py-1.5 inline-flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Oferta Especial de Lançamento
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <Card className="interactive-card border-2 hover:border-primary/50 transition-colors hover:shadow-primary/25 relative">
              <CardContent className="pt-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Plano Mensal</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-muted-foreground line-through">R$ 79,99</span>
                    <span className="text-4xl font-bold text-primary">R$ 29,99</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Pagamento mensal, sem fidelidade</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Acesso ilimitado via WhatsApp</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Prescrições e orientações personalizadas</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">IA exclusiva para odontologia</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Base científica atualizada</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Live toda quarta-feira</span>
                  </div>
                </div>

                <Link href="/register" className="block">
                  <Button className="w-full" size="lg" variant="cta">
                    Assinar Mensal
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Annual Plan */}
            <Card className="interactive-card border-2 border-primary shadow-lg shadow-primary/25 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-primary to-accent text-white px-4 py-1">Mais Econômico</Badge>
              </div>
              <CardContent className="pt-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Plano Anual</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-muted-foreground line-through">R$ 359,88</span>
                    <span className="text-4xl font-bold text-primary">R$ 240</span>
                    <span className="text-muted-foreground">/ano</span>
                  </div>
                  <p className="text-sm font-medium text-primary mt-2">R$ 20/mês • Economize 33%</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">Tudo do plano mensal</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">🎁 Ebook: Validação de diploma nos EUA</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">🎁 1 live mensal com certificado</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Suporte prioritário</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Acesso antecipado a novos recursos</span>
                  </div>
                </div>

                <Link href="/register" className="block">
                  <Button className="w-full" size="lg" variant="cta">
                    Assinar Anual
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full py-20 md:py-32 bg-final-cta-section">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
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
              Começar Agora
              <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="w-full py-20 md:py-32 bg-faq-section">
        <div className="mx-auto max-w-3xl space-y-12">
          <SectionHeader
            label="FAQ"
            icon={HelpCircle}
            title="Perguntas Frequentes"
            align="center"
          />

          <div className="space-y-4">
            <Card className="interactive-card border-2">
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-bold text-lg">Qual a diferença para o ChatGPT comum?</h3>
                <p className="text-muted-foreground">
                  Odonto GPT é calibrado exclusivamente para odontologia com literatura e protocolos clínicos
                  específicos da área.
                </p>
              </CardContent>
            </Card>

            <Card className="interactive-card border-2">
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-bold text-lg">Como funciona o acesso via WhatsApp?</h3>
                <p className="text-muted-foreground">
                  Após pagar, você recebe o número da IA e fala normalmente pelo WhatsApp, como se fosse uma conversa
                  comum.
                </p>
              </CardContent>
            </Card>

            <Card className="interactive-card border-2">
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-bold text-lg">As respostas são confiáveis?</h3>
                <p className="text-muted-foreground">
                  Sim. Todas as respostas são baseadas em literatura odontológica reconhecida e evidências científicas
                  atualizadas.
                </p>
              </CardContent>
            </Card>

            <Card className="interactive-card border-2">
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-bold text-lg">É para estudantes também?</h3>
                <p className="text-muted-foreground">
                  Sim! Ajuda em provas, estágios, casos clínicos e todo o processo de aprendizado em odontologia.
                </p>
              </CardContent>
            </Card>

            <Card className="interactive-card border-2">
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-bold text-lg">Tem limite de perguntas?</h3>
                <p className="text-muted-foreground">
                  Não. Você pode fazer quantas perguntas quiser, sem limites ou restrições.
                </p>
              </CardContent>
            </Card>

            <Card className="interactive-card border-2">
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-bold text-lg">Posso cancelar quando quiser?</h3>
                <p className="text-muted-foreground">
                  Sim. Não há fidelidade. Você pode cancelar sua assinatura a qualquer momento.
                </p>
              </CardContent>
            </Card>

            <Card className="interactive-card border-2">
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-bold text-lg">Meus dados ficam seguros?</h3>
                <p className="text-muted-foreground">
                  Sim. Todas as conversas são criptografadas e seguimos rigorosamente a LGPD para proteção de dados.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-footer">
        <div className="container mx-auto py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Logo width={180} height={40} />
                <span className="sr-only">Odonto GPT</span>
              </div>
              <p className="text-sm text-muted-foreground">Inteligência Artificial especializada em Odontologia</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#como-funciona" className="hover:text-primary transition-colors">
                    Como Funciona
                  </Link>
                </li>
                <li>
                  <Link href="#beneficios" className="hover:text-primary transition-colors">
                    Benefícios
                  </Link>
                </li>
                <li>
                  <Link href="#planos" className="hover:text-primary transition-colors">
                    Planos
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="hover:text-primary transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/termos" className="hover:text-primary transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="hover:text-primary transition-colors">
                    Política de Privacidade
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="https://wa.me/5511999999999"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Suporte via WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 Odonto GPT. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
 
}
