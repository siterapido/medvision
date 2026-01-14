import { Microscope, GraduationCap, PenTool, Bot } from "lucide-react"

export interface AgentInfo {
    id: string
    name: string
    icon: typeof Microscope
    color: string
    gradient: string
    description: string
}

export const AGENT_CONFIGS: Record<string, AgentInfo> = {
    "dr-ciencia": {
        id: "dr-ciencia",
        name: "Dr. Ciência",
        icon: Microscope,
        color: "blue",
        gradient: "from-blue-500 via-cyan-500 to-teal-500",
        description: "Pesquisa Científica"
    },
    "prof-estudo": {
        id: "prof-estudo",
        name: "Prof. Estudo",
        icon: GraduationCap,
        color: "purple",
        gradient: "from-purple-500 via-violet-500 to-fuchsia-500",
        description: "Questões e Simulados"
    },
    "dr-redator": {
        id: "dr-redator",
        name: "Dr. Redator",
        icon: PenTool,
        color: "emerald",
        gradient: "from-emerald-500 via-green-500 to-teal-500",
        description: "Escrita Acadêmica"
    },
    "analise-imagem": {
        id: "analise-imagem",
        name: "Análise de Imagem",
        icon: Bot,
        color: "amber",
        gradient: "from-amber-500 via-orange-500 to-red-500",
        description: "Análise de Radiografias"
    },
    default: {
        id: "default",
        name: "Odonto GPT",
        icon: Bot,
        color: "cyan",
        gradient: "from-cyan-500 via-blue-500 to-indigo-500",
        description: "Assistente Geral"
    }
}

export function getAgentInfo(agentId?: string): AgentInfo {
    if (!agentId) return AGENT_CONFIGS.default
    return AGENT_CONFIGS[agentId] || AGENT_CONFIGS.default
}
