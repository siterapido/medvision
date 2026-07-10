import {
  Eye,
  LayoutDashboard,
  Bot,
  Users,
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

/** Rota canônica da ferramenta Med Vision (alias: `/dashboard/med-vision`). */
export const MED_VISION_HREF = "/dashboard/odonto-vision" as const

/** Navegação do app: ferramenta principal Med Vision (imagens). */
export const NAV_ITEMS: NavItem[] = [
  { href: MED_VISION_HREF, label: "Med Vision", icon: Eye },
  { href: "/dashboard/laudos", label: "Laudos", icon: ScanText },
]

export const BOTTOM_NAV_ITEMS: NavItem[] = []

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/agentes", label: "Agentes IA", icon: Bot },
]
