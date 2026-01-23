import type { ArtifactType } from '@/lib/artifacts/definitions'

export interface AgentArtifactConfig {
  primaryArtifact: ArtifactType
  supportedArtifacts: ArtifactType[]
  color: string
  gradient: string
  streamingLabels: Record<string, string>
}

export const AGENT_ARTIFACT_CONFIG: Record<string, AgentArtifactConfig> = {
  'odonto-gpt': {
    primaryArtifact: 'summary',
    supportedArtifacts: ['summary', 'flashcards'],
    color: '#00D4FF',
    gradient: 'from-cyan-500 to-blue-500',
    streamingLabels: {
      loading: 'Preparando material...',
      processing: 'Criando conteúdo...',
      complete: 'Concluído!'
    }
  },
  'odonto-research': {
    primaryArtifact: 'research',
    supportedArtifacts: ['research'],
    color: '#BF5AF2',
    gradient: 'from-purple-500 to-violet-500',
    streamingLabels: {
      loading: 'Iniciando pesquisa...',
      searching: 'Buscando evidências...',
      analyzing: 'Analisando fontes...',
      complete: 'Dossiê pronto!'
    }
  },
  'odonto-practice': {
    primaryArtifact: 'quiz',
    supportedArtifacts: ['quiz'],
    color: '#FF9F0A',
    gradient: 'from-orange-500 to-amber-500',
    streamingLabels: {
      loading: 'Preparando simulado...',
      processing: 'Gerando questões...',
      complete: 'Simulado pronto!'
    }
  },
  'odonto-summary': {
    primaryArtifact: 'summary',
    supportedArtifacts: ['summary', 'flashcards'],
    color: '#30D158',
    gradient: 'from-green-500 to-emerald-500',
    streamingLabels: {
      loading: 'Analisando conteúdo...',
      processing: 'Criando resumo...',
      complete: 'Material pronto!'
    }
  },
  'odonto-vision': {
    primaryArtifact: 'report',
    supportedArtifacts: ['report'],
    color: '#FF6B6B',
    gradient: 'from-red-500 to-rose-500',
    streamingLabels: {
      loading: 'Recebendo imagem...',
      analyzing: 'Analisando estruturas...',
      complete: 'Laudo finalizado!'
    }
  }
} as const

export function getAgentArtifactConfig(agentId: string): AgentArtifactConfig {
  return AGENT_ARTIFACT_CONFIG[agentId] || AGENT_ARTIFACT_CONFIG['odonto-gpt']
}

export function canGenerateArtifact(agentId: string, artifactType: ArtifactType): boolean {
  const config = AGENT_ARTIFACT_CONFIG[agentId]
  if (!config) return false
  return config.supportedArtifacts.includes(artifactType)
}
