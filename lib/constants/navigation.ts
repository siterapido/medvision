import {
  Eye,
  LayoutDashboard,
  Bot,
  FileText,
  Users,
  Award,
  ScanText,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: any
  badge?: number
  shortcut?: string
  badgeText?: string
  disabled?: boolean
  hiddenForTrial?: boolean
}

/** Navegação do app: ferramenta principal Med Vision (imagens). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/odonto-vision", label: "Med Vision", icon: Eye },
  { href: "/dashboard/laudos", label: "Laudos", icon: ScanText },
]

export const BOTTOM_NAV_ITEMS: NavItem[] = []

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/cursos", label: "Cursos", icon: Award },
  { href: "/admin/materiais", label: "Materiais", icon: FileText },
  { href: "/admin/agentes", label: "Agentes IA", icon: Bot },
]
