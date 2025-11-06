 
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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
  User,
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
      <section className="w-full min-h-screen bg-hero-section text-white flex items-center justify-center py-16 md:py-20 px-4 md:px-6">
        {/* Fundo animado estilo shadcn que transmite ideia de IA */}
        <div aria-hidden="true" className="hero-ai-bg">
          {/* Grid técnico suave em ciano */}
          <div className="hero-ai-grid" />
          {/* Beams/auroras em camadas para dar sensação de tecnologia/IA */}
          <div
            className="hero-ai-beam"
            style={{ top: "-10%", left: "-6%", ['--beam-color' as any]: "color-mix(in oklab, var(--accent) 45%, transparent)", animationDuration: "20s" }}
          />
          <div
            className="hero-ai-beam"
            style={{ bottom: "-8%", right: "-4%", ['--beam-color' as any]: "color-mix(in oklab, var(--primary) 40%, transparent)", animationDuration: "22s" }}
          />
          <div
            className="hero-ai-beam"
            style={{ top: "30%", right: "35%", ['--beam-color' as any]: "color-mix(in oklab, var(--secondary) 35%, transparent)", animationDuration: "24s" }}
          />
        </div>
        <div className="container mx-auto">
          {/* Logo - First on Mobile, moved to text section on Desktop */}
          <div className="flex justify-start md:hidden mb-6">
            <Logo width={140} height={30} className="hero-logo-white" />
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">

          {/* VSL - Second on Mobile, Right on Desktop */}
          <div className="relative order-2 md:order-2 hero-video-container">
            <YouTubePlayer
              videoId="loPD53clzR4"
              title="VSL Odonto GPT"
              aspect="landscape"
              playButtonSize="xl"
              controls={0}
              hideOverlayControls
              className="w-full rounded-2xl border-2 border-[#21839B]/30 shadow-lg"
            />
          </div>

          {/* Text Content - Third on Mobile, Left on Desktop */}
          <div className="space-y-6 md:space-y-8 text-left order-3 md:order-1">
            {/* Logo - Hidden on mobile, shown on desktop */}
            <div className="hidden md:flex justify-start mb-4 md:mb-6">
              <Logo width={140} height={30} className="hero-logo-white" />
            </div>

            <h1 className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100 text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-balance">
              Pare de travar nas dúvidas{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-cyan-400 bg-clip-text text-transparent">
                que travam sua carreira
              </span>
            </h1>

            <p className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200 text-lg md:text-xl lg:text-2xl text-slate-300 text-balance leading-relaxed">
              Respostas científicas no WhatsApp em 60 segundos - sem passar vergonha perguntando ao professor pela 5ª vez no mesmo dia
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 pt-4 md:pt-6">
              <a href="https://pay.kiwify.com.br/PQH9KhD" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button
                  size="xl"
                  aria-label="Assinar agora"
                  variant="cta"
                  className="group shadow-primary/25 w-full"
                >
                  Assinar agora
                  <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </a>
              <Link href="#planos" className="w-full sm:w-auto">
                <Button size="xl" variant="outline" aria-label="Ver Planos" className="w-full">
                  Ver Planos
                </Button>
              </Link>
            </div>

            {/* Social Proof Metrics removidos conforme solicitado */}
          </div>

          {/* Features - After buttons on Mobile (fourth), below video on Desktop */}
          <div className="order-4 md:order-3 md:col-span-2">
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 pt-4">
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
      <section className="w-full py-16 md:py-32 px-4 md:px-6 bg-dentista-section">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader
            label="A Verdade que Ninguém Te Conta"
            icon={CheckCircle2}
            title="Enquanto Você Fica Parado nas Dúvidas, Seus Colegas Já Estão na Frente"
            description="A diferença entre o estudante que se destaca e o que fica para trás não é inteligência - é ter as respostas certas na hora certa"
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
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-destructive">Estudante Sem Odonto GPT</h3>
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
                    <span>Assiste colegas com "contatos" ganharem as melhores vagas</span>
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
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Estudante Com Odonto GPT</h3>
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
      <section className="w-full py-16 md:py-32 px-4 md:px-6 bg-testimonials-section">
        <div className="container mx-auto max-w-6xl space-y-12 md:space-y-16">
          <SectionHeader
            label="Histórias Reais de Sucesso"
            icon={Video}
            title="Resultados Reais: Segurança, Velocidade e Acertos"
            description="Veja como o Odonto GPT está transformando a jornada acadêmica de estudantes que já estão colhendo os frutos"
            align="center"
          />

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Video 1 */}
            <Card className="h-full text-center bg-transparent border-0 shadow-none">
              <CardContent className="p-0 space-y-3">
                <div className="relative mx-auto w-full max-w-[300px]">
                  <YouTubePlayer
                    videoId="loPD53clzR4"
                    title="Depoimento Dr. Carlos Silva - Odonto GPT"
                    aspect="portrait"
                    className="rounded-3xl border-2 border-[#2399B4] hover:border-[#2399B4] shadow-none"
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
            <Card className="h-full text-center bg-transparent border-0 shadow-none">
              <CardContent className="p-0 space-y-3">
                <div className="relative mx-auto w-full max-w-[300px]">
                  <YouTubePlayer
                    videoId="loPD53clzR4"
                    title="Depoimento Dra. Ana Oliveira - Odonto GPT"
                    aspect="portrait"
                    className="rounded-3xl border-2 border-[#2399B4] hover:border-[#2399B4] shadow-none"
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
            <Card className="h-full text-center bg-transparent border-0 shadow-none">
              <CardContent className="p-0 space-y-3">
                <div className="relative mx-auto w-full max-w-[300px]">
                  <YouTubePlayer
                    videoId="loPD53clzR4"
                    title="Depoimento Dr. Rodrigo Santos - Odonto GPT"
                    aspect="portrait"
                    className="rounded-3xl border-2 border-[#2399B4] hover:border-[#2399B4] shadow-none"
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

          {/* Removed 'Ver mais depoimentos' button per request */}
        </div>
      </section>

      {/* What is Odonto GPT */}
      <section className="w-full py-16 md:py-32 px-4 md:px-6 bg-how-it-works-section">
        <div className="mx-auto max-w-5xl space-y-10 md:space-y-12">
          <SectionHeader
            label="Sua Vantagem Competitiva"
            icon={Brain}
            title="O Segredo dos Estudantes que se Destacam na Odontologia"
            description="Enquanto seus colegas ainda estão perdidos nos livros, você terá respostas científicas instantâneas que transformam dúvidas em oportunidades de aprendizado"
            align="center"
          />

          <div className="grid md:grid-cols-3 gap-8">
              <Card className="interactive-card border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-8 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Notas que Impressionam</h3>
                  <p className="text-muted-foreground">
                    Respostas de provas com citações de livros que seus professores adoram ver.
                  </p>
                </CardContent>
              </Card>

              <Card className="interactive-card border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-8 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Plantão Sem Medo</h3>
                  <p className="text-muted-foreground">
                    Chegue no plantão com a segurança de ter um expert no bolso 24/7.
                  </p>
                </CardContent>
              </Card>

              <Card className="interactive-card border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-8 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Vantagem Competitiva</h3>
                  <p className="text-muted-foreground">
                    O diferencial que vai fazer você se destacar entre dezenas de colegas.
                  </p>
                </CardContent>
              </Card>
            </div>
        </div>
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

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg">
                1
              </div>
              <Card className="interactive-card pt-12 border-2 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <MessageSquare className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-bold">Tire a Dúvida que Te Travava</h3>
                  <p className="text-muted-foreground">Aquela questão de prova ou caso clínico que tira seu sono - mande pelo WhatsApp</p>
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
                  <h3 className="text-xl font-bold">Resposta com Respaldo Científico</h3>
                  <p className="text-muted-foreground">Em segundos, receba a resposta fundamentada na literatura que seus professores exigem</p>
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
                  <h3 className="text-xl font-bold">Destaque-se na Multidão</h3>
                  <p className="text-muted-foreground">
                    Chegue na frente com conhecimento que impressiona professores e conquista os melhores estágios
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="text-center pt-8">
            <a href="https://pay.kiwify.com.br/PQH9KhD" target="_blank" rel="noopener noreferrer">
              <Button size="lg" aria-label="Abrir planos" variant="cta">
                Pronto para começar?
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
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

      {/* Expert Section - Roniery Costa */}
      <section id="especialista" className="w-full py-16 md:py-32 px-4 md:px-6 bg-expert-section">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            label="Responsabilidade Técnica"
            icon={Award}
            title="Conhecimento com Respaldo de Quem Entende da Área"
            description="Por trás de cada resposta do Odonto GPT, está a experiência de um profissional que já viveu suas dúvidas e desafios"
            align="center"
          />

          <div className="grid md:grid-cols-2 gap-12 items-center mt-12">
            <div className="space-y-6">
              <div className="relative flex justify-center">
                <div className="relative w-72 h-72 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full overflow-hidden shadow-2xl border-2 border-white/20 flex items-center justify-center">
                  <Image
                    src="/Imagens /roniery.jpg"
                    alt="Roniery Costa - Responsável Técnico do Odonto GPT"
                    width={288}
                    height={288}
                    className="w-72 h-72 object-contain object-center"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-primary">Roniery Costa</h3>
                <p className="text-muted-foreground">Responsável Técnico - CRO 4616/PB</p>
              </div>

              <div className="space-y-4">
                <p className="text-lg font-semibold text-white leading-relaxed border-l-4 border-primary pl-4 py-2 bg-primary/5">
                  "Criei o Odonto GPT para ser o consultor que eu gostaria de ter tido durante minha formação -
                  acessível 24/7, sem julgamentos, e com respostas fundamentadas na literatura que realmente importa."
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
                  "Cada resposta que você recebe passa pela minha curadoria técnica, garantindo que 
                  esteja sempre alinhada com as melhores práticas da odontologia moderna."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - substituted with redesigned pricing section using current values */}
      <section id="planos" className="w-full py-16 md:py-32 px-4 md:px-6 bg-pricing-section">
        <div className="mx-auto max-w-6xl space-y-10 md:space-y-12">
          <SectionHeader 
            label="Sua Vantagem Competitiva" 
            icon={TrendingUp} 
            title="Enquanto Seus Colegas Ainda Estão no Google, Você Já Tem a Resposta" 
            description="Acesso ilimitado ao consultor de odontologia 24/7 que vai te fazer economizar horas de estudo e te poupar de constrangimentos na clínica" 
            align="center" 
          />

          {/* Oferta Especial de Lançamento - ajustar conteúdo dentro dos cards e ordem: esquerda anual, direita mensal */}
          <div className="flex justify-center">
            {/* Plano Anual - Mais Econômico (esquerda) */}
            <Card className="relative overflow-hidden p-8 md:p-10 transition-all border-2 border-primary shadow-2xl md:scale-[1.04] bg-gradient-to-b from-primary/10 to-transparent w-full max-w-[560px] min-h-[480px]">
              {/* Fita de oferta especial apenas no plano anual */}
              <div className="pointer-events-none absolute -right-14 top-6 rotate-45 z-10">
                <span className="bg-accent text-accent-foreground px-16 py-1 text-xs font-semibold shadow-md">Oferta Especial</span>
              </div>
              <div className="text-center mb-5">
                <div className="flex justify-center mb-2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">ESCOLHA INTELIGENTE</span>
                </div>
                <h3 className="text-xl font-bold mb-1">Plano Anual</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-xs md:text-sm text-muted-foreground line-through">Valor normal: R$ 359,88/ano</span>
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl md:text-4xl font-extrabold text-primary">R$ 240</span>
                  <span className="text-muted-foreground">/ano</span>
                </div>
                <div className="mt-2 text-xs md:text-sm font-medium text-primary">Economize R$ 119,88 • Equivale a R$ 20/mês</div>
              </div>

              <ul className="space-y-3 mb-6">
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

              <a href="https://pay.kiwify.com.br/PQH9KhD" target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full shadow-lg" size="lg" variant="cta">
                  Garantir Meu Acesso Anual
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </Card>
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
                Garantia de 7 dias
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
                Cartão ou Boleto
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
          <a href="https://pay.kiwify.com.br/PQH9KhD" target="_blank" rel="noopener noreferrer">
            <Button
              size="xl"
              aria-label="Começar Agora"
              variant="cta"
              className="group shadow-primary/25"
            >
              Começar Agora
              <ArrowRight aria-hidden="true" className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="w-full py-16 md:py-32 px-4 md:px-6 bg-faq-section">
        <div className="mx-auto max-w-3xl space-y-10 md:space-y-12">
          <SectionHeader
            label="FAQ"
            icon={HelpCircle}
            title="Perguntas Frequentes"
            align="center"
          />

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="interactive-card border-2 rounded-xl">
              <AccordionTrigger className="font-bold text-lg px-4 py-3">Qual a diferença para o ChatGPT comum?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground px-4 pb-4">
                Odonto GPT é calibrado exclusivamente para odontologia com literatura e protocolos clínicos
                específicos da área.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="interactive-card border-2 rounded-xl">
              <AccordionTrigger className="font-bold text-lg px-4 py-3">Como funciona o acesso via WhatsApp?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground px-4 pb-4">
                Após pagar, você recebe o número da IA e fala normalmente pelo WhatsApp, como se fosse uma conversa
                comum.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="interactive-card border-2 rounded-xl">
              <AccordionTrigger className="font-bold text-lg px-4 py-3">As respostas são confiáveis?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground px-4 pb-4">
                Sim. Todas as respostas são baseadas em literatura odontológica reconhecida e evidências científicas
                atualizadas.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="interactive-card border-2 rounded-xl">
              <AccordionTrigger className="font-bold text-lg px-4 py-3">É para estudantes também?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground px-4 pb-4">
                Sim! Ajuda em provas, estágios, casos clínicos e todo o processo de aprendizado em odontologia.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="interactive-card border-2 rounded-xl">
              <AccordionTrigger className="font-bold text-lg px-4 py-3">Tem limite de perguntas?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground px-4 pb-4">
                Não. Você pode fazer quantas perguntas quiser, sem limites ou restrições.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="interactive-card border-2 rounded-xl">
              <AccordionTrigger className="font-bold text-lg px-4 py-3">Posso cancelar quando quiser?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground px-4 pb-4">
                Sim. Não há fidelidade. Você pode cancelar sua assinatura a qualquer momento.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="interactive-card border-2 rounded-xl">
              <AccordionTrigger className="font-bold text-lg px-4 py-3">Meus dados ficam seguros?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground px-4 pb-4">
                Sim. Todas as conversas são criptografadas e seguimos rigorosamente a LGPD para proteção de dados.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-footer">
        <div className="container mx-auto py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Logo width={180} height={40} className="footer-logo-white" />
                <span className="sr-only">Odonto GPT</span>
              </div>
              <p className="text-sm text-slate-400">Inteligência Artificial especializada em Odontologia</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-white">Produto</h4>
              <ul className="space-y-2 text-sm text-slate-400">
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
              <h4 className="font-semibold text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
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
              <h4 className="font-semibold text-white">Suporte</h4>
              <ul className="space-y-2 text-sm text-slate-400">
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

          <div className="mt-12 pt-8 border-t border-slate-700 text-center text-sm text-slate-400">
            <p>© 2025 Odonto GPT. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
 
}
