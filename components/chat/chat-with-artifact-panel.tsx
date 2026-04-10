'use client'

import { useCallback, useState } from 'react'
import { Chat } from './chat'
import { ArtifactPanel } from '@/components/artifacts/artifact-panel'
import { ArtifactProvider, useArtifact } from '@/lib/contexts/artifact-context'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn } from '@/lib/utils'
import type { UIMessage } from 'ai'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ExternalLink, FlaskConical } from 'lucide-react'
import { Markdown } from './markdown'

const PANEL_SIZE_KEY = 'artifact-panel-size'
const DEFAULT_CHAT_SIZE = 60
const MIN_CHAT_SIZE = 35
const MIN_ARTIFACT_SIZE = 25

function getLastResearchFromMessages(messages: any[]) {
  if (!Array.isArray(messages) || messages.length === 0) return null

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    const parts = m?.parts
    if (!Array.isArray(parts)) continue
    for (let j = parts.length - 1; j >= 0; j--) {
      const p = parts[j]
      const toolName = p?.toolName ?? p?.type?.replace('tool-', '')
      const state = p?.state
      const output = p?.output

      if ((toolName === 'askPerplexity' || toolName === 'searchPubMed') && (state === 'output-available' || state === 'done' || state === 'result')) {
        const formatted = typeof output?.formatted === 'string' ? output.formatted : (typeof output === 'string' ? output : '')
        const links: { title: string; url: string }[] = []

        if (Array.isArray(output?.articles)) {
          for (const a of output.articles) {
            if (typeof a?.url === 'string' && a.url) {
              links.push({ title: a?.title || 'PubMed', url: a.url })
            }
          }
        }

        if (Array.isArray(output?.sources)) {
          for (const s of output.sources) {
            if (typeof s?.url === 'string' && s.url) {
              links.push({ title: s?.title || 'Fonte', url: s.url })
            }
          }
        }

        const dedup = new Map<string, { title: string; url: string }>()
        for (const l of links) dedup.set(l.url, l)

        return {
          toolName,
          formatted,
          links: Array.from(dedup.values()),
        }
      }
    }
  }

  return null
}

function getResearchBullets(formatted: string) {
  const text = formatted || ''
  if (!text) return []

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const bulletLines = lines.filter((l) => l.startsWith('- ') || l.startsWith('• ') || /^\d+\.\s+/.test(l))
  const selected = (bulletLines.length ? bulletLines : lines).slice(0, 6)

  return selected
    .map((l) => l.replace(/^(-\s+|•\s+|\d+\.\s+)/, '').trim())
    .filter(Boolean)
    .slice(0, 6)
}

type ResearchData = NonNullable<ReturnType<typeof getLastResearchFromMessages>>

function ResearchSummaryBody({
  research,
  researchBullets,
}: {
  research: ResearchData | null
  researchBullets: string[]
}) {
  if (!research) {
    return (
      <p className="text-sm text-muted-foreground">
        Quando você fizer uma pesquisa (Perplexity/PubMed), o resumo e os links vão aparecer aqui.
      </p>
    )
  }

  return (
    <>
      {researchBullets.length > 0 && (
        <div className="rounded-xl border bg-muted/20 p-3">
          <p className="mb-2 text-xs font-semibold text-foreground">Principais pontos</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {researchBullets.slice(0, 6).map((b, idx) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {research.formatted ? (
        <div className="text-sm">
          <Markdown>{research.formatted}</Markdown>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Resultado obtido, mas sem conteúdo formatado.</p>
      )}

      {research.links.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Links</p>
          <div className="grid gap-2">
            {research.links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 transition-colors hover:bg-background/70"
              >
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-xs font-semibold text-foreground">{l.title}</p>
                  <p className="break-all text-[11px] text-muted-foreground">{l.url}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

interface ChatWithArtifactPanelProps {
  id?: string
  initialMessages?: UIMessage[]
  apiEndpoint?: string
  agentId?: string
  userName?: string
  userImage?: string
  subscriptionInfo?: { isPro: boolean; trialDaysRemaining: number }
}

/**
 * Inner component that uses the artifact context
 */
function ChatWithArtifactPanelInner({
  id,
  initialMessages = [],
  apiEndpoint = '/api/chat',
  agentId = 'medvision',
  userName,
  userImage,
  subscriptionInfo,
}: ChatWithArtifactPanelProps) {
  const isMobile = useIsMobile()
  const { isPanelOpen, closePanel, currentArtifact } = useArtifact()

  const [isResearchPanelOpen, setIsResearchPanelOpen] = useState(false)
  const [mobileResearchOpen, setMobileResearchOpen] = useState(false)

  const [liveMessages, setLiveMessages] = useState<any[]>(initialMessages as any[])

  // Load saved panel size from localStorage (sem effect para evitar lint)
  const [chatPanelSize, setChatPanelSize] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_CHAT_SIZE
    const saved = localStorage.getItem(PANEL_SIZE_KEY)
    if (!saved) return DEFAULT_CHAT_SIZE
    const parsed = parseFloat(saved)
    if (isNaN(parsed)) return DEFAULT_CHAT_SIZE
    if (parsed < MIN_CHAT_SIZE) return DEFAULT_CHAT_SIZE
    if (parsed > (100 - MIN_ARTIFACT_SIZE)) return DEFAULT_CHAT_SIZE
    return parsed
  })

  // Save panel size to localStorage
  const handlePanelResize = useCallback((sizes: number[]) => {
    if (sizes[0]) {
      setChatPanelSize(sizes[0])
      localStorage.setItem(PANEL_SIZE_KEY, sizes[0].toString())
    }
  }, [])

  const research = getLastResearchFromMessages(liveMessages)
  const researchBullets = getResearchBullets(research?.formatted || '')

  // Mobile: Show artifact in a sheet/modal
  if (isMobile) {
    return (
      <div className="relative flex h-full min-h-0 flex-col">
        {research && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-end p-3 pb-[calc(88px+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setMobileResearchOpen(true)}
              className={cn(
                'pointer-events-auto inline-flex items-center gap-1.5 rounded-full border bg-background/95 px-3 py-2 text-xs font-semibold shadow-md backdrop-blur-sm',
                'hover:bg-background'
              )}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Resumo da pesquisa
            </button>
          </div>
        )}

        <Chat
          id={id}
          initialMessages={initialMessages as any}
          apiEndpoint={apiEndpoint}
          agentId={agentId}
          userName={userName}
          userImage={userImage}
          subscriptionInfo={subscriptionInfo}
          onMessagesChange={setLiveMessages}
        />

        <Sheet open={mobileResearchOpen} onOpenChange={setMobileResearchOpen}>
          <SheetContent side="bottom" className="flex max-h-[85vh] flex-col p-0">
            <SheetHeader className="border-b px-4 py-3 text-left">
              <SheetTitle>Resumo da pesquisa</SheetTitle>
            </SheetHeader>
            <ScrollArea className="max-h-[min(70vh,560px)]">
              <div className="space-y-4 p-4">
                <ResearchSummaryBody research={research} researchBullets={researchBullets} />
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Mobile Sheet for Artifact */}
        <Sheet open={isPanelOpen} onOpenChange={(open) => !open && closePanel()}>
          <SheetContent side="bottom" className="h-[85vh] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>
                {currentArtifact?.title || 'Artifact'}
              </SheetTitle>
            </SheetHeader>
            <ArtifactPanel
              className="h-full"
              onCollapse={closePanel}
              collapsible
            />
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  // Desktop: Split-screen with resizable panels
  const showRightPanel = isPanelOpen || isResearchPanelOpen
  const rightTitle = isPanelOpen ? (currentArtifact?.title || 'Artifact') : 'Resumo da Pesquisa'

  return (
    <ResizablePanelGroup
      id="chat-artifact-panel-group"
      direction="horizontal"
      className="h-full min-h-0"
      onLayout={handlePanelResize}
    >
      {/* Chat Panel (Left) */}
      <ResizablePanel
        id="chat-panel"
        defaultSize={showRightPanel ? chatPanelSize : 100}
        minSize={MIN_CHAT_SIZE}
        order={1}
      >
        <div className="h-full min-h-0 flex flex-col">
          <div className="px-3 pt-3">
            {research && (
              <button
                type="button"
                onClick={() => setIsResearchPanelOpen((v) => !v)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  'bg-background/60 hover:bg-background/80'
                )}
              >
                <FlaskConical className="w-4 h-4" />
                {isResearchPanelOpen ? 'Ocultar resumo da pesquisa' : 'Mostrar resumo da pesquisa'}
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0">
            <Chat
              id={id}
              initialMessages={initialMessages as any}
              apiEndpoint={apiEndpoint}
              agentId={agentId}
              userName={userName}
              userImage={userImage}
              subscriptionInfo={subscriptionInfo}
              onMessagesChange={setLiveMessages}
            />
          </div>
        </div>
      </ResizablePanel>

      {/* Artifact Panel (Right) - Only show when open */}
      {showRightPanel && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            id="artifact-panel"
            defaultSize={100 - chatPanelSize}
            minSize={MIN_ARTIFACT_SIZE}
            order={2}
          >
            {isPanelOpen ? (
              <ArtifactPanel
                className="h-full"
                onCollapse={closePanel}
                collapsible
              />
            ) : (
              <div className="h-full min-h-0 flex flex-col">
                <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                  <p className="text-sm font-semibold">{rightTitle}</p>
                  <button
                    type="button"
                    onClick={() => setIsResearchPanelOpen(false)}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Fechar
                  </button>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-4 p-4">
                    <ResearchSummaryBody research={research} researchBullets={researchBullets} />
                  </div>
                </ScrollArea>
              </div>
            )}
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}

/**
 * Chat component with artifact side panel
 *
 * Layout:
 * - Desktop: Split-screen with chat on left (60%) e painel direito (artifact ou resumo da pesquisa)
 * - Mobile: Chat em tela cheia; artifact em bottom sheet; resumo da pesquisa em outro bottom sheet (FAB)
 *
 * Features:
 * - Resizable panels on desktop
 * - Panel size persistence in localStorage
 * - Collapsible artifact panel
 * - Resumo Perplexity/PubMed com bullets e links
 */
export function ChatWithArtifactPanel(props: ChatWithArtifactPanelProps) {
  const sessionKey = props.id ?? 'new-chat'
  return (
    <ArtifactProvider key={sessionKey}>
      <ChatWithArtifactPanelInner {...props} />
    </ArtifactProvider>
  )
}
