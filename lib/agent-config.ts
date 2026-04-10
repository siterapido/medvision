import { Microscope, GraduationCap, PenTool, Bot, Eye, Workflow, FileText, MessageCircle } from "lucide-react"

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
        name: "Med Vision",
        icon: Eye,
        color: "amber",
        gradient: "from-amber-500 via-orange-500 to-red-500",
        ringColor: "ring-amber-500/50",
        bgGlow: "shadow-amber-500/20",
        handoffMessage: "Analisando radiografia ou tomografia...",
        description: "Interprete radiografias e tomografias (incluindo CBCT) com apoio de IA: leitura pedagógica, achados e laudo educacional."
    },
    "medvision": {
        id: "medvision",
        name: "MedVision",
        icon: Workflow, // Represents the Unified/Orchestrator nature
        color: "cyan",
        gradient: "from-cyan-500 via-blue-500 to-indigo-500",
        ringColor: "ring-cyan-500/50",
        bgGlow: "shadow-cyan-500/20",
        handoffMessage: "MedVision pensando...",
        description: "Seu assistente central inteligente. Conversa amigável e acesso automático a toda a equipe de especialistas quando necessário.",
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
    if (!agentId) return AGENT_CONFIGS["medvision"]
    return AGENT_CONFIGS[agentId] || AGENT_CONFIGS["medvision"]
}

/**
 * Mapeamento de rotas do dashboard para agentes padrão
 */
export const TAB_AGENT_MAP: Record<string, string> = {
    "/dashboard/resumos": "odonto-summary",
    "/dashboard/pesquisas": "odonto-research",
    "/dashboard/flashcards": "odonto-practice",
    "/dashboard/questionarios": "odonto-practice",
    "/dashboard/mindmaps": "odonto-summary",
    "/dashboard/odonto-vision": "odonto-vision",
    "/dashboard/escritor": "odonto-write",
    "/dashboard/imagens": "odonto-vision"
}

/**
 * Sugestões de prompts por agente
 */
export const AGENT_SUGGESTIONS: Record<string, string[]> = {
    "odonto-summary": [
        "Crie um resumo sobre periodontite",
        "Gere flashcards de endodontia",
        "Mapa mental de anatomia dental"
    ],
    "odonto-research": [
        "Evidências sobre clareamento dental",
        "Revisão sistemática de implantes",
        "Artigos recentes sobre periodontite"
    ],
    "odonto-practice": [
        "Questões de prótese para residência",
        "Simulado de periodontia ENADE",
        "Quiz de farmacologia odontológica"
    ],
    "odonto-write": [
        "Estrutura de TCC sobre implantes",
        "Formatar referências em ABNT",
        "Revisar artigo sobre endodontia"
    ],
    "odonto-vision": [
        "Analisar radiografia periapical ou panorâmica",
        "Interpretar corte de CBCT ou TC",
        "Revisar achados em tomografia volumétrica"
    ],
    "medvision": [
        "Quero pesquisar e criar um resumo",
        "Como funciona o tratamento de canal?",
        "Me ajuda com meu TCC",
        "Questões sobre periodontite"
    ]
}

export function getAgentSuggestions(agentId: string): string[] {
    return AGENT_SUGGESTIONS[agentId] || AGENT_SUGGESTIONS["medvision"]
}

export function getAgentForTab(pathname: string): string {
    // Find the matching tab
    for (const [tab, agent] of Object.entries(TAB_AGENT_MAP)) {
        if (pathname.startsWith(tab)) {
            return agent
        }
    }
    return "medvision"
}
