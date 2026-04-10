/**
 * Ferramenta de Pesquisa Perplexity
 * 
 * Utiliza o modelo Perplexity Sonar via OpenRouter para
 * realizar pesquisas profundas com citações.
 */

import { tool } from 'ai'
import { generateText } from 'ai'
import { z } from 'zod'
import { openrouter, MODELS } from '@/lib/ai/openrouter'

export const askPerplexity = tool({
  description: `Realiza uma pesquisa profunda online usando Perplexity AI para responder questões complexas.
Use esta ferramenta quando precisar de informações atualizadas, citações, ou cobertura ampla da web
que exceda o conhecimento interno ou bancos de dados específicos como PubMed.`,
  inputSchema: z.object({
    query: z.string().describe('A pergunta ou tópico de pesquisa'),
  }),
  execute: async ({ query }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = openrouter(MODELS.research) as any
      
      const result = await generateText({
        model,
        system: `Você é um assistente de pesquisa acadêmica para MedVision.
Sua tarefa é encontrar artigos científicos e evidências clínicas atualizadas.
Responda sempre em Português (Brasil).
Inclua citações no corpo do texto.
CRÍTICO: No final da resposta, crie uma seção '### Fontes' com a lista numerada de URLs usadas.`,
        prompt: query,
        temperature: 0.1,
      })

      return {
        success: true,
        content: result.text,
        usage: result.usage,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return {
        success: false,
        content: `Erro ao pesquisar: ${errorMessage}`,
      }
    }
  },
})
