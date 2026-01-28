"use client"

import { motion } from "motion/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
    MoreVertical,
    ArrowUpRight,
    Sparkles,
    Trash2,
    Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Artifact } from "@/lib/types/artifacts"
import { getIconForType, getLabelForType } from "@/lib/utils/artifact-utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ArtifactCardProps {
    item: Artifact
    onPreview: (item: Artifact) => void
    onDelete: (id: string) => void
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring" as const,
            stiffness: 260,
            damping: 20
        }
    }
}

export function ArtifactCard({ item, onPreview, onDelete }: ArtifactCardProps) {
    return (
        <motion.div variants={itemVariants} className="group h-full">
            <Card
                onClick={() => onPreview(item)}
                className={cn(
                    "h-full relative overflow-hidden transition-all duration-500 cursor-pointer",
                    "glass-card border-white/10 dark:border-white/5",
                    "hover:border-primary/50 hover:shadow-premium hover:-translate-y-1.5 group-hover:bg-accent/5"
                )}
            >
                {/* Visual Accent Layer */}
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.12] transition-opacity">
                    {getIconForType(item.type)}
                </div>

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-xl bg-muted/50 border border-border/10",
                            "group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors"
                        )}>
                            {getIconForType(item.type)}
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold border-muted-foreground/20 text-muted-foreground bg-muted/30">
                            {getLabelForType(item.type)}
                        </Badge>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass w-48">
                                <DropdownMenuItem className="gap-2 focus:bg-primary/10" onClick={() => onPreview(item)}>
                                    <ArrowUpRight className="h-4 w-4" /> Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-500 gap-2 focus:bg-red-500/10 focus:text-red-500"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDelete(item.id)
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    <div>
                        <CardTitle className="text-lg font-heading font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {item.title}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1.5 line-clamp-2 leading-relaxed opacity-80">
                            {item.description}
                        </CardDescription>
                    </div>

                    {/* Meta Section */}
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-border/20">
                        <div className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md bg-secondary/50 text-[10px] font-medium text-muted-foreground border border-border/10">
                            <Clock className="h-3 w-3" />
                            {format(new Date(item.createdAt), "dd MMM", { locale: ptBR })}
                        </div>
                        <div className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md bg-primary/5 text-[10px] font-bold text-primary/80 border border-primary/10">
                            <Sparkles className="h-3 w-3" />
                            {item.aiContext.agent}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="pt-0 pb-4 mt-auto">
                    {/* Unique stat snippets for specific types */}
                    {item.type === 'research' && (item.content as any)?.sources && (
                        <div className="w-full text-[11px] font-medium text-cyan-400 flex items-center gap-1.5 group-hover:text-cyan-300 transition-colors">
                            <div className="h-1 w-1 rounded-full bg-cyan-500 animate-pulse" />
                            {(item.content as any).sources.length} referências
                        </div>
                    )}
                    {item.type === 'exam' && (item.content as any)?.questions && (
                        <div className="w-full text-[11px] font-medium text-amber-400 flex items-center gap-1.5 group-hover:text-amber-300 transition-colors">
                            <div className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
                            {(item.content as any).questions.length} questões
                        </div>
                    )}
                    {item.type === 'flashcards' && (item.content as any)?.cards && (
                        <div className="w-full text-[11px] font-medium text-orange-400 flex items-center gap-1.5 group-hover:text-orange-300 transition-colors">
                            <div className="h-1 w-1 rounded-full bg-orange-500 animate-pulse" />
                            {(item.content as any).cards.length} cartas
                        </div>
                    )}
                    {item.type === 'vision' && (
                        <div className="w-full text-[11px] font-medium text-sky-400 flex items-center gap-1.5 group-hover:text-sky-300 transition-colors">
                            <div className="h-1 w-1 rounded-full bg-sky-500 animate-pulse" />
                            {(item.content as any)?.analysis?.findings?.length || 0} achados
                        </div>
                    )}
                </CardFooter>
            </Card>
        </motion.div>
    )
}
