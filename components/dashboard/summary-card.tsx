"use client"

import Link from "next/link"
import { Clock, FileText, Layers, BrainCircuit, MoreVertical, Trash2, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface SummaryCardProps {
    summary: any
}

export function SummaryCard({ summary }: SummaryCardProps) {
    const supabase = createClient()
    const router = useRouter()

    const handleDelete = async () => {
        try {
            const { error } = await supabase
                .from("summaries")
                .update({ deleted_at: new Date().toISOString() })
                .eq("id", summary.id)

            if (error) throw error
            router.refresh()
        } catch (error) {
            console.error("Error moving to trash:", error)
        }
    }

    return (
        <div
            className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10"
        >
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-md">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.print()}>
                            <Download className="mr-2 h-4 w-4" /> Exportar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Link href={`/dashboard/resumos/${summary.id}`} className="block h-full space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Badge
                        variant="outline"
                        className={`
                        px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-md border-0
                        ${summary.status === 'ready'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'}
                    `}
                    >
                        {summary.status === 'ready' ? 'Pronto' : 'Gerando...'}
                    </Badge>
                    <Badge variant="secondary" className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-md bg-secondary/50 text-secondary-foreground/80">
                        {summary.complexity_level === 'advanced' ? 'Avançado' :
                            summary.complexity_level === 'basic' ? 'Básico' : 'Intermédio'}
                    </Badge>
                </div>

                <div>
                    <h3 className="text-xl font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {summary.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                        <Clock className="h-3 w-3" />
                        {new Date(summary.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', year: 'numeric'
                        })}
                    </div>
                </div>

                <div className="pt-4 mt-auto grid grid-cols-3 gap-2 border-t border-border/50">
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-background/50 text-xs text-muted-foreground group-hover:bg-primary/5 transition-colors">
                        <FileText className="h-4 w-4 mb-1 opacity-70" />
                        <span>Resumo</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-background/50 text-xs text-muted-foreground group-hover:bg-primary/5 transition-colors">
                        <Layers className="h-4 w-4 mb-1 opacity-70" />
                        <span>Cards</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-background/50 text-xs text-muted-foreground group-hover:bg-primary/5 transition-colors">
                        <BrainCircuit className="h-4 w-4 mb-1 opacity-70" />
                        <span>Mapa</span>
                    </div>
                </div>
            </Link>
        </div>
    )
}
