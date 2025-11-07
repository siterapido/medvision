"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import {
  BookMarked,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  FolderDown,
  Link2,
  PlayCircle,
  ShieldCheck,
} from "lucide-react"

type LessonDocumentType = "checklist" | "protocolo" | "fluxograma" | "caso" | "template"

type LessonDocument = {
  id: string
  title: string
  description: string
  format: string
  size: string
  url: string
  type: LessonDocumentType
}

type Lesson = {
  id: string
  title: string
  duration: string
  completed: boolean
  videoUrl: string
  description: string
  level: string
  focus: string
  documents: LessonDocument[]
}

type CourseData = {
  id: string
  title: string
  description: string
  specialty: string
  level: string
  duration: string
  totalLessons: number
  lastUpdated: string
  badges: string[]
  highlights: { label: string; value: string; helper?: string }[]
  lessons: Lesson[]
}

const coursesData: Record<string, CourseData> = {
  "demo-implantodontia": {
    id: "demo-implantodontia",
    title: "Implantodontia Guiada em 3D",
    description:
      "Fluxo digital completo com protocolos de IA clínica, carregamentos imediatos e checklists cirúrgicos validados em centros de referência.",
    specialty: "Cirurgia Oral / Implantodontia",
    level: "Avançado",
    duration: "18h 30m",
    totalLessons: 6,
    lastUpdated: "Mar 2025",
    badges: ["Premium", "IA aplicada", "Fluxo Digital"],
    highlights: [
      { label: "Carga horária", value: "18h 30m" },
      { label: "Checklists", value: "12 modelos" },
      { label: "Casos guiados", value: "4 cirurgias" },
      { label: "Atualização", value: "Mar 2025", helper: "Conteúdo recém-revisado" },
    ],
    lessons: [
      {
        id: "lesson-1",
        title: "Planejamento guiado com IA clínica",
        duration: "18:40",
        completed: true,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description:
          "Integração de tomografia, planejamento reverso e validação automática de zonas de segurança para carga imediata.",
        level: "Fundamentos",
        focus: "Aquisição de exames e fluxo digital",
        documents: [
          {
            id: "doc-1",
            title: "Checklist pré-operatório",
            description: "Checklist validado para triagem sistêmica e preparo da equipe.",
            format: "PDF",
            size: "1.2 MB",
            url: "https://example.com/checklist-pre-op.pdf",
            type: "checklist",
          },
          {
            id: "doc-2",
            title: "Template de consentimento guiado",
            description: "Modelo editável com campos dinâmicos para assinatura digital.",
            format: "DOCX",
            size: "320 KB",
            url: "https://example.com/consentimento.docx",
            type: "template",
          },
        ],
      },
      {
        id: "lesson-2",
        title: "Seleção dos implantes e materiais",
        duration: "22:10",
        completed: true,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description:
          "Comparativo de superfícies, conexões e parafusos indexados. Como registrar lote e rastrear rastreabilidade com QR Codes.",
        level: "Técnicas Clínicas",
        focus: "Materiais e biossegurança",
        documents: [
          {
            id: "doc-3",
            title: "Tabela comparativa de implantes",
            description: "Planilha com torque recomendado, perfil transmucoso e torque finais.",
            format: "XLSX",
            size: "860 KB",
            url: "https://example.com/implantes.xlsx",
            type: "fluxograma",
          },
          {
            id: "doc-4",
            title: "Protocolo de esterilização da guia",
            description: "Passo a passo com fotos para esterilização a baixa temperatura.",
            format: "PDF",
            size: "950 KB",
            url: "https://example.com/esterilizacao.pdf",
            type: "protocolo",
          },
        ],
      },
      {
        id: "lesson-3",
        title: "Navegação intraoperatória",
        duration: "27:55",
        completed: true,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Configuração das brocas, verificação da guia e checagens obrigatórias antes das osteotomias.",
        level: "Procedimento",
        focus: "Execução da cirurgia guiada",
        documents: [
          {
            id: "doc-5",
            title: "Mapa cirúrgico por fase",
            description: "Fluxo visual com limites críticos e alertas da IA.",
            format: "PDF",
            size: "2.1 MB",
            url: "https://example.com/mapa-cirurgico.pdf",
            type: "fluxograma",
          },
          {
            id: "doc-6",
            title: "Logbook de instrumentais",
            description: "Planilha editável para rastrear instrumentais por paciente.",
            format: "XLSX",
            size: "540 KB",
            url: "https://example.com/logbook.xlsx",
            type: "template",
          },
        ],
      },
      {
        id: "lesson-4",
        title: "Carga imediata e provisórios",
        duration: "31:05",
        completed: false,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Critérios biomecânicos para liberar carga imediata e checklist fotográfico para documentação premium.",
        level: "Avançado",
        focus: "Entrega com previsibilidade estética",
        documents: [
          {
            id: "doc-7",
            title: "Guia de torque e sequência de aperto",
            description: "Tabela resumida para aparafusar provisórios sem deformações.",
            format: "PDF",
            size: "780 KB",
            url: "https://example.com/torque.pdf",
            type: "protocolo",
          },
          {
            id: "doc-8",
            title: "Kit fotográfico para aprovação com IA",
            description: "Lista de ângulos e prompt sugerido para validação com Odonto GPT.",
            format: "PDF",
            size: "1.5 MB",
            url: "https://example.com/fotografia.pdf",
            type: "checklist",
          },
        ],
      },
      {
        id: "lesson-5",
        title: "Pós-operatório inteligente",
        duration: "16:20",
        completed: false,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Protocolos de analgesia, revisão de suturas e como automatizar alertas pelo WhatsApp com IA.",
        level: "Cuidados",
        focus: "Follow-up e comunicação",
        documents: [
          {
            id: "doc-9",
            title: "Script de acompanhamento",
            description: "Sequência de mensagens e perguntas de triagem em até 7 dias.",
            format: "PDF",
            size: "430 KB",
            url: "https://example.com/script-follow.pdf",
            type: "template",
          },
        ],
      },
      {
        id: "lesson-6",
        title: "Complicações e planos de contingência",
        duration: "24:35",
        completed: false,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Como mapear riscos, reverter perda de torque e documentar casos para auditorias.",
        level: "Master",
        focus: "Gestão de risco",
        documents: [
          {
            id: "doc-10",
            title: "Fluxo de decisões rápidas",
            description: "Fluxograma para suporte imediato em sangramentos e fraturas.",
            format: "PDF",
            size: "690 KB",
            url: "https://example.com/fluxo-urgencias.pdf",
            type: "fluxograma",
          },
          {
            id: "doc-11",
            title: "Checklist de auditoria",
            description: "Campos essenciais para registro clínico e jurídico.",
            format: "DOCX",
            size: "410 KB",
            url: "https://example.com/auditoria.docx",
            type: "checklist",
          },
        ],
      },
    ],
  },
  "demo-sedacao": {
    id: "demo-sedacao",
    title: "Sedação Consciente e Controle de Dor",
    description:
      "Farmacologia aplicada, simulações de emergência e roteiros para integrar a equipe assistencial em procedimentos extensos.",
    specialty: "Sedação / Dor Orofacial",
    level: "Intermediário",
    duration: "14h 10m",
    totalLessons: 5,
    lastUpdated: "Fev 2025",
    badges: ["Express", "Checklist de emergência"],
    highlights: [
      { label: "Protocolo de risco", value: "ASA I-IV" },
      { label: "Simulações", value: "6 cenários clínicos" },
      { label: "Checklists", value: "8 documentos" },
      { label: "Atualização", value: "Fev 2025" },
    ],
    lessons: [
      {
        id: "sed-1",
        title: "Avaliação pré-anestésica",
        duration: "19:15",
        completed: false,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Classificação ASA com IA e ajuste medicamentoso personalizado.",
        level: "Fundamentos",
        focus: "Estratificação de risco",
        documents: [
          {
            id: "doc-s1",
            title: "Ficha de avaliação",
            description: "Modelo editável com automações.",
            format: "PDF",
            size: "360 KB",
            url: "https://example.com/ficha-avaliacao.pdf",
            type: "template",
          },
        ],
      },
      {
        id: "sed-2",
        title: "Protocolos farmacológicos",
        duration: "24:50",
        completed: false,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Doses seguras e reversores disponíveis no consultório.",
        level: "Farmacologia",
        focus: "Combinações medicamentosas",
        documents: [
          {
            id: "doc-s2",
            title: "Tabela de dosagens",
            description: "Inclui faixa pediátrica e ajuste renal.",
            format: "PDF",
            size: "510 KB",
            url: "https://example.com/dosagens.pdf",
            type: "protocolo",
          },
        ],
      },
      {
        id: "sed-3",
        title: "Simulações de emergência",
        duration: "26:05",
        completed: false,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Playbooks para laringoespasmo, broncoespasmo e crise hipertensiva.",
        level: "Avançado",
        focus: "Tomada de decisão",
        documents: [
          {
            id: "doc-s3",
            title: "Playbook emergencial",
            description: "Fluxos para toda a equipe.",
            format: "PDF",
            size: "1.1 MB",
            url: "https://example.com/emergencia.pdf",
            type: "fluxograma",
          },
        ],
      },
      {
        id: "sed-4",
        title: "Comunicação com paciente e família",
        duration: "17:40",
        completed: false,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Scripts para reduzir ansiedade e garantir consentimento informado.",
        level: "Relacionamento",
        focus: "Experiência do paciente",
        documents: [
          {
            id: "doc-s4",
            title: "Roteiro de briefing",
            description: "Prompt + fluxos para Odonto GPT responder dúvidas.",
            format: "PDF",
            size: "280 KB",
            url: "https://example.com/briefing.pdf",
            type: "template",
          },
        ],
      },
      {
        id: "sed-5",
        title: "Follow-up e monitoramento",
        duration: "14:25",
        completed: false,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Integração com wearables e alertas automáticos pós-sedação.",
        level: "Follow-up",
        focus: "Monitoramento remoto",
        documents: [
          {
            id: "doc-s5",
            title: "Checklist de alta",
            description: "Inclui sinais de alerta e telemonitoramento.",
            format: "PDF",
            size: "410 KB",
            url: "https://example.com/checklist-alta.pdf",
            type: "checklist",
          },
        ],
      },
    ],
  },
}

const documentTypeConfig: Record<
  LessonDocumentType,
  { label: string; icon: LucideIcon; accent: string }
> = {
  checklist: { label: "Checklist", accent: "text-[#8be7fd]", icon: ClipboardList },
  protocolo: { label: "Protocolo", accent: "text-[#7dd3fc]", icon: ShieldCheck },
  fluxograma: { label: "Fluxograma", accent: "text-[#a5f3fc]", icon: FolderDown },
  caso: { label: "Caso clínico", accent: "text-[#bbf7d0]", icon: BookMarked },
  template: { label: "Template", accent: "text-[#fed7aa]", icon: FileText },
}

export function CoursePlayer({ courseId }: { courseId: string }) {
  const fallbackCourse = useMemo(() => Object.values(coursesData)[0], [])
  const courseData = coursesData[courseId] ?? fallbackCourse
  const [lessons, setLessons] = useState<Lesson[]>(courseData.lessons)
  const [currentLessonId, setCurrentLessonId] = useState<string>(courseData.lessons[0]?.id ?? "")
  const currentLesson = lessons.find((lesson) => lesson.id === currentLessonId) ?? lessons[0]
  const currentLessonIndex = lessons.findIndex((lesson) => lesson.id === currentLessonId)

  const completedCount = lessons.filter((lesson) => lesson.completed).length
  const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0
  const allCompleted = completedCount === lessons.length
  const upcomingLesson =
    lessons.find((lesson, index) => index > currentLessonIndex && !lesson.completed) ?? null

  if (!currentLesson) {
    return null
  }

  const handleMarkComplete = () => {
    setLessons((prev) =>
      prev.map((lesson) => (lesson.id === currentLesson.id ? { ...lesson, completed: true } : lesson)),
    )

    const currentIndex = lessons.findIndex((lesson) => lesson.id === currentLesson.id)
    if (currentIndex > -1 && currentIndex < lessons.length - 1) {
      setCurrentLessonId(lessons[currentIndex + 1].id)
    }
  }

  const handleDocumentAction = (resource: LessonDocument, action: "view" | "download") => {
    if (typeof window === "undefined") return

    if (action === "view") {
      window.open(resource.url, "_blank", "noopener,noreferrer")
      return
    }

    const link = document.createElement("a")
    link.href = resource.url
    link.download = resource.title
    link.target = "_blank"
    link.rel = "noopener"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <section className="space-y-8 rounded-[28px] border border-white/5 bg-[#0b1424] px-4 py-6 text-white shadow-[0_25px_60px_rgba(3,6,15,0.45)] sm:px-8 sm:py-8">
      <header className="border-b border-white/5 pb-5">
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">Academia Odonto GPT</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-white md:text-3xl">{courseData.title}</h1>
            <p className="text-sm text-slate-300">{courseData.description}</p>
          </div>
          <div className="flex flex-col gap-2 text-right text-sm text-slate-300">
            <div>
              <p className="text-3xl font-semibold text-white">{progress}%</p>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Concluído</p>
            </div>
            <p>
              {lessons.length} aulas • {courseData.duration}
            </p>
            <p className="text-xs text-white/50">Atualizado {courseData.lastUpdated}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-5">
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-black">
            <div className="aspect-video w-full">
              <iframe
                src={currentLesson.videoUrl}
                title={currentLesson.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/60">
                <span>
                  Aula {currentLessonIndex + 1} de {lessons.length}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {currentLesson.duration}
                </span>
                <span>{currentLesson.level}</span>
                <span>{currentLesson.focus}</span>
              </div>
              <h2 className="text-2xl font-semibold text-white">{currentLesson.title}</h2>
              <p className="text-sm text-slate-200">{currentLesson.description}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {!currentLesson.completed ? (
                <Button
                  size="sm"
                  className="rounded-full bg-white text-[#0b1424] hover:bg-slate-100"
                  onClick={handleMarkComplete}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Marcar como concluída
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-white/20 text-white hover:bg-white/10"
                >
                  <PlayCircle className="h-4 w-4" />
                  Reassistir aula
                </Button>
              )}
              {allCompleted && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-slate-200 hover:bg-white/10"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Gerar certificado
                </Button>
              )}
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.25em] text-white/40">
              Próxima: {upcomingLesson ? upcomingLesson.title : "Trilha concluída"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Documentos da aula</h3>
                <p className="text-xs text-slate-300">Disponíveis para equipe</p>
              </div>
              <span className="text-xs text-white/50">{currentLesson.documents.length} arquivos</span>
            </div>

            {currentLesson.documents.length === 0 ? (
              <p className="mt-4 text-sm text-slate-300">Nenhum documento disponível para esta aula.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {currentLesson.documents.map((resource) => {
                  const config = documentTypeConfig[resource.type]
                  const Icon = config.icon

                  return (
                    <div
                      key={resource.id}
                      className="flex items-start gap-4 rounded-xl border border-white/10 bg-[#111b2f] p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        <Icon className={cn("h-4 w-4", config.accent)} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold text-white">{resource.title}</p>
                        <p className="text-xs text-slate-300 line-clamp-2">{resource.description}</p>
                        <p className="text-xs text-white/40">
                          {resource.format} • {resource.size}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-white/70 hover:bg-white/10"
                          onClick={() => handleDocumentAction(resource, "view")}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-white/70 hover:bg-white/10"
                          onClick={() => handleDocumentAction(resource, "download")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="w-full space-y-4 rounded-2xl border border-white/10 bg-[#0d172a] p-4 lg:max-w-sm">
          <div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Trilha do curso</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="mt-2 h-1.5 rounded-full bg-white/10" />
            <p className="mt-1 text-xs text-white/40">
              {completedCount}/{lessons.length} aulas concluídas
            </p>
          </div>

          <ScrollArea className="h-[65vh] pr-2">
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => setCurrentLessonId(lesson.id)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-3 text-left transition",
                    lesson.id === currentLesson.id
                      ? "border-white/20 bg-white/10"
                      : "border-transparent hover:border-white/10 hover:bg-white/5",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        lesson.completed
                          ? "bg-white/10 text-emerald-300"
                          : lesson.id === currentLesson.id
                            ? "bg-white text-[#0b1424]"
                            : "bg-white/5 text-white/70",
                      )}
                    >
                      {lesson.completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white line-clamp-2">{lesson.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {lesson.duration}
                        </span>
                        <span>{lesson.level}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </section>
  )
}
