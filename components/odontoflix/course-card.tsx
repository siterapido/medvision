"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlayCircle, Clock, CheckCircle2 } from "lucide-react"
import { CourseThumbnail } from "@/components/dashboard/course-thumbnail"
import { OdontoFlixCourse } from "@/lib/odontoflix/types"
import { formatDuration, getProgressColor } from "@/lib/odontoflix/helpers"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface CourseCardProps {
    course: OdontoFlixCourse
    priority?: boolean
}

export function CourseCard({ course, priority = false }: CourseCardProps) {
    const isComingSoon = course.coming_soon && course.available_at && new Date(course.available_at) > new Date()
    const isCompleted = (course.progress ?? 0) >= 100
    const progressColor = getProgressColor(course.progress ?? 0)

    return (
        <Link
            href={`/dashboard/odontoflix/cursos/${course.id}`}
            className="group relative block w-full transition-all duration-500 ease-out hover:z-50 focus:outline-none"
        >
            <Card className="relative aspect-[16/9] overflow-hidden border-none bg-slate-900 shadow-xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-cyan-500/20 group-focus:ring-2 group-focus:ring-cyan-500">
                {/* Thumbnail */}
                <CourseThumbnail
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    priority={priority}
                />

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-40" />
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/10 transition-colors" />

                {/* Content Overlay (Bottom) */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                    <div className="space-y-2">
                        {/* Badges and Progress */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                {isComingSoon ? (
                                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] px-2 py-0">
                                        Em Breve
                                    </Badge>
                                ) : isCompleted ? (
                                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-2 py-0">
                                        Concluído
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px] px-2 py-0">
                                        {course.area || "Geral"}
                                    </Badge>
                                )}
                            </div>
                            {!isComingSoon && (course.progress ?? 0) > 0 && (
                                <span className="text-[10px] font-bold text-white shadow-sm">
                                    {Math.round(course.progress)}%
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-white line-clamp-2 drop-shadow-md transition-colors group-hover:text-cyan-300">
                            {course.title}
                        </h3>

                        {/* Meta Info (Visible on Hover or for All?) - Making it Always visible but subtle */}
                        <div className="flex items-center gap-3 text-[10px] font-medium text-slate-300 transition-opacity duration-500 group-hover:text-white">
                            <div className="flex items-center gap-1">
                                <PlayCircle className="h-3 w-3 text-cyan-400" />
                                <span>{course.lessons_count} aulas</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-cyan-400" />
                                <span>{formatDuration(course.duration_minutes)}</span>
                            </div>
                            {isCompleted && (
                                <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Play Icon Middle (Only on hover) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-100 scale-150 pointer-events-none">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-white shadow-2xl shadow-cyan-500/40">
                        <PlayCircle className="h-8 w-8 fill-current" />
                    </div>
                </div>

                {/* Progress Bar (Bottom) */}
                {!isComingSoon && (course.progress ?? 0) > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                        <div
                            className={cn("h-full transition-all duration-1000", `bg-${progressColor}`)}
                            style={{ width: `${course.progress}%` }}
                        />
                    </div>
                )}
            </Card>

            {/* Background Glow */}
            <div className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-cyan-500/0 opacity-0 blur transition-all duration-500 group-hover:from-cyan-500/20 group-hover:via-cyan-400/10 group-hover:to-cyan-500/20 group-hover:opacity-100" />
        </Link>
    )
}
