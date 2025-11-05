import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const courses = [
  {
    id: "1",
    title: "Implantodontia Básica",
    description: "Fundamentos e técnicas essenciais de implantodontia",
    thumbnail: "/placeholder.svg?height=200&width=400",
    progress: 75,
    lessons: 12,
    duration: "8h 30min",
  },
  {
    id: "2",
    title: "Endodontia Avançada",
    description: "Técnicas modernas de tratamento de canal",
    thumbnail: "/placeholder.svg?height=200&width=400",
    progress: 45,
    lessons: 15,
    duration: "10h 15min",
  },
  {
    id: "3",
    title: "Ortodontia Digital",
    description: "Planejamento ortodôntico com tecnologia digital",
    thumbnail: "/placeholder.svg?height=200&width=400",
    progress: 100,
    lessons: 10,
    duration: "6h 45min",
  },
  {
    id: "4",
    title: "Periodontia Clínica",
    description: "Diagnóstico e tratamento de doenças periodontais",
    thumbnail: "/placeholder.svg?height=200&width=400",
    progress: 0,
    lessons: 14,
    duration: "9h 20min",
  },
  {
    id: "5",
    title: "Prótese Dentária",
    description: "Reabilitação oral com próteses fixas e removíveis",
    thumbnail: "/placeholder.svg?height=200&width=400",
    progress: 30,
    lessons: 18,
    duration: "12h 00min",
  },
  {
    id: "6",
    title: "Odontopediatria",
    description: "Atendimento odontológico infantil especializado",
    thumbnail: "/placeholder.svg?height=200&width=400",
    progress: 0,
    lessons: 11,
    duration: "7h 30min",
  },
]

export default function CursosPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Meus Cursos</h1>
        <p className="text-muted-foreground">Continue seu aprendizado e desenvolva suas habilidades</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Badge
          variant="outline"
          className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Todos
        </Badge>
        <Badge
          variant="outline"
          className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Em Progresso
        </Badge>
        <Badge
          variant="outline"
          className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Concluídos
        </Badge>
        <Badge
          variant="outline"
          className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Não Iniciados
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link key={course.id} href={`/dashboard/cursos/${course.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={course.thumbnail || "/placeholder.svg"}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {course.progress > 0 && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-primary text-primary-foreground">{course.progress}%</Badge>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    {course.lessons} aulas
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {course.duration}
                  </span>
                </div>
                {course.progress > 0 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
