'use client'

import { motion } from "framer-motion"
import { Microscope, Eye, GraduationCap, PenTool, BookOpen, MessageCircle } from "lucide-react"
import { useState } from "react"

interface AgentIconProps {
    icon: typeof Microscope
    color: string
    gradient: string
    delay: number
    position: { x: number; y: number }
    name: string
}

const AgentIcon = ({ icon: Icon, color, gradient, delay, position, name }: AgentIconProps) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
                opacity: 1,
                scale: 1,
                y: [0, -10, 0],
            }}
            transition={{
                opacity: { delay, duration: 0.5 },
                scale: { delay, duration: 0.5 },
                y: {
                    delay: delay + 0.5,
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }
            }}
            whileHover={{
                scale: 1.2,
                rotate: [0, -10, 10, -10, 0],
                transition: { duration: 0.5 }
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="absolute cursor-pointer"
            style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
            }}
        >
            <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${gradient} p-4 shadow-lg hover:shadow-2xl transition-shadow`}>
                <Icon className="w-full h-full text-white" />

                {/* Glow effect */}
                <motion.div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0`}
                    animate={{
                        opacity: isHovered ? [0, 0.5, 0] : 0,
                        scale: isHovered ? [1, 1.5, 2] : 1,
                    }}
                    transition={{
                        duration: 1,
                        repeat: isHovered ? Infinity : 0,
                    }}
                    style={{ filter: 'blur(10px)', zIndex: -1 }}
                />
            </div>

            {/* Tooltip */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                    opacity: isHovered ? 1 : 0,
                    y: isHovered ? 0 : 10
                }}
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
                <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${gradient} text-white text-xs font-semibold shadow-lg`}>
                    {name}
                </div>
            </motion.div>

            {/* Connecting lines animation */}
            {isHovered && (
                <motion.div
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.3 }}
                    className="absolute inset-0 pointer-events-none"
                >
                    <svg className="w-full h-full">
                        <motion.circle
                            cx="50%"
                            cy="50%"
                            r="40"
                            stroke={color}
                            strokeWidth="2"
                            fill="none"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [1, 2, 3], opacity: [0.5, 0.2, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </svg>
                </motion.div>
            )}
        </motion.div>
    )
}

export const AnimatedAgentIcons = () => {
    const agents = [
        {
            icon: Microscope,
            color: "#3B82F6",
            gradient: "from-blue-500 via-cyan-500 to-teal-500",
            name: "Odonto Research",
            position: { x: 15, y: 20 }
        },
        {
            icon: Eye,
            color: "#06B6D4",
            gradient: "from-cyan-500 via-blue-500 to-indigo-500",
            name: "Odonto Vision",
            position: { x: 75, y: 15 }
        },
        {
            icon: BookOpen,
            color: "#EC4899",
            gradient: "from-pink-500 via-rose-500 to-red-500",
            name: "Odonto Summary",
            position: { x: 25, y: 65 }
        },
        {
            icon: GraduationCap,
            color: "#A855F7",
            gradient: "from-purple-500 via-violet-500 to-fuchsia-500",
            name: "Odonto Practice",
            position: { x: 70, y: 70 }
        },
        {
            icon: PenTool,
            color: "#10B981",
            gradient: "from-emerald-500 via-green-500 to-teal-500",
            name: "Odonto Write",
            position: { x: 50, y: 45 }
        },
        {
            icon: MessageCircle,
            color: "#6366F1",
            gradient: "from-indigo-500 via-purple-500 to-pink-500",
            name: "Odonto GPT",
            position: { x: 85, y: 45 }
        }
    ]

    return (
        <div className="relative w-full h-[400px] md:h-[500px]">
            {/* Central hub */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32"
            >
                <motion.div
                    animate={{
                        rotate: 360,
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 flex items-center justify-center backdrop-blur-sm"
                >
                    <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold text-primary">AI</div>
                        <div className="text-xs text-muted-foreground">Hub</div>
                    </div>
                </motion.div>

                {/* Pulsing rings */}
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                />
                <motion.div
                    animate={{
                        scale: [1, 2, 1],
                        opacity: [0.3, 0, 0.3],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                    className="absolute inset-0 rounded-full border-2 border-accent/30"
                />
            </motion.div>

            {/* Agent icons */}
            {agents.map((agent, index) => (
                <AgentIcon
                    key={agent.name}
                    icon={agent.icon}
                    color={agent.color}
                    gradient={agent.gradient}
                    name={agent.name}
                    position={agent.position}
                    delay={index * 0.15}
                />
            ))}

            {/* Connecting lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#06B6D4" />
                        <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                </defs>
                {agents.map((agent, index) => (
                    <motion.line
                        key={`line-${index}`}
                        x1="50%"
                        y1="50%"
                        x2={`${agent.position.x}%`}
                        y2={`${agent.position.y}%`}
                        stroke="url(#lineGradient)"
                        strokeWidth="1"
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.3 }}
                        transition={{ delay: index * 0.15 + 0.5, duration: 1 }}
                    />
                ))}
            </svg>

            {/* Floating particles - usando valores determinísticos para evitar hydration mismatch */}
            {[
                { left: 12, top: 8, xOffset: 5, duration: 3.5, delay: 0.2 },
                { left: 28, top: 15, xOffset: -8, duration: 4.2, delay: 1.1 },
                { left: 45, top: 5, xOffset: 3, duration: 3.8, delay: 0.7 },
                { left: 62, top: 12, xOffset: -5, duration: 4.5, delay: 1.4 },
                { left: 78, top: 8, xOffset: 7, duration: 3.2, delay: 0.4 },
                { left: 88, top: 18, xOffset: -3, duration: 4.8, delay: 1.8 },
                { left: 8, top: 45, xOffset: 6, duration: 3.6, delay: 0.9 },
                { left: 22, top: 52, xOffset: -7, duration: 4.1, delay: 1.3 },
                { left: 92, top: 48, xOffset: 4, duration: 3.4, delay: 0.5 },
                { left: 15, top: 78, xOffset: -6, duration: 4.3, delay: 1.6 },
                { left: 35, top: 85, xOffset: 8, duration: 3.7, delay: 0.3 },
                { left: 55, top: 82, xOffset: -4, duration: 4.6, delay: 1.2 },
                { left: 72, top: 88, xOffset: 5, duration: 3.3, delay: 0.8 },
                { left: 85, top: 75, xOffset: -8, duration: 4.4, delay: 1.5 },
                { left: 95, top: 62, xOffset: 3, duration: 3.9, delay: 0.6 },
            ].map((particle, i) => (
                <motion.div
                    key={`particle-${i}`}
                    className="absolute w-1 h-1 bg-primary/30 rounded-full"
                    style={{
                        left: `${particle.left}%`,
                        top: `${particle.top}%`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        x: [0, particle.xOffset, 0],
                        opacity: [0, 1, 0],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                    }}
                />
            ))}
        </div>
    )
}
