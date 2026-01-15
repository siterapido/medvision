"use client"

import { HelpCircle } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SectionHeader } from "@/components/ui/section-header"

export function FAQSection() {
    return (
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
    )
}
