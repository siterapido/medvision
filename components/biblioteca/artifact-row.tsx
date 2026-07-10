"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MoreVertical, Trash2, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Artifact } from "@/lib/types/artifacts"
import type { VisionArtifactContent } from "@/lib/types/vision"
import { getLabelForType } from "@/lib/utils/artifact-utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function getArtifactStatus(item: Artifact): string {
    if (item.type === "vision") {
        const content = item.content as VisionArtifactContent | undefined
        const count =
            content?.analysis?.findings?.length ??
            content?.analysis?.detections?.length ??
            0
        if (count > 0) return `${count} achado${count === 1 ? "" : "s"}`
        return "Sem achados"
    }
    return "Salvo"
}

function getArtifactPreview(item: Artifact): string {
    if (item.description?.trim()) return item.description.trim()
    if (item.type === "vision") {
        const content = item.content as VisionArtifactContent | undefined
        const hypothesis = content?.analysis?.report?.diagnosticHypothesis
        if (hypothesis?.trim()) return hypothesis.trim()
    }
    return item.title
}

interface ArtifactRowProps {
    item: Artifact
    onPreview: (item: Artifact) => void
    onDelete: (id: string) => void
}

export function ArtifactRow({ item, onPreview, onDelete }: ArtifactRowProps) {
    const preview = getArtifactPreview(item)
    const status = getArtifactStatus(item)

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onPreview(item)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onPreview(item)
                }
            }}
            className={cn(
                "group flex min-w-0 cursor-pointer items-center gap-3 border-b border-rule px-3 py-3 text-left transition-colors",
                "hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                "md:gap-4 md:px-4"
            )}
        >
            <time
                dateTime={item.createdAt}
                className="w-[4.5rem] shrink-0 text-xs tabular-nums text-ink-muted md:w-24"
            >
                {format(new Date(item.createdAt), "dd/MM/yy", { locale: ptBR })}
            </time>

            <span className="hidden w-28 shrink-0 truncate text-xs font-medium text-ink sm:block">
                {getLabelForType(item.type)}
            </span>

            <span className="w-20 shrink-0 text-xs text-ink-muted md:w-24">
                {status}
            </span>

            <p className="min-w-0 flex-1 truncate text-sm text-ink">
                {preview}
            </p>

            <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 md:opacity-100">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-ink-muted hover:text-ink"
                            aria-label="Ações do laudo"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem className="gap-2" onClick={() => onPreview(item)}>
                            <ArrowUpRight className="h-4 w-4" />
                            Abrir
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="gap-2 text-destructive focus:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(item.id)
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
