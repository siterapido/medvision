"use client"

import { useRef, useState, useEffect, KeyboardEvent, ChangeEvent } from "react"
import { Send, Loader2, Paperclip, X, Image as ImageIcon } from "lucide-react"

interface AgnoInputProps {
    onSend: (message: string, file?: File) => void
    disabled?: boolean
    isStreaming?: boolean
    placeholder?: string
}

export function AgnoInput({
    onSend,
    disabled = false,
    isStreaming = false,
    placeholder = "Digite sua pergunta...",
}: AgnoInputProps) {
    const [value, setValue] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.type.startsWith("image/")) {
                setSelectedFile(file)
                const url = URL.createObjectURL(file)
                setPreviewUrl(url)
            }
        }
    }

    const clearFile = () => {
        setSelectedFile(null)
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleSubmit = () => {
        if ((!value.trim() && !selectedFile) || disabled || isStreaming) return
        onSend(value.trim(), selectedFile || undefined)
        setValue("")
        clearFile()
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const isDisabled = disabled || isStreaming || (!value.trim() && !selectedFile)

    return (
        <div className="flex flex-col gap-3">
            {/* Image Preview */}
            {previewUrl && (
                <div className="relative inline-block w-fit">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-700">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <button
                        onClick={clearFile}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            <div className="flex gap-3 items-end">
                <div className="flex-1 relative bg-slate-800/80 rounded-xl border border-slate-700/50 focus-within:border-cyan-500/50 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute left-3 bottom-3 p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-cyan-400 transition-colors"
                        title="Adicionar imagem"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={1}
                        className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:ring-0 resize-none text-slate-100 placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            minHeight: "48px",
                            maxHeight: "120px",
                        }}
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isDisabled}
                    className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 text-white flex items-center justify-center shadow-lg transition-all disabled:cursor-not-allowed active:scale-95"
                >
                    {isStreaming ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    )
}
