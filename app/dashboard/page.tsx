import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Bem-vindo ao Odonto GPT</h1>
        <p className="text-muted-foreground">Sua plataforma completa de IA e educação odontológica</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/chat">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Chat de IA</h3>
                <p className="text-sm text-muted-foreground">Tire dúvidas clínicas com inteligência artificial</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/cursos">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Cursos</h3>
                <p className="text-sm text-muted-foreground">Acesse vídeo-aulas e materiais educativos</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/pricing">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-secondary">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Planos</h3>
                <p className="text-sm text-muted-foreground">Faça upgrade e desbloqueie recursos premium</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Atividade Recente</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nova conversa no chat</p>
                <p className="text-xs text-muted-foreground">Há 2 horas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Aula concluída: Implantodontia Básica</p>
                <p className="text-xs text-muted-foreground">Há 1 dia</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-secondary"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Certificado gerado</p>
                <p className="text-xs text-muted-foreground">Há 3 dias</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Seu Progresso</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Cursos Concluídos</span>
                <span className="text-muted-foreground">3 de 10</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "30%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Conversas no Chat</span>
                <span className="text-muted-foreground">47 mensagens</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: "65%" }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
