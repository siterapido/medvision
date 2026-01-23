'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ClipboardList, Check, X, ChevronRight, RotateCcw, Trophy, Award } from 'lucide-react'
import type { QuizArtifact as QuizArtifactType } from './types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface QuizArtifactProps {
  artifact: QuizArtifactType
  className?: string
}

export function QuizArtifact({ artifact, className }: QuizArtifactProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const question = artifact.questions[currentQuestion]
  const totalQuestions = artifact.questions.length
  const progress = ((currentQuestion + 1) / totalQuestions) * 100
  const selectedAnswer = selectedAnswers[currentQuestion]
  const correctAnswer = question.options.find((o) => o.isCorrect)
  const isCorrect = selectedAnswer === correctAnswer?.id

  const handleSelectAnswer = (optionId: string) => {
    if (selectedAnswer) return // Already answered
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion]: optionId }))
    setShowExplanation(true)
  }

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setShowExplanation(false)
    } else {
      setIsFinished(true)
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setShowExplanation(false)
    setIsFinished(false)
  }

  const calculateScore = () => {
    let correct = 0
    Object.entries(selectedAnswers).forEach(([qIndex, answerId]) => {
      const q = artifact.questions[parseInt(qIndex)]
      if (q.options.find((o) => o.id === answerId)?.isCorrect) {
        correct++
      }
    })
    return correct
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-500'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'hard':
        return 'bg-red-500/10 text-red-500'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  if (isFinished) {
    const score = calculateScore()
    const percentage = (score / totalQuestions) * 100

    return (
      <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Resultado Final</span>
          </div>
        </div>

        <div className="p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div
              className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center',
                percentage >= 70 ? 'bg-green-500/20' : percentage >= 50 ? 'bg-yellow-500/20' : 'bg-red-500/20'
              )}
            >
              <Award
                className={cn(
                  'h-12 w-12',
                  percentage >= 70 ? 'text-green-500' : percentage >= 50 ? 'text-yellow-500' : 'text-red-500'
                )}
              />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-foreground">
              {score} / {totalQuestions}
            </h3>
            <p className="text-sm text-muted-foreground">
              {percentage >= 70 ? 'Excelente!' : percentage >= 50 ? 'Bom trabalho!' : 'Continue estudando!'}
            </p>
          </div>

          <Progress value={percentage} className="h-2" />

          <Button onClick={handleRestart} variant="outline" className="mt-4">
            <RotateCcw className="h-4 w-4 mr-2" />
            Refazer Simulado
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{artifact.title || 'Simulado'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={getDifficultyColor(question.difficulty)}>
            {question.difficulty === 'easy' ? 'Fácil' : question.difficulty === 'medium' ? 'Médio' : 'Difícil'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {currentQuestion + 1}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-1 rounded-none" />

      {/* Question */}
      <div className="p-4 space-y-4">
        {artifact.specialty && (
          <Badge variant="outline" className="mb-2">
            {artifact.specialty}
          </Badge>
        )}

        <p className="text-foreground font-medium">{question.text}</p>

        {/* Options */}
        <div className="space-y-2">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option.id
            const isCorrectOption = option.isCorrect
            const showCorrectness = showExplanation

            return (
              <button
                key={option.id}
                onClick={() => handleSelectAnswer(option.id)}
                disabled={!!selectedAnswer}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all',
                  'flex items-start gap-3',
                  !selectedAnswer && 'hover:bg-accent/50 hover:border-primary/50',
                  isSelected && showCorrectness && isCorrectOption && 'bg-green-500/10 border-green-500',
                  isSelected && showCorrectness && !isCorrectOption && 'bg-red-500/10 border-red-500',
                  !isSelected && showCorrectness && isCorrectOption && 'bg-green-500/10 border-green-500',
                  !showCorrectness && isSelected && 'bg-primary/10 border-primary'
                )}
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                    'text-xs font-medium border',
                    isSelected && !showCorrectness && 'bg-primary text-primary-foreground border-primary',
                    showCorrectness && isCorrectOption && 'bg-green-500 text-white border-green-500',
                    showCorrectness && isSelected && !isCorrectOption && 'bg-red-500 text-white border-red-500'
                  )}
                >
                  {showCorrectness && isCorrectOption && <Check className="h-3 w-3" />}
                  {showCorrectness && isSelected && !isCorrectOption && <X className="h-3 w-3" />}
                  {!showCorrectness && option.id}
                </span>
                <span className="text-sm text-foreground">{option.text}</span>
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div
            className={cn(
              'p-4 rounded-lg border',
              isCorrect ? 'bg-green-500/5 border-green-500/30' : 'bg-amber-500/5 border-amber-500/30'
            )}
          >
            <p className="text-sm font-medium mb-1">{isCorrect ? 'Correto!' : 'Incorreto'}</p>
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </div>
        )}

        {/* Navigation */}
        {showExplanation && (
          <Button onClick={handleNext} className="w-full">
            {currentQuestion < totalQuestions - 1 ? (
              <>
                Próxima <ChevronRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Ver Resultado <Trophy className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
