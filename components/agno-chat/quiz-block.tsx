"use client"

import { useState } from "react"
import { Check, X, HelpCircle, ArrowRight, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface Option {
    id: string
    text: string
    isCorrect: boolean
    explanation: string
}

interface Option {
    id: string
    text: string
    isCorrect: boolean
    explanation: string
}

interface QuizData {
    type: "multiple_choice"
    difficulty: string
    specialty: string
    topic: string
    statement: string
    options: Option[]
}

interface ExamData {
    title: string
    type: string
    questions: QuizData[]
}

interface QuizBlockProps {
    data: QuizData | ExamData | string
}

export function QuizBlock({ data }: QuizBlockProps) {
    // State for single question
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
    const [showExplanation, setShowExplanation] = useState(false)
    
    // State for exam mode
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [examAnswers, setExamAnswers] = useState<Record<number, string>>({})
    const [examMode, setExamMode] = useState(false)

    // Parse data
    let content: QuizData | ExamData
    try {
        content = typeof data === "string" ? JSON.parse(data) : data
    } catch (e) {
        return (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                Erro ao carregar componente interativo.
            </div>
        )
    }

    // Determine if it's an exam or single question
    const isExam = "questions" in content
    const quiz = isExam ? (content as ExamData).questions[currentQuestionIndex] : (content as QuizData)

    // Handlers
    const handleOptionSelect = (optionId: string) => {
        if (isExam) {
            if (examAnswers[currentQuestionIndex]) return
            setExamAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionId }))
        } else {
            if (selectedOptionId) return
            setSelectedOptionId(optionId)
            setShowExplanation(true)
        }
    }

    const handleNext = () => {
        if (isExam && currentQuestionIndex < (content as ExamData).questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        }
    }

    const handlePrev = () => {
        if (isExam && currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
        }
    }

    const handleReset = () => {
        setSelectedOptionId(null)
        setShowExplanation(false)
    }

    // Computed states
    const currentSelectedId = isExam ? examAnswers[currentQuestionIndex] : selectedOptionId
    const showFeedback = isExam ? !!currentSelectedId : showExplanation
    
    const selectedOption = quiz.options.find(o => o.id === currentSelectedId)
    const isCorrect = selectedOption?.isCorrect

    return (
        <Card className="w-full bg-slate-900/50 border-slate-700/50 overflow-hidden my-4">
            <CardHeader className="pb-3 border-b border-slate-800/50 bg-slate-900/30">
                <div className="flex justify-between items-center gap-2 mb-2">
                    {isExam ? (
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                                Questão {currentQuestionIndex + 1} de {(content as ExamData).questions.length}
                            </Badge>
                             <span className="text-xs text-slate-400">{(content as ExamData).title}</span>
                        </div>
                    ) : (
                         <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                                {quiz.specialty}
                            </Badge>
                            <Badge variant="secondary" className="text-xs font-normal">
                                {quiz.difficulty}
                            </Badge>
                        </div>
                    )}
                </div>
                <CardTitle className="text-base font-medium text-slate-200 leading-relaxed">
                    {quiz.statement}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
                {quiz.options.map((option) => {
                    const isSelected = currentSelectedId === option.id
                    const isCorrectOption = option.isCorrect
                    const showStatus = !!currentSelectedId

                    let className = "justify-start text-left h-auto py-3 px-4 border-slate-700/50 hover:bg-slate-800/50 hover:text-slate-200"

                    if (showStatus) {
                        if (isSelected) {
                            if (isCorrectOption) {
                                className = "justify-start text-left h-auto py-3 px-4 bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-400"
                            } else {
                                className = "justify-start text-left h-auto py-3 px-4 bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                            }
                        } else if (isCorrectOption) {
                             className = "justify-start text-left h-auto py-3 px-4 border-green-500/30 text-green-400/70 hover:bg-transparent"
                        } else {
                            className = "justify-start text-left h-auto py-3 px-4 border-slate-800 text-slate-500 opacity-50"
                        }
                    }

                    return (
                        <Button
                            key={option.id}
                            variant="outline"
                            className={cn("w-full whitespace-normal", className)}
                            onClick={() => handleOptionSelect(option.id)}
                            disabled={showStatus}
                        >
                            <span className="mr-3 font-mono text-xs opacity-70 border border-current rounded w-5 h-5 flex items-center justify-center flex-shrink-0">
                                {option.id.toUpperCase()}
                            </span>
                            <span className="flex-1">{option.text}</span>
                            {showStatus && isSelected && (
                                <span className="ml-2">
                                    {isCorrectOption ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                </span>
                            )}
                        </Button>
                    )
                })}
            </CardContent>
            
            {showFeedback && selectedOption && (
                <CardFooter className="flex-col items-stretch pt-0 pb-4 px-4">
                    <div className={cn(
                        "rounded-lg p-4 text-sm animate-in fade-in slide-in-from-top-2 duration-300 mb-4",
                        selectedOption.isCorrect 
                            ? "bg-green-500/10 text-green-300 border border-green-500/20" 
                            : "bg-red-500/10 text-red-300 border border-red-500/20"
                    )}>
                        <div className="flex items-center gap-2 font-semibold mb-1">
                            {selectedOption.isCorrect ? (
                                <>
                                    <Check className="w-4 h-4" /> Resposta Correta!
                                </>
                            ) : (
                                <>
                                    <X className="w-4 h-4" /> Resposta Incorreta
                                </>
                            )}
                        </div>
                        <p className="opacity-90 leading-relaxed">
                            {selectedOption.explanation}
                        </p>
                    </div>

                    <div className="flex justify-between items-center">
                         {!isExam && (
                            <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-400 hover:text-white ml-auto">
                                <RotateCcw className="w-3 h-3 mr-2" />
                                Tentar Novamente
                            </Button>
                        )}

                        {isExam && (
                            <div className="flex w-full justify-between gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handlePrev} 
                                    disabled={currentQuestionIndex === 0}
                                    className="text-slate-400"
                                >
                                    Anterior
                                </Button>
                                <div className="text-xs text-slate-500 self-center">
                                    {currentQuestionIndex + 1} / {(content as ExamData).questions.length}
                                </div>
                                <Button 
                                    variant="default" 
                                    size="sm" 
                                    onClick={handleNext}
                                    disabled={currentQuestionIndex === (content as ExamData).questions.length - 1}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white"
                                >
                                    Próxima
                                    <ArrowRight className="w-3 h-3 ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>
                </CardFooter>
            )}
        </Card>
    )
}
