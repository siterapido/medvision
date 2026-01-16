'use client'

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { PenTool, FileText, BookOpen, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"

export function AgentDemoWrite() {
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref, { once: false, amount: 0.4 })
    const [stage, setStage] = useState(0)
    const [typedText, setTypedText] = useState("")

    const fullText = "A reabilitação oral com implantes osseointegrados representa uma das mais significativas evoluções da odontologia moderna. Desde os estudos pioneiros de Brånemark na década de 1960..."

    useEffect(() => {
        if (!isInView) {
            setStage(0)
            setTypedText("")
            return
        }

        const timers = [
            setTimeout(() => setStage(1), 500),
            setTimeout(() => setStage(2), 1500),
            setTimeout(() => setStage(3), 2500),
        ]

        return () => timers.forEach(clearTimeout)
    }, [isInView])

    useEffect(() => {
        if (stage >= 2) {
            let i = 0
            const interval = setInterval(() => {
                if (i < fullText.length) {
                    setTypedText(fullText.slice(0, i + 1))
                    i++
                } else {
                    clearInterval(interval)
                }
            }, 30)
            return () => clearInterval(interval)
        }
    }, [stage])

    const sections = [
        { name: "1. Introdução", status: "complete" },
        { name: "2. Revisão de Literatura", status: "complete" },
        { name: "3. Metodologia", status: "writing" },
        { name: "4. Resultados", status: "pending" },
        { name: "5. Discussão", status: "pending" },
        { name: "6. Conclusão", status: "pending" },
    ]

    return (
        <div ref={ref} className="relative py-20 overflow-hidden">

            <div className="container mx-auto max-w-6xl px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">

                    {/* Texto */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8 }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#30D158]/10 border border-[#30D158]/20">
                            <PenTool className="w-5 h-5 text-[#30D158]" />
                            <span className="text-[#30D158] font-semibold">Odonto Write</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                            Seu TCC começa<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#30D158] via-[#00C7BE] to-[#00B4D8]">
                                bem estruturado
                            </span>
                        </h2>

                        <p className="text-lg text-slate-300 leading-relaxed">
                            Estruture artigos, TCCs e relatórios com linguagem técnica correta e referências formatadas automaticamente.
                        </p>

                        <div className="space-y-3">
                            {[
                                "Estruturação completa de trabalhos acadêmicos",
                                "Linguagem técnica e científica apropriada",
                                "Formatação automática em ABNT ou Vancouver"
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ delay: 0.5 + i * 0.2 }}
                                    className="flex items-center gap-3 text-slate-300"
                                >
                                    <CheckCircle2 className="w-5 h-5 text-[#30D158] shrink-0" />
                                    <span>{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Animação */}
                    <div className="relative">
                        <Card className="p-6 bg-slate-900/80 border-[#30D158]/20 backdrop-blur-xl rounded-2xl">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-[#30D158] via-[#00C7BE] to-[#00B4D8]">
                                    <PenTool className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="font-semibold text-white">Odonto Write</div>
                                    <div className="text-xs text-slate-400">Estruturando TCC...</div>
                                </div>
                            </div>

                            <div className="min-h-[320px] space-y-4">
                                {/* Estrutura do documento */}
                                {stage >= 1 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-2"
                                    >
                                        <div className="text-xs text-slate-500 mb-2">Estrutura do documento:</div>
                                        <div className="flex flex-wrap gap-2">
                                            {sections.map((section, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${section.status === 'complete'
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                        : section.status === 'writing'
                                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                            : 'bg-slate-700 text-slate-400 border border-slate-600'
                                                        }`}
                                                >
                                                    {section.status === 'complete' && <CheckCircle2 className="w-3 h-3" />}
                                                    {section.status === 'writing' && (
                                                        <motion.span
                                                            animate={{ opacity: [1, 0.3, 1] }}
                                                            transition={{ duration: 1, repeat: Infinity }}
                                                        >
                                                            ✍️
                                                        </motion.span>
                                                    )}
                                                    {section.name}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Área de escrita */}
                                {stage >= 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                                    >
                                        <div className="flex items-center gap-2 mb-3 text-xs text-emerald-400">
                                            <FileText className="w-4 h-4" />
                                            <span>1. Introdução</span>
                                        </div>
                                        <div className="font-serif text-slate-300 text-sm leading-relaxed">
                                            {typedText}
                                            <motion.span
                                                animate={{ opacity: [1, 0] }}
                                                transition={{ duration: 0.5, repeat: Infinity }}
                                                className="inline-block w-0.5 h-4 bg-emerald-400 ml-0.5"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {/* Referências */}
                                {stage >= 3 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 text-xs text-slate-400 mt-4"
                                    >
                                        <BookOpen className="w-4 h-4 text-emerald-400" />
                                        <span>12 referências formatadas em ABNT adicionadas automaticamente</span>
                                    </motion.div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
