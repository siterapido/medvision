export interface DocSection {
  id: string
  label: string
  icon: string
  description: string
}

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'visao-geral',
    label: 'Visão Geral',
    icon: 'Layers',
    description: 'Projeto, tech stack e versão atual',
  },
  {
    id: 'arquitetura',
    label: 'Arquitetura',
    icon: 'GitBranch',
    description: 'Estrutura do sistema e camadas',
  },
  {
    id: 'funcionalidades',
    label: 'Funcionalidades',
    icon: 'Sparkles',
    description: 'Features core e em desenvolvimento',
  },
  {
    id: 'banco-de-dados',
    label: 'Banco de Dados',
    icon: 'Database',
    description: 'Tabelas, schemas e storage',
  },
  {
    id: 'autenticacao',
    label: 'Auth & Autorização',
    icon: 'Shield',
    description: 'Fluxo de auth e controle de acesso',
  },
  {
    id: 'apis-integracoes',
    label: 'APIs & Integrações',
    icon: 'Plug',
    description: 'Rotas internas e serviços externos',
  },
  {
    id: 'ambiente-dev',
    label: 'Ambiente de Dev',
    icon: 'Terminal',
    description: 'Scripts, env vars e configuração local',
  },
  {
    id: 'deploy',
    label: 'Deploy & Produção',
    icon: 'Rocket',
    description: 'Vercel, configurações e monitoramento',
  },
]
