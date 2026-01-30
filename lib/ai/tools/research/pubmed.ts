/**
 * Ferramenta de Pesquisa PubMed
 * 
 * Integração com a API E-Utilities do NCBI para buscar
 * artigos científicos no PubMed.
 */

import { tool } from 'ai'
import { z } from 'zod'

const PUBMED_API = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

interface PubMedArticle {
  pmid: string
  title: string
  authors: string
  source: string
  pubdate: string
  url: string
}

export const searchPubMed = tool({
  description: `Busca artigos científicos no PubMed sobre temas de odontologia e medicina.
Ideal para encontrar estudos clínicos recentes, revisões sistemáticas e pesquisa baseada em evidências.`,
  inputSchema: z.object({
    query: z.string().describe('Termo de busca (ex: "dental implant failure", "periodontal treatment")'),
    maxResults: z.number().optional().default(5).describe('Número máximo de resultados (padrão: 5)'),
    specialty: z.string().optional().describe('Filtrar por especialidade odontológica (opcional)'),
  }),
  execute: async ({ query, maxResults = 5, specialty }) => {
    try {
      // Construir query com filtros
      let searchQuery = query
      if (specialty) {
        searchQuery = `${query} AND ${specialty}`
      }

      // Buscar IDs dos artigos
      const searchUrl = `${PUBMED_API}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=${maxResults}&retmode=json`
      const searchRes = await fetch(searchUrl)
      
      if (!searchRes.ok) {
        throw new Error(`PubMed search failed: ${searchRes.statusText}`)
      }

      const searchData = await searchRes.json()
      const ids: string[] = searchData.esearchresult?.idlist || []

      if (ids.length === 0) {
        return {
          success: true,
          articles: [],
          message: `Nenhum artigo encontrado para: "${query}"`,
          totalResults: 0,
        }
      }

      // Buscar detalhes dos artigos
      const summaryUrl = `${PUBMED_API}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
      const summaryRes = await fetch(summaryUrl)
      
      if (!summaryRes.ok) {
        throw new Error(`PubMed summary failed: ${summaryRes.statusText}`)
      }

      const summaryData = await summaryRes.json()

      const articles: PubMedArticle[] = ids.map((id) => {
        const article = summaryData.result?.[id]
        const authors = article?.authors?.slice(0, 3).map((a: { name: string }) => a.name).join(', ') || 'Desconhecido'
        
        return {
          pmid: id,
          title: article?.title || 'Sem título',
          authors: article?.authors?.length > 3 ? `${authors} et al.` : authors,
          source: article?.source || '',
          pubdate: article?.pubdate || '',
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        }
      })

      // Formatar resultado para o modelo
      const formattedResult = articles.map((a, i) => 
        `### ${i + 1}. ${a.title}\n` +
        `**PMID:** ${a.pmid}\n` +
        `**Autores:** ${a.authors}\n` +
        `**Publicado:** ${a.pubdate} - ${a.source}\n` +
        `**Link:** [PubMed](${a.url})`
      ).join('\n\n')

      return {
        success: true,
        articles,
        formatted: `## Resultados PubMed: "${query}"\n\nEncontrados ${articles.length} artigos relevantes:\n\n${formattedResult}`,
        totalResults: parseInt(searchData.esearchresult?.count || '0'),
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return {
        success: false,
        articles: [],
        message: `Erro ao buscar no PubMed: ${errorMessage}. Tente uma query mais simples ou verifique sua conexão.`,
        totalResults: 0,
      }
    }
  },
})
