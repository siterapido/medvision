"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    MoreVertical,
    FileText,
    Microscope,
    BrainCircuit,
    BookOpen,
    GraduationCap,
    Scan
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ArtifactCardProps {
    artifact: {
        id: string
        title: string
        type: string
        created_at: string
        description?: string | null
    }
    onClick?: () => void
    onDelete?: () => void
    onEdit?: () => void
}

const getIconForType = (type: string) => {
    switch (type) {
        case "research": return <Microscope className="h-5 w-5 text-blue-500" />
        case "flashcards":
        case "summary": return <BookOpen className="h-5 w-5 text-rose-500" />
        case "exam": return <GraduationCap className="h-5 w-5 text-amber-500" />
        case "mindmap": return <BrainCircuit className="h-5 w-5 text-teal-500" />
        case "vision":
        case "report": return <Scan className="h-5 w-5 text-sky-500" />
        default: return <FileText className="h-5 w-5 text-slate-500" />
    }
}

const getLabelForType = (type: string) => {
    switch (type) {
        case "research": return "Pesquisa"
        case "flashcards": return "Flashcards"
        case "summary": return "Resumo"
        case "exam": return "Simulado"
        case "mindmap": return "Mapa Mental"
        case "vision":
        case "report": return "Laudo"
        default: return "Documento"
    }
}

export function ArtifactCard({ artifact, onClick, onDelete, onEdit }: ArtifactCardProps) {
    return (
        <Card
            className="group relative overflow-hidden border-white/5 bg-slate-900/50 hover:bg-slate-900/80 hover:border-white/10 transition-all duration-300 cursor-pointer"
            onClick={onClick}
        >
            <div className="p-5 flex flex-col h-full gap-4">
                <div className="flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-300">
                        {getIconForType(artifact.type)}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white -mr-2">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.() }}>
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                onClick={(e) => { e.stopPropagation(); onDelete?.() }}
                            >
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div>
                    <h3 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {artifact.title}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2 min-h-[2.5rem]">
                        {artifact.description || `Gerado em ${format(new Date(artifact.created_at), "dd 'de' MMMM", { locale: ptBR })}`}
                    </p>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                    <span className="capitalize px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                        {getLabelForType(artifact.type)}
                    </span>
                    <span>
                        {format(new Date(artifact.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                </div>
            </div>
        </Card>
    )
}
