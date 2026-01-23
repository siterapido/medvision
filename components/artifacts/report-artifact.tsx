'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { FileText, AlertCircle, CheckCircle2, Copy, Check, Download, Image as ImageIcon } from 'lucide-react'
import type { ReportArtifact as ReportArtifactType } from './types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ReportArtifactProps {
  artifact: ReportArtifactType
  className?: string
}

export function ReportArtifact({ artifact, className }: ReportArtifactProps) {
  const [copied, setCopied] = useState(false)

  const copyContent = () => {
    let content = `# LAUDO: ${artifact.title || 'Análise de Imagem'}\n\n`
    content += `**Tipo de Exame:** ${artifact.examType}\n\n`
    if (artifact.quality) {
      content += `**Qualidade Técnica:** ${artifact.quality.rating}\n`
      if (artifact.quality.notes) content += `${artifact.quality.notes}\n`
      content += '\n'
    }
    content += '---\n\n'
    content += artifact.content
    content += '\n\n## Achados\n\n'
    artifact.findings.forEach((finding, i) => {
      content += `${i + 1}. ${finding}\n`
    })
    content += '\n## Recomendações\n\n'
    artifact.recommendations.forEach((rec, i) => {
      content += `${i + 1}. ${rec}\n`
    })
    content += '\n\n---\n*Este relatório é uma análise assistida por IA e deve ser correlacionado com o exame clínico presencial pelo Cirurgião-Dentista responsável.*'

    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadAsPDF = () => {
    // For now, download as markdown - PDF would require a library
    let content = `# LAUDO RADIOGRÁFICO\n\n`
    content += `## ${artifact.title || 'Análise de Imagem'}\n\n`
    content += `**Tipo de Exame:** ${artifact.examType}\n`
    content += `**Data:** ${new Date().toLocaleDateString('pt-BR')}\n\n`
    if (artifact.quality) {
      content += `### Qualidade Técnica\n`
      content += `- **Avaliação:** ${artifact.quality.rating === 'good' ? 'Boa' : artifact.quality.rating === 'adequate' ? 'Adequada' : 'Limitada'}\n`
      if (artifact.quality.notes) content += `- **Observações:** ${artifact.quality.notes}\n`
      content += '\n'
    }
    content += '---\n\n'
    content += '### Descrição\n\n'
    content += artifact.content
    content += '\n\n### Achados Clínicos\n\n'
    artifact.findings.forEach((finding, i) => {
      content += `${i + 1}. ${finding}\n`
    })
    content += '\n### Recomendações\n\n'
    artifact.recommendations.forEach((rec, i) => {
      content += `${i + 1}. ${rec}\n`
    })
    content += '\n\n---\n\n'
    content += '> **AVISO IMPORTANTE:** Este relatório é uma análise assistida por Inteligência Artificial e serve como ferramenta auxiliar de diagnóstico. Deve ser correlacionado com o exame clínico presencial e demais informações do paciente pelo Cirurgião-Dentista responsável. Não substitui a avaliação profissional.\n'

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laudo-${artifact.examType.toLowerCase().replace(/\s+/g, '-')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getQualityBadge = () => {
    if (!artifact.quality) return null
    const colors = {
      good: 'bg-green-500/10 text-green-500 border-green-500/30',
      adequate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      limited: 'bg-red-500/10 text-red-500 border-red-500/30',
    }
    const labels = {
      good: 'Boa Qualidade',
      adequate: 'Qualidade Adequada',
      limited: 'Qualidade Limitada',
    }
    return (
      <Badge variant="outline" className={colors[artifact.quality.rating]}>
        {labels[artifact.quality.rating]}
      </Badge>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card overflow-hidden',
        'shadow-sm hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-red-500/10 to-rose-500/10 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium text-foreground">{artifact.title || 'Laudo Radiográfico'}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={copyContent}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={downloadAsPDF}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Exam Info */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Tipo de Exame</p>
          <p className="text-sm font-medium text-foreground">{artifact.examType}</p>
        </div>
        {getQualityBadge()}
      </div>

      {/* Image Preview */}
      {artifact.imageUrl && (
        <div className="px-4 py-3 border-b border-border">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/50">
            <img
              src={artifact.imageUrl}
              alt="Imagem do exame"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.content}</ReactMarkdown>
      </div>

      {/* Findings */}
      {artifact.findings?.length > 0 && (
        <div className="px-4 py-3 border-t border-border bg-amber-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h4 className="text-sm font-medium text-foreground">Achados Clínicos</h4>
          </div>
          <ul className="space-y-1">
            {artifact.findings.map((finding, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-amber-500 mt-1">•</span>
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {artifact.recommendations?.length > 0 && (
        <div className="px-4 py-3 border-t border-border bg-green-500/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <h4 className="text-sm font-medium text-foreground">Recomendações</h4>
          </div>
          <ul className="space-y-1">
            {artifact.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-green-500 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-4 py-3 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground italic">
          Este relatório é uma análise assistida por IA e deve ser correlacionado com o exame clínico presencial pelo Cirurgião-Dentista responsável.
        </p>
      </div>
    </div>
  )
}
