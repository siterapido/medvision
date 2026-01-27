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
import { Clock, ArrowRight } from "lucide-react"
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
                "rounded-lg bg-white border border-gray-200",
                "shadow-sm max-w-md p-8"
            )}>
                <div className="space-y-6 text-center">
                    <DialogHeader className="space-y-4">
                        {/* Icon Section */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 150, damping: 15 }}
                            className="flex justify-center"
                        >
                            <div className="text-gray-400">
                                {icon ? (
                                    <div className="h-10 w-10">
                                        {icon}
                                    </div>
                                ) : (
                                    <Clock className="h-10 w-10" />
                                )}
                            </div>
                        </motion.div>

                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex justify-center w-full"
                        >
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Em Breve
                            </span>
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            <DialogTitle className="text-2xl md:text-3xl font-semibold text-gray-900">
                                {title}
                            </DialogTitle>
                        </motion.div>
                    </DialogHeader>

                    {/* Description */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <DialogDescription className="text-sm md:text-base text-gray-600 leading-relaxed">
                            {description}
                        </DialogDescription>
                    </motion.div>

                    {/* Custom Copy */}
                    {copy && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="p-3 bg-gray-50 rounded text-sm text-gray-700 leading-relaxed"
                        >
                            {copy}
                        </motion.div>
                    )}

                    {/* Action Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="pt-4 flex flex-col sm:flex-row gap-3"
                    >
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 rounded border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Voltar
                        </Button>
                        <Button
                            onClick={onPrimaryAction || (() => onOpenChange(false))}
                            className="flex-1 rounded bg-gray-900 text-white hover:bg-gray-800 gap-2 transition-colors"
                        >
                            {primaryButtonText}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </motion.div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
