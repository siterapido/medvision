'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { motion } from "framer-motion"
import { FadeIn } from "@/components/ui/animations"
import {
    Award,
    Clock,
    CheckCircle2,
    ArrowRight,
    GraduationCap,
    Sparkles,
    Shield,
    BookOpen,
    Users,
    Star
} from "lucide-react"
import { CONSULTORIO_FUTURO_COURSE } from "@/lib/cakto"

export default function ConsultorioDoFuturoPage() {
    const checkoutUrl = CONSULTORIO_FUTURO_COURSE.checkoutUrl

    return (
        <main className="relative min-h-screen bg-[#0a0f1a]">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <div
                    className="absolute inset-0"
                    style={{
                        background: `
                            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.15), transparent),
                            radial-gradient(ellipse 60% 40% at 100% 50%, rgba(139, 92, 246, 0.1), transparent),
                            radial-gradient(ellipse 60% 40% at 0% 80%, rgba(6, 182, 212, 0.08), transparent),
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
                        <Button variant="ghost" className="text-white hover:text-emerald-400" asChild>
                            <Link href="/login">Entrar</Link>
                        </Button>
                        <Button
                            className="hidden sm:flex"
                            style={{
                                background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
                            }}
                            asChild
                        >
                            <Link href={checkoutUrl}>
                                Adquirir Agora
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Section 1: Hero */}
            <section className="relative z-10 w-full min-h-[80vh] flex items-center justify-center py-16 md:py-24 px-4 md:px-6">
                <div className="container mx-auto max-w-5xl text-center">
                    <FadeIn delay={0.1} direction="up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold mb-6">
                            <Award className="w-4 h-4" />
                            <span>Certificado de {CONSULTORIO_FUTURO_COURSE.hours} Horas</span>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.2} direction="up">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight mb-6">
                            Consultório do Futuro
                        </h1>
                    </FadeIn>

                    <FadeIn delay={0.3} direction="up">
                        <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto mb-8">
                            Domine as tecnologias e estratégias que estão transformando a odontologia moderna.
                            Prepare-se para o consultório do amanhã com um curso completo e certificado reconhecido.
                        </p>
                    </FadeIn>

                    <FadeIn delay={0.4} direction="up">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    size="lg"
                                    className="rounded-full px-8 py-6 text-lg font-semibold shadow-[0_10px_40px_rgba(16,185,129,0.3)] border-0 text-white"
                                    style={{
                                        background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
                                    }}
                                    asChild
                                >
                                    <Link href={checkoutUrl}>
                                        Garantir Minha Vaga
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </Link>
                                </Button>
                            </motion.div>
                            <Button variant="outline" size="lg" className="rounded-full px-8 py-6 text-lg border-slate-600 text-slate-300 hover:bg-slate-800" asChild>
                                <Link href="/login">
                                    Já sou aluno
                                </Link>
                            </Button>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.5} direction="up">
                        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-emerald-400" />
                                <span>{CONSULTORIO_FUTURO_COURSE.hours} horas de conteúdo</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-emerald-400" />
                                <span>Certificado incluso</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-emerald-400" />
                                <span>Acesso vitalício</span>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Section 2: Sobre o Curso e Certificado */}
            <section className="relative z-10 w-full py-16 md:py-24 px-4 md:px-6 bg-slate-900/30">
                <div className="container mx-auto max-w-6xl">
                    <FadeIn delay={0.1} direction="up">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                                O que você vai aprender
                            </h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">
                                Um programa completo para transformar sua prática odontológica
                            </p>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {[
                            {
                                icon: Sparkles,
                                title: "Tecnologias Emergentes",
                                description: "IA, scanner intraoral, impressão 3D e outras inovações que estão revolucionando a odontologia."
                            },
                            {
                                icon: BookOpen,
                                title: "Gestão Moderna",
                                description: "Estratégias de gestão e marketing digital para consultórios odontológicos de sucesso."
                            },
                            {
                                icon: Users,
                                title: "Experiência do Paciente",
                                description: "Como criar uma jornada memorável e fidelizar seus pacientes com excelência."
                            },
                            {
                                icon: Shield,
                                title: "Biossegurança Avançada",
                                description: "Protocolos atualizados de biossegurança e conformidade regulatória."
                            },
                            {
                                icon: Star,
                                title: "Casos Clínicos",
                                description: "Estudos de caso reais com aplicação prática dos conceitos aprendidos."
                            },
                            {
                                icon: Award,
                                title: "Certificação",
                                description: "Certificado de conclusão de 20 horas para enriquecer seu currículo."
                            }
                        ].map((item, index) => (
                            <FadeIn key={index} delay={0.1 * (index + 1)} direction="up">
                                <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors h-full">
                                    <CardContent className="p-6">
                                        <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                                            <item.icon className="w-6 h-6 text-emerald-400" />
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
                        <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
                            <CardContent className="p-8 md:p-12">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex-shrink-0">
                                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                            <Award className="w-12 h-12 md:w-16 md:h-16 text-white" />
                                        </div>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                            Certificado de {CONSULTORIO_FUTURO_COURSE.hours} Horas
                                        </h3>
                                        <p className="text-slate-300 mb-4 max-w-2xl">
                                            Ao concluir o curso, você receberá um certificado digital verificável que comprova
                                            suas {CONSULTORIO_FUTURO_COURSE.hours} horas de capacitação em tecnologias e gestão para o
                                            consultório do futuro. Ideal para enriquecer seu currículo e comprovar sua
                                            atualização profissional.
                                        </p>
                                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                            <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Verificação online</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Código único</span>
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
                            Comece sua transformação agora
                        </h2>
                    </FadeIn>

                    <FadeIn delay={0.2} direction="up">
                        <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                            Invista em seu futuro profissional. Adquira o curso Consultório do Futuro
                            e receba seu certificado de {CONSULTORIO_FUTURO_COURSE.hours} horas após a conclusão.
                        </p>
                    </FadeIn>

                    <FadeIn delay={0.3} direction="up">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    size="lg"
                                    className="rounded-full px-10 py-7 text-xl font-semibold shadow-[0_10px_40px_rgba(16,185,129,0.4)] border-0 text-white"
                                    style={{
                                        background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
                                    }}
                                    asChild
                                >
                                    <Link href={checkoutUrl}>
                                        Adquirir Curso + Certificado
                                        <ArrowRight className="ml-2 w-6 h-6" />
                                    </Link>
                                </Button>
                            </motion.div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.4} direction="up">
                        <p className="text-sm text-slate-500">
                            Pagamento seguro via Cakto. Acesso imediato após confirmação.
                        </p>
                    </FadeIn>

                    {/* Quick Links */}
                    <FadeIn delay={0.5} direction="up">
                        <div className="mt-12 pt-8 border-t border-slate-800">
                            <p className="text-slate-400 mb-4">Já possui uma conta?</p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" asChild>
                                    <Link href="/login">
                                        Fazer Login
                                    </Link>
                                </Button>
                                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" asChild>
                                    <Link href="/register">
                                        Criar Conta Grátis
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
