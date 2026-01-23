import { Sparkles, FlaskConical, GraduationCap, FileText, ScanEye, Bot } from "lucide-react"

export const AGENT_UI_CONFIG: Record<string, { icon: any, gradient: string }> = {
    'odonto-gpt': {
        icon: Sparkles,
        gradient: 'from-[#00D4FF] via-[#00A3FF] to-[#0066FF]'
    },
    'odonto-research': {
        icon: FlaskConical,
        gradient: 'from-[#BF5AF2] via-[#9D4EDD] to-[#7B2CBF]'
    },
    'odonto-practice': {
        icon: GraduationCap,
        gradient: 'from-[#FF9F0A] via-[#FF6B35] to-[#FF453A]'
    },
    'odonto-summary': {
        icon: FileText,
        gradient: 'from-[#30D158] via-[#00C7BE] to-[#00B4D8]'
    },
    'odonto-vision': {
        icon: ScanEye,
        gradient: 'from-[#FF6B6B] via-[#EE5A70] to-[#DA4167]'
    },
}

export function getAgentUI(agentId: string) {
    return AGENT_UI_CONFIG[agentId] || { icon: Bot, gradient: 'from-slate-500 to-slate-600' }
}
