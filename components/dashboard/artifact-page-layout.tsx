"use client"

import { ReactNode, useState } from "react"
import { PanelRightOpen, PanelRightClose } from "lucide-react"
import { AgentChatPanel } from "@/components/chat"
import { getAgentSuggestions, getAgentInfo } from "@/lib/agent-config"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ArtifactResult } from "@/components/chat/types"

interface ArtifactPageLayoutProps {
    children: ReactNode
    agentId: string
    userId: string
    onArtifactCreated?: (artifact: ArtifactResult) => void
}

/**
 * Layout wrapper para páginas de artefatos com painel de chat lateral
 * Mostra conteúdo à esquerda (70%) e chat do agente à direita (30%)
 */
export function ArtifactPageLayout({
    children,
    agentId,
    userId,
    onArtifactCreated
}: ArtifactPageLayoutProps) {
    const [chatOpen, setChatOpen] = useState(true)
    const agentInfo = getAgentInfo(agentId)
    const suggestions = getAgentSuggestions(agentId)

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Main Content */}
            <div className={cn(
                "flex-1 overflow-y-auto transition-all duration-300 custom-scrollbar",
                chatOpen ? "md:w-[70%]" : "w-full"
            )}>
                {children}

                {/* Toggle button when chat is closed */}
                {!chatOpen && (
                    <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => setChatOpen(true)}
                        className={cn(
                            "fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full shadow-lg",
                            `bg-gradient-to-r ${agentInfo.gradient} text-white hover:opacity-90`
                        )}
                        title={`Abrir chat com ${agentInfo.name}`}
                    >
                        <PanelRightOpen className="w-5 h-5" />
                    </Button>
                )}
            </div>

            {/* Chat Panel */}
            {chatOpen && (
                <div className="hidden md:block w-[30%] min-w-[320px] max-w-[450px] relative border-l border-slate-800/50">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setChatOpen(false)}
                        className="absolute top-2 right-2 z-10 h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Fechar chat"
                    >
                        <PanelRightClose className="w-4 h-4" />
                    </Button>
                    <AgentChatPanel
                        agentId={agentId}
                        userId={userId}
                        suggestions={suggestions}
                        onArtifactCreated={onArtifactCreated}
                        compact={false}
                    />
                </div>
            )}
        </div>
    )
}
