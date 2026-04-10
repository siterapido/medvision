"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Lock, Eye, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface UnavailablePageProps {
    title: string
    description?: string
}

export function UnavailablePage({
    title,
    description = "Esta funcionalidade está em manutenção ou será liberada em breve para sua conta. Utilize o Odonto Vision para análise de imagens."
}: UnavailablePageProps) {
    const router = useRouter()

    const handleBackToVision = () => {
        router.push("/dashboard/odonto-vision")
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden bg-slate-950">
            {/* Background Layer */}
            <div className="absolute inset-0 bg-slate-950" />

            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                    "relative max-w-md w-full overflow-hidden rounded-[2.5rem] border border-slate-800/50",
                    "bg-[#0a0f1f]/90 backdrop-blur-3xl shadow-2xl p-10 text-center",
                    "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.05] before:to-transparent before:pointer-events-none"
                )}
            >
                {/* Internal Glow */}
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10 space-y-8">
                    {/* Icon Container */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-3xl animate-pulse" />
                            <div className="relative h-20 w-20 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center shadow-inner overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent" />
                                <Lock className="h-9 w-9 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-slate-50 tracking-tight">
                            {title}
                        </h2>
                        <p className="text-slate-300 text-sm leading-relaxed max-w-[300px] mx-auto font-medium">
                            {description}
                        </p>
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={handleBackToVision}
                            className={cn(
                                "w-full group relative overflow-hidden h-14 rounded-2xl text-white font-semibold transition-all duration-500",
                                "bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-400/40 hover:scale-[1.02]",
                                "shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]"
                            )}
                        >
                            <div className="flex items-center justify-center gap-3">
                                <Eye className="w-5 h-5 transition-transform duration-500 group-hover:rotate-12 text-cyan-200" />
                                <span className="tracking-wide text-cyan-50">Ir para o Odonto Vision</span>
                                <ArrowLeft className="w-4 h-4 ml-auto opacity-30 group-hover:-translate-x-1 transition-transform text-cyan-200" />
                            </div>
                        </Button>
                    </div>

                    <div className="flex flex-col items-center gap-1 pt-4">
                        <div className="w-8 h-[1px] bg-cyan-500/20" />
                        <p className="text-[10px] text-cyan-400/30 uppercase tracking-[0.3em] font-bold">
                            OdontoGPT System
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
