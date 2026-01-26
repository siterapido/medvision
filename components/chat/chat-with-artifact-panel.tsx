'use client'

import { useCallback, useEffect, useState } from 'react'
import { Chat } from './chat'
import { ArtifactPanel, ArtifactPanelEmpty } from '@/components/artifacts/artifact-panel'
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

const PANEL_SIZE_KEY = 'artifact-panel-size'
const DEFAULT_CHAT_SIZE = 60
const MIN_CHAT_SIZE = 35
const MIN_ARTIFACT_SIZE = 25

interface ChatWithArtifactPanelProps {
  id?: string
  initialMessages?: UIMessage[]
  apiEndpoint?: string
  agentId?: string
  userName?: string
  userImage?: string
}

/**
 * Inner component that uses the artifact context
 */
function ChatWithArtifactPanelInner({
  id,
  initialMessages = [],
  apiEndpoint = '/api/chat',
  agentId = 'odonto-gpt',
  userName,
  userImage,
}: ChatWithArtifactPanelProps) {
  const isMobile = useIsMobile()
  const { isPanelOpen, closePanel, currentArtifact } = useArtifact()

  // Load saved panel size from localStorage
  const [chatPanelSize, setChatPanelSize] = useState(DEFAULT_CHAT_SIZE)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(PANEL_SIZE_KEY)
    if (saved) {
      const parsed = parseFloat(saved)
      if (!isNaN(parsed) && parsed >= MIN_CHAT_SIZE && parsed <= (100 - MIN_ARTIFACT_SIZE)) {
        setChatPanelSize(parsed)
      }
    }
  }, [])

  // Save panel size to localStorage
  const handlePanelResize = useCallback((sizes: number[]) => {
    if (sizes[0]) {
      setChatPanelSize(sizes[0])
      localStorage.setItem(PANEL_SIZE_KEY, sizes[0].toString())
    }
  }, [])

  // Mobile: Show artifact in a sheet/modal
  if (isMobile) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <Chat
          id={id}
          initialMessages={initialMessages as any}
          apiEndpoint={apiEndpoint}
          agentId={agentId}
          userName={userName}
          userImage={userImage}
        />

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
        defaultSize={isPanelOpen ? chatPanelSize : 100}
        minSize={MIN_CHAT_SIZE}
        order={1}
      >
        <Chat
          id={id}
          initialMessages={initialMessages as any}
          apiEndpoint={apiEndpoint}
          agentId={agentId}
          userName={userName}
          userImage={userImage}
        />
      </ResizablePanel>

      {/* Artifact Panel (Right) - Only show when open */}
      {isPanelOpen && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            id="artifact-panel"
            defaultSize={100 - chatPanelSize}
            minSize={MIN_ARTIFACT_SIZE}
            order={2}
          >
            <ArtifactPanel
              className="h-full"
              onCollapse={closePanel}
              collapsible
            />
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
 * - Desktop: Split-screen with chat on left (60%) and artifact panel on right (40%)
 * - Mobile: Chat fullscreen, artifact opens as bottom sheet
 *
 * Features:
 * - Resizable panels on desktop
 * - Panel size persistence in localStorage
 * - Collapsible artifact panel
 */
export function ChatWithArtifactPanel(props: ChatWithArtifactPanelProps) {
  return (
    <ArtifactProvider>
      <ChatWithArtifactPanelInner {...props} />
    </ArtifactProvider>
  )
}
