/**
 * RAG Search Tool for Odonto GPT
 *
 * Unified search tool that combines:
 * - Knowledge documents (textbooks, articles, protocols, guidelines)
 * - User memories (student facts and long-term context)
 *
 * Uses hybrid search: semantic (vector) + keyword (FTS) scoring
 */

import { z } from "zod";
import { tool } from "ai";
import { getContext } from "../artifacts/context";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Search knowledge base and user memories using RAG
 * Combines semantic search (vector embeddings) with keyword search (FTS)
 */
export const searchKnowledge = tool({
  description: `Busca conhecimento odontológico na base de dados combinando documentos de referência com contexto do aluno.

  Use SEMPRE antes de responder perguntas técnicas sobre:
  - Protocolos e procedimentos clínicos
  - Diagnóstico e tratamento
  - Anatomia e fisiologia
  - Farmacologia odontológica
  - Evidências científicas

  Retorna trechos de livros, artigos, protocolos e contexto do aluno com relevância.`,
  parameters: z.object({
    query: z
      .string()
      .describe(
        "A pergunta ou tópico para buscar (ex: 'Como tratar canal radicular?', 'Protocolo de anestesia')"
      ),
    specialties: z
      .array(z.string())
      .optional()
      .describe(
        "Filtrar por especialidades (ex: ['endodontia', 'periodontia', 'implantologia'])"
      ),
    maxResults: z
      .number()
      .optional()
      .default(5)
      .describe("Máximo de documentos a retornar"),
  }),
  execute: async ({ query, specialties, maxResults }) => {
    try {
      const ctx = getContext();

      if (!ctx?.userId) {
        return {
          success: false,
          error: "Contexto do usuário não disponível",
          documents: [],
          userContext: [],
        };
      }

      // Call the rag-search Edge Function
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/rag-search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            query,
            userId: ctx.userId,
            specialties: specialties || null,
            maxDocuments: maxResults,
            maxMemories: 3,
            semanticWeight: 0.7,
            keywordWeight: 0.3,
            matchThreshold: 0.5,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("[RAG Tool] Edge Function error:", error);
        return {
          success: false,
          error: `Erro na busca: ${error.error || "Desconhecido"}`,
          documents: [],
          userContext: [],
        };
      }

      const data = await response.json();

      if (!data.success) {
        return {
          success: false,
          error: data.error || "Erro desconhecido na busca",
          documents: [],
          userContext: [],
        };
      }

      // Format documents for the agent
      const formattedDocuments = (data.documents || []).map(
        (doc: any, idx: number) => ({
          id: doc.id,
          title: doc.title,
          source: doc.source,
          specialty: doc.specialty,
          relevance: `${Math.round(doc.combinedScore * 100)}%`,
          content: doc.content.substring(0, 500), // Truncate for context
          fullContent: doc.content,
          index: idx + 1,
        })
      );

      // Format memories for context
      const formattedMemories = (data.userContext || []).map(
        (mem: any, idx: number) => ({
          topic: mem.topic || "Geral",
          content: mem.content,
          relevance: `${Math.round(mem.combinedScore * 100)}%`,
          index: idx + 1,
        })
      );

      // Create a formatted response for the agent to use
      let responseText = "";

      if (formattedDocuments.length > 0) {
        responseText += "📚 **Fontes encontradas:**\n";
        formattedDocuments.forEach((doc) => {
          responseText += `\n${doc.index}. **${doc.title}** (${doc.source}) - Relevância: ${doc.relevance}\n`;
          responseText += `   ${doc.content}...\n`;
        });
      }

      if (formattedMemories.length > 0) {
        responseText += "\n👤 **Contexto do aluno:**\n";
        formattedMemories.forEach((mem) => {
          responseText += `\n- **${mem.topic}** (${mem.relevance}): ${mem.content}\n`;
        });
      }

      if (formattedDocuments.length === 0 && formattedMemories.length === 0) {
        return {
          success: false,
          error:
            "Nenhum resultado encontrado na base de conhecimento. Tente reformular sua pergunta.",
          documents: [],
          userContext: [],
        };
      }

      return {
        success: true,
        documents: formattedDocuments,
        userContext: formattedMemories,
        summary: responseText,
        message: `Encontrados ${formattedDocuments.length} documentos e ${formattedMemories.length} informações do contexto do aluno.`,
      };
    } catch (error) {
      console.error("[RAG Tool] Error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido na busca RAG",
        documents: [],
        userContext: [],
      };
    }
  },
});
