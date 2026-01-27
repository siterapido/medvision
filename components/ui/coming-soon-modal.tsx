"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, Sparkles, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComingSoonModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    copy?: string
    icon?: React.ReactNode
    primaryButtonText?: string
    onPrimaryAction?: () => void
}

export function ComingSoonModal({
    isOpen,
    onOpenChange,
    title,
    description,
    copy,
    icon,
    primaryButtonText = "Notificar-me",
    onPrimaryAction,
}: ComingSoonModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "glass-card border-white/10 rounded-[2rem] bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-3xl",
                "shadow-2xl shadow-primary/20 max-w-lg p-0 overflow-hidden"
            )}>
                {/* Background glow effect */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-48 h-48 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 p-8 md:p-10">
                    <DialogHeader className="space-y-6 text-center items-center">
                        {/* Icon Section */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30"
                        >
                            {icon ? (
                                <div className="text-primary">
                                    {icon}
                                </div>
                            ) : (
                                <Clock className="h-8 w-8 text-primary" />
                            )}
                        </motion.div>

                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-semibold uppercase tracking-wider text-primary"
                        >
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            Em Breve
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            <DialogTitle className="text-3xl md:text-4xl font-heading font-bold tracking-tight">
                                {title}
                            </DialogTitle>
                        </motion.div>

                        {/* Description */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <DialogDescription className="text-base md:text-lg text-muted-foreground/90 leading-relaxed">
                                {description}
                            </DialogDescription>
                        </motion.div>

                        {/* Custom Copy */}
                        {copy && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3"
                            >
                                <p className="text-sm leading-relaxed text-foreground/90">
                                    {copy}
                                </p>
                            </motion.div>
                        )}
                    </DialogHeader>

                    {/* Action Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8 flex flex-col sm:flex-row gap-3"
                    >
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 rounded-lg border-border/40 hover:bg-muted/50 transition-all"
                        >
                            Voltar
                        </Button>
                        <Button
                            onClick={onPrimaryAction || (() => onOpenChange(false))}
                            className={cn(
                                "flex-1 rounded-lg font-semibold shadow-lg",
                                "bg-gradient-to-br from-primary to-cyan-500 hover:from-primary hover:to-cyan-600",
                                "text-white gap-2 group transition-all duration-300"
                            )}
                        >
                            {primaryButtonText}
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </motion.div>

                    {/* Decorative Footer */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3 w-3 text-primary/50" />
                        <span>Estamos preparando algo incrível para você</span>
                        <Sparkles className="h-3 w-3 text-primary/50" />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
