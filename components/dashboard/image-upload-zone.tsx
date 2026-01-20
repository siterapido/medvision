"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileImage, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

interface ImageUploadZoneProps {
    onFileSelected: (file: File) => void
    isUploading?: boolean
    className?: string
}

export function ImageUploadZone({ onFileSelected, isUploading = false, className }: ImageUploadZoneProps) {
    const [error, setError] = useState<string | null>(null)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setError(null)
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0]
            if (file.type.startsWith("image/")) {
                onFileSelected(file)
            } else {
                setError("Por favor, envie apenas arquivos de imagem (JPG, PNG).")
            }
        }
    }, [onFileSelected])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxFiles: 1,
        disabled: isUploading
    })

    return (
        <Card
            {...getRootProps()}
            className={cn(
                "relative group cursor-pointer overflow-hidden border-2 border-dashed transition-all duration-300",
                isDragActive ? "border-primary bg-primary/5" : "border-slate-300 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900/50",
                isUploading ? "pointer-events-none opacity-80" : "",
                className
            )}
        >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 min-h-[300px]">
                <AnimatePresence mode="wait">
                    {isUploading ? (
                        <motion.div
                            key="uploading"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative mb-4">
                                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                                <div className="relative bg-primary/10 p-4 rounded-full">
                                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-primary animate-pulse">Enviando imagem...</h3>
                            <p className="text-sm text-muted-foreground mt-2">Preparando para análise</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex flex-col items-center max-w-md"
                        >
                            <div className={cn(
                                "p-4 rounded-full mb-4 transition-colors duration-300",
                                isDragActive ? "bg-primary/20 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary group-hover:bg-primary/10"
                            )}>
                                {isDragActive ? (
                                    <Upload className="w-10 h-10 animate-bounce" />
                                ) : (
                                    <FileImage className="w-10 h-10" />
                                )}
                            </div>
                            
                            <h3 className="text-xl font-bold mb-2">
                                {isDragActive ? "Solte a imagem aqui" : "Arraste sua radiografia ou clique para selecionar"}
                            </h3>
                            
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-4">
                                Suportamos imagens JPG, PNG e WebP de alta resolução para análise detalhada.
                            </p>

                            {error && (
                                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg mt-2">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                </div>
                            )}
                            
                            <div className="mt-4 px-4 py-2 bg-primary/5 text-primary text-xs font-medium rounded-full border border-primary/10 group-hover:bg-primary/10 transition-colors">
                                Análise via Odonto Vision AI
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Decorative background elements */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3" />
            </div>
        </Card>
    )
}
