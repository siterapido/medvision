"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Sparkles,
    FlaskConical,
    GraduationCap,
    FileText,
    ScanEye,
    Paperclip,
    Mic,
    Image as ImageIcon,
    File,
    ArrowUp,
    Cpu,
    ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type AgentConfig } from "@/lib/ai/agents/config"
import { AGENT_UI_CONFIG } from "@/lib/ai/agents/ui-config"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ModernChatInputProps {
    input: string
    setInput: (value: string) => void
    onSend: () => void
    agents: AgentConfig[]
    selectedAgent: AgentConfig
    setSelectedAgent: (agent: AgentConfig) => void
    isLoading: boolean
    isReady: boolean
    handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
    inputRef: React.RefObject<HTMLTextAreaElement | null>
    onFileSelect?: (file: File) => void
}

export function ModernChatInput({
    input = "",
    setInput,
    onSend,
    agents = [],
    selectedAgent,
    setSelectedAgent,
    isLoading = false,
    isReady = true,
    handleKeyDown,
    inputRef,
    onFileSelect,
}: ModernChatInputProps) {
    const [showAttachments, setShowAttachments] = useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Safe wrappers for callbacks
    const safeSetInput = React.useCallback((value: string) => {
        if (typeof setInput === 'function') {
            setInput(value)
        }
    }, [setInput])

    const safeSetSelectedAgent = React.useCallback((agent: AgentConfig) => {
        if (typeof setSelectedAgent === 'function') {
            setSelectedAgent(agent)
        }
    }, [setSelectedAgent])

    const safeHandleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (typeof handleKeyDown === 'function') {
            handleKeyDown(e)
        }
    }, [handleKeyDown])

    const handleFileClick = () => {
        fileInputRef.current?.click()
        setShowAttachments(false)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && onFileSelect) {
            onFileSelect(file)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log("[ModernChatInput] handleSubmit triggered")
        onSend()
    }

    return (
        <div className="relative w-full max-w-4xl mx-auto px-2 pb-6 md:px-4 md:pb-12">
            <div
                className={cn(
                    "relative flex flex-col gap-1 p-2 rounded-[28px] bg-white dark:bg-zinc-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-zinc-200 dark:ring-zinc-800 transition-all duration-500",
                    "focus-within:ring-zinc-300 dark:focus-within:ring-zinc-700 focus-within:shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
                )}
            >
                {/* Top Area: Text input */}
                <div className="px-4 pt-2">
                    <textarea
                        ref={inputRef}
                        value={input || ""}
                        onChange={(e) => safeSetInput(e.target.value)}
                        onKeyDown={safeHandleKeyDown}
                        placeholder="Perguntar ao Odonto GPT..."
                        rows={1}
                        className="w-full resize-none bg-transparent py-2 text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 max-h-[200px] overflow-y-auto custom-scrollbar text-zinc-900 dark:text-zinc-100 leading-relaxed font-sans"
                    />
                </div>

                {/* Bottom Area: Tools and Agents */}
                <div className="flex items-center justify-between px-2 pb-1 pt-2">
                    {/* Left: Agent Pill */}
                    <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/50 p-1 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">

                        {/* Desktop: List all agents */}
                        <div className="hidden md:flex items-center gap-1">
                            <TooltipProvider>
                                {agents.map((agent) => {
                                    const Icon = AGENT_UI_CONFIG[agent.id]?.icon || Sparkles
                                    const isSelected = selectedAgent?.id === agent.id

                                    return (
                                        <Tooltip key={agent.id}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={() => safeSetSelectedAgent(agent)}
                                                    className={cn(
                                                        "relative flex items-center justify-center h-7 w-7 rounded-xl transition-all duration-300",
                                                        isSelected
                                                            ? "bg-white dark:bg-zinc-700 text-[#8fb6b9] shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-600"
                                                            : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-800"
                                                    )}
                                                >
                                                    <Icon className={cn(
                                                        "h-4 w-4 transition-transform duration-300",
                                                        isSelected ? "scale-100" : "scale-90"
                                                    )} />

                                                    {isSelected && (
                                                        <motion.div
                                                            layoutId="activeAgentSubtle"
                                                            className="absolute inset-0 rounded-xl"
                                                            transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                                                        />
                                                    )}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="bg-zinc-900 border-zinc-800 text-white">
                                                <p className="text-[11px] font-medium tracking-tight">{agent.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                })}
                            </TooltipProvider>
                        </div>

                        {/* Mobile: Dropdown Selection */}
                        <div className="flex md:hidden">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                        {(() => {
                                            const Icon = AGENT_UI_CONFIG[selectedAgent?.id]?.icon || Sparkles
                                            return <Icon className="h-3.5 w-3.5 text-[#8fb6b9]" />
                                        })()}
                                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 max-w-[80px] truncate">
                                            {selectedAgent?.name || "Selecione"}
                                        </span>
                                        <ChevronDown className="h-3 w-3 text-zinc-400" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[200px]">
                                    {agents.map((agent) => {
                                        const Icon = AGENT_UI_CONFIG[agent.id]?.icon || Sparkles
                                        return (
                                            <DropdownMenuItem
                                                key={agent.id}
                                                onClick={() => safeSetSelectedAgent(agent)}
                                                className="gap-2 cursor-pointer"
                                            >
                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{agent.name}</span>
                                            </DropdownMenuItem>
                                        )
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                    </div>

                    <div className="flex items-center gap-1 md:gap-3">
                        {/* Action Icons */}
                        <div className="flex items-center gap-1.5 mr-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,application/pdf"
                                onChange={handleFileChange}
                            />

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowAttachments(!showAttachments)}
                                    className={cn(
                                        "p-2 rounded-full text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors",
                                        showAttachments && "text-zinc-900 dark:text-zinc-100"
                                    )}
                                >
                                    <Paperclip className="h-4 w-4" />
                                </button>

                                <AnimatePresence>
                                    {showAttachments && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute bottom-full right-0 mb-4 p-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col gap-1 min-w-[170px] z-50 overflow-hidden"
                                        >
                                            <button
                                                onClick={handleFileClick}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                                            >
                                                <ImageIcon className="h-4 w-4 text-rose-500" />
                                                Enviar Foto ou Vídeo
                                            </button>
                                            <button
                                                onClick={handleFileClick}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                                            >
                                                <File className="h-4 w-4 text-blue-500" />
                                                Anexar Documento
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button
                                type="button"
                                className="p-2 rounded-full text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors hidden sm:flex"
                            >
                                <Mic className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                className="p-2 rounded-full text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors hidden sm:flex"
                            >
                                <Cpu className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !(input || "").trim() || !isReady}
                            className={cn(
                                "flex items-center justify-center shrink-0 h-8 w-8 rounded-xl transition-all duration-300",
                                (input || "").trim() && isReady
                                    ? "bg-[#8fb6b9] text-white hover:opacity-90 active:scale-95 shadow-md shadow-[#8fb6b9]/20"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                            )}
                        </button>
                    </div>
                </div>
            </div>


        </div>
    )
}
