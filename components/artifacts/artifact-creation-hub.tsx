"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
    Microscope,
    BookOpen,
    GraduationCap,
    Scan,
    BrainCircuit,
    FileText,
    ArrowRight,
    Sparkles,
    WalletCards
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface ArtifactTypeCardProps {
    title: string
    description: string
    icon: React.ReactNode
    color: string
    onClick: () => void
    comingSoon?: boolean
}

const ArtifactTypeCard = ({ title, description, icon, color, onClick, comingSoon }: ArtifactTypeCardProps) => {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-full"
        >
            <Card
                onClick={comingSoon ? undefined : onClick}
                className={cn(
                    "relative h-full overflow-hidden border-white/10 bg-slate-900/40 backdrop-blur-xl transition-all duration-300",
                    comingSoon ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-white/20 hover:shadow-2xl hover:shadow-primary/10"
                )}
            >
                {/* Decorative Background Gradient */}
                <div className={cn(
                    "absolute -right-8 -top-8 h-32 w-32 blur-3xl transition-opacity duration-500 opacity-20 group-hover:opacity-40",
                    color
                )} />

                <div className="relative p-6 flex flex-col h-full">
                    <div className={cn(
                        "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md",
                        "group-hover:scale-110 transition-transform duration-500"
                    )}>
                        {React.cloneElement(icon as React.ReactElement<any>, { className: "h-6 w-6 text-white" })}
                    </div>

                    <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white font-heading tracking-tight">{title}</h3>
                        {comingSoon && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                                Em Breve
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed mb-6">
                        {description}
                    </p>

                    <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs font-bold text-white/40 uppercase tracking-widest">
                            <Sparkles className="h-3 w-3" />
                            Premium Agent
                        </div>
                        {!comingSoon && (
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all">
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}

export const ArtifactCreationHub = ({ onSelectType }: { onSelectType: (type: string) => void }) => {
    const types = [
        {
            id: "research",
            title: "Pesquisa Científica",
            description: "Análise profunda de evidências clínicas e literaturas científicas atualizadas.",
            icon: <Microscope />,
            color: "bg-blue-500",
        },
        {
            id: "summary",
            title: "Resumo & Flashcards",
            description: "Transforme qualquer tema complexo em resumos estruturados e decks de estudo.",
            icon: <BookOpen />,
            color: "bg-rose-500",
        },
        {
            id: "exam",
            title: "Simulado Prático",
            description: "Gere questões de alto nível para testar seus conhecimentos e fixar aprendizado.",
            icon: <GraduationCap />,
            color: "bg-amber-500",
        },
        {
            id: "vision",
            title: "Laudo Vision",
            description: "Análise inteligente de exames de imagem com detecção de patologias em tempo real.",
            icon: <Scan />,
            color: "bg-sky-500",
        },
        {
            id: "mindmap",
            title: "Mapa Mental",
            description: "Estruture o conhecimento de forma visual e intuitiva para melhor retenção.",
            icon: <BrainCircuit />,
            color: "bg-teal-500",
        },
        {
            id: "writing",
            title: "Escrita Acadêmica",
            description: "Assistência especializada na redação de artigos, casos clínicos e monografias.",
            icon: <FileText />,
            color: "bg-indigo-500",
        }
    ]

    return (
        <section className="mb-12">
            <div className="mb-6 flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-white font-heading">Criar Novo Conhecimento</h2>
                <p className="text-slate-400">Selecione uma especialidade para começar a gerar artefatos inteligentes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {types.map((type) => (
                    <ArtifactTypeCard
                        key={type.id}
                        title={type.title}
                        description={type.description}
                        icon={type.icon}
                        color={type.color}
                        onClick={() => onSelectType(type.id)}
                    />
                ))}
            </div>
        </section>
    )
}
