'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { motion } from "motion/react"
import { FadeIn } from "@/components/ui/animations"
import {
    Award,
    Clock,
    CheckCircle2,
    ArrowRight,
    GraduationCap,
    Sparkles,
    Shield,
    Calendar,
    Video,
    Brain,
    Stethoscope,
    Zap
} from "lucide-react"
import { PALESTRA_IA_EVENT } from "@/lib/cakto"

export default function PalestraIAPage() {
    const checkoutUrl = PALESTRA_IA_EVENT.checkoutUrl

    return (
        <main className="relative min-h-screen bg-[#0a0f1a]">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <div
                    className="absolute inset-0"
                    style={{
                        background: `
                            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.18), transparent),
                            radial-gradient(ellipse 60% 40% at 100% 50%, rgba(16, 185, 129, 0.12), transparent),
                            radial-gradient(ellipse 60% 40% at 0% 80%, rgba(59, 130, 246, 0.08), transparent),
                            linear-gradient(to bottom, #0a0f1a, #0F192F)
                        `
                    }}
                />
            </div>

            {/* Header */}
            <header className="relative z-10 w-full py-4 px-4 md:px-6">
                <div className="container mx-auto flex justify-between items-center">
                    <Link href="/">
                        <Logo variant="white" width={140} height={30} />
                    </Link>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="text-white hover:text-violet-400" asChild>
                            <Link href="/login">Entrar</Link>
                        </Button>
                        <Button
                            className="hidden sm:flex border-0 text-white"
                            style={{
                                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                            }}
                            asChild
                        >
                            <Link href={checkoutUrl}>
                                Garantir Certificado
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Section 1: Hero */}
            <section className="relative z-10 w-full min-h-[85vh] flex items-center justify-center py-16 md:py-24 px-4 md:px-6">
                <div className="container mx-auto max-w-5xl text-center">
                    <FadeIn delay={0.1} direction="up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-sm font-semibold mb-4">
                            <Video className="w-4 h-4" />
                            <span>Palestra Online ao Vivo</span>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.15} direction="up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold mb-6 ml-2">
                            <Award className="w-4 h-4" />
                            <span>Certificado de {PALESTRA_IA_EVENT.hours} Horas</span>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.2} direction="up">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white leading-tight mb-6">
                            Consultório do Futuro
                            <br />
                            <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
                                na Odontologia (IA)
                            </span>
                        </h1>
                    </FadeIn>

                    <FadeIn delay={0.3} direction="up">
                        <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto mb-8">
                            Descubra como a Inteligência Artificial está revolucionando a odontologia.
                            Palestra exclusiva da Odonto GPT com certificado de {PALESTRA_IA_EVENT.hours} horas.
                        </p>
                    </FadeIn>

                    {/* Event Date/Time Highlight */}
                    <FadeIn delay={0.35} direction="up">
                        <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
                            <div className="flex items-center gap-2 text-white">
                                <Calendar className="w-5 h-5 text-violet-400" />
                                <span className="font-semibold">Hoje, 05/02/2026</span>
                            </div>
                            <div className="w-px h-6 bg-white/20" />
                            <div className="flex items-center gap-2 text-white">
                                <Clock className="w-5 h-5 text-emerald-400" />
                                <span className="font-semibold">20h (Horário de Brasília)</span>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.4} direction="up">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    size="lg"
                                    className="rounded-full px-8 py-6 text-lg font-semibold shadow-[0_10px_40px_rgba(139,92,246,0.3)] border-0 text-white"
                                    style={{
                                        background: 'linear-gradient(135deg, #8B5CF6 0%, #10B981 100%)'
                                    }}
                                    asChild
                                >
                                    <Link href={checkoutUrl}>
                                        Garantir Meu Certificado
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </Link>
                                </Button>
                            </motion.div>
                            <Button variant="outline" size="lg" className="rounded-full px-8 py-6 text-lg border-slate-600 text-slate-300 hover:bg-slate-800" asChild>
                                <Link href="/login">
                                    Ja sou aluno
                                </Link>
                            </Button>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.5} direction="up">
                        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-violet-400" />
                                <span>Certificado de {PALESTRA_IA_EVENT.hours}h incluso</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-violet-400" />
                                <span>Ao vivo online</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-violet-400" />
                                <span>Acesso imediato</span>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Section 2: O que voce vai aprender */}
            <section className="relative z-10 w-full py-16 md:py-24 px-4 md:px-6 bg-slate-900/30">
                <div className="container mx-auto max-w-6xl">
                    <FadeIn delay={0.1} direction="up">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                                O que voce vai aprender
                            </h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">
                                Conteudo exclusivo sobre o futuro da odontologia com Inteligencia Artificial
                            </p>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {[
                            {
                                icon: Brain,
                                title: "IA na Odontologia",
                                description: "Como a Inteligencia Artificial esta transformando diagnosticos, planejamento de tratamentos e atendimento ao paciente."
                            },
                            {
                                icon: Stethoscope,
                                title: "Diagnostico por IA",
                                description: "Ferramentas de analise de imagens e radiografias assistidas por IA para maior precisao diagnostica."
                            },
                            {
                                icon: Sparkles,
                                title: "Tecnologias Emergentes",
                                description: "Scanner intraoral, impressao 3D, CAD/CAM e outras inovacoes que estao revolucionando a odontologia."
                            },
                            {
                                icon: Zap,
                                title: "Automacao do Consultorio",
                                description: "Como automatizar processos administrativos, agendamentos e comunicacao com pacientes usando IA."
                            },
                            {
                                icon: Shield,
                                title: "Etica e Regulamentacao",
                                description: "Aspectos eticos e regulatorios do uso de IA na pratica odontologica e protecao de dados."
                            },
                            {
                                icon: Award,
                                title: "Certificacao de 20h",
                                description: "Certificado de participacao com carga horaria de 20 horas para enriquecer seu curriculo profissional."
                            }
                        ].map((item, index) => (
                            <FadeIn key={index} delay={0.1 * (index + 1)} direction="up">
                                <Card className="bg-slate-800/50 border-slate-700 hover:border-violet-500/50 transition-colors h-full">
                                    <CardContent className="p-6">
                                        <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4">
                                            <item.icon className="w-6 h-6 text-violet-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                        <p className="text-slate-400 text-sm">{item.description}</p>
                                    </CardContent>
                                </Card>
                            </FadeIn>
                        ))}
                    </div>

                    {/* Certificate Highlight */}
                    <FadeIn delay={0.3} direction="up">
                        <Card className="bg-gradient-to-r from-violet-500/10 to-emerald-500/10 border-violet-500/30">
                            <CardContent className="p-8 md:p-12">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex-shrink-0">
                                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center">
                                            <Award className="w-12 h-12 md:w-16 md:h-16 text-white" />
                                        </div>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                            Certificado de {PALESTRA_IA_EVENT.hours} Horas
                                        </h3>
                                        <p className="text-slate-300 mb-4 max-w-2xl">
                                            Ao participar da palestra, voce recebera um certificado digital verificavel
                                            de {PALESTRA_IA_EVENT.hours} horas que comprova sua participacao no evento
                                            &ldquo;Consultorio do Futuro na Odontologia (IA)&rdquo;. Ideal para enriquecer
                                            seu curriculo e comprovar sua atualizacao profissional.
                                        </p>
                                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                            <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Verificacao online</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Codigo unico</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Download em PDF</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </FadeIn>
                </div>
            </section>

            {/* Section 3: CTA Final */}
            <section className="relative z-10 w-full py-16 md:py-24 px-4 md:px-6">
                <div className="container mx-auto max-w-4xl text-center">
                    <FadeIn delay={0.1} direction="up">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                            Garanta seu certificado agora
                        </h2>
                    </FadeIn>

                    <FadeIn delay={0.2} direction="up">
                        <p className="text-lg text-slate-300 mb-4 max-w-2xl mx-auto">
                            Participe da palestra &ldquo;Consultorio do Futuro na Odontologia (IA)&rdquo;
                            e receba seu certificado de {PALESTRA_IA_EVENT.hours} horas.
                        </p>
                        <p className="text-md text-violet-300 mb-8 font-semibold">
                            Hoje, 05/02/2026 as 20h (Horario de Brasilia)
                        </p>
                    </FadeIn>

                    <FadeIn delay={0.3} direction="up">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    size="lg"
                                    className="rounded-full px-10 py-7 text-xl font-semibold shadow-[0_10px_40px_rgba(139,92,246,0.4)] border-0 text-white"
                                    style={{
                                        background: 'linear-gradient(135deg, #8B5CF6 0%, #10B981 100%)'
                                    }}
                                    asChild
                                >
                                    <Link href={checkoutUrl}>
                                        Adquirir Certificado
                                        <ArrowRight className="ml-2 w-6 h-6" />
                                    </Link>
                                </Button>
                            </motion.div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.4} direction="up">
                        <p className="text-sm text-slate-500">
                            Pagamento seguro via Cakto. Acesso imediato apos confirmacao.
                        </p>
                    </FadeIn>

                    {/* Quick Links */}
                    <FadeIn delay={0.5} direction="up">
                        <div className="mt-12 pt-8 border-t border-slate-800">
                            <p className="text-slate-400 mb-4">Ja possui uma conta?</p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" asChild>
                                    <Link href="/login">
                                        Fazer Login
                                    </Link>
                                </Button>
                                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" asChild>
                                    <Link href="/register">
                                        Criar Conta Gratis
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 w-full py-8 px-4 md:px-6 border-t border-slate-800">
                <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4">
                    <Link href="/">
                        <Logo variant="white" width={100} height={22} />
                    </Link>
                    <p className="text-sm text-slate-500">
                        {new Date().getFullYear()} Odonto GPT. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </main>
    )
}
