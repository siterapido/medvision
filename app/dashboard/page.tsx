import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { 
  MessageSquare, 
  Library, 
  GraduationCap, 
  Award,
  ArrowRight,
  Sparkles,
  Clock,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionCard {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  badge?: string
}

const quickActions: QuickActionCard[] = [
  {
    title: 'Chat IA',
    description: 'Converse com a IA especializada em odontologia',
    href: '/dashboard/chat',
    icon: MessageSquare,
    gradient: 'from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20',
    badge: 'IA',
  },
  {
    title: 'Biblioteca',
    description: 'Acesse materiais e recursos de estudo',
    href: '/dashboard/biblioteca',
    icon: Library,
    gradient: 'from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20',
  },
  {
    title: 'Cursos',
    description: 'Explore cursos e trilhas de aprendizado',
    href: '/dashboard/cursos',
    icon: GraduationCap,
    gradient: 'from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20',
  },
  {
    title: 'Certificados',
    description: 'Veja seus certificados e conquistas',
    href: '/dashboard/certificados',
    icon: Award,
    gradient: 'from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20',
  },
]

export default async function NewDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 
                    user?.email?.split('@')[0] || 
                    'Usuario'

  // Get current hour for greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          <Clock className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {greeting}, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          O que voce gostaria de fazer hoje?
        </p>
      </header>

      {/* Quick Actions Grid */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Acesso Rapido
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                'group relative p-5 rounded-xl border border-border',
                'bg-gradient-to-br transition-all duration-300',
                'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5',
                'hover:-translate-y-0.5',
                action.gradient
              )}
            >
              {action.badge && (
                <span className="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                  {action.badge}
                </span>
              )}
              
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-background border border-border mb-4 group-hover:border-primary/50 transition-colors">
                <action.icon className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
              </div>
              
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
              
              <div className="mt-4 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Acessar</span>
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity / Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Continue Aprendendo
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Comece uma nova conversa
                </span>
                <span className="text-xs text-muted-foreground">Novo</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Use o chat IA para tirar duvidas, criar resumos ou gerar flashcards
              </p>
              <Link
                href="/dashboard/chat"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Iniciar conversa
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Seu Progresso
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Conversas</span>
              <span className="text-sm font-medium text-foreground">0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Resumos criados</span>
              <span className="text-sm font-medium text-foreground">0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Flashcards</span>
              <span className="text-sm font-medium text-foreground">0</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Certificados</span>
              <span className="text-sm font-medium text-foreground">0</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
