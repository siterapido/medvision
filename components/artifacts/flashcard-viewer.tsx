
"use client"

import { useState } from "react"
import { useCopilotReadable } from "@copilotkit/react-core"
import { ChevronLeft, ChevronRight, RotateCcw, Volume2, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Flashcard {
    front: string
    back: string
}

interface FlashcardViewerProps {
    deck: {
        id: string
        title: string
        topic: string
        cards: Flashcard[]
    }
}

export function FlashcardViewer({ deck }: FlashcardViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [direction, setDirection] = useState(0)

    const cards = deck.cards || []
    const totalCards = cards.length
    const currentCard = cards[currentIndex]

    // Use CopilotReadable to expose current card to AI
    useCopilotReadable({
        description: `O usuário está estudando o baralho "${deck.title}". Atualmente na carta ${currentIndex + 1} de ${totalCards}.`,
        value: {
            deckTitle: deck.title,
            currentCard: currentCard,
            progress: `${currentIndex + 1}/${totalCards}`
        }
    })

    const handleNext = () => {
        if (currentIndex < totalCards - 1) {
            setDirection(1)
            setIsFlipped(false)
            setTimeout(() => setCurrentIndex(currentIndex + 1), 50)
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0) {
            setDirection(-1)
            setIsFlipped(false)
            setTimeout(() => setCurrentIndex(currentIndex - 1), 50)
        }
    }

    const handleFlip = () => {
        setIsFlipped(!isFlipped)
    }

    const handleReset = () => {
        setCurrentIndex(0)
        setIsFlipped(false)
    }

    if (totalCards === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Info className="w-12 h-12 mb-4 opacity-20" />
                <p>Nenhuma carta encontrada neste baralho.</p>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                    <span>Progresso do Estudo</span>
                    <span>{currentIndex + 1} de {totalCards}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Card Container */}
            <div className="relative h-[400px] perspective-1000 group">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={{
                            enter: (dir: number) => ({
                                x: dir > 0 ? 300 : -300,
                                opacity: 0,
                                scale: 0.9
                            }),
                            center: {
                                zIndex: 1,
                                x: 0,
                                opacity: 1,
                                scale: 1
                            },
                            exit: (dir: number) => ({
                                zIndex: 0,
                                x: dir < 0 ? 300 : -300,
                                opacity: 0,
                                scale: 0.9
                            })
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className="absolute inset-0 cursor-pointer"
                        onClick={handleFlip}
                    >
                        <div className={cn(
                            "relative w-full h-full transition-all duration-500 preserve-3d shadow-xl rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800",
                            isFlipped ? "rotate-y-180" : ""
                        )}>
                            {/* Front side */}
                            <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-12 text-center overflow-auto">
                                <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Pergunta</span>
                                <h3 className="text-2xl md:text-3xl font-medium text-slate-800 dark:text-slate-100 leading-tight">
                                    {currentCard.front}
                                </h3>
                                <p className="mt-8 text-sm text-slate-400 font-medium animate-pulse">Clique para ver a resposta</p>
                            </div>

                            {/* Back side */}
                            <div className="absolute inset-0 backface-hidden bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-12 text-center rotate-y-180 overflow-auto">
                                <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-orange-500">Resposta</span>
                                <div className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {currentCard.back}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full border-slate-200 dark:border-slate-800 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>

                <Button
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full px-8 h-12 font-semibold shadow-lg shadow-black/10 transition-all flex items-center gap-2"
                    onClick={handleFlip}
                >
                    <RotateCcw className={cn("h-4 w-4 transition-transform duration-500", isFlipped ? "rotate-180" : "")} />
                    {isFlipped ? "Ver Pergunta" : "Revelar Resposta"}
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full border-slate-200 dark:border-slate-800 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={handleNext}
                    disabled={currentIndex === totalCards - 1}
                >
                    <ChevronRight className="h-6 w-6" />
                </Button>
            </div>

            {/* Footer info/Reset */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest font-bold px-2 pt-4">
                <button
                    onClick={handleReset}
                    className="hover:text-orange-500 transition-colors flex items-center gap-1"
                >
                    <RotateCcw className="w-3 h-3" />
                    Reiniciar Sessão
                </button>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        Ouvir (breve)
                    </span>
                </div>
            </div>
        </div>
    )
}
