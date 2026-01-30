
"use client"

import { useState } from "react"
import { useCopilotReadable } from "@copilotkit/react-core"
import { cn } from "@/lib/utils"
import { CheckCircle2, HelpCircle, BrainCircuit, GraduationCap, ChevronRight, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Question {
    id: string
    question_text: string
    options: any
    correct_answer: string
    explanation: string
    type: string
    difficulty: string
}

interface PracticeExamContentProps {
    exam: {
        id: string
        title: string
        topic: string
        specialty: string
        difficulty: string
        practice_questions: Question[]
    }
}

export function PracticeExamContent({ exam }: PracticeExamContentProps) {
    const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({})

    // Expose exam content to AI
    useCopilotReadable({
        description: `O usuário está realizando o simulado "${exam.title}" sobre o tema "${exam.topic}".`,
        value: exam
    })

    const toggleAnswer = (questionId: string) => {
        setShowAnswers(prev => ({ ...prev, [questionId]: !prev[questionId] }))
    }

    return (
        <div className="flex flex-col gap-10">
            {/* Exam Header Card */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-violet-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider border border-white/20">
                                {exam.specialty || "Odontologia Geral"}
                            </span>
                            <span className={cn(
                                "px-2.5 py-1 rounded-full backdrop-blur-md text-[10px] font-bold uppercase tracking-wider border",
                                exam.difficulty === 'hard' ? 'bg-red-500/20 border-red-500/30' :
                                    exam.difficulty === 'medium' ? 'bg-amber-500/20 border-amber-500/30' :
                                        'bg-emerald-500/20 border-emerald-500/30'
                            )}>
                                {exam.difficulty === 'hard' ? 'Nível Difícil' : exam.difficulty === 'medium' ? 'Nível Intermediário' : 'Nível Iniciante'}
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight leading-tight">{exam.title}</h2>
                        <div className="flex items-center gap-4 text-white/70 text-sm font-medium">
                            <span className="flex items-center gap-1.5">
                                <BrainCircuit className="w-4 h-4" />
                                {exam.topic}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <GraduationCap className="w-4 h-4" />
                                {exam.practice_questions?.length || 0} Questões
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 min-w-[120px]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Status</span>
                        <span className="text-lg font-bold">Simulado</span>
                        <div className="mt-2 w-full h-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white w-1/3 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-8">
                {exam.practice_questions?.map((q, index) => (
                    <div
                        key={q.id}
                        className="group flex flex-col md:flex-row gap-6 p-1 transition-all duration-300"
                    >
                        <div className="md:w-16 flex-shrink-0 flex items-start justify-center pt-2">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-sm font-black text-slate-400 dark:text-slate-600 group-hover:border-violet-500/30 group-hover:text-violet-500 transition-all duration-300">
                                {String(index + 1).padStart(2, '0')}
                            </div>
                        </div>

                        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300">
                            <h3 className="text-xl text-slate-800 dark:text-slate-100 font-bold leading-relaxed mb-8">
                                {q.question_text}
                            </h3>

                            <div className="grid grid-cols-1 gap-3 mb-8">
                                {Array.isArray(q.options) && q.options.map((option: string, optIdx: number) => {
                                    const isCorrect = showAnswers[q.id] && (
                                        option === q.correct_answer ||
                                        option.startsWith(q.correct_answer)
                                    );

                                    return (
                                        <div
                                            key={optIdx}
                                            className={cn(
                                                "group/opt relative p-4 rounded-2xl border text-sm transition-all duration-300 cursor-pointer flex gap-4 items-center",
                                                isCorrect
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100 shadow-lg shadow-emerald-500/5"
                                                    : "bg-slate-50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-violet-500/30 hover:bg-white dark:hover:bg-slate-900"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all",
                                                isCorrect ? "bg-emerald-500 border-emerald-400 text-white" : "border-slate-300 dark:border-slate-700 text-slate-400 groub-hover/opt:border-violet-500 group-hover/opt:text-violet-500"
                                            )}>
                                                {String.fromCharCode(65 + optIdx)}
                                            </div>
                                            <span className="flex-1 leading-relaxed">{option}</span>
                                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex flex-col gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => toggleAnswer(q.id)}
                                    className={cn(
                                        "w-full md:w-auto h-11 rounded-full px-6 font-bold text-xs gap-2 transition-all duration-300 shadow-sm",
                                        showAnswers[q.id]
                                            ? "bg-violet-600 border-violet-500 text-white hover:bg-violet-700 shadow-violet-500/20"
                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    )}
                                >
                                    {showAnswers[q.id] ? (
                                        "Esconder Explicação"
                                    ) : (
                                        <><HelpCircle className="w-4 h-4" /> Verificar Resposta & Ver Explicação</>
                                    )}
                                </Button>

                                {showAnswers[q.id] && (
                                    <div className="p-6 rounded-2xl bg-violet-500/5 border border-violet-500/10 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                                                <Info className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm font-bold text-violet-900 dark:text-violet-200 uppercase tracking-widest flex items-center gap-2">
                                                    Referência Acadêmica
                                                    <ChevronRight className="w-3 h-3" />
                                                </p>
                                                <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-violet-100 dark:border-violet-900/20">
                                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">GABARITO: {q.correct_answer}</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                                        {q.explanation}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
