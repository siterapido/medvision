import {
    Home,
    MessageCircle,
    Eye,
    Bell,
    History,
    LayoutDashboard,
    Bot,
    FileText,
    Users,
    Award,
    BookOpen,
    MonitorPlay,
    FileBadge
} from 'lucide-react'

export interface NavItem {
    href: string
    label: string
    icon: any // LucideIcon type is tricky to import sometimes, playing safe
    badge?: number
    shortcut?: string
    badgeText?: string
    disabled?: boolean
    hiddenForTrial?: boolean
}

export const NAV_ITEMS: NavItem[] = [
    { href: '/dashboard', label: 'Início', icon: Home },
    { href: '/dashboard/chat', label: 'Chat', icon: MessageCircle },
    {
        href: '/dashboard/biblioteca',
        label: 'Biblioteca',
        icon: BookOpen,
        badgeText: 'Em breve',
        disabled: true,
        hiddenForTrial: true,
    },
    {
        href: '/dashboard/odontoflix',
        label: 'OdontoFlix',
        icon: MonitorPlay,
        badgeText: 'Em breve',
        disabled: true,
        hiddenForTrial: true,
    },
    { href: '/dashboard/odonto-vision', label: 'Radiografia', icon: Eye },
    {
        href: '/dashboard/certificados',
        label: 'Certificados',
        icon: FileBadge,
        hiddenForTrial: true,
    },
]

export const BOTTOM_NAV_ITEMS: NavItem[] = []

export const ADMIN_NAV_ITEMS: NavItem[] = [
    { href: '/admin', label: 'Visão Geral', icon: LayoutDashboard },
    { href: '/admin/usuarios', label: 'Usuários', icon: Users },
    { href: '/admin/cursos', label: 'Cursos', icon: Award },
    { href: '/admin/materiais', label: 'Materiais', icon: FileText },
    { href: '/admin/agentes', label: 'Agentes IA', icon: Bot },
]

