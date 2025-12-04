"use client"

import { useState } from "react"
import { CourseCarousel } from "@/components/courses/course-carousel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Props = {
  cursosEmBreveCards: JSX.Element[]
  novoCursosCards: JSX.Element[]
  livesAgendadasCards: JSX.Element[]
}

export function ContentTypeSections({ cursosEmBreveCards, novoCursosCards, livesAgendadasCards }: Props) {
  const [type, setType] = useState<string>("todos")

  const showCursos = type === "todos" || type === "cursos"
  const showLives = type === "todos" || type === "lives"

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-52 bg-[#131D37] border-slate-600 text-white">
            <SelectValue placeholder="Tipo de conteúdo" />
          </SelectTrigger>
          <SelectContent className="bg-[#131D37] border-slate-600">
            <SelectItem value="todos" className="text-white">Todos</SelectItem>
            <SelectItem value="cursos" className="text-white">Cursos</SelectItem>
            <SelectItem value="lives" className="text-white">Lives</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showLives && livesAgendadasCards.length > 0 && (
        <section className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400">
                🎥 Lives
              </span>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[inherit]">
            <div className="flex justify-center md:justify-start gap-5 overflow-x-auto pb-4 px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {livesAgendadasCards}
            </div>
          </div>
        </section>
      )}

      {showCursos && cursosEmBreveCards.length > 0 && (
        <section className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400">
                ⏳ Em Breve
              </span>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[inherit]">
            <div className="flex justify-center md:justify-start gap-5 overflow-x-auto pb-4 px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {cursosEmBreveCards}
            </div>
          </div>
        </section>
      )}

      {showCursos && novoCursosCards.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400">
              ✨ Meus Cursos
            </span>
          </div>
          <CourseCarousel ariaLabel="Meus cursos" className="rounded-[inherit]">
            {novoCursosCards}
          </CourseCarousel>
        </section>
      )}
    </div>
  )}
