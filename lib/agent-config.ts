import { Microscope, GraduationCap, PenTool, Bot, Eye, Workflow, FileText } from "lucide-react"

export interface AgentInfo {
    id: string
    name: string
    icon: typeof Microscope
    color: string
    gradient: string
    description: string
    ringColor: string
    bgGlow: string
    handoffMessage: string
    isOrchestrator?: boolean
}

export const AGENT_CONFIGS: Record<string, AgentInfo> = {
    "odonto-research": {
        id: "odonto-research",
        name: "Odonto Research",
        icon: Microscope,
        color: "blue",
        gradient: "from-blue-500 via-cyan-500 to-teal-500",
        ringColor: "ring-blue-500/50",
        bgGlow: "shadow-blue-500/20",
        handoffMessage: "Buscando evidências científicas...",
        description: "Encontre evidência científica odontológica em segundos. Busca, resume e valida artigos, guidelines e referências clínicas com precisão."
    },
    "odonto-practice": {
        id: "odonto-practice",
        name: "Odonto Practice",
        icon: GraduationCap,
        color: "purple",
        gradient: "from-purple-500 via-violet-500 to-fuchsia-500",
        ringColor: "ring-purple-500/50",
        bgGlow: "shadow-purple-500/20",
        handoffMessage: "Preparando questões e simulados...",
        description: "Treine para provas, concursos e residência com simulados inteligentes. Questões comentadas, repetição adaptativa e foco no que precisa melhorar."
    },
    "odonto-write": {
        id: "odonto-write",
        name: "Odonto Write",
        icon: PenTool,
        color: "emerald",
        gradient: "from-emerald-500 via-green-500 to-teal-500",
        ringColor: "ring-emerald-500/50",
        bgGlow: "shadow-emerald-500/20",
        handoffMessage: "Estruturando conteúdo acadêmico...",
        description: "Produza textos acadêmicos e documentação clínica impecáveis. Crie artigos, TCCs, resumos e relatórios com linguagem técnica correta."
    },
    "odonto-vision": {
        id: "odonto-vision",
        name: "Odonto Vision",
        icon: Eye,
        color: "amber",
        gradient: "from-amber-500 via-orange-500 to-red-500",
        ringColor: "ring-amber-500/50",
        bgGlow: "shadow-amber-500/20",
        handoffMessage: "Analisando imagem odontológica...",
        description: "Interprete radiografias e imagens odontológicas com apoio de IA. Auxílio na leitura clínica, identificação de padrões e geração de laudos."
    },
    "odonto-flow": {
        id: "odonto-flow",
        name: "Odonto Flow",
        icon: Workflow,
        color: "cyan",
        gradient: "from-cyan-500 via-blue-500 to-indigo-500",
        ringColor: "ring-cyan-500/50",
        bgGlow: "shadow-cyan-500/20",
        handoffMessage: "Analisando sua solicitação...",
        description: "Central inteligente que entende a necessidade do usuário e ativa o módulo certo automaticamente.",
        isOrchestrator: true
    },
    "odonto-summary": {
        id: "odonto-summary",
        name: "Odonto Summary",
        icon: Bot,
        color: "pink",
        gradient: "from-pink-500 via-rose-500 to-red-500",
        ringColor: "ring-pink-500/50",
        bgGlow: "shadow-pink-500/20",
        handoffMessage: "Criando materiais de estudo...",
        description: "Gera resumos inteligentes, flashcards e mapas mentais a partir de tópicos odontológicos."
    }
}

export function getAgentInfo(agentId?: string): AgentInfo {
    if (!agentId) return AGENT_CONFIGS["odonto-flow"]
    return AGENT_CONFIGS[agentId] || AGENT_CONFIGS["odonto-flow"]
}

