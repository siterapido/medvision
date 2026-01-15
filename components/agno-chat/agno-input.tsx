"use client"

import { useRef, useState, useEffect, KeyboardEvent, ChangeEvent, DragEvent } from "react"
import { Send, Loader2, Paperclip, X, Image as ImageIcon, Mic, MicOff, Camera, FileAudio, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AgnoInputProps {
    onSend: (message: string, file?: File) => void
    disabled?: boolean
    isStreaming?: boolean
    placeholder?: string
}

interface AttachedFile {
    file: File
    previewUrl: string | null
    type: 'image' | 'audio' | 'other'
}

export function AgnoInput({
    onSend,
    disabled = false,
    isStreaming = false,
    placeholder = "Digite sua pergunta...",
}: AgnoInputProps) {
    const [value, setValue] = useState("")
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = "auto"
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
        }
    }, [value])

    // Focus on mount
    useEffect(() => {
        textareaRef.current?.focus()
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            attachedFiles.forEach(f => {
                if (f.previewUrl) URL.revokeObjectURL(f.previewUrl)
            })
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
        }
    }, [])

    const addFile = (file: File) => {
        const isImage = file.type.startsWith("image/")
        const isAudio = file.type.startsWith("audio/")

        const newFile: AttachedFile = {
            file,
            previewUrl: isImage ? URL.createObjectURL(file) : null,
            type: isImage ? 'image' : isAudio ? 'audio' : 'other'
        }

        // Limit to 3 files
        if (attachedFiles.length < 3) {
            setAttachedFiles(prev => [...prev, newFile])
        }
    }

    const removeFile = (index: number) => {
        setAttachedFiles(prev => {
            const newFiles = [...prev]
            const removed = newFiles.splice(index, 1)[0]
            if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl)
            return newFiles
        })
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const clearAllFiles = () => {
        attachedFiles.forEach(f => {
            if (f.previewUrl) URL.revokeObjectURL(f.previewUrl)
        })
        setAttachedFiles([])
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(addFile)
        }
    }

    // Drag and Drop handlers
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)

        const files = e.dataTransfer.files
        if (files) {
            Array.from(files).forEach(file => {
                if (file.type.startsWith("image/") || file.type.startsWith("audio/")) {
                    addFile(file)
                }
            })
        }
    }

    // Audio recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                const audioFile = new File([audioBlob], `recording_${Date.now()}.webm`, { type: 'audio/webm' })
                addFile(audioFile)

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } catch (err) {
            console.error("Error accessing microphone:", err)
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
                recordingTimerRef.current = null
            }
        }
    }

    const formatRecordingTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleSubmit = () => {
        if ((!value.trim() && attachedFiles.length === 0) || disabled || isStreaming) return

        // For now, send the first file if exists (backend currently supports single file)
        const firstFile = attachedFiles.length > 0 ? attachedFiles[0].file : undefined
        onSend(value.trim(), firstFile)
        setValue("")
        clearAllFiles()
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const isDisabled = disabled || isStreaming || (!value.trim() && attachedFiles.length === 0)

    return (
        <div
            className="flex flex-col gap-3"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag overlay */}
            {isDragging && (
                <div className="absolute inset-0 bg-cyan-500/10 border-2 border-dashed border-cyan-500/50 rounded-xl flex items-center justify-center z-10 pointer-events-none">
                    <div className="text-cyan-400 font-medium flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Solte a imagem aqui
                    </div>
                </div>
            )}

            {/* Attached Files Preview */}
            {attachedFiles.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    {attachedFiles.map((attached, index) => (
                        <div
                            key={index}
                            className={cn(
                                "relative group rounded-xl overflow-hidden border border-slate-700",
                                attached.type === 'image' ? "w-16 h-16" : "px-3 py-2 flex items-center gap-2 bg-slate-800/50"
                            )}
                        >
                            {attached.type === 'image' && attached.previewUrl ? (
                                <img
                                    src={attached.previewUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : attached.type === 'audio' ? (
                                <>
                                    <FileAudio className="w-4 h-4 text-cyan-400" />
                                    <span className="text-xs text-slate-400 truncate max-w-[80px]">
                                        {attached.file.name}
                                    </span>
                                </>
                            ) : (
                                <span className="text-xs text-slate-400 truncate max-w-[100px]">
                                    {attached.file.name}
                                </span>
                            )}

                            <button
                                onClick={() => removeFile(index)}
                                className={cn(
                                    "absolute -top-1 -right-1 p-1 rounded-full bg-slate-900 border border-slate-700",
                                    "text-slate-400 hover:text-red-400 transition-colors",
                                    attached.type !== 'image' && "relative top-0 right-0"
                                )}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                    {attachedFiles.length > 1 && (
                        <button
                            onClick={clearAllFiles}
                            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-red-400 transition-colors"
                            title="Remover todos"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {/* Input Area */}
            <div className="flex gap-2 items-end">
                <div className={cn(
                    "flex-1 relative bg-slate-800/80 rounded-xl border transition-all",
                    isDragging
                        ? "border-cyan-500/50 ring-2 ring-cyan-500/20"
                        : "border-slate-700/50 focus-within:border-cyan-500/50 focus-within:ring-2 focus-within:ring-cyan-500/20"
                )}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,audio/*"
                        multiple
                        onChange={handleFileSelect}
                    />

                    {/* Left toolbar */}
                    <div className="absolute left-2 bottom-2 flex items-center gap-1">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={attachedFiles.length >= 3}
                            className={cn(
                                "p-2 rounded-lg transition-colors",
                                attachedFiles.length >= 3
                                    ? "text-slate-600 cursor-not-allowed"
                                    : "hover:bg-slate-700/50 text-slate-400 hover:text-cyan-400"
                            )}
                            title="Adicionar arquivo"
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>

                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={cn(
                                "p-2 rounded-lg transition-colors",
                                isRecording
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                    : "hover:bg-slate-700/50 text-slate-400 hover:text-cyan-400"
                            )}
                            title={isRecording ? "Parar gravação" : "Gravar áudio"}
                        >
                            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>

                        {isRecording && (
                            <span className="text-xs text-red-400 font-mono animate-pulse">
                                {formatRecordingTime(recordingTime)}
                            </span>
                        )}
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isRecording ? "Gravando áudio..." : placeholder}
                        disabled={disabled || isRecording}
                        rows={1}
                        className="w-full pl-24 pr-4 py-3 bg-transparent border-none focus:ring-0 resize-none text-slate-100 placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            minHeight: "48px",
                            maxHeight: "120px",
                        }}
                    />
                </div>

                {/* Send Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isDisabled}
                    className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-lg transition-all",
                        "active:scale-95 disabled:cursor-not-allowed",
                        isDisabled
                            ? "bg-slate-700 opacity-50"
                            : "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400"
                    )}
                >
                    {isStreaming ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Character count */}
            {value.length > 200 && (
                <div className="text-right">
                    <span className={cn(
                        "text-xs",
                        value.length > 2000 ? "text-amber-400" : "text-slate-500"
                    )}>
                        {value.length} / 4000
                    </span>
                </div>
            )}
        </div>
    )
}
