'use client'

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Eye, Scan, Target, AlertCircle, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { FadeIn } from "@/components/ui/animations"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AiVisionSection() {
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref, { once: false, amount: 0.4 })
    const [stage, setStage] = useState(0)

    useEffect(() => {
        if (!isInView) {
            const timer = setTimeout(() => setStage(0), 0)
            return () => clearTimeout(timer)
        }

        const timers = [
            setTimeout(() => setStage(1), 500),   // Imagem aparece
            setTimeout(() => setStage(2), 1500),  // Scanner passa
            setTimeout(() => setStage(3), 3500),  // Marcações aparecem
            setTimeout(() => setStage(4), 5000),  // Laudo aparece
        ]

        return () => timers.forEach(clearTimeout)
    }, [isInView])

    const findings = [
        { x: 20, y: 30, label: "Lesão periapical", color: "red" },
        { x: 60, y: 45, label: "Cárie interproximal", color: "orange" },
        { x: 75, y: 25, label: "Restauração íntegra", color: "green" },
    ]

    return (
        <section ref={ref} className="py-24 relative overflow-hidden bg-[#0F192F]">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <FadeIn direction="right">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm font-semibold">
                                <Eye className="w-4 h-4" />
                                <span>Odonto Vision (Pro)</span>
                            </div>

                            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                                Analisa e Lauda <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Radiografias</span>
                            </h2>

                            <div className="space-y-6 text-lg text-slate-300 leading-relaxed">
                                <p>
                                    Envie radiografias odontológicas e receba laudos automáticos
                                    com sugestões diagnósticas baseadas em IA.
                                </p>

                                <p className="font-medium text-slate-100 text-xl border-l-4 border-purple-500 pl-4 py-1">
                                    Já imaginou enviar uma radiografia e a IA laudar para você?
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link href="/register">
                                    <Button className="w-full sm:w-auto rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 h-12 px-8 text-base">
                                        Testar Vision Agora
                                    </Button>
                                </Link>
                                <Link href="#como-funciona">
                                    <Button variant="outline" className="w-full sm:w-auto rounded-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-white h-12 px-8 text-base">
                                        Ver Demonstração
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn direction="left" delay={0.2}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 blur-xl rounded-2xl" />
                            <Card className="p-6 bg-slate-900/80 border-purple-500/30 backdrop-blur-xl rounded-2xl overflow-hidden relative z-10">
                                {/* Visual content from AgentDemoVision */}
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
                                    <motion.div
                                        animate={stage >= 2 ? { scale: [1, 1.1, 1] } : {}}
                                        transition={{ duration: 0.5, repeat: stage === 2 ? Infinity : 0, repeatDelay: 0.5 }}
                                        className="p-2 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600"
                                    >
                                        <Eye className="w-6 h-6 text-white" />
                                    </motion.div>
                                    <div>
                                        <div className="font-semibold text-white">Odonto Vision</div>
                                        <div className="text-xs text-slate-400">
                                            {stage < 2 ? "Aguardando imagem..." : stage === 2 ? "Processando..." : "Análise concluída"}
                                        </div>
                                    </div>
                                    {stage === 2 && (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="ml-auto"
                                        >
                                            <Scan className="w-5 h-5 text-purple-400" />
                                        </motion.div>
                                    )}
                                </div>

                                <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden mb-4">
                                    {stage >= 1 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center"
                                        >
                                            <div className="text-center">
                                                <div className="text-6xl mb-2">🦷</div>
                                                <div className="text-xs text-slate-500">Radiografia Periapical</div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {stage === 2 && (
                                        <motion.div
                                            initial={{ top: 0 }}
                                            animate={{ top: "100%" }}
                                            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
                                            style={{ boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)", willChange: "top" }}
                                        />
                                    )}

                                    {stage >= 3 && findings.map((finding, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: i * 0.3, type: "spring" }}
                                            className="absolute"
                                            style={{ left: `${finding.x}%`, top: `${finding.y}%` }}
                                        >
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                <Target
                                                    className="w-8 h-8"
                                                    style={{
                                                        color: finding.color === 'red' ? '#ef4444' :
                                                            finding.color === 'orange' ? '#f97316' : '#22c55e'
                                                    }}
                                                />
                                            </motion.div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded text-xs font-medium
                                                    ${finding.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                                                        finding.color === 'orange' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                                                            'bg-green-500/20 text-green-400 border border-green-500/40'}`}
                                            >
                                                {finding.label}
                                            </motion.div>
                                        </motion.div>
                                    ))}
                                </div>

                                {stage >= 4 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20"
                                    >
                                        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-purple-400">
                                            <AlertCircle className="w-4 h-4" />
                                            Laudo IA
                                        </div>
                                        <div className="space-y-2 text-sm text-slate-300">
                                            <div className="p-2 bg-purple-500/10 rounded border border-purple-500/10">
                                                <strong>Conclusão:</strong> Sugestão de lesão periapical crônica no elemento 36.
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </Card>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    )
}
