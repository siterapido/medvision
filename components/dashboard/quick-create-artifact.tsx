"use client"

import { Plus, Sparkles, Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface QuickCreateArtifactProps {
    type: "pesquisa" | "simulado" | "resumo" | "flashcards" | "mindmap"
    label?: string
    onSuccess?: (artifactId: string) => void
}

const typeConfig = {
    pesquisa: {
        label: "Pesquisa",
        placeholder: "Ex: Tratamento de periodontite em pacientes diabéticos",
        gradient: "from-emerald-500/20 to-emerald-600/10",
        buttonGradient: "bg-emerald-600 hover:bg-emerald-500",
        icon: "🔬"
    },
    simulado: {
        label: "Simulado",
        placeholder: "Ex: Endodontia para residência",
        gradient: "from-violet-500/20 to-violet-600/10",
        buttonGradient: "bg-violet-600 hover:bg-violet-500",
        icon: "📝"
    },
    resumo: {
        label: "Resumo",
        placeholder: "Ex: Farmacologia dos anestésicos locais",
        gradient: "from-blue-500/20 to-blue-600/10",
        buttonGradient: "bg-blue-600 hover:bg-blue-500",
        icon: "📄"
    },
    flashcards: {
        label: "Flashcards",
        placeholder: "Ex: Anatomia dental para provas",
        gradient: "from-orange-500/20 to-orange-600/10",
        buttonGradient: "bg-orange-600 hover:bg-orange-500",
        icon: "🃏"
    },
    mindmap: {
        label: "Mapa Mental",
        placeholder: "Ex: Classificação das lesões cariosas",
        gradient: "from-pink-500/20 to-purple-600/10",
        buttonGradient: "bg-pink-600 hover:bg-pink-500",
        icon: "🗺️"
    }
}

export function QuickCreateArtifact({ type, label, onSuccess }: QuickCreateArtifactProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [topic, setTopic] = useState("")
    const [instructions, setInstructions] = useState("")
    const [isPending, startTransition] = useTransition()
    const [isGenerating, setIsGenerating] = useState(false)

    const config = typeConfig[type]

    const handleGenerate = async () => {
        if (!topic.trim()) {
            toast.error("Por favor, informe o tema")
            return
        }

        setIsGenerating(true)

        try {
            const response = await fetch("/api/agents/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    topic: topic.trim(),
                    instructions: instructions.trim() || undefined
                })
            })

            const result = await response.json()

            if (result.success && result.artifact_id) {
                toast.success(`${config.label} criado com sucesso!`, {
                    description: result.title || topic.slice(0, 50)
                })
                onSuccess?.(result.artifact_id)
                setIsOpen(false)
                setTopic("")
                setInstructions("")
            } else {
                toast.error("Erro ao criar artefato", {
                    description: result.error || "Tente novamente"
                })
            }
        } catch (error) {
            console.error("Error generating artifact:", error)
            toast.error("Erro de conexão", {
                description: "Não foi possível conectar ao servidor"
            })
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="relative">
            <Button
                onClick={() => setIsOpen(true)}
                className={`${config.buttonGradient} text-white gap-2 shadow-lg`}
            >
                <Plus className="w-4 h-4" />
                Novo {label || config.label}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            onClick={() => !isGenerating && setIsOpen(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className={`
                fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                w-full max-w-md p-6 rounded-2xl z-50
                bg-gradient-to-br ${config.gradient}
                bg-slate-900 border border-slate-700/50
                shadow-2xl shadow-black/50
              `}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => !isGenerating && setIsOpen(false)}
                                disabled={isGenerating}
                                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="text-3xl">{config.icon}</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-cyan-400" />
                                        Geração Rápida
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        Crie um novo {config.label.toLowerCase()} em segundos
                                    </p>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Tema *
                                    </label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder={config.placeholder}
                                        disabled={isGenerating}
                                        className="
                      w-full px-4 py-3 rounded-xl
                      bg-black/30 border border-white/10
                      text-white placeholder:text-slate-500
                      focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20
                      outline-none transition-all
                      disabled:opacity-50
                    "
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault()
                                                handleGenerate()
                                            }
                                        }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Instruções adicionais (opcional)
                                    </label>
                                    <textarea
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        placeholder="Ex: Foque em casos clínicos, inclua imagens de referência..."
                                        disabled={isGenerating}
                                        rows={3}
                                        className="
                      w-full px-4 py-3 rounded-xl resize-none
                      bg-black/30 border border-white/10
                      text-white placeholder:text-slate-500
                      focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20
                      outline-none transition-all
                      disabled:opacity-50
                    "
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="ghost"
                                    className="flex-1 text-slate-400 hover:text-white"
                                    onClick={() => setIsOpen(false)}
                                    disabled={isGenerating}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className={`flex-1 ${config.buttonGradient} text-white gap-2`}
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !topic.trim()}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Gerando...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Gerar agora
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Loading state */}
                            {isGenerating && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="mt-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                                            <Sparkles className="w-4 h-4 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-cyan-300">
                                                Agente trabalhando...
                                            </p>
                                            <p className="text-xs text-cyan-400/70">
                                                Gerando seu {config.label.toLowerCase()} sobre "{topic.slice(0, 30)}..."
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
