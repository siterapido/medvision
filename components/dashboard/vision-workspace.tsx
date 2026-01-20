"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Maximize2, Minimize2, ChevronRight, ChevronLeft, Loader2, Sparkles, Send, Scan, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { useImageUpload } from "@/lib/hooks/useImageUpload"
import { useAgnoChat } from "@/lib/hooks/useAgnoChat"
import { AGENT_IDS, AGENT_NAMES } from "@/lib/constants"
import { getAgentInfo } from "@/lib/agent-config"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { ImageUploadZone } from "./image-upload-zone"
import remarkGfm from "remark-gfm"
import { MarkdownComponents } from "@/components/agno-chat/markdown-components"

interface VisionWorkspaceProps {
    userId: string
    onClose: () => void
    onArtifactCreated?: () => void
}

export function VisionWorkspace({ userId, onClose, onArtifactCreated }: VisionWorkspaceProps) {
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [analysisStarted, setAnalysisStarted] = useState(false)
    const [contextInput, setContextInput] = useState("")
    const [isFullscreen, setIsFullscreen] = useState(false)
    
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const { uploadImage, isUploading } = useImageUpload()
    
    const { messages, sendMessage, isStreaming, error } = useAgnoChat({
        userId,
        onArtifactCreated: () => {
             onArtifactCreated?.()
        },
        onError: (err) => toast.error(err)
    })

    const agentInfo = getAgentInfo(AGENT_IDS.VISION)

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isStreaming])

    const handleFileSelected = async (file: File) => {
        setImageFile(file)
        
        // Create local preview
        const objectUrl = URL.createObjectURL(file)
        setImageUrl(objectUrl)
    }

    const startAnalysis = async () => {
        if (!imageFile || !imageUrl) return
        
        setAnalysisStarted(true)
        
        try {
            // 1. Upload image
            const publicUrl = await uploadImage(imageFile)
            
            if (!publicUrl) {
                toast.error("Erro ao fazer upload da imagem")
                setAnalysisStarted(false)
                return
            }

            // 2. Send to agent
            const initialMessage = contextInput 
                ? `Analise esta imagem radiográfica. Contexto clínico: ${contextInput}`
                : "Analise esta imagem radiográfica detalhadamente, identificando achados, diagnósticos prováveis e sugestões de conduta."

            await sendMessage(
                initialMessage, 
                { id: AGENT_IDS.VISION, name: AGENT_NAMES[AGENT_IDS.VISION] } as any, 
                publicUrl
            )

        } catch (err) {
            console.error(err)
            toast.error("Erro ao iniciar análise")
            setAnalysisStarted(false)
        }
    }

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!contextInput.trim() || isStreaming) return
        
        const msg = contextInput
        setContextInput("")
        await sendMessage(msg, { id: AGENT_IDS.VISION, name: AGENT_NAMES[AGENT_IDS.VISION] } as any)
    }

    // Determine current phase for animations
    const isScanning = isStreaming && messages.length <= 2 // Initial analysis

    return (
        <div className={cn(
            "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col transition-all duration-300",
            !isFullscreen && "relative h-[calc(100vh-100px)] rounded-xl border border-border shadow-2xl overflow-hidden mt-4"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg"
                    )}>
                        <Scan className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg leading-none">Workspace Odonto Vision</h2>
                        <p className="text-xs text-muted-foreground mt-1">Análise Radiográfica Assistida por IA</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                
                {/* Left Panel: Image Canvas */}
                <div className={cn(
                    "relative transition-all duration-500 ease-in-out bg-slate-950 flex flex-col",
                    analysisStarted ? "flex-1" : "w-full"
                )}>
                    
                    {!imageUrl ? (
                        <div className="h-full flex items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/50">
                            <ImageUploadZone 
                                onFileSelected={handleFileSelected} 
                                className="w-full max-w-2xl aspect-video shadow-xl"
                            />
                        </div>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
                            
                            {/* Image Container */}
                            <motion.div 
                                layoutId="analyzed-image"
                                className="relative max-w-full max-h-full p-4"
                            >
                                <img 
                                    src={imageUrl} 
                                    alt="Radiografia" 
                                    className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg shadow-2xl border border-white/10"
                                />
                                
                                {/* Scanning Effect */}
                                <AnimatePresence>
                                    {(isScanning || isUploading) && (
                                        <motion.div
                                            initial={{ top: 0, opacity: 0 }}
                                            animate={{ top: "100%", opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-10"
                                            style={{ boxShadow: "0 0 20px rgba(0, 255, 255, 0.5)" }}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Reset Button (only if not analyzing yet) */}
                                {!analysisStarted && (
                                    <Button 
                                        size="icon" 
                                        variant="secondary" 
                                        className="absolute top-6 right-6 shadow-lg hover:bg-red-500 hover:text-white transition-colors"
                                        onClick={() => {
                                            setImageUrl(null)
                                            setImageFile(null)
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </motion.div>

                            {/* Controls Overlay (Pre-Analysis) */}
                            {!analysisStarted && (
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center pb-12">
                                    <div className="w-full max-w-xl bg-background/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/10 space-y-4">
                                        <Textarea 
                                            placeholder="Adicione contexto clínico (opcional)... Ex: Paciente relata dor ao mastigar no lado esquerdo."
                                            value={contextInput}
                                            onChange={(e) => setContextInput(e.target.value)}
                                            className="resize-none bg-slate-50 dark:bg-slate-900 border-0 focus-visible:ring-1 min-h-[80px]"
                                        />
                                        <Button 
                                            onClick={startAnalysis}
                                            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg h-12 text-lg font-medium"
                                        >
                                            <Sparkles className="w-5 h-5 mr-2" />
                                            Gerar Laudo Completo
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel: Chat/Report */}
                <AnimatePresence>
                    {analysisStarted && (
                        <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: isFullscreen ? "35%" : "400px", opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-background border-l border-border flex flex-col shadow-2xl z-20"
                        >
                             {/* Messages Area */}
                             <ScrollArea className="flex-1 p-4">
                                <div className="space-y-6">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={cn("flex flex-col gap-2", msg.role === 'user' ? "items-end" : "items-start")}>
                                            <div className={cn(
                                                "max-w-[90%] rounded-xl p-3 text-sm",
                                                msg.role === 'user' 
                                                    ? "bg-primary text-primary-foreground" 
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                            )}>
                                                {msg.role === 'agent' ? (
                                                     <MarkdownRenderer components={MarkdownComponents}>
                                                        {msg.content}
                                                     </MarkdownRenderer>
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>
                                            {msg.role === 'agent' && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                                                    <span>Odonto Vision</span>
                                                    <span>•</span>
                                                    <span>{new Date().toLocaleTimeString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {isStreaming && messages[messages.length - 1]?.role !== 'agent' && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                            <span>Analisando imagem...</span>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                             </ScrollArea>

                             {/* Input Area */}
                             <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-900/50">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <Textarea
                                        value={contextInput}
                                        onChange={(e) => setContextInput(e.target.value)}
                                        placeholder="Faça uma pergunta sobre o laudo..."
                                        className="min-h-[44px] max-h-32 resize-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSendMessage()
                                            }
                                        }}
                                    />
                                    <Button type="submit" size="icon" disabled={!contextInput.trim() || isStreaming}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
