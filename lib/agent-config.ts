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
    "odonto-research": {
        id: "odonto-research",
        name: "Odonto Research",
        icon: Microscope,
        color: "blue",
        gradient: "from-blue-500 via-cyan-500 to-teal-500",
        description: "Encontre evidência científica odontológica em segundos. Busca, resume e valida artigos, guidelines e referências clínicas com precisão."
    },
    "odonto-practice": {
        id: "odonto-practice",
        name: "Odonto Practice",
        icon: GraduationCap,
        color: "purple",
        gradient: "from-purple-500 via-violet-500 to-fuchsia-500",
        description: "Treine para provas, concursos e residência com simulados inteligentes. Questões comentadas, repetição adaptativa e foco no que precisa melhorar."
    },
    "odonto-write": {
        id: "odonto-write",
        name: "Odonto Write",
        icon: PenTool,
        color: "emerald",
        gradient: "from-emerald-500 via-green-500 to-teal-500",
        description: "Produza textos acadêmicos e documentação clínica impecáveis. Crie artigos, TCCs, resumos e relatórios com linguagem técnica correta."
    },
    "odonto-vision": {
        id: "odonto-vision",
        name: "Odonto Vision",
        icon: Bot,
        color: "amber",
        gradient: "from-amber-500 via-orange-500 to-red-500",
        description: "Interprete radiografias e imagens odontológicas com apoio de IA. Auxílio na leitura clínica, identificação de padrões e geração de laudos."
    },
    "odonto-flow": {
        id: "odonto-flow",
        name: "Odonto Flow",
        icon: Bot,
        color: "cyan",
        gradient: "from-cyan-500 via-blue-500 to-indigo-500",
        description: "Central inteligente que entende a necessidade do usuário e ativa o módulo certo automaticamente."
    }
}

export function getAgentInfo(agentId?: string): AgentInfo {
    if (!agentId) return AGENT_CONFIGS["odonto-flow"]
    return AGENT_CONFIGS[agentId] || AGENT_CONFIGS["odonto-flow"]
}
