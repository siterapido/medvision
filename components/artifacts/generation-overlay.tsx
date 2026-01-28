"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Loader2, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AgentDemoResearch } from "@/components/landing/agent-demo-research"
import { AgentDemoSummary } from "@/components/landing/agent-demo-summary"
import { AgentDemoVision } from "@/components/landing/agent-demo-vision"
// We'll map other types to these for now or add more if they exist

interface GenerationOverlayProps {
    isOpen: boolean
    onClose: () => void
    type: string
    title: string
}

export const GenerationOverlay = ({ isOpen, onClose, type, title }: GenerationOverlayProps) => {
    // Selection of animation component based on type
    const renderAnimation = () => {
        switch (type) {
            case 'research':
                return <AgentDemoResearch />
            case 'summary':
            case 'flashcards':
            case 'mindmap':
                return <AgentDemoSummary />
            case 'vision':
                return <AgentDemoVision />
            default:
                return (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full animate-pulse" />
                            <Loader2 className="h-16 w-16 text-primary animate-spin" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Processando Artefato</h3>
                        <p className="text-slate-400">Nossa inteligência está estruturando seu conhecimento...</p>
                    </div>
                )
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8"
                >
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full" />
                        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
                    </div>

                    <div className="relative w-full max-w-6xl">
                        {/* Status Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Agente em Ação</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full hover:bg-white/10 text-white/40 hover:text-white"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        {/* Animation Container */}
                        <div className="bg-slate-900/50 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
                            {renderAnimation()}
                        </div>

                        {/* Footer Info */}
                        <div className="mt-8 text-center">
                            <p className="text-slate-500 text-sm">
                                Este processo pode levar alguns segundos dependendo da complexidade do tema.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
