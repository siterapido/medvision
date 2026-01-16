"use client"

import { motion } from "framer-motion"
import {
    FlaskConical,
    GraduationCap,
    FileText,
    ScanEye,
    MessageCircle,
    Sparkles,
    Database
} from "lucide-react"

interface AgentNodeProps {
    icon: any
    label: string
    color: string
    delay: number
    position: string // Tailwind classes for positioning
}

const AgentNode = ({ icon: Icon, label, color, delay, position }: AgentNodeProps) => {
    return (
        <motion.div
            className={`absolute flex flex-col items-center gap-1 md:gap-2 ${position}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.5, type: "spring" }}
        >
            <motion.div
                className={`relative p-2.5 md:p-4 rounded-xl md:rounded-2xl backdrop-blur-md border border-white/20 shadow-xl ${color}`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                animate={{
                    y: [0, -5, 0],
                }}
                transition={{
                    y: { duration: 3 + Math.random(), repeat: Infinity, ease: "easeInOut" },
                }}
            >
                <Icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </motion.div>
            <span className="text-[9px] md:text-xs font-semibold text-slate-200 bg-slate-900/80 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full backdrop-blur-sm shadow-sm whitespace-nowrap">
                {label}
            </span>
        </motion.div>
    )
}

export function AgentHeroVisual() {
    // Agentes com ícones e cores padronizados - Gradientes estilo Apple
    const agents = [
        {
            id: 1,
            icon: FlaskConical,
            label: "Pesquisador",
            color: "bg-gradient-to-br from-[#BF5AF2] via-[#9D4EDD] to-[#7B2CBF]",
            position: "left-[2%] top-[28%] md:left-[10%] md:top-[20%]"
        },
        {
            id: 2,
            icon: GraduationCap,
            label: "Estudos",
            color: "bg-gradient-to-br from-[#FF9F0A] via-[#FF6B35] to-[#FF453A]",
            position: "right-[2%] top-[22%] md:right-[8%] md:top-[25%]"
        },
        {
            id: 3,
            icon: FileText,
            label: "Redator",
            color: "bg-gradient-to-br from-[#30D158] via-[#00C7BE] to-[#00B4D8]",
            position: "left-[2%] bottom-[18%] md:left-[12%] md:bottom-[15%]"
        },
        {
            id: 4,
            icon: MessageCircle,
            label: "Consultor",
            color: "bg-gradient-to-br from-[#5E5CE6] via-[#7C3AED] to-[#A855F7]",
            position: "right-[2%] bottom-[15%] md:right-[5%] md:bottom-[10%]"
        },
        {
            id: 5,
            icon: ScanEye,
            label: "Diagnóstico",
            color: "bg-gradient-to-br from-[#FF6B6B] via-[#EE5A70] to-[#DA4167]",
            position: "left-1/2 -translate-x-1/2 top-[2%] md:top-[3%]"
        },
    ]

    return (
        <div className="relative w-full aspect-square max-w-[320px] md:max-w-2xl mx-auto perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-full blur-3xl transform -translate-y-10" />

            {/* Central Core */}
            <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
            >
                <div className="relative w-24 h-24 md:w-40 md:h-40 bg-white rounded-full shadow-[0_0_60px_-15px_rgba(8,145,178,0.3)] flex items-center justify-center z-20">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-200 animate-spin-slow" />
                    <motion.div
                        className="w-16 h-16 md:w-28 md:h-28 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full flex items-center justify-center p-4 md:p-6 shadow-inner"
                        animate={{
                            background: [
                                "linear-gradient(to top right, #06b6d4, #2563eb)",
                                "linear-gradient(to top right, #0891b2, #3b82f6)",
                                "linear-gradient(to top right, #06b6d4, #2563eb)"
                            ]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <Sparkles className="w-full h-full text-white" />
                    </motion.div>

                    {/* Floating 'Central de Inteligência' label */}
                    <motion.div
                        className="absolute -bottom-8 md:-bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="px-3 py-1 md:px-4 md:py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-cyan-100 shadow-lg flex items-center gap-1.5 md:gap-2">
                            <Database className="w-3 h-3 md:w-4 md:h-4 text-cyan-600" />
                            <span className="font-bold text-slate-800 text-[10px] md:text-sm">Central de Inteligência</span>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Agents */}
            {agents.map((agent, i) => (
                <AgentNode
                    key={agent.id}
                    {...agent}
                    delay={0.2 * (i + 1)}
                />
            ))}

            {/* Connecting Lines (desktop only) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-30 hidden md:block">
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                >
                    <line x1="50%" y1="50%" x2="15%" y2="30%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                    <line x1="50%" y1="50%" x2="85%" y2="38%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                    <line x1="50%" y1="50%" x2="20%" y2="75%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                    <line x1="50%" y1="50%" x2="90%" y2="80%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                    <line x1="50%" y1="50%" x2="50%" y2="15%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                </motion.g>
                <defs>
                    <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0891b2" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#0891b2" stopOpacity="0.8" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    )
}

