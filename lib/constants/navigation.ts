import {
    Home,
    MessageCircle,
    BookOpen,
    MonitorPlay,
    Eye,
    FileBadge,
    Bell,
    History,
    LayoutDashboard,
    Bot,
    FileText,
    Calendar,
    Workflow,
    Sparkles,
    Users,
    Award
} from 'lucide-react'

export interface NavItem {
    href: string
    label: string
    icon: any // LucideIcon type is tricky to import sometimes, playing safe
    badge?: number
    shortcut?: string
}

export const NAV_ITEMS: NavItem[] = [
    { href: '/dashboard', label: 'Início', icon: Home },
    { href: '/dashboard/chat', label: 'Chat', icon: MessageCircle },
    { href: '/dashboard/biblioteca', label: 'Biblioteca', icon: BookOpen },
    { href: '/dashboard/odontoflix', label: 'OdontoFlix', icon: MonitorPlay },
    { href: '/dashboard/odonto-vision', label: 'Odonto Vision', icon: Eye },
    { href: '/dashboard/certificados', label: 'Certificados', icon: FileBadge },
    { href: '/dashboard/historico', label: 'Histórico', icon: History },
]

export const BOTTOM_NAV_ITEMS: NavItem[] = [
    { href: '/dashboard/notificacoes', label: 'Notificações', icon: Bell },
]

export const ADMIN_NAV_ITEMS: NavItem[] = [
    { href: '/admin', label: 'Visão Geral', icon: LayoutDashboard },
    { href: '/admin/cursos', label: 'Cursos', icon: BookOpen },
    { href: '/admin/materiais', label: 'Materiais', icon: FileText },
    { href: '/admin/lives', label: 'Lives', icon: Calendar },
    { href: '/admin/agentes', label: 'Agentes IA', icon: Bot },
    { href: '/admin/pipeline', label: 'Pipeline', icon: Workflow },
    { href: '/admin/trials', label: 'Trials', icon: Sparkles },
    { href: '/admin/usuarios', label: 'Usuários', icon: Users },
    { href: '/admin/certificados', label: 'Certificados Admin', icon: Award },
]
