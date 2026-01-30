/**
 * Ferramentas de Artefatos
 * 
 * Ferramentas para criar materiais de estudo (resumos, flashcards, mapas mentais)
 * e salvá-los no Supabase.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

// Tipo para os artefatos
export interface ArtifactResult {
  success: boolean
  artifactId?: string
  artifactType?: 'summary' | 'flashcards' | 'mindmap'
  message: string
  error?: string
}

/**
 * Ferramenta para criar resumos estruturados
 */
export const createSummary = tool({
  description: `Cria um resumo estruturado sobre um tema de estudo e salva no banco de dados do usuário.
Use esta ferramenta quando o aluno pedir para resumir um conteúdo ou quando for pedagogicamente útil criar um material de revisão.`,
  inputSchema: z.object({
    title: z.string().describe('Título do resumo'),
    content: z.string().describe('Conteúdo do resumo em Markdown'),
    topics: z.array(z.string()).describe('Lista de tópicos principais abordados'),
  }),
  execute: async ({ title, content, topics }): Promise<ArtifactResult> => {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { success: false, message: 'Usuário não autenticado', error: 'auth_required' }
      }

      const id = nanoid()
      const { error } = await supabase.from('summaries').insert({
        id,
        user_id: user.id,
        title,
        content,
        topics,
        created_at: new Date().toISOString(),
      })

      if (error) {
        // Se a tabela não existir, retorna sucesso parcial
        if (error.code === '42P01') {
          return {
            success: true,
            artifactId: id,
            artifactType: 'summary',
            message: `📝 Resumo "${title}" gerado! (Nota: tabela não configurada ainda)`,
          }
        }
        return { success: false, message: `Erro ao salvar: ${error.message}`, error: error.code }
      }

      return {
        success: true,
        artifactId: id,
        artifactType: 'summary',
        message: `📝 Resumo "${title}" criado com sucesso! Você pode acessá-lo na aba Resumos.`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return { success: false, message: `Erro: ${errorMessage}` }
    }
  },
})

/**
 * Ferramenta para criar flashcards
 */
export const createFlashcards = tool({
  description: `Cria um conjunto de flashcards para estudo e revisão espaçada.
Use esta ferramenta quando o aluno pedir para criar cards de revisão ou quando quiser ajudá-lo a memorizar conceitos.`,
  inputSchema: z.object({
    title: z.string().describe('Título do deck de flashcards'),
    cards: z.array(z.object({
      front: z.string().describe('Frente do cartão (pergunta)'),
      back: z.string().describe('Verso do cartão (resposta)'),
    })).min(1).describe('Lista de flashcards (mínimo 1)'),
  }),
  execute: async ({ title, cards }): Promise<ArtifactResult> => {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { success: false, message: 'Usuário não autenticado', error: 'auth_required' }
      }

      const id = nanoid()
      const { error } = await supabase.from('flashcard_decks').insert({
        id,
        user_id: user.id,
        title,
        cards,
        created_at: new Date().toISOString(),
      })

      if (error) {
        if (error.code === '42P01') {
          return {
            success: true,
            artifactId: id,
            artifactType: 'flashcards',
            message: `🃏 Deck "${title}" com ${cards.length} flashcards gerado! (Nota: tabela não configurada ainda)`,
          }
        }
        return { success: false, message: `Erro ao salvar: ${error.message}`, error: error.code }
      }

      return {
        success: true,
        artifactId: id,
        artifactType: 'flashcards',
        message: `🃏 Deck "${title}" com ${cards.length} flashcards criado! Acesse na aba Flashcards.`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return { success: false, message: `Erro: ${errorMessage}` }
    }
  },
})

/**
 * Ferramenta para criar mapas mentais
 */
export const createMindMap = tool({
  description: `Cria um mapa mental visual sobre um tópico de estudo.
Use esta ferramenta para ajudar o aluno a visualizar conexões entre conceitos.`,
  inputSchema: z.object({
    title: z.string().describe('Título do mapa mental'),
    nodes: z.array(z.object({
      id: z.string().describe('ID único do nó'),
      label: z.string().describe('Texto do nó'),
      parentId: z.string().nullable().describe('ID do nó pai (null para o nó raiz)'),
    })).min(1).describe('Lista de nós do mapa mental'),
  }),
  execute: async ({ title, nodes }): Promise<ArtifactResult> => {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { success: false, message: 'Usuário não autenticado', error: 'auth_required' }
      }

      const id = nanoid()
      const { error } = await supabase.from('mind_maps').insert({
        id,
        user_id: user.id,
        title,
        nodes,
        created_at: new Date().toISOString(),
      })

      if (error) {
        if (error.code === '42P01') {
          return {
            success: true,
            artifactId: id,
            artifactType: 'mindmap',
            message: `🧠 Mapa mental "${title}" com ${nodes.length} nós gerado! (Nota: tabela não configurada ainda)`,
          }
        }
        return { success: false, message: `Erro ao salvar: ${error.message}`, error: error.code }
      }

      return {
        success: true,
        artifactId: id,
        artifactType: 'mindmap',
        message: `🧠 Mapa mental "${title}" com ${nodes.length} nós criado! Visualize na aba Mapas Mentais.`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return { success: false, message: `Erro: ${errorMessage}` }
    }
  },
})
