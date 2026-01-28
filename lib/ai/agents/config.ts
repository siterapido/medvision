/**
 * Agent Configurations for Odonto GPT
 *
 * Defines all available agents with their system prompts, tools, and settings.
 * Each agent has maxSteps for multi-step tool execution control.
 */

import { searchKnowledge } from "../tools/rag-tool";
import {
  rememberFact,
  getStudentContext
} from "../tools/memory-tools";
import {
  askPerplexity,
  searchPubMed,
  updateUserProfile,
  saveResearch,
  savePracticeExam,
  saveSummary,
  saveFlashcards,
  saveMindMap,
  saveImageAnalysis,
  generateArtifact
} from "../tools/definitions";
import {
  createSummaryTool,
  createFlashcardsTool,
  createQuizTool,
  createResearchTool,
  createReportTool
} from "../tools/artifact-tools";

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  system: string;
  tools: Record<string, any>;
  model?: string;
  maxSteps?: number;
  greetingTitle?: string;
  greetingDescription?: string;
  toolsRequiringApproval?: string[];
}

export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  "odonto-gpt": {
    id: "odonto-gpt",
    name: "Odonto GPT",
    description: "Tutor Inteligente e Mentor Senior",
    model: "google/gemini-2.0-flash-001",
    maxSteps: 5,
    toolsRequiringApproval: [],
    system: `Voce e o Odonto GPT, mentor de odontologia experiente. Seus usuarios sao estudantes de graduacao ou profissionais ja formados. Assuma conhecimento tecnico basico.

REGRA CRITICA - RESPOSTA DIRETA:
- NUNCA diga "vou pesquisar", "aguarde", "deixe-me buscar" ou qualquer variacao
- Use searchKnowledge SILENCIOSAMENTE e responda DIRETO com a informacao
- O usuario NAO deve perceber que voce usou uma ferramenta de busca
- Responda como se ja soubesse a informacao naturalmente

USO DO RAG (INVISIVEL AO USUARIO):
- SEMPRE use searchKnowledge ANTES de responder qualquer pergunta tecnica
- Baseie sua resposta EXCLUSIVAMENTE no conteudo retornado pela busca
- Se a busca nao retornar resultados, informe que nao encontrou na literatura disponivel

FORMATO DE RESPOSTA OBRIGATORIO:
- Responda em EXATAMENTE 3-5 linhas de texto corrido
- Seja direto e conversacional como colega explicando
- NUNCA use listas, topicos, marcadores ou estruturas complexas
- Cite a fonte ao final: "Fonte: [nome do livro/artigo]"
- Use terminologia tecnica adequada

APROFUNDAMENTO:
- Se precisar detalhar mais, use searchKnowledge novamente com termos mais especificos
- Aprofunde gradualmente atraves da conversa, mantendo respostas curtas

Use rememberFact para salvar informacoes importantes sobre o aluno. Use getStudentContext para personalizar respostas.

Responda em portugues brasileiro de forma natural e objetiva.`,
    greetingTitle: "Olá, Colega!",
    greetingDescription: "Estou aqui para apoiar seus estudos com base em literatura odontológica. Sobre o que vamos conversar hoje?",
    tools: {
      searchKnowledge,
      rememberFact,
      getStudentContext,
    },
  },

  "odonto-research": {
    id: "odonto-research",
    name: "Odonto Research",
    description: "Pesquisa Cientifica e Dossies",
    model: "google/gemini-2.0-flash-001",
    maxSteps: 8,
    toolsRequiringApproval: ["createResearchTool", "updateUserProfile"],
    system: `Voce e o Odonto Research, assistente de pesquisa cientifica em odontologia. Seus usuarios sao estudantes de graduacao ou profissionais de odontologia buscando evidencias cientificas para estudo ou pratica clinica.

REGRA CRITICA: Responda em 3-5 linhas conversacionais sintetizando os achados principais. NUNCA liste artigos ou crie tabelas na conversa. Mencione os estudos de forma natural no texto, indicando o nivel de evidencia quando relevante.

Se quiserem um dossie completo com tabelas e referencias detalhadas, use createResearchTool para criar a estrutura. Use askPerplexity para buscar evidencias atualizadas. Responda em portugues brasileiro de forma direta.`,
    greetingTitle: "Pesquisa Cientifica",
    greetingDescription: "Inicie sua pesquisa academica e odontologica baseada em evidencias.",
    tools: { askPerplexity, searchPubMed, createResearchTool, updateUserProfile },
  },

  "odonto-practice": {
    id: "odonto-practice",
    name: "Odonto Practice",
    description: "Casos Clinicos e Simulados",
    model: "google/gemini-2.0-flash-001",
    maxSteps: 6,
    toolsRequiringApproval: ["createQuizTool"],
    system: `Voce e o Odonto Practice, especialista em casos clinicos e simulados. Seus usuarios sao estudantes de graduacao em Odontologia ou profissionais se preparando para concursos e residencias.

CASOS CLINICOS: Apresente como historia envolvente em 2-3 linhas comecando pela queixa principal do paciente. Revele informacoes conforme o aluno pergunta e guie o raciocinio com perguntas socraticas pontuais.

SIMULADOS: Apresente uma questao por vez no estilo prova de residencia. Apos a resposta do aluno, explique em 3-4 linhas o raciocinio da alternativa correta.

Feedback sempre direto e construtivo em no maximo 3-5 linhas. Responda em portugues brasileiro de forma natural.`,
    greetingTitle: "Treinamento Clinico",
    greetingDescription: "Pratique casos clinicos e prepare-se para seus desafios profissionais.",
    tools: { createQuizTool, askPerplexity, updateUserProfile },
  },

  "odonto-summary": {
    id: "odonto-summary",
    name: "Odonto Summary",
    description: "Resumos e Flashcards",
    model: "google/gemini-2.0-flash-001",
    maxSteps: 5,
    toolsRequiringApproval: [],
    system: `Voce e o Odonto Summary, especialista em materiais de estudo. Seus usuarios sao estudantes de graduacao em Odontologia ou profissionais buscando revisao de conteudos para provas, concursos ou atualizacao.

REGRA CRITICA: Na conversa responda em 2-3 linhas apenas, confirmando o topico e perguntando se quer foco especifico. TODO conteudo estruturado como resumos e flashcards vai no artifact via createSummaryTool ou createFlashcardsTool, NUNCA na conversa.

Apos criar o material, informe em 1 linha que esta pronto no painel lateral. Responda em portugues brasileiro de forma breve e direta.`,
    greetingTitle: "Resumos Inteligentes",
    greetingDescription: "Transforme seus estudos em materiais concisos e flashcards memoraveis.",
    tools: { createSummaryTool, createFlashcardsTool, updateUserProfile },
  },

  "odonto-vision": {
    id: "odonto-vision",
    name: "Odonto Vision",
    description: "Laudos Radiograficos e Analise de Imagens",
    model: "google/gemini-2.0-flash-001",
    maxSteps: 3,
    toolsRequiringApproval: [],
    system: `Voce e o Odonto Vision, radiologista virtual especializado em imagens odontologicas. Seus usuarios sao estudantes de graduacao em Odontologia ou cirurgioes-dentistas analisando exames de imagem para estudo ou apoio ao diagnostico clinico.

REGRA CRITICA: Inicie com observacao geral em 2-3 linhas mencionando o tipo de exame, qualidade tecnica e o achado principal mais relevante. Pergunte se quer laudo completo ou analise de area especifica.

Se pedirem laudo completo, use createReportTool com estrutura detalhada incluindo identificacao, descricao anatomica, achados especificos, hipoteses diagnosticas e sugestao de conduta.

Sempre inclua ao final "Analise assistida por IA, validar com exame clinico presencial". Responda em portugues brasileiro com linguagem tecnica adequada.`,
    greetingTitle: "Laudos Inteligentes",
    greetingDescription: "Envie radiografias e receba analises detalhadas com precisao de laudo radiologico.",
    tools: { createReportTool, updateUserProfile },
  },
};

// Helper to get agent by ID
export function getAgentConfig(agentId: string): AgentConfig {
  return AGENT_CONFIGS[agentId] || AGENT_CONFIGS['odonto-gpt'];
}

// List all available agents
export function listAgents(): AgentConfig[] {
  return Object.values(AGENT_CONFIGS);
}

// Get agent IDs
export function getAgentIds(): string[] {
  return Object.keys(AGENT_CONFIGS);
}

// Check if agent requires approval for a tool
export function agentRequiresApproval(agentId: string, toolName: string): boolean {
  const config = AGENT_CONFIGS[agentId];
  return config?.toolsRequiringApproval?.includes(toolName) ?? false;
}
