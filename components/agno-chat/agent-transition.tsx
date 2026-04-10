"use client"

import { useEffect, useState } from "react"
import { getAgentInfo } from "@/lib/agent-config"
import { cn } from "@/lib/utils"
import { ArrowRight, Sparkles } from "lucide-react"

interface InlineHandoffProps {
    fromAgentId: string
    toAgentId: string
    className?: string
}

/**
 * Subtle inline animation showing agent transition
 * Appears between messages when agent changes
 */
export function InlineHandoff({ fromAgentId, toAgentId, className }: InlineHandoffProps) {
    const [phase, setPhase] = useState<'calling' | 'connected'>('calling')

    const fromAgent = getAgentInfo(fromAgentId)
    const toAgent = getAgentInfo(toAgentId)
    const FromIcon = fromAgent.icon
    const ToIcon = toAgent.icon

    useEffect(() => {
        const timer = setTimeout(() => setPhase('connected'), 1500)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className={cn(
            "flex items-center justify-center py-4 my-3",
            "animate-fade-in",
            className
        )}>
            <div className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl",
                "bg-slate-800/50 border border-slate-700/50",
                "shadow-lg shadow-slate-900/50"
            )}>
                {/* From Agent */}
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500",
                    `bg-gradient-to-br ${fromAgent.gradient}`,
                    phase === 'connected' && "opacity-50 scale-90"
                )}>
                    <FromIcon className="w-4 h-4 text-white" />
                </div>

                {/* Arrow / Status */}
                <div className="flex items-center gap-2">
                    {phase === 'calling' ? (
                        <>
                            <span className="text-xs text-slate-400">chamando</span>
                            <ArrowRight className="w-4 h-4 text-cyan-400 animate-bounce-x" />
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-3 h-3 text-green-400" />
                            <ArrowRight className="w-4 h-4 text-green-400" />
                        </>
                    )}
                </div>

                {/* To Agent */}
                <div className={cn(
                    "flex items-center gap-2 transition-all duration-500",
                    phase === 'connected' && "scale-105"
                )}>
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        `bg-gradient-to-br ${toAgent.gradient}`,
                        phase === 'connected' && `ring-2 ring-offset-2 ring-offset-slate-800 ${toAgent.ringColor}`
                    )}>
                        <ToIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className={cn(
                        "text-xs font-medium transition-colors duration-300",
                        phase === 'connected' ? "text-white" : "text-slate-400"
                    )}>
                        {toAgent.name.replace(/^(Odonto|Med) /, '')}
                    </span>
                </div>
            </div>
        </div>
    )
}
