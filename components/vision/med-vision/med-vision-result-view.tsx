'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Download,
  Printer,
  Share2,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Search,
  Scan,
  RefreshCcw,
  Loader2,
  ExternalLink,
  ChevronDown,
  Maximize2,
  Pencil,
  Microscope,
  Info,
  Wrench,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ImageOverlay } from '@/components/vision/image-overlay'
import { VisionClinicalDisclaimer } from '@/components/vision/med-vision/clinical-disclaimer'
import { cn } from '@/lib/utils'
import { getSeverityStyle } from '@/lib/constants/vision'
import type { VisionAnalysisResult, VisionRefinement } from '@/lib/types/vision'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MedVisionResultViewProps {
  analysisResult: VisionAnalysisResult | null
  analysisPrecision: number | null
  image: string | null
  isSaved: boolean
  isSaving: boolean
  refinements: VisionRefinement[]
  onSave: () => void
  onExportPDF: (variant: 'laudo' | 'conduta') => void
  onPrint: () => void
  onRetry: () => void
  onNewAnalysis: () => void
  onShareWithPatient: () => void
  onAnnotate: () => void
  onRefineRegion: () => void
  onToggleHeatmap: () => void
  onFullscreen: () => void
  showHeatmap: boolean
  isAnnotating: boolean
  isSelectingRegion: boolean
}

type ResultTab = 'laudo' | 'radiografia' | 'conduta'

const PANEL = 'rounded-xl border border-rule bg-surface-raised'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function precisionBadgeClass(precision: number): string {
  if (precision >= 80) return 'bg-clinical-ok/10 text-clinical-ok border-clinical-ok/30'
  if (precision >= 60) return 'bg-clinical-warn/10 text-clinical-warn border-clinical-warn/30'
  return 'bg-clinical-alert/10 text-clinical-alert border-clinical-alert/30'
}

function precisionLabel(precision: number): string {
  if (precision >= 80) return 'alta'
  if (precision >= 60) return 'limitada'
  return 'reduzida'
}

function qualityBadgeClass(score: number): string {
  if (score >= 80) return 'bg-clinical-ok/10 text-clinical-ok border-clinical-ok/30'
  if (score >= 60) return 'bg-clinical-warn/10 text-clinical-warn border-clinical-warn/30'
  return 'bg-clinical-alert/10 text-clinical-alert border-clinical-alert/30'
}

function confidenceBadgeClass(confidence: number): string {
  if (confidence >= 0.8) return 'bg-clinical-ok/10 text-clinical-ok border-clinical-ok/20'
  if (confidence >= 0.6) return 'bg-clinical-warn/10 text-clinical-warn border-clinical-warn/20'
  return 'bg-clinical-alert/10 text-clinical-alert border-clinical-alert/20'
}

// ---------------------------------------------------------------------------
// Empty / Error State
// ---------------------------------------------------------------------------

function EmptyResultState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className={cn(PANEL, 'p-8 flex flex-col items-center text-center gap-4')}>
        <div className="w-16 h-16 rounded-full bg-clinical-alert/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-clinical-alert" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink">Resultado indisponível</h2>
          <p className="text-sm text-ink-muted mt-1 max-w-md">
            Não foi possível carregar o resultado da análise. Verifique a
            imagem e tente novamente.
          </p>
        </div>
        <Button onClick={onRetry} variant="default" className="gap-2">
          <RefreshCcw className="w-4 h-4" />
          Tentar novamente
        </Button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Precision / Quality Banner
// ---------------------------------------------------------------------------

function PrecisionBanner({
  precision,
  meta,
}: {
  precision: number
  meta: VisionAnalysisResult['meta']
}) {
  if (precision >= 80 && meta) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-[10px] text-muted-foreground">
          Qualidade da imagem:
        </span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-clinical-ok/10 text-clinical-ok border border-clinical-ok/30">
          {meta.quality} · {precision}%
        </span>
      </div>
    )
  }

  const isModerate = precision >= 60
  const colorClasses = isModerate
    ? 'bg-clinical-warn/10 border-clinical-warn/25'
    : 'bg-clinical-alert/10 border-clinical-alert/25'
  const iconColor = isModerate ? 'text-clinical-warn' : 'text-clinical-alert'
  const textColor = isModerate ? 'text-clinical-warn' : 'text-clinical-alert'

  return (
    <div
      className={cn(
        'p-4 rounded-xl border flex flex-col gap-3 sm:flex-row sm:items-start',
        colorClasses,
      )}
    >
      <AlertTriangle
        className={cn('w-5 h-5 shrink-0 sm:mt-0.5', iconColor)}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <p className={cn('text-sm font-semibold break-words', textColor)}>
          Análise com precisão {precisionLabel(precision)} ({precision}%)
        </p>
        {meta && (
          <span
            className={cn(
              'inline-flex w-fit max-w-full text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0',
              precisionBadgeClass(precision),
            )}
          >
            Qualidade: {meta.quality}
          </span>
        )}
        <p className="text-xs text-muted-foreground">
          {precision < 60
            ? 'A qualidade da imagem está abaixo do recomendado. Confirme com uma imagem de melhor qualidade.'
            : 'A qualidade pode afetar a confiabilidade de alguns achados.'}
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Refinement Cards (expandable)
// ---------------------------------------------------------------------------

function RefinementsSection({
  refinements,
}: {
  refinements: VisionRefinement[]
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  if (refinements.length === 0) return null

  return (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-ink uppercase tracking-wide">
          Refinamentos de Região ({refinements.length})
        </h3>
      </div>

      {refinements.map((ref, idx) => {
        const isOpen = expandedIdx === idx

        return (
          <div key={idx} className={cn(PANEL, 'overflow-hidden')}>
            <button
              className="w-full p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors text-left"
              onClick={() =>
                setExpandedIdx((prev) => (prev === idx ? null : idx))
              }
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-black/5 shrink-0">
                <img
                  src={ref.regionImageBase64}
                  alt="Região refinada"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  Refinamento #{idx + 1}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {ref.analysis.detections.length} achados ·{' '}
                  {new Date(ref.analyzedAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {ref.analysis.detections.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {ref.analysis.detections.slice(0, 3).map((d, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className={cn(
                          'text-[9px] h-4 px-1',
                          getSeverityStyle(d.severity).badge,
                        )}
                      >
                        {d.label}
                      </Badge>
                    ))}
                    {ref.analysis.detections.length > 3 && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1">
                        +{ref.analysis.detections.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="shrink-0">
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    isOpen && 'rotate-180',
                  )}
                />
              </div>
            </button>

            {/* Expanded content */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-2 border-t border-border/30 space-y-4">
                    {/* Region image with detections */}
                    <div className="rounded-lg overflow-hidden border border-border/50 bg-black/5 max-h-48 flex items-center justify-center">
                      <ImageOverlay
                        src={ref.regionImageBase64}
                        detections={ref.analysis.detections}
                        className="max-h-48"
                      />
                    </div>

                    {/* Refined findings */}
                    {ref.analysis.findings.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Achados Refinados
                        </p>
                        {ref.analysis.findings.map((f, i) => {
                          const det = ref.analysis.detections[i]
                          return (
                            <div
                              key={i}
                              className="p-2.5 rounded-lg bg-muted/20 border border-border/20 flex items-center justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-medium">
                                    {f.type}
                                  </p>
                                  {det?.toothNumber && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] h-4 px-1"
                                    >
                                      {det.toothNumber}
                                    </Badge>
                                  )}
                                  {det?.cidCode && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] h-4 px-1 font-mono"
                                    >
                                      {det.cidCode}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {f.zone}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[9px] h-4 px-1',
                                  f.color,
                                )}
                              >
                                {f.level}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Refined report */}
                    {ref.analysis.report?.detailedFindings && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Análise Detalhada da Região
                        </p>
                        <p className="text-xs text-foreground/80 leading-relaxed bg-muted/10 p-2.5 rounded-lg border border-border/10 whitespace-pre-line">
                          {ref.analysis.report.detailedFindings}
                        </p>
                      </div>
                    )}

                    {ref.analysis.report?.diagnosticHypothesis && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Hipótese Diagnóstica
                        </p>
                        <p className="text-xs font-medium text-primary/80 leading-relaxed bg-primary/5 p-2.5 rounded-lg border border-primary/10">
                          {ref.analysis.report.diagnosticHypothesis}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Laudo Tab Content
// ---------------------------------------------------------------------------

function LaudoTabContent({
  result,
  precision,
  onExportPDF,
  onSave,
  isSaved,
  isSaving,
  refinements,
}: {
  result: VisionAnalysisResult
  precision: number | null
  onExportPDF: (variant: 'laudo' | 'conduta') => void
  onSave: () => void
  isSaved: boolean
  isSaving: boolean
  refinements: VisionRefinement[]
}) {
  return (
    <div className="space-y-6 w-full">
      <div className={cn(PANEL, 'p-6 flex flex-col')}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
          <div>
            <h2 className="text-xl font-heading font-bold">Laudo clínico</h2>
            <p className="text-xs text-muted-foreground">
              Texto completo e achados alinhados à radiografia
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {result.meta && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                {result.meta.imageType}
              </Badge>
            )}
            {precision !== null && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] h-5 px-1.5 font-bold',
                  precisionBadgeClass(precision),
                )}
              >
                Precisão {precision}%
              </Badge>
            )}
            <Badge
              variant="outline"
              className="bg-clinical-ok/10 text-clinical-ok border-clinical-ok/25"
            >
              Concluído
            </Badge>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          {/* Principais Achados */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> Principais Achados
            </h4>
            <div className="space-y-2">
              {result.findings.map((finding, i) => {
                const matchedDet = result.detections[i]
                return (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-muted/30 border border-border/30 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium">{finding.type}</p>
                        {matchedDet?.toothNumber && (
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1 font-normal"
                          >
                            Dente {matchedDet.toothNumber}
                          </Badge>
                        )}
                        {matchedDet?.cidCode && (
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1 font-mono font-normal"
                          >
                            {matchedDet.cidCode}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {finding.zone}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {finding.confidence !== undefined && (
                        <span
                          className={cn(
                            'text-[9px] font-semibold px-1.5 py-0.5 rounded-full border',
                            confidenceBadgeClass(finding.confidence),
                          )}
                        >
                          {Math.round(finding.confidence * 100)}% conf.
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full bg-background/50 border border-border/50',
                          finding.color,
                        )}
                      >
                        {finding.level}
                      </span>
                    </div>
                  </div>
                )
              })}
              {result.findings.length === 0 && (
                <p className="text-sm text-muted-foreground italic pl-2">
                  Nenhum achado crítico detectado.
                </p>
              )}
            </div>
          </section>

          {/* Per-Tooth Breakdown */}
          {result.report?.perToothBreakdown &&
            result.report.perToothBreakdown.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-3 h-3" /> Achados por Dente (Notação FDI)
                </h4>
                <div className="overflow-x-auto rounded-lg border border-border/30">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/30">
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                          Dente
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                          Achado
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                          CID-10
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                          Severidade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.report.perToothBreakdown.map((item, i) => (
                        <tr
                          key={i}
                          className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-3 py-2 font-bold text-primary">
                            {item.tooth}
                          </td>
                          <td className="px-3 py-2 text-foreground/80">
                            {item.findings}
                          </td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">
                            {item.cidCode || '—'}
                          </td>
                          <td className="px-3 py-2">
                            {item.severity && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[9px] h-4 px-1',
                                  getSeverityStyle(item.severity).badge,
                                )}
                              >
                                {getSeverityStyle(item.severity).ptLabel}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

          {/* Report Sections */}
          {result.report && (
            <>
              <section className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Scan className="w-3 h-3" /> Análise Técnica
                </h4>
                <div className="text-sm text-foreground/80 leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/10">
                  {result.report.technicalAnalysis}
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Search className="w-3 h-3" /> Achados Detalhados
                </h4>
                <div className="text-sm text-foreground/80 leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/10 whitespace-pre-line">
                  {result.report.detailedFindings}
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Hipótese Diagnóstica
                </h4>
                <div className="text-sm font-medium text-primary/80 leading-relaxed bg-primary/5 p-3 rounded-lg border border-primary/10">
                  {result.report.diagnosticHypothesis}
                </div>
              </section>

              {/* Differential Diagnosis */}
              {result.report.differentialDiagnosis && (
                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" /> Diagnóstico
                    Diferencial
                  </h4>
                  <div className="text-sm text-foreground/80 leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/10 whitespace-pre-line">
                    {result.report.differentialDiagnosis}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Legacy fallback */}
          {!result.report && result.clinicalAssessment && (
            <section className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3 h-3" /> Avaliação Clínica
              </h4>
              <div className="text-sm text-foreground/80 leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/20">
                {result.clinicalAssessment}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-rule flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[11px] text-ink-muted">Laudo gerado por análise assistida</p>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={() => onExportPDF('laudo')}
            >
              <Download className="w-3 h-3" /> PDF do Laudo
            </Button>
            {isSaved ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1 text-clinical-ok border-clinical-ok/30 hover:bg-clinical-ok/10"
                disabled
              >
                <ExternalLink className="w-3 h-3" /> Salvo na Biblioteca
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs gap-1"
                onClick={onSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
                {isSaving ? 'Salvando...' : 'Salvar na Biblioteca'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Refinements */}
      <RefinementsSection refinements={refinements} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Conduta Tab Content
// ---------------------------------------------------------------------------

function CondutaTabContent({
  result,
  onExportPDF,
}: {
  result: VisionAnalysisResult
  onExportPDF: (variant: 'laudo' | 'conduta') => void
}) {
  return (
    <div className={cn(PANEL, 'p-6 flex flex-col')}>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
        <div>
          <h2 className="text-xl font-heading font-bold">
            Conduta recomendada
          </h2>
          <p className="text-xs text-muted-foreground">
            Orientações clínicas derivadas da análise
          </p>
        </div>
        {result.meta && (
          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
            {result.meta.imageType}
          </Badge>
        )}
      </div>

      {result.report?.diagnosticHypothesis && (
        <section className="space-y-2 mb-6">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-3 h-3" /> Hipótese Diagnóstica
          </h4>
          <div className="text-sm font-medium text-primary/80 leading-relaxed bg-primary/5 p-3 rounded-lg border border-primary/10">
            {result.report.diagnosticHypothesis}
          </div>
        </section>
      )}

      {result.report?.recommendations &&
      result.report.recommendations.length > 0 ? (
        <ul className="space-y-3">
          {result.report.recommendations.map((rec, i) => (
            <li
              key={i}
              className="flex gap-3 text-sm items-start p-3 rounded-lg bg-muted/30 border border-border/30"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-foreground leading-relaxed pt-0.5">
                {rec}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          Nenhuma conduta recomendada foi gerada para esta análise.
        </p>
      )}

      <div className="mt-6 pt-4 border-t border-rule flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-[11px] text-ink-muted">Conduta derivada da análise assistida</p>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1"
          disabled={!result.report?.recommendations?.length}
          onClick={() => onExportPDF('conduta')}
        >
          <Download className="w-3 h-3" /> PDF da Conduta
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MedVisionResultView({
  analysisResult,
  analysisPrecision,
  image,
  isSaved,
  isSaving,
  refinements,
  onSave,
  onExportPDF,
  onPrint,
  onRetry,
  onNewAnalysis,
  onShareWithPatient,
  onAnnotate,
  onRefineRegion,
  onToggleHeatmap,
  onFullscreen,
  showHeatmap,
  isAnnotating,
  isSelectingRegion,
}: MedVisionResultViewProps) {
  const [activeTab, setActiveTab] = useState<ResultTab>('laudo')

  // ── Empty State ──
  if (!analysisResult) {
    return <EmptyResultState onRetry={onRetry} />
  }

  // ── Derived data ──
  const hasDetections = analysisResult.detections.length > 0
  const recommendationCount =
    analysisResult.report?.recommendations?.length ?? 0

  return (
    <motion.div
      id="medvision-result"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 max-w-6xl mx-auto w-full min-w-0"
    >
      {/* ─── Sticky Action Bar ─── */}
      <div className="no-print sticky top-0 z-30 flex items-center justify-between gap-2 p-3 rounded-xl border border-rule bg-surface-raised shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 font-semibold"
            onClick={() => onExportPDF('laudo')}
          >
            <Download className="w-4 h-4" />
            EXPORTAR PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onPrint}
          >
            <Printer className="w-4 h-4" />
            IMPRIMIR
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={onShareWithPatient}
          >
            <Share2 className="w-4 h-4" />
            COMPARTILHAR
          </Button>
        </div>

        {/* Additional quick-actions */}
        <div className="flex items-center gap-1.5">
          {!isSaved && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>
      </div>

      {/* ─── Clinical Disclaimer ─── */}
      <VisionClinicalDisclaimer />

      {/* ─── Quality Badge (high precision) ─── */}
      {analysisPrecision !== null &&
        analysisPrecision >= 80 &&
        analysisResult.meta && (
          <div className="flex items-center justify-end gap-2">
            <span className="text-[10px] text-muted-foreground">
              Qualidade da imagem:
            </span>
            <span
              className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                qualityBadgeClass(analysisResult.meta.qualityScore),
              )}
            >
              {analysisResult.meta.quality} ·{' '}
              {analysisResult.meta.qualityScore}%
            </span>
          </div>
        )}

      {/* ─── Precision/Quality Warning Banner ─── */}
      {analysisPrecision !== null && analysisPrecision < 80 && (
        <PrecisionBanner
          precision={analysisPrecision}
          meta={analysisResult.meta}
        />
      )}

      {/* ─── Split Layout: Image Sidebar + Tabs ─── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Image Sidebar (desktop: 40%) */}
        <div className="lg:w-[40%] lg:sticky lg:top-24 lg:self-start space-y-4">
          <div className="min-w-0 overflow-hidden rounded-xl border border-rule bg-surface-raised p-1">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-rule bg-surface min-w-0">
              <div className="absolute inset-0 flex items-center justify-center">
                {image && (
                  <ImageOverlay
                    src={image}
                    detections={analysisResult.detections}
                    showHeatmap={showHeatmap}
                    showConfidenceFilter
                    useModernMarkers
                  />
                )}
              </div>
            </div>
          </div>

          {/* Image tooltip */}
          {hasDetections && (
            <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <Info className="w-3 h-3" />
              Clique nos balões de detecção para ver detalhes técnicos
              completos
            </p>
          )}

          {/* No detections state */}
          {!hasDetections && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-clinical-ok/10 border border-clinical-ok/25">
              <CheckCircle2 className="w-5 h-5 text-clinical-ok shrink-0" />
              <div>
                <p className="text-sm font-semibold text-clinical-ok">
                  Sem achados significativos
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  A análise não identificou patologias ou achados com confiança
                  suficiente nesta imagem.
                </p>
              </div>
            </div>
          )}

          {/* New analysis button */}
          <Button
            variant="outline"
            className="w-full rounded-xl h-12 gap-2"
            onClick={onNewAnalysis}
          >
            <RefreshCcw className="w-4 h-4" /> Analisar outra imagem
          </Button>
        </div>

        {/* Right: Tabs Content (desktop: 60%) */}
        <div className="lg:w-[60%] min-w-0">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ResultTab)}
            className="w-full flex flex-col gap-4"
          >
            <TabsList className="no-print grid h-12 w-full max-w-2xl grid-cols-3 gap-0 rounded-xl border border-rule bg-surface p-1.5">
              <TabsTrigger
                value="laudo"
                className="gap-2 rounded-xl text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4 shrink-0" aria-hidden />
                <span>Laudo</span>
                {analysisResult.findings.length > 0 && (
                  <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary">
                    {analysisResult.findings.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="radiografia"
                className="gap-2 rounded-xl text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <ImageIcon className="h-4 w-4 shrink-0" aria-hidden />
                Radiografia
              </TabsTrigger>
              <TabsTrigger
                value="conduta"
                className="gap-2 rounded-xl text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                Conduta
                {recommendationCount > 0 && (
                  <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary">
                    {recommendationCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ─── Laudo Tab ─── */}
            <TabsContent
              value="laudo"
              className="mt-0 max-w-3xl w-full self-center space-y-6 outline-none"
            >
              <LaudoTabContent
                result={analysisResult}
                precision={analysisPrecision}
                onExportPDF={onExportPDF}
                onSave={onSave}
                isSaved={isSaved}
                isSaving={isSaving}
                refinements={refinements}
              />
            </TabsContent>

            {/* ─── Radiografia Tab ─── */}
            <TabsContent
              value="radiografia"
              className="mt-0 space-y-4 outline-none"
            >
              {/* Image with full controls */}
              <div className="min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-card p-1">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border/50 bg-black/5 min-w-0">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {image && (
                      <ImageOverlay
                        src={image}
                        detections={analysisResult.detections}
                        showHeatmap={showHeatmap}
                        showConfidenceFilter
                        useModernMarkers
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Image action controls — recolhidas por padrão */}
              <Collapsible defaultOpen={false} className="no-print">
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full justify-between rounded-xl border-rule px-4"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Wrench className="h-4 w-4 shrink-0" aria-hidden />
                      Ferramentas avançadas
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 justify-start gap-2 rounded-xl text-xs"
                  onClick={onAnnotate}
                  disabled={isSelectingRegion}
                >
                  <Pencil className="h-4 w-4 shrink-0" />
                  {isAnnotating ? 'Anotando...' : 'Anotar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 justify-start gap-2 rounded-xl text-xs"
                  onClick={onRefineRegion}
                  disabled={isAnnotating || isSelectingRegion}
                >
                  <Microscope className="h-4 w-4 shrink-0" />
                  Refinar região
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'h-11 justify-start gap-2 rounded-xl text-xs',
                    showHeatmap && 'border-red-500/40 bg-red-500/10',
                  )}
                  onClick={onToggleHeatmap}
                >
                  Mapa de calor
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 justify-start gap-2 rounded-xl text-xs"
                  onClick={onFullscreen}
                >
                  <Maximize2 className="h-4 w-4 shrink-0" />
                  Tela cheia
                </Button>
              </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Tooltip */}
              {hasDetections && (
                <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
                  <Info className="w-3 h-3" />
                  Clique nos balões de detecção para ver detalhes técnicos
                  completos
                </p>
              )}

              {/* No findings state */}
              {!hasDetections && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-clinical-ok/10 border border-clinical-ok/25">
                  <CheckCircle2 className="w-5 h-5 text-clinical-ok shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-clinical-ok">
                      Sem achados significativos
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      A análise não identificou patologias ou achados com
                      confiança suficiente nesta imagem.
                    </p>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full max-w-2xl rounded-xl h-12 gap-2"
                onClick={onNewAnalysis}
              >
                <RefreshCcw className="w-4 h-4" /> Analisar outra imagem
              </Button>
            </TabsContent>

            {/* ─── Conduta Tab ─── */}
            <TabsContent
              value="conduta"
              className="mt-0 max-w-3xl w-full self-center space-y-6 outline-none"
            >
              <CondutaTabContent
                result={analysisResult}
                onExportPDF={onExportPDF}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </motion.div>
  )
}
