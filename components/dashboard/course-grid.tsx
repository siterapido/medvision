"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { PlayCircle, Clock } from "lucide-react"
import type { CourseOverview, CourseStatus } from "@/lib/dashboard/overview"
import { getCourseStatus } from "@/lib/dashboard/overview"

interface CourseGridProps {
  courses: CourseOverview[]
}

const statusLabels: Record<CourseStatus | "all", string> = {
  all: "Todos",
  "not-started": "Não iniciado",
  "in-progress": "Em andamento",
  completed: "Concluído",
}

const panelBackground =
  "space-y-6 rounded-3xl border border-[#132238] bg-[linear-gradient(140deg,#030b18_0%,#04132a_45%,#071f3d_100%)] p-6 text-white"

export function CourseGrid({ courses }: CourseGridProps) {
  const [category, setCategory] = useState<string>("all")
  const [level, setLevel] = useState<string>("all")
  const [status, setStatus] = useState<CourseStatus | "all">("all")

  const categories = useMemo(() => {
    return [
      "Todas as categorias",
      ...Array.from(new Set(courses.map((course) => course.category).filter(Boolean))) as string[],
    ]
  }, [courses])

  const levels = useMemo(() => {
    return [
      "Todos os níveis",
      ...Array.from(new Set(courses.map((course) => course.difficulty).filter(Boolean))) as string[],
    ]
  }, [courses])

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Mostrar apenas cursos iniciados (progress > 0)
      if (course.progress === 0) {
        return false
      }

      if (category !== "all" && course.category !== category) {
        return false
      }

      if (level !== "all" && course.difficulty !== level) {
        return false
      }

      if (status !== "all" && getCourseStatus(course.progress) !== status) {
        return false
      }

      return course.isPublished
    })
  }, [courses, category, level, status])

  const getProgressLabel = (progress: number) => {
    if (progress >= 100) return "Curso concluído"
    if (progress <= 0) return "Pronto para iniciar"
    return `${progress}% em andamento`
  }

  return (
    <section className={panelBackground}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Continue aprendendo</h2>
            <p className="text-sm text-slate-300">Aulas que você já iniciou. Continue de onde parou e complete sua jornada.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                size="sm"
                className="h-9 min-w-[140px] rounded-full border-slate-700/50 bg-slate-800/30 text-sm text-white backdrop-blur-sm transition-colors hover:bg-slate-800/50 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30"
              >
                <SelectValue>
                  {category === "all" ? "Categoria" : category}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((option) => (
                  <SelectItem key={option} value={option === "Todas as categorias" ? "all" : option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger
                size="sm"
                className="h-9 min-w-[140px] rounded-full border-slate-700/50 bg-slate-800/30 text-sm text-white backdrop-blur-sm transition-colors hover:bg-slate-800/50 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30"
              >
                <SelectValue>
                  {level === "all" ? "Nível" : level}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {levels.map((option) => (
                  <SelectItem key={option} value={option === "Todos os níveis" ? "all" : option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(value) => setStatus(value as CourseStatus | "all")}>
              <SelectTrigger
                size="sm"
                className="h-9 min-w-[140px] rounded-full border-slate-700/50 bg-slate-800/30 text-sm text-white backdrop-blur-sm transition-colors hover:bg-slate-800/50 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30"
              >
                <SelectValue>{statusLabels[status]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([key, label]) => {
                  const optionKey = key as CourseStatus | "all"
                  return (
                    <SelectItem key={optionKey} value={optionKey}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {(category !== "all" || level !== "all" || status !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-4 text-sm text-slate-300 transition-colors hover:bg-slate-800/50 hover:text-white"
                onClick={() => {
                  setCategory("all")
                  setLevel("all")
                  setStatus("all")
                }}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-1">
        {filteredCourses.length === 0 ? (
          <div className="flex min-w-full items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-slate-300">Você ainda não iniciou nenhuma aula.</p>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/dashboard/cursos">Explorar catálogo</Link>
              </Button>
            </div>
          </div>
        ) : (
          filteredCourses.map((course) => {
            const courseStatus = getCourseStatus(course.progress)
            const gradientClass =
              course.progress >= 100
                ? "from-[#10b981] via-[#34d399] to-[#059669]"
                : "from-[#0891b2] via-[#06b6d4] to-[#22d3ee]"

            return (
              <Link key={course.id} href={`/dashboard/cursos/${course.id}`} className="flex-shrink-0">
                <Card className="group relative flex h-full w-[260px] flex-col overflow-hidden rounded-2xl border-2 border-[#9dbbff] bg-gradient-to-b from-[#e7f3ff] via-[#d6e8ff] to-[#c5ddff] text-slate-900 shadow-[0_20px_40px_rgba(13,60,130,0.12)] transition-all duration-500 hover:-translate-y-1 hover:border-[#1c64f2]/70 hover:shadow-[0_30px_55px_rgba(13,60,130,0.24)] sm:w-[300px]">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={course.thumbnail}
                      alt={course.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 260px"
                      className="object-cover transition duration-[1200ms] ease-out group-hover:scale-110"
                      priority={false}
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-500 group-hover:opacity-100">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#8bc3ff]/70 bg-white/85 text-white backdrop-blur-xl shadow-lg shadow-[#1c64f2]/20">
                        <PlayCircle className="h-8 w-8 text-[#cfe6ff]" />
                      </div>
                    </div>
                    {course.isNew && (
                      <Badge className="absolute top-4 left-4 rounded-full border border-[#9ebeff] bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5cbaff] shadow-lg backdrop-blur">
                        Novo
                      </Badge>
                    )}
                    {courseStatus === "completed" && (
                      <Badge className="absolute top-4 left-4 rounded-full border border-[#9ebeff] bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5cbaff] shadow-lg backdrop-blur">
                        Concluído
                      </Badge>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center justify-between text-[11px] font-medium text-[#dbefff]">
                        <span>{getProgressLabel(course.progress)}</span>
                        <span>{course.durationLabel}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${gradientClass}`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div>
                      <h3 className="text-lg font-semibold leading-tight line-clamp-2 text-[#74b7ff]">{course.title}</h3>
                      <p className="mt-2 text-sm text-[#2f4db3] line-clamp-3">{course.description}</p>
                    </div>
                    <div className="mt-auto flex items-center gap-4 text-xs text-[#6db6ff]">
                      <span className="flex items-center gap-1">
                        <PlayCircle className="h-3.5 w-3.5 text-[#8dc3ff]" />
                        {course.lessonsCount} aulas
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[#8dc3ff]" />
                        {course.durationLabel}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </section>
  )
}
