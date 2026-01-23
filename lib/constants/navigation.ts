import {
    Home,
    MessageCircle,
    BookOpen,
    MonitorPlay,
    Eye,
    FileBadge,
    Bell
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
]

export const BOTTOM_NAV_ITEMS: NavItem[] = [
    { href: '/dashboard/notificacoes', label: 'Notificações', icon: Bell },
]
