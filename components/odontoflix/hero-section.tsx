"use client"

import { PlayCircle, Info, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OdontoFlixCourse } from "@/lib/odontoflix/types"
import { formatDuration } from "@/lib/odontoflix/helpers"
import Link from "next/link"
import Image from "next/image"

interface HeroSectionProps {
    course: OdontoFlixCourse | null
}

export function HeroSection({ course }: HeroSectionProps) {
    if (!course) return null

    const isCompleted = (course.progress ?? 0) >= 100
    const hasStarted = (course.progress ?? 0) > 0 && !isCompleted

    return (
        <section className="relative h-[80vh] w-full overflow-hidden md:h-[90vh]">
            {/* Background Image / Placeholder */}
            <div className="absolute inset-0">
                <Image
                    src={course.thumbnail_url || "/placeholder-course.jpg"}
                    alt={course.title}
                    fill
                    className="object-cover opacity-60 transition-transform duration-[10s] hover:scale-110"
                    priority
                />
                {/* Multi-layered Gradients for Netflix Look */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30" />
            </div>

            {/* Content */}
            <div className="relative flex h-full flex-col justify-center px-6 md:px-16 lg:px-24">
                <div className="max-w-2xl space-y-6">
                    <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-700">
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-bold uppercase tracking-wider backdrop-blur-md">
                            Destaque
                        </Badge>
                        <Badge className="bg-white/5 text-slate-300 border-white/10 backdrop-blur-md">
                            {course.area || "Geral"}
                        </Badge>
                        {isCompleted && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold backdrop-blur-md">
                                Concluído
                            </Badge>
                        )}
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                            <Clock className="h-4 w-4 text-cyan-400" />
                            <span>{formatDuration(course.duration_minutes)}</span>
                        </div>
                    </div>

                    <h1 className="text-4xl font-black text-white md:text-6xl lg:text-7xl leading-tight animate-in fade-in slide-in-from-left-6 duration-700 delay-100 drop-shadow-2xl">
                        {course.title}
                    </h1>

                    <p className="text-base text-slate-300 md:text-lg lg:text-xl line-clamp-3 leading-relaxed animate-in fade-in slide-in-from-left-8 duration-700 delay-200 drop-shadow-md">
                        {course.description || "Inicie agora e transforme seu conhecimento com o melhor conteúdo de odontologia do mercado."}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-4 animate-in fade-in slide-in-from-left-10 duration-700 delay-300">
                        <Link href={`/newdashboard/odontoflix/cursos/${course.id}`}>
                            <Button size="lg" className="h-14 px-8 text-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-white shadow-xl shadow-cyan-500/30 transition-all hover:scale-105">
                                <PlayCircle className="mr-2 h-6 w-6 fill-current" />
                                {hasStarted ? "Continuar Assistindo" : "Começar Agora"}
                            </Button>
                        </Link>

                        <Link href={`/newdashboard/odontoflix/cursos/${course.id}`}>
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-white/20 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 transition-all hover:scale-105">
                                <Info className="mr-2 h-6 w-6" />
                                Mais Informações
                            </Button>
                        </Link>
                    </div>

                    {/* Progress Indicator if started */}
                    {hasStarted && (
                        <div className="mt-8 max-w-sm space-y-2 animate-in fade-in duration-1000 delay-500">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-cyan-400 font-bold">Progresso: {Math.round(course.progress)}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 backdrop-blur-sm">
                                <div
                                    className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-1000 ease-out"
                                    style={{ width: `${course.progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
