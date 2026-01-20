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
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-950 relative">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col w-full min-w-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                {/* Header */}
                <div className="flex-shrink-0 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
                    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {/* History Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="p-2 -ml-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all group flex items-center gap-2 outline-none"
                                        title="Histórico de Conversas"
                                    >
                                        <History className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-medium hidden sm:inline text-slate-400 group-hover:text-cyan-400">Histórico</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[300px] bg-slate-900 border-slate-800 text-slate-200">
                                    <DropdownMenuLabel className="text-slate-400">Conversas Recentes</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-slate-800" />
                                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                        {isLoadingSessions ? (
                                            <div className="text-center py-4 text-slate-500 text-sm animate-pulse">
                                                Carregando histórico...
                                            </div>
                                        ) : sessions.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-sm px-4 text-center">
                                                <History className="w-8 h-8 mb-2 opacity-50" />
                                                <p>Nenhuma conversa anterior</p>
                                            </div>
                                        ) : (
                                            sessions.map((session) => (
                                                <DropdownMenuItem
                                                    key={session.session_id}
                                                    onClick={() => handleSelectSession(session.session_id)}
                                                    className={cn(
                                                        "cursor-pointer flex items-center gap-3 p-3 focus:bg-slate-800 focus:text-slate-200",
                                                        sessionId === session.session_id ? "bg-slate-800 text-white" : "text-slate-400"
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
                                className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-xl transition-all group flex items-center gap-2"
                                title="Nova Conversa"
                            >
                                <MessageSquarePlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium hidden sm:inline text-slate-400 group-hover:text-green-400">Nova Conversa</span>
                            </button>

                            <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block" />

                            {/* Static Title instead of Selector */}
                            <div className="flex items-center gap-2 text-slate-200 px-2">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <span className="font-semibold text-sm">Odonto GPT</span>
                                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">TUTOR</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Connection indicator - compact */}
                            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${isConnected
                                ? "text-green-400"
                                : "text-red-400"
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                                <span className="hidden sm:inline">{isConnected ? "Ativo" : "Offline"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Welcome State - Tutor Focused */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 animate-fade-in">
                                {/* Tutor Hero */}
                                <div className="relative mb-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 animate-pulse-glow glow-cyan">
                                        <BrainCircuit className="w-10 h-10 text-white" />
                                    </div>
                                    {/* Orbital ring effect */}
                                    <div className="absolute inset-0 -m-4 rounded-full border border-cyan-500/20 animate-spin-slow" />
                                </div>

                                <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                    Olá, sou o Odonto GPT!
                                    <Sparkles className="w-5 h-5 text-cyan-400" />
                                </h1>

                                <p className="text-sm text-slate-400 mb-6 max-w-md">
                                    Seu Tutor Inteligente. Estou aqui para guiar seu aprendizado, tirar dúvidas e conectar seus estudos usando todo o potencial da IA.
                                </p>

                                <p className="text-base text-slate-400 mb-8 max-w-md">
                                    O que vamos aprender hoje?
                                </p>

                                {/* Suggestion Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => handleSend(suggestion)}
                                            disabled={isStreaming || isUploading}
                                            className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <p className="text-sm text-slate-300 group-hover:text-white font-medium">
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
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 max-w-md flex items-center gap-3">
                                    <X className="w-5 h-5 text-red-400 shrink-0" />
                                    <p className="text-red-400 text-sm">{chatError || agentsError}</p>
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
                <div className="flex-shrink-0 border-t border-slate-800/50 bg-slate-900/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom,20px)] pt-2">
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
                        <p className="text-center text-[10px] text-slate-600 mt-2">
                            Odonto GPT utiliza IA para suporte educacional. Verifique informações clínicas críticas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
