"use client"

import { useState, useEffect, useCallback } from "react"
import { useCopilotReadable } from "@copilotkit/react-core"
import { ChevronLeft, ChevronRight, RotateCcw, Info, Trophy, Flame, Target, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
    QualityRating,
    SIMPLE_RATINGS,
    formatNextReview
} from "@/lib/utils/spaced-repetition"

interface Flashcard {
    id?: string
    front: string
    back: string
    category?: string
}

interface CardProgress {
    cardId: string
    repetition: number
    easeFactor: number
    intervalDays: number
    nextReviewAt: string | null
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
    const [isRating, setIsRating] = useState(false)
    const [cardProgress, setCardProgress] = useState<Record<string, CardProgress>>({})
    const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 })
    const [isComplete, setIsComplete] = useState(false)

    const cards = deck.cards || []
    const totalCards = cards.length
    const currentCard = cards[currentIndex]
    const currentCardId = currentCard?.id || `card-${currentIndex}`

    // Fetch progress on mount
    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const response = await fetch(`/api/flashcards/review?artifactId=${deck.id}`)
                if (response.ok) {
                    const data = await response.json()
                    const progressMap: Record<string, CardProgress> = {}
                    for (const p of data.progress || []) {
                        progressMap[p.card_id] = {
                            cardId: p.card_id,
                            repetition: p.repetition,
                            easeFactor: Number(p.ease_factor),
                            intervalDays: p.interval_days,
                            nextReviewAt: p.next_review_at
                        }
                    }
                    setCardProgress(progressMap)
                }
            } catch (error) {
                console.error('Failed to fetch progress:', error)
            }
        }
        fetchProgress()
    }, [deck.id])

    // Use CopilotReadable to expose current card to AI
    useCopilotReadable({
        description: `O usuário está estudando o baralho "${deck.title}". Atualmente na carta ${currentIndex + 1} de ${totalCards}.`,
        value: {
            deckTitle: deck.title,
            currentCard: currentCard,
            progress: `${currentIndex + 1}/${totalCards}`,
            sessionStats
        }
    })

    const handleRateCard = useCallback(async (quality: QualityRating) => {
        setIsRating(true)

        try {
            const response = await fetch('/api/flashcards/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    artifactId: deck.id,
                    cardId: currentCardId,
                    quality
                })
            })

            if (response.ok) {
                const result = await response.json()

                // Update local progress
                setCardProgress(prev => ({
                    ...prev,
                    [currentCardId]: {
                        cardId: currentCardId,
                        repetition: result.repetition,
                        easeFactor: result.easeFactor,
                        intervalDays: result.interval,
                        nextReviewAt: result.nextReviewAt
                    }
                }))

                // Update session stats
                setSessionStats(prev => ({
                    reviewed: prev.reviewed + 1,
                    correct: quality >= 3 ? prev.correct + 1 : prev.correct
                }))

                // Move to next card or finish
                if (currentIndex < totalCards - 1) {
                    setDirection(1)
                    setIsFlipped(false)
                    setTimeout(() => setCurrentIndex(currentIndex + 1), 50)
                } else {
                    setIsComplete(true)
                }
            } else {
                toast.error("Erro ao salvar progresso")
            }
        } catch (error) {
            console.error('Rating error:', error)
            toast.error("Erro de conexão")
        } finally {
            setIsRating(false)
        }
    }, [deck.id, currentCardId, currentIndex, totalCards])

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
        setIsComplete(false)
        setSessionStats({ reviewed: 0, correct: 0 })
    }

    if (totalCards === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Info className="w-12 h-12 mb-4 opacity-20" />
                <p>Nenhuma carta encontrada neste baralho.</p>
            </div>
        )
    }

    // Session Complete Screen
    if (isComplete) {
        const percentage = Math.round((sessionStats.correct / sessionStats.reviewed) * 100) || 0
        return (
            <div className="max-w-2xl mx-auto space-y-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-3xl p-12 text-center space-y-6"
                >
                    <div className="inline-flex p-6 rounded-full bg-orange-500/20 border border-orange-500/30">
                        <Trophy className="h-12 w-12 text-orange-500" />
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Sessão Completa!</h2>
                        <p className="text-slate-400">Você revisou todas as {totalCards} cartas</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                        <div className="bg-white/5 rounded-2xl p-4">
                            <div className="text-2xl font-bold text-white">{sessionStats.reviewed}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest">Revisadas</div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4">
                            <div className="text-2xl font-bold text-emerald-400">{sessionStats.correct}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest">Corretas</div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4">
                            <div className="text-2xl font-bold text-orange-400">{percentage}%</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest">Taxa</div>
                        </div>
                    </div>

                    <Button
                        onClick={handleReset}
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 h-12 font-semibold"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Estudar Novamente
                    </Button>
                </motion.div>
            </div>
        )
    }

    const currentProgress = cardProgress[currentCardId]

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Stats Bar */}
            <div className="flex items-center justify-between gap-4 bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-medium text-white">{currentIndex + 1}/{totalCards}</span>
                    </div>
                    {sessionStats.reviewed > 0 && (
                        <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-400">{sessionStats.correct} corretas</span>
                        </div>
                    )}
                </div>
                {currentProgress && (
                    <div className="text-xs text-slate-400">
                        Próxima revisão: {formatNextReview(currentProgress.nextReviewAt ? new Date(currentProgress.nextReviewAt) : null)}
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Card Container */}
            <div className="relative h-[350px] perspective-1000 group">
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
                            "relative w-full h-full transition-all duration-500 preserve-3d shadow-xl rounded-3xl overflow-hidden border border-slate-700",
                            isFlipped ? "rotate-y-180" : ""
                        )}>
                            {/* Front side */}
                            <div className="absolute inset-0 backface-hidden bg-slate-900 flex flex-col items-center justify-center p-12 text-center overflow-auto">
                                <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Pergunta</span>
                                {currentCard.category && (
                                    <span className="absolute top-6 right-6 text-[10px] font-bold uppercase tracking-widest text-orange-500/70">{currentCard.category}</span>
                                )}
                                <h3 className="text-2xl md:text-3xl font-medium text-white leading-tight">
                                    {currentCard.front}
                                </h3>
                                <p className="mt-8 text-sm text-slate-500 font-medium animate-pulse">Clique para ver a resposta</p>
                            </div>

                            {/* Back side */}
                            <div className="absolute inset-0 backface-hidden bg-slate-950 flex flex-col items-center justify-center p-12 text-center rotate-y-180 overflow-auto">
                                <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-orange-500">Resposta</span>
                                <div className="text-xl md:text-2xl text-slate-200 leading-relaxed">
                                    {currentCard.back}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Rating Buttons (shown after flip) */}
            <AnimatePresence>
                {isFlipped && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="space-y-3"
                    >
                        <p className="text-center text-xs text-slate-500 uppercase tracking-widest font-bold">Como foi?</p>
                        <div className="flex items-center justify-center gap-3">
                            {SIMPLE_RATINGS.map((rating) => (
                                <Button
                                    key={rating.quality}
                                    onClick={() => handleRateCard(rating.quality)}
                                    disabled={isRating}
                                    className={cn(
                                        "rounded-full px-6 h-11 font-semibold text-white shadow-lg transition-all",
                                        rating.color,
                                        isRating && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {isRating ? (
                                        <span className="animate-pulse">...</span>
                                    ) : (
                                        rating.label
                                    )}
                                </Button>
                            ))}
                        </div>
                        <p className="text-center text-xs text-slate-600">
                            {SIMPLE_RATINGS.find(r => r.quality === 3)?.description}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation Controls (shown before flip) */}
            {!isFlipped && (
                <div className="flex items-center justify-center gap-6">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full border-slate-700 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>

                    <Button
                        className="bg-slate-800 text-white hover:bg-slate-700 rounded-full px-8 h-12 font-semibold shadow-lg transition-all flex items-center gap-2"
                        onClick={handleFlip}
                    >
                        <RotateCcw className="h-4 w-4" />
                        Revelar Resposta
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full border-slate-700 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={handleNext}
                        disabled={currentIndex === totalCards - 1}
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </div>
            )}

            {/* Footer info/Reset */}
            <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-bold px-2 pt-4">
                <button
                    onClick={handleReset}
                    className="hover:text-orange-500 transition-colors flex items-center gap-1"
                >
                    <RotateCcw className="w-3 h-3" />
                    Reiniciar Sessão
                </button>
                <div className="flex items-center gap-2">
                    {currentProgress && currentProgress.repetition > 0 && (
                        <span className="flex items-center gap-1 text-emerald-500">
                            <Check className="w-3 h-3" />
                            {currentProgress.repetition}x revisada
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
