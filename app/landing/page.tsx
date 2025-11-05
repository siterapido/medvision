import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-cyan-50/30 to-background">
      {/* Header/Nav */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Odonto GPT
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#como-funciona" className="text-sm font-medium hover:text-primary transition-colors">
              Como Funciona
            </Link>
            <Link href="#beneficios" className="text-sm font-medium hover:text-primary transition-colors">
              Benefícios
            </Link>
            <Link href="#planos" className="text-sm font-medium hover:text-primary transition-colors">
              Planos
            </Link>
            <Link href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="mx-auto max-w-5xl text-center space-y-8">
          <Badge className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-primary/20 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 mr-1.5 inline" />
            Inteligência Artificial Especializada
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
            Inteligência Artificial para{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-cyan-400 bg-clip-text text-transparent">
              Odontologia
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto text-balance leading-relaxed">
            Suporte clínico e educacional via WhatsApp. Dúvidas, prescrições e orientações baseadas em literatura
            científica.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="font-medium">IA Especializada em Odontologia</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="font-medium">Base Científica</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="font-medium">Via WhatsApp — 24/7</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 h-14 shadow-lg shadow-primary/25"
              >
                Contratar Odonto GPT
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#planos">
              <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2 bg-transparent">
                Ver Planos
              </Button>
            </Link>
          </div>

          {/* Social Proof Metrics */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Profissionais</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Disponível</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">98%</div>
              <div className="text-sm text-muted-foreground">Satisfação</div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Odonto GPT */}
      <section className="container py-20 md:py-32">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-balance">
              Revolucione seus estudos e prática odontológica
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
              Com o Odonto GPT, você tem uma IA treinada exclusivamente em odontologia, integrada ao WhatsApp. Ela
              responde dúvidas, sugere prescrições e oferece orientações clínicas com base em livros e artigos
              científicos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-colors">
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

            <Card className="border-2 hover:border-primary/50 transition-colors">
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

            <Card className="border-2 hover:border-primary/50 transition-colors">
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
      <section id="como-funciona" className="container py-20 md:py-32 bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-balance">
              Três passos simples para revolucionar sua prática
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg">
                1
              </div>
              <Card className="pt-12 border-2">
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
              <Card className="pt-12 border-2">
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
              <Card className="pt-12 border-2">
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
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                Pronto para começar?
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="container py-20 md:py-32">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-balance">Por que escolher o Odonto GPT?</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <Zap className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Agilidade Clínica</h3>
                <p className="text-sm text-muted-foreground">Respostas em segundos durante atendimentos.</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Apoio Educacional</h3>
                <p className="text-sm text-muted-foreground">Ajuda em estudos, residência e provas.</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <Shield className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Respostas Seguras</h3>
                <p className="text-sm text-muted-foreground">Baseadas em literatura e evidências científicas.</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <Clock className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Disponibilidade 24/7</h3>
                <p className="text-sm text-muted-foreground">Ilimitado via WhatsApp, sempre que precisar.</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <Award className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Prescrições Personalizadas</h3>
                <p className="text-sm text-muted-foreground">Sugestões com dosagens adequadas.</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <MessageSquare className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Interface Familiar</h3>
                <p className="text-sm text-muted-foreground">Funciona no WhatsApp, sem aprender nada novo.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-20 md:py-32 bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-balance">O que dizem nossos usuários</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2">
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground italic">
                  "Revolucionou meus estudos! Respostas embasadas e rápidas."
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                    AC
                  </div>
                  <div>
                    <div className="font-semibold">Dr. Ana Carolina Silva</div>
                    <div className="text-sm text-muted-foreground">8º período</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground italic">"É como ter um mentor disponível 24h no WhatsApp."</p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                    RM
                  </div>
                  <div>
                    <div className="font-semibold">Dr. Rafael Martins</div>
                    <div className="text-sm text-muted-foreground">Cirurgião-Dentista</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground italic">"A praticidade pelo WhatsApp é sensacional."</p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                    MO
                  </div>
                  <div>
                    <div className="font-semibold">Dra. Marina Oliveira</div>
                    <div className="text-sm text-muted-foreground">Residente</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="container py-20 md:py-32">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-4">
            <Badge className="bg-gradient-to-r from-destructive/10 to-warning/10 text-destructive border-destructive/20 px-4 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5 inline" />
              Oferta Especial de Lançamento
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-balance">Escolha seu plano</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <Card className="border-2 hover:border-primary/50 transition-colors relative">
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
                  <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90" size="lg">
                    Assinar Mensal
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Annual Plan */}
            <Card className="border-2 border-primary shadow-lg shadow-primary/25 relative">
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
                  <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90" size="lg">
                    Assinar Anual
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container py-20 md:py-32 bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold text-balance">Transforme sua prática hoje mesmo</h2>
          <p className="text-lg md:text-xl text-muted-foreground text-balance">
            Junte-se aos profissionais que já estão usando IA especializada na rotina clínica e acadêmica.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 h-14 shadow-lg shadow-primary/25"
            >
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container py-20 md:py-32">
        <div className="mx-auto max-w-3xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-balance">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-4">
            <Card className="border-2">
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-bold text-lg">Qual a diferença para o ChatGPT comum?</h3>
                <p className="text-muted-foreground">
                  Odonto GPT é calibrado exclusivamente para odontologia com literatura e protocolos clínicos
                  específicos da área.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-bold text-lg">Como funciona o acesso via WhatsApp?</h3>
                <p className="text-muted-foreground">
                  Após pagar, você recebe o número da IA e fala normalmente pelo WhatsApp, como se fosse uma conversa
                  comum.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-bold text-lg">As respostas são confiáveis?</h3>
                <p className="text-muted-foreground">
                  Sim. Todas as respostas são baseadas em literatura odontológica reconhecida e evidências científicas
                  atualizadas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-bold text-lg">É para estudantes também?</h3>
                <p className="text-muted-foreground">
                  Sim! Ajuda em provas, estágios, casos clínicos e todo o processo de aprendizado em odontologia.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-bold text-lg">Tem limite de perguntas?</h3>
                <p className="text-muted-foreground">
                  Não. Você pode fazer quantas perguntas quiser, sem limites ou restrições.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-bold text-lg">Posso cancelar quando quiser?</h3>
                <p className="text-muted-foreground">
                  Sim. Não há fidelidade. Você pode cancelar sua assinatura a qualquer momento.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
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
      <footer className="border-t bg-muted/50">
        <div className="container py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Odonto GPT
                </span>
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
