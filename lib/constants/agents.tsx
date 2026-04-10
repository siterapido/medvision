import {
  Sparkles, Microscope, GraduationCap, BookOpen, Eye, PenTool, MessageCircle
} from "lucide-react"
import React from "react"

export interface AgentUIConfig {
  id: string
  icon: React.ReactNode
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
    id: 'medvision',
    icon: <Sparkles className="w-4 h-4" />,
    name: 'MedVision',
    shortName: 'GPT',
    description: 'Assistente para diagnóstico por imagem e estudo em RX/tomografia',
    placeholder: 'Pergunte sobre interpretação de imagens...',
    color: 'cyan',
    bgColor: 'bg-[#00A3FF]/10',
    borderColor: 'border-[#00A3FF]',
    textColor: 'text-[#00A3FF]',
    primaryHex: '#00A3FF',
    bgHex: 'rgba(0, 163, 255, 0.1)',
  },
  {
    id: 'odonto-research',
    icon: <Microscope className="w-4 h-4" />,
    name: 'Pesquisa Cientifica',
    shortName: 'Research',
    description: 'Busca em bases cientificas com citacoes e evidencias',
    placeholder: 'Busque evidencias cientificas...',
    color: 'cyan',
    bgColor: 'bg-[#00A3FF]/10',
    borderColor: 'border-[#00A3FF]',
    textColor: 'text-[#00A3FF]',
    primaryHex: '#00A3FF',
    bgHex: 'rgba(0, 163, 255, 0.1)',
    isPro: true,
  },
  {
    id: 'odonto-practice',
    icon: <GraduationCap className="w-4 h-4" />,
    name: 'Casos Clinicos',
    shortName: 'Practice',
    description: 'Pratique com casos clinicos interativos e feedback',
    placeholder: 'Pratique com casos clinicos...',
    color: 'purple',
    bgColor: 'bg-[#A855F7]/10',
    borderColor: 'border-[#A855F7]',
    textColor: 'text-[#A855F7]',
    primaryHex: '#A855F7',
    bgHex: 'rgba(168, 85, 247, 0.1)',
    isPro: true,
  },
  {
    id: 'odonto-summary',
    icon: <BookOpen className="w-4 h-4" />,
    name: 'Resumos',
    shortName: 'Summary',
    description: 'Crie resumos, flashcards e materiais de estudo',
    placeholder: 'Crie resumos e flashcards...',
    color: 'pink',
    bgColor: 'bg-[#EC4899]/10',
    borderColor: 'border-[#EC4899]',
    textColor: 'text-[#EC4899]',
    primaryHex: '#EC4899',
    bgHex: 'rgba(236, 72, 153, 0.1)',
  },
  {
    id: 'odonto-vision',
    icon: <Eye className="w-4 h-4" />,
    name: 'Analise de Imagens',
    shortName: 'Vision',
    description: 'Analise radiografias e tomografias com apoio pedagógico',
    placeholder: 'Envie uma radiografia ou corte de tomografia...',
    color: 'blue',
    bgColor: 'bg-[#06B6D4]/10',
    borderColor: 'border-[#06B6D4]',
    textColor: 'text-[#06B6D4]',
    primaryHex: '#06B6D4',
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
