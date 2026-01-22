import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  MessageSquare,
  Library,
  GraduationCap,
  Award,
  ArrowRight,
  Sparkles,
  Search,
  BookOpen,
  Clock,
  FileText,
  PlayCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/glass-card'
import { Progress } from '@/components/ui/progress' // Assumindo que existe ou vou usar div simples se não existir

interface QuickActionCard {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const quickActions: QuickActionCard[] = [
  {
    title: 'Nova Conversa',
    description: 'Assistente Clínico IA',
    href: '/dashboard/chat',
    icon: Sparkles,
    badge: 'Pro',
  },
  {
    title: 'Biblioteca',
    description: 'Meus protocolos',
    href: '/dashboard/biblioteca',
    icon: Library,
  },
  {
    title: 'OdontoFlix',
    description: 'Aulas e cursos',
    href: '/dashboard/odontoflix',
    icon: GraduationCap,
  },
  {
    title: 'Certificados',
    description: 'Minhas conquistas',
    href: '/dashboard/certificados',
    icon: Award,
  },
]

// Mock data para "Últimos Artefatos" - Futuramente virá do DB
const recentArtifacts = [
  { id: 1, title: 'Protocolo de Clareamento', type: 'Protocolo', date: 'Há 2h' },
  { id: 2, title: 'Resumo Endodontia Molar', type: 'Resumo', date: 'Ontem' },
  { id: 3, title: 'Lista de Materiais Cirurgia', type: 'Checklist', date: '2 dias atrás' },
]

// Mock data para "Curso em Progresso"
const currentCourse = {
  title: 'Tomografia Computadorizada',
  module: 'Análise de Molares Superiores',
  progress: 65,
  totalModules: 12,
  completedModules: 7
}

export default async function NewDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] || 'Doutor(a)'

  const hours = new Date().getHours()
  const greeting = hours < 12 ? 'Bom dia' : hours < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="min-h-screen pb-32 md:pb-10 pt-6 px-4 md:px-8 max-w-6xl mx-auto animate-in fade-in duration-500">

      {/* Mobile-First Header */}
      <header className="mb-10 space-y-4 text-center md:text-left">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-medium tracking-tight text-foreground">
            {greeting}, <span className="text-muted-foreground">{firstName}</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            O que vamos aprender ou pesquisar hoje?
          </p>
        </div>

        {/* Search Input Fake (Navigation) */}
        <Link href="/dashboard/chat" className="block mt-8 group max-w-2xl">
          <div className="relative w-full h-14 bg-muted/40 border border-border/50 rounded-full flex items-center px-6 transition-all duration-300 group-hover:border-primary/30 group-hover:bg-muted/60 group-hover:shadow-[0_0_30px_-10px_rgba(var(--primary-rgb),0.2)]">
            <Search className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="ml-4 text-muted-foreground/60 text-lg font-light group-hover:text-foreground transition-colors">
              Perguntar ao Odonto GPT...
            </span>
            <div className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-background/50 flex items-center justify-center border border-border/50 group-hover:scale-105 transition-transform">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </Link>
      </header>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Quick Actions & Highlights (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Quick Actions Grid */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">Acesso Rápido</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href} className="group block h-full">
                  <GlassCard className="h-full p-0 overflow-hidden hover:border-primary/20 transition-all duration-300 group-hover:-translate-y-1">
                    <div className="p-5 flex items-start gap-4 h-full">
                      <div className="h-12 w-12 shrink-0 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <action.icon className="h-6 w-6 stroke-[1.5] text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-medium text-foreground">{action.title}</h3>
                          {action.badge && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider border border-primary/10">
                              {action.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-snug">{action.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all mt-1" />
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </section>

          {/* Featured / Suggestion */}
          <section>
            <GlassCard variant="gradient" className="p-6 relative overflow-hidden group border-primary/10">
              <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -z-10 transition-opacity group-hover:opacity-75" />

              <div className="flex flex-col sm:flex-row gap-6 items-start z-10">
                <div className="flex-1 space-y-3">
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                    <Sparkles className="h-3 w-3" />
                    <span>Novidade na IA</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-semibold text-foreground mb-2">Análise de Radiografias</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                      Agora você pode enviar imagens de raios-x diretamente no chat para obter uma segunda opinião baseada em IA sobre possíveis patologias.
                    </p>
                  </div>
                  <Link href="/dashboard/chat" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-2">
                    Experimentar agora <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
                <div className="hidden sm:flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-background/50 border border-border/50 backdrop-blur-sm">
                  <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                </div>
              </div>
            </GlassCard>
          </section>

        </div>

        {/* Right Column: Widgets (1/3 width on large screens) */}
        <div className="space-y-6 lg:border-l lg:border-border/30 lg:pl-8">

          {/* Continue Learning Widget */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Em Progresso</h2>
              <Link href="/dashboard/odontoflix" className="text-xs text-primary hover:underline">Ver tudo</Link>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card p-4 space-y-4 hover:bg-muted/5 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-cover bg-center shrink-0 border border-border/50 bg-muted flex items-center justify-center">
                  <PlayCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-sm font-medium text-foreground truncate">{currentCourse.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{currentCourse.module}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{currentCourse.progress}% concluído</span>
                  <span>{currentCourse.completedModules}/{currentCourse.totalModules} módulos</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${currentCourse.progress}%` }} />
                </div>
              </div>
              <button className="w-full py-2 text-xs font-medium text-center border border-border/50 rounded-lg hover:bg-muted transition-colors">
                Continuar Assistindo
              </button>
            </div>
          </section>

          {/* Recent Artifacts Widget */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recentes</h2>
              <Link href="/dashboard/biblioteca" className="text-xs text-primary hover:underline">Biblioteca</Link>
            </div>
            <div className="space-y-3">
              {recentArtifacts.map((artifact) => (
                <Link key={artifact.id} href={`/dashboard/biblioteca?id=${artifact.id}`} className="block group">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-border/40 hover:bg-muted/10 transition-all">
                    <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 border border-border/30 group-hover:border-primary/20 group-hover:text-primary transition-colors">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{artifact.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{artifact.type}</span>
                        <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50" />
                        <span>{artifact.date}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              <Link href="/dashboard/biblioteca" className="block text-center py-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/40 rounded-xl hover:bg-muted/5 transition-colors">
                Ver todos os arquivos
              </Link>
            </div>
          </section>

        </div>

      </div>

    </div>
  )
}
