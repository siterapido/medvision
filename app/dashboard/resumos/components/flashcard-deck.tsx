"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, RotateCw, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Flashcard {
    front: string
    back: string
}

interface FlashcardDeckProps {
    cards: Flashcard[]
}

export function FlashcardDeck({ cards: initialCards }: FlashcardDeckProps) {
    const [cards, setCards] = React.useState(initialCards)
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [isFlipped, setIsFlipped] = React.useState(false)

    const currentCard = cards[currentIndex]

    const handleNext = () => {
        setIsFlipped(false)
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % cards.length)
        }, 150)
    }

    const handlePrev = () => {
        setIsFlipped(false)
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
        }, 150)
    }

    const handleShuffle = () => {
        setIsFlipped(false)
        setTimeout(() => {
            setCards([...cards].sort(() => Math.random() - 0.5))
            setCurrentIndex(0)
        }, 150)
    }

    return (
        <div className="flex flex-col items-center space-y-6 w-full max-w-2xl mx-auto">
            <div className="flex justify-between w-full items-center">
                <span className="text-sm font-medium text-muted-foreground">
                    Card {currentIndex + 1} de {cards.length}
                </span>
                <Button variant="ghost" size="sm" onClick={handleShuffle}>
                    <Shuffle className="mr-2 h-3 w-3" /> Embaralhar
                </Button>
            </div>

            <div
                className="w-full aspect-[3/2] perspective-1000 cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={cn(
                    "relative w-full h-full transition-transform duration-500 transform-style-3d",
                    isFlipped ? "rotate-y-180" : ""
                )}>
                    {/* Front */}
                    <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-8 text-center border-2 border-primary/20 shadow-md group-hover:border-primary/50 transition-colors">
                        <div className="space-y-4">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Frente</span>
                            <p className="text-xl md:text-2xl font-medium">{currentCard.front}</p>
                            <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground opacity-50">
                                Clique para virar
                            </div>
                        </div>
                    </Card>

                    {/* Back */}
                    <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-8 text-center bg-muted/30 border-2 border-primary/20 shadow-md">
                        <div className="space-y-4">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Verso</span>
                            <p className="text-lg md:text-xl text-muted-foreground">{currentCard.back}</p>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={handlePrev}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-2">
                    <Button variant="secondary" className="w-32" onClick={() => setIsFlipped(!isFlipped)}>
                        {isFlipped ? "Ver Frente" : "Ver Resposta"}
                    </Button>
                </div>
                <Button variant="outline" size="icon" onClick={handleNext}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
