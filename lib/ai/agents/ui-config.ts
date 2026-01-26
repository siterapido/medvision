import { Sparkles, Microscope, GraduationCap, BookOpen, Eye, PenTool, MessageCircle, Bot, type LucideIcon } from "lucide-react"

/**
 * Configuração de UI dos agentes - cores e ícones baseados na Landing Page
 * Mantém consistência visual entre LP e Chat
 * Gradientes estilo Apple/iOS com degradê diagonal suave
 */

export interface AgentUIConfig {
    id: string
    icon: LucideIcon
    name: string
    shortName: string
    description: string
    placeholder: string
    gradient: string
    color: string
    bgColor: string
    borderColor: string
    isPro?: boolean
    hasVision?: boolean
}

export const AGENTS_UI_LIST: AgentUIConfig[] = [
    {
        id: 'odonto-gpt',
        icon: Sparkles,
        name: 'Odonto GPT',
        shortName: 'GPT',
        description: 'Assistente geral de odontologia para duvidas e estudo',
        placeholder: 'Pergunte sobre odontologia...',
        gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
        color: 'text-[#00A3FF]',
        bgColor: 'bg-[#00A3FF]/10',
        borderColor: 'border-[#00A3FF]/30',
    },
    {
        id: 'odonto-research',
        icon: Microscope,
        name: 'Pesquisa Cientifica',
        shortName: 'Research',
        description: 'Busca em bases cientificas com citacoes e evidencias',
        placeholder: 'Busque evidencias cientificas...',
        gradient: 'from-blue-500 via-cyan-500 to-teal-500',
        color: 'text-[#3B82F6]',
        bgColor: 'bg-[#3B82F6]/10',
        borderColor: 'border-[#3B82F6]/30',
        isPro: true,
    },
    {
        id: 'odonto-practice',
        icon: GraduationCap,
        name: 'Casos Clinicos',
        shortName: 'Practice',
        description: 'Pratique com casos clinicos interativos e feedback',
        placeholder: 'Pratique com casos clinicos...',
        gradient: 'from-purple-500 via-violet-500 to-fuchsia-500',
        color: 'text-[#A855F7]',
        bgColor: 'bg-[#A855F7]/10',
        borderColor: 'border-[#A855F7]/30',
        isPro: true,
    },
    {
        id: 'odonto-summary',
        icon: BookOpen,
        name: 'Resumos',
        shortName: 'Summary',
        description: 'Crie resumos, flashcards e materiais de estudo',
        placeholder: 'Crie resumos e flashcards...',
        gradient: 'from-pink-500 via-rose-500 to-red-500',
        color: 'text-[#EC4899]',
        bgColor: 'bg-[#EC4899]/10',
        borderColor: 'border-[#EC4899]/30',
    },
    {
        id: 'odonto-vision',
        icon: Eye,
        name: 'Analise de Imagens',
        shortName: 'Vision',
        description: 'Analise radiografias e imagens odontologicas',
        placeholder: 'Envie uma imagem para analise...',
        gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
        color: 'text-[#06B6D4]',
        bgColor: 'bg-[#06B6D4]/10',
        borderColor: 'border-[#06B6D4]/30',
        isPro: true,
        hasVision: true,
    },
]

export const AGENT_UI_CONFIG: Record<string, AgentUIConfig> = AGENTS_UI_LIST.reduce(
    (acc, agent) => {
        acc[agent.id] = agent
        return acc
    },
    {} as Record<string, AgentUIConfig>
)

export function getAgentUI(agentId: string): AgentUIConfig {
    return AGENT_UI_CONFIG[agentId] || {
        id: 'default',
        icon: Bot,
        name: 'Bot',
        shortName: 'Bot',
        description: 'Default assistant',
        placeholder: 'Ask me anything...',
        gradient: 'from-slate-500 to-slate-600',
        color: 'text-slate-500',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
    }
}
