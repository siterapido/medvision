import { ElementType } from "react"
import { Bot, FlaskConical, GraduationCap, FileText, ScanEye, Sparkles } from "lucide-react"

export interface AgentUIConfig {
    icon: ElementType
    gradient: string
    color: string
}

export const AGENT_UI_CONFIG: Record<string, AgentUIConfig> = {
    'odonto-gpt': {
        icon: Sparkles,
        gradient: 'from-[#00D4FF] via-[#00A3FF] to-[#0066FF]',
        color: '#00D4FF'
    },
    'odonto-research': {
        icon: FlaskConical,
        gradient: 'from-[#BF5AF2] via-[#9D4EDD] to-[#7B2CBF]',
        color: '#BF5AF2'
    },
    'odonto-practice': {
        icon: GraduationCap,
        gradient: 'from-[#FF9F0A] via-[#FF6B35] to-[#FF453A]',
        color: '#FF9F0A'
    },
    'odonto-summary': {
        icon: FileText,
        gradient: 'from-[#30D158] via-[#00C7BE] to-[#00B4D8]',
        color: '#30D158'
    },
    'odonto-vision': {
        icon: ScanEye,
        gradient: 'from-[#FF6B6B] via-[#EE5A70] to-[#DA4167]',
        color: '#FF6B6B'
    },
    'default': {
        icon: Bot,
        gradient: 'from-slate-500 to-slate-600',
        color: '#64748b'
    }
}

export function getAgentUI(agentId: string): AgentUIConfig {
    return AGENT_UI_CONFIG[agentId] || AGENT_UI_CONFIG['default']
}

import { AGENT_CONFIGS } from './config'

export const AGENTS_UI_LIST = Object.values(AGENT_CONFIGS).map(agent => ({
    ...agent,
    ...(AGENT_UI_CONFIG[agent.id] || AGENT_UI_CONFIG['default']),
    // Default styling properties required by mobile-agent-selector-sheet
    borderColor: 'border-primary/50',
    bgColor: 'bg-primary/5',
    textColor: 'text-primary',
    isPro: true
}))
