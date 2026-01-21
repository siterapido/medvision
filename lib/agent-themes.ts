import { 
  Bot, 
  Search, 
  PenTool, 
  Image as ImageIcon, 
  FileText, 
  ClipboardList, 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  UserRound,
  LayoutGrid,
  LucideIcon
} from "lucide-react"

export type AgentThemeColor = "blue" | "purple" | "emerald" | "amber" | "rose" | "indigo" | "cyan" | "slate"

export interface AgentTheme {
  id: string
  name: string
  icon: LucideIcon
  color: AgentThemeColor
  primaryColor: string // Hex para uso inline se necessário
  accentColor: string  // Cor de acento
  glowColor: string    // Cor para efeitos de glow
  gradient: string // Classe Tailwind de gradiente
  gradientFrom: string // Hex do início do gradiente
  gradientTo: string   // Hex do fim do gradiente
  description: string
}

export const AGENT_THEMES: Record<string, AgentTheme> = {
  "chat": {
    id: "chat",
    name: "Odonto GPT",
    icon: Bot,
    color: "cyan",
    primaryColor: "#0891b2",
    accentColor: "#06b6d4",
    glowColor: "#2399B4",
    gradient: "from-cyan-600 to-cyan-500",
    gradientFrom: "#0891b2",
    gradientTo: "#06b6d4",
    description: "Seu assistente geral de odontologia"
  },
  "pesquisas": {
    id: "pesquisas",
    name: "Pesquisas",
    icon: Search,
    color: "purple",
    primaryColor: "#8b5cf6",
    accentColor: "#a78bfa",
    glowColor: "#8b5cf6",
    gradient: "from-violet-500 to-violet-400",
    gradientFrom: "#8b5cf6",
    gradientTo: "#a78bfa",
    description: "Investigação científica profunda"
  },
  "escritor": {
    id: "escritor",
    name: "Escritor",
    icon: PenTool,
    color: "amber",
    primaryColor: "#a855f7",
    accentColor: "#c084fc",
    glowColor: "#a855f7",
    gradient: "from-purple-500 to-purple-400",
    gradientFrom: "#a855f7",
    gradientTo: "#c084fc",
    description: "Redação acadêmica e clínica"
  },
  "imagens": {
    id: "imagens",
    name: "Imagens",
    icon: ImageIcon,
    color: "rose",
    primaryColor: "#ec4899",
    accentColor: "#f472b6",
    glowColor: "#ec4899",
    gradient: "from-pink-500 to-pink-400",
    gradientFrom: "#ec4899",
    gradientTo: "#f472b6",
    description: "Geração e análise visual"
  },
  "resumos": {
    id: "resumos",
    name: "Resumos",
    icon: FileText,
    color: "emerald",
    primaryColor: "#10b981",
    accentColor: "#34d399",
    glowColor: "#10b981",
    gradient: "from-emerald-500 to-emerald-400",
    gradientFrom: "#10b981",
    gradientTo: "#34d399",
    description: "Síntese de conteúdos complexos"
  },
  "questionarios": {
    id: "questionarios",
    name: "Questionários",
    icon: ClipboardList,
    color: "indigo",
    primaryColor: "#f59e0b",
    accentColor: "#fbbf24",
    glowColor: "#f59e0b",
    gradient: "from-amber-500 to-amber-400",
    gradientFrom: "#f59e0b",
    gradientTo: "#fbbf24",
    description: "Criação de provas e testes"
  },
  "cursos": {
    id: "cursos",
    name: "Cursos",
    icon: GraduationCap,
    color: "blue",
    primaryColor: "#3b82f6",
    accentColor: "#60a5fa",
    glowColor: "#3b82f6",
    gradient: "from-blue-500 to-blue-400",
    gradientFrom: "#3b82f6",
    gradientTo: "#60a5fa",
    description: "Aprendizado contínuo"
  },
  "materiais": {
    id: "materiais",
    name: "Materiais",
    icon: BookOpen,
    color: "slate",
    primaryColor: "#64748b",
    accentColor: "#94a3b8",
    glowColor: "#64748b",
    gradient: "from-slate-500 to-slate-400",
    gradientFrom: "#64748b",
    gradientTo: "#94a3b8",
    description: "Biblioteca de recursos"
  }
}

export function getAgentTheme(path: string): AgentTheme {
  const segment = path.split('/').pop() || "chat"
  // Mapeamento simples de path para ID
  const id = Object.keys(AGENT_THEMES).find(key => path.includes(key)) || "chat"
  return AGENT_THEMES[id]
}

/**
 * Gera as variáveis CSS para um tema de agente
 */
export function getAgentCSSVars(theme: AgentTheme): Record<string, string> {
  return {
    '--agent-primary': theme.primaryColor,
    '--agent-accent': theme.accentColor,
    '--agent-glow': theme.glowColor,
    '--agent-gradient-from': theme.gradientFrom,
    '--agent-gradient-to': theme.gradientTo,
  }
}

/**
 * Retorna as classes de estilo inline para usar com style prop
 */
export function getAgentStyles(theme: AgentTheme) {
  return getAgentCSSVars(theme) as React.CSSProperties
}
