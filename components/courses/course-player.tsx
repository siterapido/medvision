"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Lesson = {
  id: string
  title: string
  duration: string
  completed: boolean
  videoUrl: string
}

const coursesData: Record<string, { title: string; lessons: Lesson[] }> = {
  "1": {
    title: "Implantodontia Básica",
    lessons: [
      {
        id: "1",
        title: "Introdução à Implantodontia",
        duration: "15:30",
        completed: true,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      {
        id: "2",
        title: "Anatomia e Fisiologia Óssea",
        duration: "22:45",
        completed: true,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      {
        id: "3",
        title: "Planejamento Cirúrgico",
        duration: "28:15",
        completed: true,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      {
        id: "4",
        title: "Técnicas de Instalação",
        duration: "35:20",
        completed: false,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      {
        id: "5",
        title: "Cuidados Pós-Operatórios",
        duration: "18:50",
        completed: false,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
      {
        id: "6",
        title: "Complicações e Soluções",
        duration: "25:30",
        completed: false,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
    ],
  },
}

export function CoursePlayer({ courseId }: { courseId: string }) {
  const courseData = coursesData[courseId] || coursesData["1"]
  const [currentLesson, setCurrentLesson] = useState(courseData.lessons[0])
  const [lessons, setLessons] = useState(courseData.lessons)

  const completedCount = lessons.filter((l) => l.completed).length
  const progress = Math.round((completedCount / lessons.length) * 100)
  const isLastLesson = currentLesson.id === lessons[lessons.length - 1].id
  const allCompleted = completedCount === lessons.length

  const handleMarkComplete = () => {
    setLessons((prev) =>
      prev.map((lesson) => (lesson.id === currentLesson.id ? { ...lesson, completed: true } : lesson)),
    )

    // Move to next lesson if not the last one
    const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id)
    if (currentIndex < lessons.length - 1) {
      setCurrentLesson(lessons[currentIndex + 1])
    }
  }

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Video Player Area */}
      <div className="flex-1 flex flex-col bg-black">
        <div className="flex-1 flex items-center justify-center">
          <iframe
            src={currentLesson.videoUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <div className="bg-card p-6 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">{currentLesson.title}</h2>
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="outline">{currentLesson.duration}</Badge>
              {currentLesson.completed && <Badge className="bg-success text-success-foreground">Concluída</Badge>}
            </div>
            {!currentLesson.completed ? (
              <Button
                onClick={handleMarkComplete}
                className="bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Marcar como Concluída
              </Button>
            ) : isLastLesson && allCompleted ? (
              <Button className="bg-success hover:bg-success/90 text-success-foreground">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Gerar Certificado
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Lessons Sidebar */}
      <div className="w-full lg:w-96 bg-card border-l border-border overflow-y-auto">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-lg mb-2">{courseData.title}</h3>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <span>
              {completedCount} de {lessons.length} aulas
            </span>
            <span>{progress}% concluído</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="p-4 space-y-2">
          {lessons.map((lesson, index) => (
            <button
              key={lesson.id}
              onClick={() => setCurrentLesson(lesson)}
              className={cn(
                "w-full text-left p-4 rounded-lg transition-colors",
                currentLesson.id === lesson.id
                  ? "bg-primary/10 border-2 border-primary"
                  : "bg-muted hover:bg-muted/80 border-2 border-transparent",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold",
                    lesson.completed
                      ? "bg-success text-success-foreground"
                      : currentLesson.id === lesson.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground",
                  )}
                >
                  {lesson.completed ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm mb-1 line-clamp-2">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
