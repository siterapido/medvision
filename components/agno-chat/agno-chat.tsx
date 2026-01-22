"use client"

import { useEffect, useRef, useState } from "react"
import { MessageSquarePlus, Bot, Sparkles, X, History, MessageSquare, Trash2, BrainCircuit } from "lucide-react"
import { useAgnoAgents } from "@/lib/hooks/useAgnoAgents"
import { useAgnoChat } from "@/lib/hooks/useAgnoChat"
import { useImageUpload } from "@/lib/hooks/useImageUpload"
import { getAgentInfo } from "@/lib/agent-config"
// AgentSelector removed - Odonto GPT is the only chat agent
import { AgnoMessage } from "./agno-message"
import { AgnoInput } from "./agno-input"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { AGENT_IDS } from "@/lib/constants"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AgnoChatProps {
    userId: string
    onArtifactCreated?: (artifact: any) => void
}

export function AgnoChat({ userId, onArtifactCreated }: AgnoChatProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Hooks
    const {
        agents,
        selectedAgent,
        // Select logic is automatic now
        isLoading: agentsLoading,
        isConnected,
        error: agentsError,
    } = useAgnoAgents()

    const {
        messages,
        isStreaming,
        error: chatError,
        sendMessage,
        clearChat,
        sessions,
        loadSession,
        loadSessions,
        isLoadingSessions,
        sessionId
    } = useAgnoChat({
        userId,
        onArtifactCreated: (artifact) => {
            console.log("SUCESSO: Artefato criado!", artifact)
            if (onArtifactCreated) onArtifactCreated(artifact)
        }
    })

    const { uploadImage, isUploading } = useImageUpload()

    // Load sessions on mount
    useEffect(() => {
        loadSessions()
    }, [loadSessions])

    // Smart Auto-scroll
    useEffect(() => {
        if (messages.length > 0) {
            const container = messagesEndRef.current?.parentElement
            if (container) {
                const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
                if (isNearBottom) {
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
                }
            }
        }
    }, [messages])

    // Error Toast
    useEffect(() => {
        if (agentsError) {
            toast.error("Erro de conexão com agentes", {
                description: agentsError
            })
        }
    }, [agentsError])

    useEffect(() => {
        if (chatError) {
            toast.error("Erro no chat", {
                description: chatError
            })
        }
    }, [chatError])

    const handleSend = async (message: string, file?: File) => {
        if (!selectedAgent) return

        let imageUrl: string | undefined

        if (file) {
            const url = await uploadImage(file)
            if (url) {
                imageUrl = url
            } else {
                console.error("Failed to upload image")
                return
            }
        }

        await sendMessage(message, selectedAgent, imageUrl)
    }

    const handleNewChat = () => {
        clearChat()
    }

    const handleSelectSession = (id: string) => {
        loadSession(id)
    }

    const suggestions = [
        "Tenho dúvida na técnica de Clark",
        "Me explique o tratamento de canal passo a passo",
        "Como funciona a adesão dentinária?",
        "Estou com dificuldade em Anatomia",
    ]

    return (
        <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background p-4 md:p-6">
            {/* Main Chat Area - Centered Card */}
            <div className="flex flex-col w-full max-w-5xl h-full max-h-[90vh] bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/5">
                {/* Header */}
                <div className="flex-shrink-0 border-b border-border/40 bg-card/80 backdrop-blur-md z-10">
                    <div className="w-full px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {/* History Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="p-2 -ml-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all group flex items-center gap-2 outline-none"
                                        title="Histórico de Conversas"
                                    >
                                        <History className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-medium hidden sm:inline group-hover:text-primary">Histórico</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[300px] bg-card border-border text-card-foreground">
                                    <DropdownMenuLabel className="text-muted-foreground">Conversas Recentes</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-border" />
                                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                        {isLoadingSessions ? (
                                            <div className="text-center py-4 text-muted-foreground text-sm animate-pulse">
                                                Carregando histórico...
                                            </div>
                                        ) : sessions.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm px-4 text-center">
                                                <History className="w-8 h-8 mb-2 opacity-50" />
                                                <p>Nenhuma conversa anterior</p>
                                            </div>
                                        ) : (
                                            sessions.map((session) => (
                                                <DropdownMenuItem
                                                    key={session.session_id}
                                                    onClick={() => handleSelectSession(session.session_id)}
                                                    className={cn(
                                                        "cursor-pointer flex items-center gap-3 p-3 focus:bg-muted focus:text-foreground",
                                                        sessionId === session.session_id ? "bg-muted text-foreground" : "text-muted-foreground"
                                                    )}
                                                >
                                                    <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-70" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {session.session_name}
                                                        </p>
                                                        <p className="text-[10px] opacity-60">
                                                            {session.created_at ? format(new Date(session.created_at * 1000), "d 'de' MMM, HH:mm", { locale: ptBR }) : ""}
                                                        </p>
                                                    </div>
                                                </DropdownMenuItem>
                                            ))
                                        )}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* New Chat Button */}
                            <button
                                onClick={handleNewChat}
                                className="p-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-xl transition-all group flex items-center gap-2"
                                title="Nova Conversa"
                            >
                                <MessageSquarePlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium hidden sm:inline group-hover:text-green-500">Nova Conversa</span>
                            </button>

                            <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

                            {/* Static Title instead of Selector */}
                            <div className="flex items-center gap-2 text-foreground px-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="font-semibold text-sm">Odonto GPT</span>
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">TUTOR</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Connection indicator - compact */}
                            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${isConnected
                                ? "text-green-500"
                                : "text-destructive"
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-destructive"}`} />
                                <span className="hidden sm:inline">{isConnected ? "Ativo" : "Offline"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar bg-card/50">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Welcome State - Tutor Focused */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 animate-fade-in">
                                {/* Tutor Hero */}
                                <div className="relative mb-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse-glow glow-blue">
                                        <BrainCircuit className="w-10 h-10 text-white" />
                                    </div>
                                    {/* Orbital ring effect */}
                                    <div className="absolute inset-0 -m-4 rounded-full border border-primary/20 animate-spin-slow" />
                                </div>

                                <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                                    Olá, sou o Odonto GPT!
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </h1>

                                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                                    Seu Tutor Inteligente. Estou aqui para guiar seu aprendizado, tirar dúvidas e conectar seus estudos usando todo o potencial da IA.
                                </p>

                                <p className="text-base text-muted-foreground mb-8 max-w-md">
                                    O que vamos aprender hoje?
                                </p>

                                {/* Suggestion Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => handleSend(suggestion)}
                                            disabled={isStreaming || isUploading}
                                            className="p-3 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/50 hover:bg-muted/60 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <p className="text-sm text-muted-foreground group-hover:text-foreground font-medium">
                                                {suggestion}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {(chatError || agentsError) && (
                            <div className="flex justify-center">
                                <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 max-w-md flex items-center gap-3">
                                    <X className="w-5 h-5 text-destructive shrink-0" />
                                    <p className="text-destructive text-sm">{chatError || agentsError}</p>
                                </div>
                            </div>
                        )}

                        {/* Messages List */}
                        {messages.map((message, index) => (
                            <div key={message.id}>
                                <AgnoMessage message={message} />
                            </div>
                        ))}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="flex-shrink-0 border-t border-border/40 bg-card/80 backdrop-blur-md pb-[env(safe-area-inset-bottom,20px)] pt-2">
                    <div className="max-w-3xl mx-auto p-4">
                        <AgnoInput
                            onSend={handleSend}
                            disabled={!selectedAgent || !isConnected || isUploading}
                            isStreaming={isStreaming || isUploading}
                            placeholder={
                                !isConnected
                                    ? "AgentOS desconectado..."
                                    : isUploading
                                        ? "Enviando imagem..."
                                        : "Pergunte ao seu Tutor..."
                            }
                        />
                        <p className="text-center text-[10px] text-muted-foreground mt-2">
                            Odonto GPT utiliza IA para suporte educacional. Verifique informações clínicas críticas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
