'use client'

import { motion } from 'motion/react'
import {
    Pencil,
    Circle,
    MoveRight,
    Type,
    Undo2,
    Redo2,
    Trash2,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AnnotationTool, AnnotationColor } from '@/lib/types/vision'
import { cn } from '@/lib/utils'

interface AnnotationToolbarProps {
    activeTool: AnnotationTool
    activeColor: AnnotationColor
    canUndo: boolean
    canRedo: boolean
    onToolChange: (tool: AnnotationTool) => void
    onColorChange: (color: AnnotationColor) => void
    onUndo: () => void
    onRedo: () => void
    onClear: () => void
    onClose: () => void
}

const tools: { tool: AnnotationTool; icon: typeof Pencil; label: string }[] = [
    { tool: 'pen', icon: Pencil, label: 'Caneta' },
    { tool: 'circle', icon: Circle, label: 'Círculo' },
    { tool: 'arrow', icon: MoveRight, label: 'Seta' },
    { tool: 'text', icon: Type, label: 'Texto' },
]

const colors: { color: AnnotationColor; hex: string; label: string }[] = [
    { color: 'red', hex: '#ef4444', label: 'Vermelho' },
    { color: 'yellow', hex: '#eab308', label: 'Amarelo' },
    { color: 'blue', hex: '#3b82f6', label: 'Azul' },
    { color: 'white', hex: '#ffffff', label: 'Branco' },
]

export function AnnotationToolbar({
    activeTool,
    activeColor,
    canUndo,
    canRedo,
    onToolChange,
    onColorChange,
    onUndo,
    onRedo,
    onClear,
    onClose
}: AnnotationToolbarProps) {
    return (
        <TooltipProvider delayDuration={300}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
            >
                <div className="flex items-center gap-1 p-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl">
                    {/* Tools */}
                    <div className="flex items-center gap-1 px-2 border-r border-white/10">
                        {tools.map(({ tool, icon: Icon, label }) => (
                            <Tooltip key={tool}>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={cn(
                                            "w-9 h-9 rounded-xl transition-all",
                                            activeTool === tool
                                                ? "bg-primary text-primary-foreground"
                                                : "text-white/70 hover:text-white hover:bg-white/10"
                                        )}
                                        onClick={() => onToolChange(tool)}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                    {label}
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>

                    {/* Colors */}
                    <div className="flex items-center gap-1 px-2 border-r border-white/10">
                        {colors.map(({ color, hex, label }) => (
                            <Tooltip key={color}>
                                <TooltipTrigger asChild>
                                    <button
                                        className={cn(
                                            "w-6 h-6 rounded-full border-2 transition-all",
                                            activeColor === color
                                                ? "border-white scale-110"
                                                : "border-transparent hover:border-white/50"
                                        )}
                                        style={{ backgroundColor: hex }}
                                        onClick={() => onColorChange(color)}
                                    />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                    {label}
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 px-2 border-r border-white/10">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-9 h-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
                                    onClick={onUndo}
                                    disabled={!canUndo}
                                >
                                    <Undo2 className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                Desfazer
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-9 h-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
                                    onClick={onRedo}
                                    disabled={!canRedo}
                                >
                                    <Redo2 className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                Refazer
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-9 h-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10"
                                    onClick={onClear}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                Limpar Tudo
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Close */}
                    <div className="flex items-center px-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-9 h-9 rounded-xl text-white/70 hover:text-white hover:bg-red-500/20"
                                    onClick={onClose}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                Fechar Anotações
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </motion.div>
        </TooltipProvider>
    )
}
