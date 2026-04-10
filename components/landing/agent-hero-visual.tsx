"use client"

import { motion } from "framer-motion"
import {
    Microscope,
    Eye,
    BookOpen,
    GraduationCap,
    PenTool,
    MessageCircle,
    Sparkles
} from "lucide-react"
import { useIsMobile } from "@/lib/hooks/use-mobile"

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
            style={{ willChange: "transform, opacity" }}
        >
            <motion.div
                className={`relative p-2.5 md:p-4 rounded-xl md:rounded-2xl backdrop-blur-md border border-white/20 shadow-xl ${color}`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                animate={{
                    // Animação com amplitude fixa - responsividade via duração
                    y: [0, -4, 0],
                }}
                transition={{
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                }}
                style={{ willChange: "transform", transform: "translateZ(0)" }}
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
    const isMobile = useIsMobile()

    // Agentes com ícones e cores consistentes com AnimatedAgentIcons
    // Mobile: distribuídos em círculo ao redor do centro com mais espaçamento
    const agents = [
        {
            id: 1,
            icon: Microscope,
            label: "Odonto Research",
            color: "bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500",
            position: "left-[-8%] top-[5%] md:left-[5%] md:top-[15%]"
        },
        {
            id: 2,
            icon: Eye,
            label: "Odonto Vision",
            color: "bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500",
            position: "right-[-8%] top-[5%] md:right-[5%] md:top-[15%]"
        },
        {
            id: 3,
            icon: BookOpen,
            label: "Odonto Summary",
            color: "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500",
            position: "left-[-12%] top-[50%] -translate-y-1/2 md:left-[0%]"
        },
        {
            id: 4,
            icon: GraduationCap,
            label: "Odonto Practice",
            color: "bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500",
            position: "right-[-12%] top-[50%] -translate-y-1/2 md:right-[0%]"
        },
        {
            id: 5,
            icon: PenTool,
            label: "Odonto Write",
            color: "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500",
            position: "left-[-8%] bottom-[5%] md:left-[5%] md:bottom-[15%]"
        },
        {
            id: 6,
            icon: MessageCircle,
            label: "Odonto Chat",
            color: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
            position: "right-[-8%] bottom-[5%] md:right-[5%] md:bottom-[15%]"
        },
    ]

    return (
        <div className="relative w-full aspect-square max-w-[280px] md:max-w-2xl mx-auto perspective-1000 overflow-visible">
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
                        transition={{ duration: isMobile ? 5 : 3, repeat: Infinity }}
                        style={{ willChange: "background", transform: "translateZ(0)" }}
                    >
                        <Sparkles className="w-full h-full text-white" />
                    </motion.div>

                    {/* Floating 'MedVision' label */}
                    <motion.div
                        className="absolute -bottom-8 md:-bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="px-3 py-1 md:px-4 md:py-1.5 bg-gradient-to-r from-[#00D4FF] to-[#0066FF] backdrop-blur-md rounded-full border border-cyan-400/30 shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 md:gap-2">
                            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-white" />
                            <span className="font-bold text-white text-[10px] md:text-sm">MedVision</span>
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
                    {/* Linha para Odonto Research (topo esquerda) */}
                    <line x1="50%" y1="50%" x2="12%" y2="25%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                    {/* Linha para Odonto Vision (topo direita) */}
                    <line x1="50%" y1="50%" x2="88%" y2="25%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                    {/* Linha para Odonto Summary (meio esquerda) */}
                    <line x1="50%" y1="50%" x2="8%" y2="50%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                    {/* Linha para Odonto Practice (meio direita) */}
                    <line x1="50%" y1="50%" x2="92%" y2="50%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                    {/* Linha para Odonto Write (baixo esquerda) */}
                    <line x1="50%" y1="50%" x2="12%" y2="75%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                    {/* Linha para MedVision (baixo direita) */}
                    <line x1="50%" y1="50%" x2="88%" y2="75%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
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
