"use client"

import { motion } from "framer-motion"
import {
    Brain,
    Search,
    FileText,
    MessageSquare,
    UserCheck,
    Stethoscope,
    Sparkles,
    Database
} from "lucide-react"

const AgentNode = ({ icon: Icon, label, color, delay, x, y }: any) => {
    return (
        <motion.div
            className="absolute flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.5, type: "spring" }}
            style={{ left: x, top: y }}
        >
            <motion.div
                className={`relative p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl ${color}`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                animate={{
                    y: [0, -10, 0],
                    boxShadow: [
                        "0 10px 30px -10px rgba(0,0,0,0.1)",
                        "0 20px 40px -10px rgba(0,0,0,0.2)",
                        "0 10px 30px -10px rgba(0,0,0,0.1)"
                    ]
                }}
                transition={{
                    y: { duration: 3 + Math.random(), repeat: Infinity, ease: "easeInOut" },
                    boxShadow: { duration: 3 + Math.random(), repeat: Infinity, ease: "easeInOut" }
                }}
            >
                <Icon className="w-8 h-8 text-white" />
                {/* Orbiting particle */}
                <motion.div
                    className="absolute -inset-1 rounded-full border border-white/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                    <div className="w-2 h-2 bg-white rounded-full absolute -top-1 left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                </motion.div>
            </motion.div>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
                {label}
            </span>
        </motion.div>
    )
}

const ConnectionLine = ({ start, end, delay }: any) => {
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <motion.path
                d={`M${start.x} ${start.y} L${end.x} ${end.y}`}
                fill="none"
                stroke="url(#gradient-line)"
                strokeWidth="2"
                strokeDasharray="10 10"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ delay, duration: 1.5, ease: "easeInOut" }}
            />
            <motion.circle
                r="4"
                fill="#0891b2"
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                style={{ offsetPath: `path("M${start.x} ${start.y} L${end.x} ${end.y}")` }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: delay + 1 }}
            />
            <defs>
                <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0891b2" stopOpacity="0" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                </linearGradient>
            </defs>
        </svg>
    )
}

export function AgentHeroVisual() {
    const agents = [
        { id: 1, icon: Brain, label: "Planejador Clínico", color: "bg-gradient-to-br from-violet-500 to-purple-600", x: "20%", y: "20%" },
        { id: 2, icon: Search, label: "Pesquisador", color: "bg-gradient-to-br from-blue-500 to-cyan-600", x: "80%", y: "30%" },
        { id: 3, icon: FileText, label: "Redator", color: "bg-gradient-to-br from-emerald-400 to-green-600", x: "15%", y: "70%" },
        { id: 4, icon: MessageSquare, label: "Consultor", color: "bg-gradient-to-br from-orange-400 to-red-500", x: "85%", y: "75%" },
        { id: 5, icon: Stethoscope, label: "Diagnóstico", color: "bg-gradient-to-br from-pink-500 to-rose-600", x: "50%", y: "15%" },
    ]

    // Approximate center percentage coordinates for lines
    // These need to match visually with the 'top/left' styles above
    // This is a simplification; in a real scenario we might use absolute pixels or a different layout method
    // But for a hero section this 'visual' approximation works well enough for responsiveness if container is relative

    return (
        <div className="relative w-full aspect-square md:aspect-[4/3] max-w-2xl mx-auto perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-full blur-3xl transform -translate-y-10" />

            {/* Central Core */}
            <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
            >
                <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white rounded-full shadow-[0_0_60px_-15px_rgba(8,145,178,0.3)] flex items-center justify-center z-20">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-200 animate-spin-slow" />
                    <motion.div
                        className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full flex items-center justify-center p-6 shadow-inner"
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

                    {/* Floating 'Odonto Suite' label */}
                    <motion.div
                        className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-cyan-100 shadow-lg flex items-center gap-2">
                            <Database className="w-4 h-4 text-cyan-600" />
                            <span className="font-bold text-slate-800 text-sm">Central de Inteligência</span>
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

            {/* Connecting Lines (Simulated visually) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-30">
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                >
                    {/* Connecting center (50% 50%) to nodes */}
                    <line x1="50%" y1="50%" x2="20%" y2="30%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                    <line x1="50%" y1="50%" x2="80%" y2="38%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                    <line x1="50%" y1="50%" x2="20%" y2="75%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                    <line x1="50%" y1="50%" x2="85%" y2="80%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                    <line x1="50%" y1="50%" x2="50%" y2="22%" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
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
