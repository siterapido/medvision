'use client'

/**
 * Message - Vercel Chat SDK Pattern with Artifacts Support
 *
 * - Mensagens do usuário: bolha azul alinhada à direita
 * - Mensagens do assistente: sem bolha, alinhada à esquerda com ícone sparkles
 * - Tool calls: cards ricos mostrando o que a IA está fazendo em tempo real
 */

import type { UIMessage } from 'ai'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { SparklesIcon } from './icons'
import { Loader2 } from 'lucide-react'
import { Markdown } from './markdown'
import {
  ArtifactRenderer,
  type Artifact,
  createCodeArtifact,
  createSummaryArtifact,
  createFlashcardArtifact,
  createTableArtifact,
  createImageArtifact
} from '@/components/artifacts'
import {
  Search, BookOpen, FlaskConical, Brain, FileText, Layers,
  CheckCircle2, AlertCircle, Code, Image as ImageIcon, Table, Lightbulb,
  Database, Globe, BookMarked, Cpu, ExternalLink
} from 'lucide-react'

interface MessageProps {
  message: UIMessage
  isLoading?: boolean
}

// ─── Tool metadata ────────────────────────────────────────────────────────────

interface ToolMeta {
  label: string
  labelLoading: string
  icon: React.ReactNode
  color: string        // Tailwind text color
  bgColor: string      // Tailwind bg color
  borderColor: string  // Tailwind border color
}

const TOOL_META: Record<string, ToolMeta> = {
  searchKnowledge: {
    label: 'Base de Conhecimento',
    labelLoading: 'Buscando na base de conhecimento...',
    icon: <Database className="w-3.5 h-3.5" />,
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40',
    borderColor: 'border-sky-200 dark:border-sky-800/60',
  },
  askPerplexity: {
    label: 'Literatura Científica',
    labelLoading: 'Pesquisando evidências científicas...',
    icon: <Globe className="w-3.5 h-3.5" />,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/40',
    borderColor: 'border-violet-200 dark:border-violet-800/60',
  },
  searchPubMed: {
    label: 'PubMed',
    labelLoading: 'Consultando PubMed...',
    icon: <BookMarked className="w-3.5 h-3.5" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800/60',
  },
  generateArtifact: {
    label: 'Gerando material',
    labelLoading: 'Criando material de estudo...',
    icon: <Cpu className="w-3.5 h-3.5" />,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800/60',
  },
  saveSummary: {
    label: 'Resumo salvo',
    labelLoading: 'Salvando resumo na biblioteca...',
    icon: <FileText className="w-3.5 h-3.5" />,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40',
    borderColor: 'border-teal-200 dark:border-teal-800/60',
  },
  saveFlashcards: {
    label: 'Flashcards salvos',
    labelLoading: 'Salvando flashcards na biblioteca...',
    icon: <Layers className="w-3.5 h-3.5" />,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40',
    borderColor: 'border-teal-200 dark:border-teal-800/60',
  },
  saveResearch: {
    label: 'Pesquisa salva',
    labelLoading: 'Salvando dossiê na biblioteca...',
    icon: <FlaskConical className="w-3.5 h-3.5" />,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40',
    borderColor: 'border-teal-200 dark:border-teal-800/60',
  },
  savePracticeExam: {
    label: 'Simulado salvo',
    labelLoading: 'Salvando simulado na biblioteca...',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40',
    borderColor: 'border-teal-200 dark:border-teal-800/60',
  },
  saveMindMap: {
    label: 'Mapa mental salvo',
    labelLoading: 'Salvando mapa mental na biblioteca...',
    icon: <Brain className="w-3.5 h-3.5" />,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40',
    borderColor: 'border-teal-200 dark:border-teal-800/60',
  },
  updateUserProfile: {
    label: 'Contexto salvo',
    labelLoading: 'Salvando seu contexto...',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: 'text-zinc-500 dark:text-zinc-400',
    bgColor: 'bg-zinc-50 dark:bg-zinc-900/40',
    borderColor: 'border-zinc-200 dark:border-zinc-800/60',
  },
  saveImageAnalysis: {
    label: 'Análise salva',
    labelLoading: 'Salvando análise de imagem...',
    icon: <ImageIcon className="w-3.5 h-3.5" />,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-800/60',
  },
}

function getToolMeta(toolName: string): ToolMeta {
  return TOOL_META[toolName] ?? {
    label: toolName,
    labelLoading: `Executando ${toolName}...`,
    icon: <Lightbulb className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border',
  }
}

// ─── Tool part renderer ───────────────────────────────────────────────────────

function asStringOrJson(value: unknown) {
  if (value == null) return ''
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}

type ResearchToolName = 'askPerplexity' | 'searchPubMed'

function isResearchTool(toolName: string): toolName is ResearchToolName {
  return toolName === 'askPerplexity' || toolName === 'searchPubMed'
}

function extractResearchMarkdown(output: any) {
  if (!output) return ''
  if (typeof output === 'string') return output
  if (typeof output?.formatted === 'string' && output.formatted.trim()) return output.formatted
  if (typeof output?.message === 'string' && output.message.trim()) return output.message
  return ''
}

function extractResearchLinks(output: any): { title: string; url: string }[] {
  const links: { title: string; url: string }[] = []

  const articles = output?.articles
  if (Array.isArray(articles)) {
    for (const a of articles) {
      const url = typeof a?.url === 'string' ? a.url : ''
      if (!url) continue
      const title = typeof a?.title === 'string' && a.title.trim() ? a.title : 'Link'
      links.push({ title, url })
    }
  }

  const sources = output?.sources
  if (Array.isArray(sources)) {
    for (const s of sources) {
      const url = typeof s?.url === 'string' ? s.url : ''
      if (!url) continue
      const title = typeof s?.title === 'string' && s.title.trim() ? s.title : 'Fonte'
      links.push({ title, url })
    }
  }

  // De-dup por URL
  const seen = new Set<string>()
  return links.filter((l) => {
    if (seen.has(l.url)) return false
    seen.add(l.url)
    return true
  })
}

function ResearchToolResultCard({
  toolName,
  meta,
  output,
}: {
  toolName: ResearchToolName
  meta: ToolMeta
  output: any
}) {
  const [expanded, setExpanded] = useState(false)

  const markdown = useMemo(() => extractResearchMarkdown(output), [output])
  const links = useMemo(() => extractResearchLinks(output), [output])
  const preview = useMemo(() => {
    const raw = markdown || asStringOrJson(output)
    return raw.slice(0, 320).trim()
  }, [markdown, output])

  const hasDetails = Boolean(markdown && markdown.length > 320) || links.length > 0

  return (
    <div className={cn('rounded-xl border overflow-hidden text-sm', meta.bgColor, meta.borderColor)}>
      <div className={cn('flex items-center justify-between gap-3 px-3 py-2 border-b', meta.color, meta.borderColor)}>
        <div className="flex items-center gap-2 font-medium min-w-0">
          {meta.icon}
          <span className="truncate">{meta.label} — resultado obtido</span>
        </div>

        {hasDetails && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              'shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors',
              'bg-background/60 hover:bg-background/80 border border-border/60'
            )}
            aria-expanded={expanded}
          >
            {expanded ? 'Ocultar' : 'Ver detalhes'}
          </button>
        )}
      </div>

      {!expanded ? (
        <div className="px-3 py-2 text-muted-foreground text-xs leading-relaxed">
          {preview}{(markdown || asStringOrJson(output)).length > 320 ? '…' : ''}
          {links.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {links.slice(0, 2).map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-background/80 border border-border/60"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate max-w-[18rem]">{l.title}</span>
                </a>
              ))}
              {links.length > 2 && (
                <span className="text-[11px] font-semibold text-muted-foreground">
                  +{links.length - 2} links
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="px-3 py-3">
          {markdown ? (
            <Markdown>{markdown}</Markdown>
          ) : (
            <pre className="text-xs overflow-auto max-h-64 p-3 bg-muted/40 rounded-lg border border-border/60">
              {asStringOrJson(output)}
            </pre>
          )}

          {links.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-foreground mb-2">Links</p>
              <div className="grid gap-2">
                {links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 hover:bg-background/70 transition-colors"
                  >
                    <ExternalLink className="mt-0.5 w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground line-clamp-2">{l.title}</p>
                      <p className="text-[11px] text-muted-foreground break-all">{l.url}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function renderToolPart(part: any, key: string) {
  const toolName = part.toolName ?? part.type?.replace('tool-', '') ?? 'unknown'
  const state: string = part.state ?? ''
  const output = part.output
  const input = part.input
  const meta = getToolMeta(toolName)

  const isLoading = state === 'streaming' || state === 'input-streaming' || state === 'input-available' || state === 'partial-call'
  const isDone = state === 'output-available' || state === 'done' || state === 'result'

  // ── Loading state ──
  if (isLoading) {
    return (
      <div
        key={key}
        className={cn(
          'flex items-center gap-2 text-sm px-3 py-2 rounded-xl border',
          meta.bgColor, meta.borderColor, meta.color
        )}
      >
        <Loader2 size={14} className="shrink-0 animate-spin" />
        <span className="font-medium">{meta.labelLoading}</span>
      </div>
    )
  }

  // ── Done state ──
  if (isDone) {
    // Silencioso para ferramentas de save/profile (só mostra ícone de check)
    const isSilent = toolName.startsWith('save') || toolName === 'updateUserProfile'
    if (isSilent) {
      return (
        <div
          key={key}
          className={cn(
            'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border w-fit',
            meta.bgColor, meta.borderColor, meta.color
          )}
        >
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          <span className="font-medium">{meta.label}</span>
        </div>
      )
    }

    // searchKnowledge: mostra fontes encontradas
    if (toolName === 'searchKnowledge' && output?.success && output?.documents?.length > 0) {
      return (
        <div
          key={key}
          className={cn('rounded-xl border overflow-hidden text-sm', meta.bgColor, meta.borderColor)}
        >
          <div className={cn('flex items-center gap-2 px-3 py-2 border-b font-medium', meta.color, meta.borderColor)}>
            {meta.icon}
            <span>{output.documents.length} fonte{output.documents.length !== 1 ? 's' : ''} encontrada{output.documents.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-border/50">
            {output.documents.slice(0, 3).map((doc: any, i: number) => (
              <div key={i} className="px-3 py-2">
                <p className="font-medium text-foreground truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{doc.content}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // askPerplexity / searchPubMed: mostra resumo compacto do resultado
    if (isResearchTool(toolName) && output) {
      return <ResearchToolResultCard key={key} toolName={toolName} meta={meta} output={output} />
    }

    // generateArtifact: tenta renderizar como artifact
    if (toolName === 'generateArtifact') {
      const artifact = parseToolOutputAsArtifact(toolName, output, input)
      if (artifact) {
        return <ArtifactRenderer key={key} artifact={artifact} className="mt-2" />
      }
    }

    // Fallback: card genérico com ícone de sucesso
    return (
      <div
        key={key}
        className={cn(
          'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border w-fit',
          meta.bgColor, meta.borderColor, meta.color
        )}
      >
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        <span className="font-medium">{meta.label}</span>
      </div>
    )
  }

  return null
}

// ─── Artifact parser (legado para tools da v1) ────────────────────────────────

function parseToolOutputAsArtifact(toolName: string, output: any, input: any): Artifact | null {
  if (!output) return null

  switch (toolName) {
    case 'generateArtifact':
      if (output.type === 'summary' || output.type === 'study-guide' || output.type === 'clinical-protocol') {
        return createSummaryArtifact({
          title: output.title || 'Resumo',
          content: typeof output.content === 'string' ? output.content : JSON.stringify(output.content),
          keyPoints: [],
        })
      }
      if (output.type === 'flashcards') {
        const cards = Array.isArray(output.content) ? output.content : output.content?.cards || []
        return createFlashcardArtifact({
          title: output.title || 'Flashcards',
          cards: cards.map((c: any, i: number) => ({
            id: `card-${i}`,
            front: c.front || c.question || '',
            back: c.back || c.answer || '',
          })),
        })
      }
      return null

    case 'createCode':
    case 'generateCode':
      return createCodeArtifact({
        title: output.title || input?.title || 'Código',
        language: output.language || 'typescript',
        code: output.code || output.content || '',
      })

    case 'createSummary':
    case 'generateSummary':
      return createSummaryArtifact({
        title: output.title || 'Resumo',
        content: output.content || '',
        keyPoints: output.keyPoints || [],
      })

    case 'createFlashcards':
    case 'generateFlashcards': {
      const cards = output.cards || []
      if (!cards.length) return null
      return createFlashcardArtifact({
        title: output.title || 'Flashcards',
        cards: cards.map((c: any, i: number) => ({
          id: `card-${i}`,
          front: c.front || c.question || '',
          back: c.back || c.answer || '',
        })),
      })
    }

    case 'generateImage':
    case 'createImage':
      if (output.url || output.image_url) {
        return createImageArtifact({
          title: output.title || 'Imagem',
          url: output.url || output.image_url,
          alt: output.alt,
        })
      }
      return null

    default:
      return null
  }
}

// ─── Message component ────────────────────────────────────────────────────────

export function Message({ message, isLoading }: MessageProps) {
  return (
    <div
      className="group/message fade-in w-full animate-in duration-200"
      data-role={message.role}
    >
      <div
        className={cn('flex w-full items-start gap-2 md:gap-3', {
          'justify-end': message.role === 'user',
          'justify-start': message.role === 'assistant',
        })}
      >
        {/* Avatar do assistente */}
        {message.role === 'assistant' && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        {/* Conteúdo da mensagem */}
        <div
          className={cn('flex flex-col', {
            'gap-2 md:gap-3': message.role === 'assistant',
            'w-full max-w-[calc(100%-3rem)]': message.role === 'assistant',
            'max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]': message.role === 'user',
          })}
        >
          {message.parts?.map((part, index) => {
            const key = `message-${message.id}-part-${index}`

            if (part.type === 'text') {
              return (
                <div key={key}>
                  <div
                    className={cn('wrap-break-word rounded-2xl px-3 py-2', {
                      'w-fit text-right text-primary-foreground bg-primary': message.role === 'user',
                      'bg-transparent px-0 py-0 text-left': message.role === 'assistant',
                    })}
                  >
                    {message.role === 'assistant' ? (
                      <Markdown>{(part as any).text}</Markdown>
                    ) : (
                      (part as any).text
                    )}
                  </div>
                </div>
              )
            }

            // Tool invocations
            if (part.type.startsWith('tool-') || part.type === 'tool-invocation') {
              return renderToolPart(part, key)
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}

// ─── ThinkingMessage ──────────────────────────────────────────────────────────

export function ThinkingMessage() {
  return (
    <div
      className="group/message fade-in w-full animate-in duration-300"
      data-role="assistant"
    >
      <div className="flex items-start justify-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <div className="animate-pulse">
            <SparklesIcon size={14} />
          </div>
        </div>

        <div className="flex items-center gap-1 p-0 text-muted-foreground text-sm">
          <span className="animate-pulse">Pensando</span>
          <span className="inline-flex">
            <span className="animate-bounce [animation-delay:0ms]">.</span>
            <span className="animate-bounce [animation-delay:150ms]">.</span>
            <span className="animate-bounce [animation-delay:300ms]">.</span>
          </span>
        </div>
      </div>
    </div>
  )
}
