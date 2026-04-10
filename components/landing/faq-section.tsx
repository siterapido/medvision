"use client"

import { HelpCircle, ArrowRight } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/animations"

export function FAQSection() {
    return (
        <section id="faq" className="w-full py-24 md:py-32 px-4 md:px-6 relative overflow-hidden z-10">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#2399B4]/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="container mx-auto max-w-4xl relative z-10">
                <FadeIn direction="up">
                    <div className="text-center mb-16 space-y-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-md">
                            <HelpCircle className="w-4 h-4 text-cyan-400" />
                            <span className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest">Dúvidas Frequentes</span>
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tighter">
                            Perguntas <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22d3ee] to-[#a855f7]">Frequentes.</span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Tudo o que você precisa saber para começar sua jornada com o MedVision.
                        </p>
                    </div>
                </FadeIn>

                <StaggerContainer>
                    <Accordion type="single" collapsible className="space-y-4 w-full">
                        {[
                            {
                                q: "Qual a diferença para o ChatGPT comum?",
                                a: "O MedVision não é apenas uma IA genérica. Ele foi treinado especificamente com literatura odontológica, protocolos clínicos brasileiros e artigos científicos de alto impacto. Diferente do ChatGPT comum, ele entende o contexto clínico real e fornece referências técnicas precisas."
                            },
                            {
                                q: "Como funciona o acesso via WhatsApp?",
                                a: "Após a confirmação da assinatura, você recebe acesso imediato ao número oficial. Você pode enviar mensagens de texto, áudio e até fotos para análise. É como ter um doutor especialista disponível no seu bolso 24h por dia, sem precisar instalar novos aplicativos."
                            },
                            {
                                q: "As respostas são confiáveis?",
                                a: "Sim. A base de conhecimento é curada por mestres e doutores em odontologia. No entanto, lembre-se que a IA é uma ferramenta de suporte e auxílio à decisão clínica; a responsabilidade final pelo tratamento é sempre do cirurgião-dentista."
                            },
                            {
                                q: "É para estudantes também?",
                                a: "Com certeza! É um acelerador absurdo para estudantes. Ajuda a entender casos complexos, sugere diagnósticos diferenciais, explica prescrições e até auxilia na redação de trabalhos acadêmicos com linguagem técnica apropriada."
                            },
                            {
                                q: "Tem limite de perguntas?",
                                a: "No plano anual, o uso é liberado para que você possa estudar e trabalhar sem preocupações. Temos apenas filtros de segurança para evitar abusos e garantir a melhor performance para todos os usuários."
                            },
                            {
                                q: "Posso cancelar quando quiser?",
                                a: "Sim. Nossas assinaturas via Kiwify são transparentes. Você pode gerenciar seu plano a qualquer momento e o cancelamento é feito com apenas um clique, sem burocracia ou multas."
                            },
                            {
                                q: "Meus dados ficam seguros?",
                                a: "Segurança é nossa prioridade. Suas conversas são privadas e criptografadas. Seguimos as diretrizes da LGPD para garantir que suas informações de estudo e casos clínicos estejam sempre protegidas."
                            }
                        ].map((item, i) => (
                            <StaggerItem key={i}>
                                <AccordionItem
                                    value={`item-${i}`}
                                    className="border border-slate-800 bg-slate-900/40 backdrop-blur-xl rounded-2xl overflow-hidden px-2 hover:border-[#22d3ee]/30 transition-all duration-300 group"
                                >
                                    <AccordionTrigger className="text-left text-lg font-bold py-6 px-4 hover:no-underline hover:text-[#22d3ee] transition-colors [&[data-state=open]>span>span]:text-[#22d3ee]">
                                        <span className="flex items-center gap-4">
                                            <span className="text-slate-600 font-mono text-sm transition-colors">0{i + 1}</span>
                                            {item.q}
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-slate-400 text-base leading-relaxed px-12 pb-6">
                                        {item.a}
                                    </AccordionContent>
                                </AccordionItem>
                            </StaggerItem>
                        ))}
                    </Accordion>
                </StaggerContainer>

                <FadeIn delay={0.4}>
                    <div className="mt-16 pt-8 border-t border-slate-800 text-center">
                        <p className="text-slate-500 mb-6 font-medium">Ainda tem alguma dúvida específica?</p>
                        <button className="group relative px-8 py-3 rounded-full overflow-hidden transition-all">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-10 group-hover:opacity-20 transition-opacity" />
                            <div className="absolute inset-0 border border-slate-700 rounded-full group-hover:border-cyan-500/50 transition-colors" />
                            <span className="relative text-white font-semibold flex items-center gap-2">
                                Falar com Suporte Humano
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </div>
                </FadeIn>
            </div>
        </section>
    )
}
