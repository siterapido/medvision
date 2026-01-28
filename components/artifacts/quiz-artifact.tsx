'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ClipboardList, Check, X, ChevronRight, RotateCcw, Trophy, Award, Timer, Pause, Play, AlertTriangle, History, TrendingUp } from 'lucide-react'
import type { QuizArtifact as QuizArtifactType } from './types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface QuizArtifactProps {
  artifact: QuizArtifactType
  className?: string
  artifactId?: string
  timeLimitMinutes?: number // Optional timer in minutes
}

interface AttemptHistory {
  id: string
  score: number
  totalQuestions: number
  percentage: number
  timeSpentSeconds: number
  completedAt: string
}

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function QuizArtifact({ artifact, className, artifactId, timeLimitMinutes }: QuizArtifactProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    timeLimitMinutes ? timeLimitMinutes * 60 : null
  )
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // History state
  const [showHistory, setShowHistory] = useState(false)
  const [attemptHistory, setAttemptHistory] = useState<AttemptHistory[]>([])
  const [historyStats, setHistoryStats] = useState({ bestScore: 0, averageScore: 0, totalAttempts: 0 })

  const question = artifact.questions[currentQuestion]
  const totalQuestions = artifact.questions.length
  const progress = ((currentQuestion + 1) / totalQuestions) * 100
  const selectedAnswer = selectedAnswers[currentQuestion]
  const correctAnswer = question.options.find((o) => o.isCorrect)
  const isCorrect = selectedAnswer === correctAnswer?.id

  // Fetch history on mount
  useEffect(() => {
    if (artifactId) {
      fetch(`/api/quiz/attempt?artifactId=${artifactId}`)
        .then(res => res.json())
        .then(data => {
          if (data.attempts) {
            setAttemptHistory(data.attempts)
            setHistoryStats(data.stats)
          }
        })
        .catch(console.error)
    }
  }, [artifactId])

  // Start attempt on mount
  useEffect(() => {
    if (artifactId && !attemptId && !isFinished) {
      fetch('/api/quiz/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          artifactId,
          totalQuestions,
          timeLimitSeconds: timeLimitMinutes ? timeLimitMinutes * 60 : null
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.attempt) {
            setAttemptId(data.attempt.id)
          }
        })
        .catch(console.error)
    }
  }, [artifactId, attemptId, totalQuestions, timeLimitMinutes, isFinished])

  // Timer effect
  useEffect(() => {
    if (isFinished || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1)

      if (timeRemaining !== null) {
        setTimeRemaining(prev => {
          if (prev === null) return null
          const newTime = prev - 1

          // Warning at 1 minute
          if (newTime === 60 && !showTimeWarning) {
            setShowTimeWarning(true)
            toast.warning("1 minuto restante!", {
              description: "O tempo está acabando."
            })
          }

          // Auto-submit at 0
          if (newTime <= 0) {
            handleAutoSubmit()
            return 0
          }

          return newTime
        })
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isFinished, isPaused, timeRemaining, showTimeWarning])

  // Auto-submit when timer runs out
  const handleAutoSubmit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    toast.error("Tempo esgotado!", {
      description: "O simulado foi enviado automaticamente."
    })
    finishQuiz(true)
  }, [])

  // Finish quiz and save attempt
  const finishQuiz = useCallback(async (timedOut = false) => {
    setIsFinished(true)

    if (attemptId && artifactId) {
      const score = calculateScore()
      await fetch('/api/quiz/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          attemptId,
          answers: selectedAnswers,
          score,
          timeSpentSeconds: elapsedTime,
          timedOut
        })
      }).catch(console.error)
    }
  }, [attemptId, artifactId, selectedAnswers, elapsedTime])

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
      finishQuiz(false)
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setShowExplanation(false)
    setIsFinished(false)
    setElapsedTime(0)
    setTimeRemaining(timeLimitMinutes ? timeLimitMinutes * 60 : null)
    setIsPaused(false)
    setShowTimeWarning(false)
    setAttemptId(null)
  }

  const handlePauseToggle = () => {
    setIsPaused(!isPaused)
    if (!isPaused) {
      toast.info("Simulado pausado", {
        description: "Clique em continuar para retomar."
      })
    }
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
          {historyStats.totalAttempts > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(true)}
              className="text-xs"
            >
              <History className="h-3 w-3 mr-1" />
              Histórico
            </Button>
          )}
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

          {/* Time Stats */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              Tempo: {formatTime(elapsedTime)}
            </span>
            {historyStats.bestScore > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Melhor: {historyStats.bestScore}/{totalQuestions}
              </span>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={handleRestart} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Refazer Simulado
            </Button>
          </div>
        </div>

        {/* History Dialog */}
        <AlertDialog open={showHistory} onOpenChange={setShowHistory}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Tentativas
              </AlertDialogTitle>
              <AlertDialogDescription>
                Suas últimas {attemptHistory.length} tentativas neste simulado.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {attemptHistory.map((attempt, idx) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">#{attemptHistory.length - idx}</span>
                    <span className="font-medium">
                      {attempt.score}/{attempt.totalQuestions}
                    </span>
                    <Badge variant={attempt.percentage >= 70 ? 'default' : attempt.percentage >= 50 ? 'secondary' : 'destructive'}>
                      {Math.round(attempt.percentage)}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(attempt.timeSpentSeconds)}
                  </div>
                </div>
              ))}
            </div>

            <AlertDialogFooter>
              <AlertDialogAction>Fechar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // Pause overlay
  if (isPaused) {
    return (
      <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
        <div className="p-8 text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-amber-500/20">
            <Pause className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-xl font-bold">Simulado Pausado</h3>
          <p className="text-sm text-muted-foreground">
            Tempo decorrido: {formatTime(elapsedTime)}
            {timeRemaining !== null && ` | Restante: ${formatTime(timeRemaining)}`}
          </p>
          <Button onClick={handlePauseToggle}>
            <Play className="h-4 w-4 mr-2" />
            Continuar
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
        <div className="flex items-center gap-3">
          {/* Timer Display */}
          {timeRemaining !== null ? (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono font-bold",
              timeRemaining <= 60 ? "bg-red-500/20 text-red-500 animate-pulse" :
              timeRemaining <= 300 ? "bg-amber-500/20 text-amber-500" :
              "bg-muted text-muted-foreground"
            )}>
              <Timer className="h-3 w-3" />
              {formatTime(timeRemaining)}
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono bg-muted text-muted-foreground">
              <Timer className="h-3 w-3" />
              {formatTime(elapsedTime)}
            </div>
          )}

          {/* Pause Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handlePauseToggle}
          >
            <Pause className="h-3 w-3" />
          </Button>

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
