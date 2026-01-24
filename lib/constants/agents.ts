/**
 * Agent UI Configuration
 *
 * Extended agent configuration for mobile interface.
 * Colors match the landing page agent cards.
 */

export interface AgentUIConfig {
  id: string
  icon: string
  name: string
  shortName: string
  description: string
  placeholder: string
  // Tailwind color classes
  color: string           // Primary color class (e.g., "cyan")
  bgColor: string         // Background color class
  borderColor: string     // Border color class
  textColor: string       // Text color class
  // Hex values for inline styles
  primaryHex: string
  bgHex: string
  // Features
  isPro?: boolean
  hasVision?: boolean
}

export const AGENTS_UI: AgentUIConfig[] = [
  {
    id: 'odonto-gpt',
    icon: '🦷',
    name: 'Odonto GPT',
    shortName: 'GPT',
    description: 'Assistente geral de odontologia para duvidas e estudo',
    placeholder: 'Pergunte sobre odontologia...',
    color: 'cyan',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500',
    textColor: 'text-cyan-500',
    primaryHex: '#06b6d4',
    bgHex: 'rgba(6, 182, 212, 0.1)',
  },
  {
    id: 'odonto-research',
    icon: '🔬',
    name: 'Pesquisa Cientifica',
    shortName: 'Research',
    description: 'Busca em bases cientificas com citacoes e evidencias',
    placeholder: 'Busque evidencias cientificas...',
    color: 'blue',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-500',
    primaryHex: '#3b82f6',
    bgHex: 'rgba(59, 130, 246, 0.1)',
    isPro: true,
  },
  {
    id: 'odonto-practice',
    icon: '📋',
    name: 'Casos Clinicos',
    shortName: 'Practice',
    description: 'Pratique com casos clinicos interativos e feedback',
    placeholder: 'Pratique com casos clinicos...',
    color: 'purple',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-500',
    primaryHex: '#a855f7',
    bgHex: 'rgba(168, 85, 247, 0.1)',
    isPro: true,
  },
  {
    id: 'odonto-summary',
    icon: '📝',
    name: 'Resumos',
    shortName: 'Summary',
    description: 'Crie resumos, flashcards e materiais de estudo',
    placeholder: 'Crie resumos e flashcards...',
    color: 'pink',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500',
    textColor: 'text-pink-500',
    primaryHex: '#ec4899',
    bgHex: 'rgba(236, 72, 153, 0.1)',
  },
  {
    id: 'odonto-vision',
    icon: '👁️',
    name: 'Analise de Imagens',
    shortName: 'Vision',
    description: 'Analise radiografias e imagens odontologicas',
    placeholder: 'Envie uma imagem para analise...',
    color: 'cyan',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500',
    textColor: 'text-cyan-500',
    primaryHex: '#06b6d4',
    bgHex: 'rgba(6, 182, 212, 0.1)',
    isPro: true,
    hasVision: true,
  },
]

// Helper to get agent config by ID
export function getAgentUI(agentId: string): AgentUIConfig {
  return AGENTS_UI.find((a) => a.id === agentId) || AGENTS_UI[0]
}

// Get color classes for an agent
export function getAgentColorClasses(agentId: string) {
  const agent = getAgentUI(agentId)
  return {
    bg: agent.bgColor,
    border: agent.borderColor,
    text: agent.textColor,
  }
}
