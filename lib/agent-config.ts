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
    "med-research": {
        id: "med-research",
        name: "Med Research",
        icon: Microscope,
        color: "blue",
        gradient: "from-blue-500 via-cyan-500 to-teal-500",
        ringColor: "ring-blue-500/50",
        bgGlow: "shadow-blue-500/20",
        handoffMessage: "Buscando evidências científicas...",
        description: "Encontre evidência científica médica em segundos. Busca, resume e valida artigos, guidelines e referências clínicas com precisão."
    },
    "med-practice": {
        id: "med-practice",
        name: "Med Practice",
        icon: GraduationCap,
        color: "purple",
        gradient: "from-purple-500 via-violet-500 to-fuchsia-500",
        ringColor: "ring-purple-500/50",
        bgGlow: "shadow-purple-500/20",
        handoffMessage: "Preparando casos clínicos e simulados...",
        description: "Treine para provas de residência, Revalida e concursos com simulados inteligentes. Casos clínicos comentados e foco no raciocínio diagnóstico."
    },
    "odonto-write": {
        id: "odonto-write",
        name: "Med Write",
        icon: PenTool,
        color: "emerald",
        gradient: "from-emerald-500 via-green-500 to-teal-500",
        ringColor: "ring-emerald-500/50",
        bgGlow: "shadow-emerald-500/20",
        handoffMessage: "Estruturando conteúdo acadêmico...",
        description: "Produza textos acadêmicos e documentação clínica impecáveis. Crie artigos, TCCs, resumos e relatórios com linguagem técnica correta."
    },
    "med-vision": {
        id: "med-vision",
        name: "Med Vision",
        icon: Eye,
        color: "amber",
        gradient: "from-amber-500 via-orange-500 to-red-500",
        ringColor: "ring-amber-500/50",
        bgGlow: "shadow-amber-500/20",
        handoffMessage: "Analisando radiografia ou tomografia...",
        description: "Interprete raio-X e tomografias (tórax, abdômen, membros, crânio) com apoio de IA: leitura pedagógica, achados e laudo educacional."
    },
    "medvision": {
        id: "medvision",
        name: "MedVision",
        icon: Workflow,
        color: "cyan",
        gradient: "from-cyan-500 via-blue-500 to-indigo-500",
        ringColor: "ring-cyan-500/50",
        bgGlow: "shadow-cyan-500/20",
        handoffMessage: "MedVision pensando...",
        description: "Seu assistente central de medicina e diagnóstico por imagem. Conversa amigável e acesso automático a toda a equipe de especialistas.",
        isOrchestrator: true
    },
    "med-summary": {
        id: "med-summary",
        name: "Med Summary",
        icon: Bot,
        color: "pink",
        gradient: "from-pink-500 via-rose-500 to-red-500",
        ringColor: "ring-pink-500/50",
        bgGlow: "shadow-pink-500/20",
        handoffMessage: "Criando materiais de estudo...",
        description: "Gera resumos inteligentes, flashcards e mapas mentais de medicina geral e diagnóstico por imagem."
    }
}

export function getAgentInfo(agentId?: string): AgentInfo {
    if (!agentId) return AGENT_CONFIGS["medvision"]
    // Legacy aliases
    const aliases: Record<string, string> = {
        'odonto-research': 'med-research',
        'odonto-practice': 'med-practice',
        'odonto-summary': 'med-summary',
        'odonto-vision': 'med-vision',
    }
    const resolvedId = aliases[agentId] ?? agentId
    return AGENT_CONFIGS[resolvedId] || AGENT_CONFIGS["medvision"]
}

/**
 * Mapeamento de rotas do dashboard para agentes padrão
 */
export const TAB_AGENT_MAP: Record<string, string> = {
    "/dashboard/resumos": "med-summary",
    "/dashboard/pesquisas": "med-research",
    "/dashboard/flashcards": "med-practice",
    "/dashboard/questionarios": "med-practice",
    "/dashboard/mindmaps": "med-summary",
    "/dashboard/odonto-vision": "med-vision",
    "/dashboard/escritor": "odonto-write",
    "/dashboard/imagens": "med-vision"
}

/**
 * Sugestões de prompts por agente
 */
export const AGENT_SUGGESTIONS: Record<string, string[]> = {
    "med-summary": [
        "Crie um resumo sobre pneumonia",
        "Gere flashcards de interpretação de RX de tórax",
        "Mapa mental de insuficiência cardíaca"
    ],
    "med-research": [
        "Evidências sobre nódulo pulmonar solitário",
        "Diretrizes de TC de abdômen com contraste",
        "Artigos recentes sobre achados de tórax na COVID-19"
    ],
    "med-practice": [
        "Caso clínico com RX de tórax alterado",
        "Simulado de radiologia para residência",
        "Quiz de interpretação de TC de crânio"
    ],
    "odonto-write": [
        "Estrutura de TCC sobre diagnóstico por imagem",
        "Formatar referências em ABNT",
        "Revisar artigo sobre achados radiológicos"
    ],
    "med-vision": [
        "Analisar RX de tórax PA",
        "Interpretar TC de abdômen com contraste",
        "Revisar achados em radiografia de membros"
    ],
    "medvision": [
        "Quero interpretar um raio-X",
        "Como funciona a leitura de TC de tórax?",
        "Me ajuda com meu caso clínico",
        "Questões sobre pneumonia na imagem"
    ]
}

export function getAgentSuggestions(agentId: string): string[] {
    // Legacy aliases
    const aliases: Record<string, string> = {
        'odonto-research': 'med-research',
        'odonto-practice': 'med-practice',
        'odonto-summary': 'med-summary',
        'odonto-vision': 'med-vision',
    }
    const resolvedId = aliases[agentId] ?? agentId
    return AGENT_SUGGESTIONS[resolvedId] || AGENT_SUGGESTIONS["medvision"]
}

export function getAgentForTab(pathname: string): string {
    for (const [tab, agent] of Object.entries(TAB_AGENT_MAP)) {
        if (pathname.startsWith(tab)) {
            return agent
        }
    }
    return "medvision"
}
