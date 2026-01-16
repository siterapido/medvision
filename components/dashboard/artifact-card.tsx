"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import Link from "next/link"
import {
    Microscope,
    BrainCircuit,
    FileText,
    LayoutGrid,
    Network,
    Scan,
    ExternalLink,
    Sparkles,
    Loader2,
    ChevronRight,
    Star
} from "lucide-react"

interface ArtifactCardProps {
    id: string
    type: "research" | "exam" | "summary" | "flashcard" | "mindmap" | "image"
    title: string
    preview?: string
    version?: number
    qualityScore?: number
    createdAt?: string
    sourceType?: "chat" | "direct" | "import"
    onRefine?: (id: string) => Promise<void>
}

const typeConfig = {
    research: {
        label: "Pesquisa",
        icon: Microscope,
        gradient: "from-emerald-500/20 to-emerald-600/10",
        borderColor: "border-emerald-500/20",
        iconColor: "text-emerald-400",
        buttonColor: "bg-emerald-600 hover:bg-emerald-500",
        href: "/dashboard/pesquisas"
    },
    exam: {
        label: "Simulado",
        icon: BrainCircuit,
        gradient: "from-violet-500/20 to-violet-600/10",
        borderColor: "border-violet-500/20",
        iconColor: "text-violet-400",
        buttonColor: "bg-violet-600 hover:bg-violet-500",
        href: "/dashboard/questionarios"
    },
    summary: {
        label: "Resumo",
        icon: FileText,
        gradient: "from-blue-500/20 to-blue-600/10",
        borderColor: "border-blue-500/20",
        iconColor: "text-blue-400",
        buttonColor: "bg-blue-600 hover:bg-blue-500",
        href: "/dashboard/resumos"
    },
    flashcard: {
        label: "Flashcards",
        icon: LayoutGrid,
        gradient: "from-orange-500/20 to-orange-600/10",
        borderColor: "border-orange-500/20",
        iconColor: "text-orange-400",
        buttonColor: "bg-orange-600 hover:bg-orange-500",
        href: "/dashboard/flashcards"
    },
    mindmap: {
        label: "Mapa Mental",
        icon: Network,
        gradient: "from-pink-500/20 to-purple-600/10",
        borderColor: "border-pink-500/20",
        iconColor: "text-pink-400",
        buttonColor: "bg-pink-600 hover:bg-pink-500",
        href: "/dashboard/mindmaps"
    },
    image: {
        label: "Análise de Imagem",
        icon: Scan,
        gradient: "from-cyan-500/20 to-teal-600/10",
        borderColor: "border-cyan-500/20",
        iconColor: "text-cyan-400",
        buttonColor: "bg-cyan-600 hover:bg-cyan-500",
        href: "/dashboard/imagens"
    }
}

export function ArtifactCard({
    id,
    type,
    title,
    preview,
    version = 1,
    qualityScore,
    createdAt,
    sourceType = "chat",
    onRefine
}: ArtifactCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isRefining, setIsRefining] = useState(false)

    const config = typeConfig[type]
    const Icon = config.icon

    const handleRefine = async () => {
        if (!onRefine) return
        setIsRefining(true)
        try {
            await onRefine(id)
        } finally {
            setIsRefining(false)
        }
    }

    const getQualityColor = (score: number) => {
        if (score >= 80) return "bg-green-500/20 text-green-300 border-green-500/30"
        if (score >= 60) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
        return "bg-red-500/20 text-red-300 border-red-500/30"
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return ""
        return new Date(dateString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short"
        })
    }

    return (
        <motion.div
            layout
            className={`
        relative p-4 rounded-xl border backdrop-blur-sm
        bg-gradient-to-br ${config.gradient}
        ${config.borderColor} shadow-lg
        cursor-pointer transition-all duration-200
        hover:border-white/20 hover:shadow-xl
        group
      `}
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            bg-white/5 border border-white/10
            transition-transform group-hover:scale-110
          `}>
                        <Icon className={`w-5 h-5 ${config.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-white/90 truncate text-sm">
                            {title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                            <span>{config.label}</span>
                            {version > 1 && <span>• v{version}</span>}
                            {createdAt && <span>• {formatDate(createdAt)}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {sourceType === "direct" && (
                        <div className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Direto
                        </div>
                    )}
                    {qualityScore !== undefined && (
                        <div className={`
              px-2 py-0.5 rounded-full text-xs font-medium border
              ${getQualityColor(qualityScore)}
            `}>
                            {qualityScore}%
                        </div>
                    )}
                </div>
            </div>

            {/* Preview */}
            {preview && (
                <p className="text-xs text-white/60 line-clamp-2 mb-2">{preview}</p>
            )}

            {/* Expand indicator */}
            <div className="flex items-center justify-end">
                <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    className="text-white/30"
                >
                    <ChevronRight className="w-4 h-4" />
                </motion.div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 mt-4 border-t border-white/10">
                            <div className="flex gap-2">
                                <Link
                                    href={`${config.href}/${id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`
                    flex-1 py-2.5 px-4 rounded-lg
                    ${config.buttonColor} text-white
                    text-sm font-medium text-center
                    transition-all hover:-translate-y-0.5
                    flex items-center justify-center gap-2
                  `}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Abrir
                                </Link>

                                {onRefine && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleRefine()
                                        }}
                                        disabled={isRefining}
                                        className={`
                      flex-1 py-2.5 px-4 rounded-lg
                      bg-white/10 hover:bg-white/20
                      text-white text-sm font-medium
                      transition-all hover:-translate-y-0.5
                      flex items-center justify-center gap-2
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                                    >
                                        {isRefining ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Refinando...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                Melhorar
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Quality breakdown (if available) */}
                            {qualityScore !== undefined && qualityScore < 80 && (
                                <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                    <div className="flex items-center gap-2 text-xs text-yellow-300">
                                        <Star className="w-4 h-4" />
                                        <span>Este artefato pode ser melhorado com refinamento</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
