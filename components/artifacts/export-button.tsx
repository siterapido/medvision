"use client"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet, Image as ImageIcon, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface ExportButtonProps {
    artifactId: string
    artifactType: string
    className?: string
}

// Available export formats per artifact type
const EXPORT_FORMATS: Record<string, Array<{ format: string; label: string; icon: typeof Download }>> = {
    research: [
        { format: 'pdf', label: 'PDF', icon: FileText },
        { format: 'markdown', label: 'Markdown', icon: FileText },
    ],
    summary: [
        { format: 'pdf', label: 'PDF', icon: FileText },
        { format: 'markdown', label: 'Markdown', icon: FileText },
    ],
    flashcards: [
        { format: 'anki', label: 'Anki (TSV)', icon: FileSpreadsheet },
        { format: 'txt', label: 'Texto', icon: FileText },
    ],
    exam: [
        { format: 'pdf', label: 'PDF com Gabarito', icon: FileText },
        { format: 'markdown', label: 'Markdown', icon: FileText },
    ],
    mindmap: [
        { format: 'markdown', label: 'Markdown (Outline)', icon: FileText },
    ],
    vision: [
        { format: 'pdf', label: 'PDF do Laudo', icon: FileText },
    ],
}

export function ExportButton({ artifactId, artifactType, className }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [lastExportFormat, setLastExportFormat] = useState<string | null>(null)

    const formats = EXPORT_FORMATS[artifactType] || []

    const handleExport = async (format: string) => {
        setIsExporting(true)

        try {
            const response = await fetch(`/api/artifacts/${artifactId}/export?format=${format}`)

            if (!response.ok) {
                throw new Error('Falha no export')
            }

            // Get filename from Content-Disposition header or generate one
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = `artifact.${format}`
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/)
                if (match) filename = match[1]
            }

            // Download the file
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            setLastExportFormat(format)
            toast.success("Download iniciado!", {
                description: `Arquivo ${filename} sendo baixado.`
            })

            // Reset success indicator after 2 seconds
            setTimeout(() => setLastExportFormat(null), 2000)

        } catch (error) {
            console.error('Export error:', error)
            toast.error("Erro ao exportar", {
                description: "Tente novamente mais tarde."
            })
        } finally {
            setIsExporting(false)
        }
    }

    if (formats.length === 0) {
        return null
    }

    // If only one format, show simple button
    if (formats.length === 1) {
        const format = formats[0]
        return (
            <Button
                variant="outline"
                size="sm"
                className={className}
                onClick={() => handleExport(format.format)}
                disabled={isExporting}
            >
                {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : lastExportFormat === format.format ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                    <Download className="h-4 w-4" />
                )}
                <span className="ml-2">Exportar</span>
            </Button>
        )
    }

    // Multiple formats: show dropdown
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={className}
                    disabled={isExporting}
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    <span className="ml-2">Exportar</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Formato</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {formats.map((format) => (
                    <DropdownMenuItem
                        key={format.format}
                        onClick={() => handleExport(format.format)}
                        className="cursor-pointer"
                    >
                        <format.icon className="h-4 w-4 mr-2" />
                        {format.label}
                        {lastExportFormat === format.format && (
                            <Check className="h-4 w-4 ml-auto text-emerald-500" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
