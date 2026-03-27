import { z } from "zod";
import { tool } from "ai";
import { createClient } from "@supabase/supabase-js";

// Supabase client creation
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

// --- RESEARCH TOOLS ---

export const askPerplexity = tool({
  description: "Performs a deep online search using Perplexity AI (Sonar Reasoning) to answer complex questions with up-to-date information and citations.",
  inputSchema: z.object({
    query: z.string().describe("The research question or topic to search for."),
  }),
  execute: async ({ query }) => {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return "Error: API key for Perplexity/OpenRouter not configured.";
    }

    const url = "https://openrouter.ai/api/v1/chat/completions";
    const model = process.env.OPENROUTER_MODEL_RESEARCH || "perplexity/sonar";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "OdontoGPT Research Agent",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: `Você é um assistente de pesquisa científica odontológica sênior do Odonto GPT.
Responda sempre em Português do Brasil com linguagem técnica e precisa.
Ao citar estudos no texto, use o formato de hyperlink markdown integrado: [Sobrenome et al., Ano](URL_DO_ARTIGO).
Ao final, inclua obrigatoriamente uma seção "### Referências" com a lista completa no formato:
[N] Autores. Título do artigo. *Nome do Periódico*, Ano; Vol(N):pp. [Acesso](URL)
Nunca liste fontes sem link clicável. Priorize estudos com alto nível de evidência (revisões sistemáticas, ECRs).`
            },
            { role: "user", content: query }
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return `Erro na pesquisa científica (Status ${response.status}): ${errorText}`;
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      }
      return "Nenhum resultado encontrado na pesquisa científica.";
    } catch (error: any) {
      return `Erro ao realizar pesquisa científica: ${error.message}`;
    }
  },
});

export const searchPubMed = tool({
  description: "Search PubMed for dental and medical research articles.",
  inputSchema: z.object({
    query: z.string().describe("Search query (e.g., 'dental implant failure')"),
    max_results: z.number().optional().default(5).describe("Number of results to return"),
    specialty: z.string().optional().describe("Filter by dental specialty"),
  }),
  execute: async ({ query, max_results = 5, specialty }) => {
    try {
      let searchQuery = query;
      if (specialty) {
        searchQuery = `${query} AND ${specialty}`;
      }

      // 1. ESearch
      const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmode=json&retmax=${max_results}`;
      const searchRes = await fetch(esearchUrl);
      const searchData = await searchRes.json();
      const ids = searchData.esearchresult?.idlist || [];

      if (ids.length === 0) {
        return `No articles found for query: ${searchQuery}`;
      }

      // 2. ESummary
      const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
      const summaryRes = await fetch(esummaryUrl);
      const summaryData = await summaryRes.json();

      const results = ids.map((id: string) => {
        const doc = summaryData.result[id];
        return {
          id,
          title: doc.title,
          authors: doc.authors?.map((a: any) => a.name).join(", ") || "Unknown",
          journal: doc.source,
          pubdate: doc.pubdate,
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
        }
      });

      return JSON.stringify(results, null, 2);
    } catch (error: any) {
      return `Error searching PubMed: ${error.message}`;
    }
  },
});

// --- PROFILE TOOLS ---

export const updateUserProfile = tool({
  description: "Updates the user's profile with academic or professional context gathered during the conversation. Call this whenever you learn the student's university, semester, specialty interest, or academic level.",
  inputSchema: z.object({
    userId: z.string().describe("The user's ID"),
    university: z.string().optional().describe("University name where the user studies or graduated"),
    semester: z.string().optional().describe("Current semester (e.g., '8º Semestre') or status ('Graduado', 'Especializando')"),
    specialty_interest: z.string().optional().describe("Area of interest (e.g., 'Ortodontia', 'Implantodontia', 'Endodontia')"),
    academic_level: z.string().optional().describe("Academic level: 'Graduando', 'Profissional', 'Especialista', 'Residente', 'Mestre', 'Doutor'"),
  }),
  execute: async ({ userId, university, semester, specialty_interest, academic_level }) => {
    const supabase = createSupabaseClient();

    const updates: Record<string, string> = {};
    if (university) updates.university = university;
    if (semester) updates.semester = semester;
    if (specialty_interest) updates.specialty_interest = specialty_interest;
    if (academic_level) updates.academic_level = academic_level;

    if (Object.keys(updates).length === 0) return "Nenhuma informação para salvar.";

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) {
      console.error("[updateUserProfile] Error:", error.message);
      // Tenta salvar apenas os campos básicos que sempre existem
      const safeUpdates: Record<string, string> = {};
      if (specialty_interest) safeUpdates.specialty_interest = specialty_interest;
      if (Object.keys(safeUpdates).length > 0) {
        const { error: retryError } = await supabase
          .from("profiles")
          .update(safeUpdates)
          .eq("id", userId);
        if (!retryError) return "Contexto parcial salvo (execute a migração 20260327000001 para habilitar todos os campos).";
      }
      return `Não foi possível salvar o contexto agora (execute a migração de banco de dados). Continuarei usando as informações na conversa.`;
    }

    const saved = Object.keys(updates).join(", ");
    return `Contexto do aluno atualizado: ${saved}.`;
  },
});

// --- ARTIFACT SAVING TOOLS ---

export const saveResearch = tool({
  description: "Salva um dossie de pesquisa estruturado no banco de dados para consulta posterior.",
  inputSchema: z.object({
    userId: z.string().describe("The ID of the user"),
    title: z.string().describe("Title of the research"),
    content: z.string().describe("Markdown content"),
    query: z.string().optional().default(""),
    sources: z.array(z.object({
      title: z.string().optional(),
      url: z.string(),
      status: z.string().optional()
    })).optional().default([]),
    researchType: z.string().optional().default("literature_review"),
  }),
  execute: async ({ userId, title, content, query, sources, researchType }) => {
    const supabase = createSupabaseClient();

    try {
      const artifactContent = {
        query,
        sources,
        researchType,
        markdownContent: content
      };

      const { data, error } = await supabase.from("artifacts").insert({
        user_id: userId,
        title,
        type: 'research',
        content: artifactContent,
        description: `Pesquisa sobre ${query || title}`,
        ai_context: { agent: 'odonto-research', model: 'perplexity/sonar' },
        metadata: { researchType }
      }).select().single();

      if (error) {
        return `Erro ao salvar pesquisa: ${error.message}`;
      }
      return `Pesquisa salva com sucesso! ID: ${data.id}`;
    } catch (e: any) {
      return `Erro inesperado: ${e.message}`;
    }
  },
});

export const savePracticeExam = tool({
  description: "Saves a generated practice exam (simulado) to the database.",
  inputSchema: z.object({
    userId: z.string(),
    title: z.string(),
    topic: z.string(),
    questions: z.array(z.object({
      question_text: z.string(),
      type: z.string().optional().default("multiple_choice"),
      options: z.any(),
      correct_answer: z.string(),
      explanation: z.string(),
      difficulty: z.string().optional().default("medium")
    })),
    specialty: z.string().optional().default("Geral"),
    difficulty: z.string().optional().default("medium"),
    examType: z.string().optional().default("custom"),
  }),
  execute: async ({ userId, title, topic, questions, specialty, difficulty, examType }) => {
    const supabase = createSupabaseClient();

    const artifactContent = {
      topic,
      specialty,
      difficulty,
      questions,
      examType
    };

    const { data: exam, error: examError } = await supabase.from("artifacts").insert({
      user_id: userId,
      title,
      type: 'exam',
      content: artifactContent,
      description: `Simulado de ${topic}`,
      ai_context: { agent: 'odonto-gpt', model: 'google/gemini-2.0-flash-exp' },
      metadata: { specialty, difficulty }
    }).select().single();

    if (examError) return `Error saving exam: ${examError.message}`;

    return `Simulado '${title}' salvo com sucesso! ID: ${exam.id} com ${questions.length} questoes.`;
  },
});

export const saveSummary = tool({
  description: "Saves a generated summary (Resumo) to the database.",
  inputSchema: z.object({
    userId: z.string(),
    title: z.string(),
    content: z.string().describe("Markdown content"),
    tags: z.array(z.string()).optional().default([]),
    topic: z.string().optional().default(""),
  }),
  execute: async ({ userId, title, content, tags, topic }) => {
    const supabase = createSupabaseClient();

    const artifactContent = {
      topic,
      tags,
      markdownContent: content
    };

    const { data, error } = await supabase.from("artifacts").insert({
      user_id: userId,
      title,
      type: 'summary',
      content: artifactContent,
      description: `Resumo sobre ${topic}`,
      ai_context: { agent: 'odonto-gpt', model: 'google/gemini-2.0-flash-exp' },
      metadata: { tags }
    }).select().single();

    if (error) return `Error saving summary: ${error.message}`;
    return `Resumo salvo com sucesso! ID: ${data.id}`;
  },
});

export const saveFlashcards = tool({
  description: "Saves a set of flashcards to the database.",
  inputSchema: z.object({
    userId: z.string(),
    title: z.string(),
    cards: z.array(z.object({
      front: z.string(),
      back: z.string()
    })),
    topic: z.string().optional().default(""),
  }),
  execute: async ({ userId, title, cards, topic }) => {
    const supabase = createSupabaseClient();

    const artifactContent = {
      topic,
      cards
    };

    const { data, error } = await supabase.from("artifacts").insert({
      user_id: userId,
      title,
      type: 'flashcards',
      content: artifactContent,
      description: `Flashcards sobre ${topic}`,
      ai_context: { agent: 'odonto-gpt', model: 'google/gemini-2.0-flash-exp' },
      metadata: { count: cards.length }
    }).select().single();

    if (error) return `Error saving flashcards: ${error.message}`;
    return `Flashcards salvos com sucesso! ID: ${data.id}`;
  },
});

export const saveMindMap = tool({
  description: "Saves a mind map to the database.",
  inputSchema: z.object({
    userId: z.string(),
    title: z.string(),
    mapData: z.record(z.any()).describe("JSON structure of the mind map"),
    topic: z.string().optional().default(""),
  }),
  execute: async ({ userId, title, mapData, topic }) => {
    const supabase = createSupabaseClient();

    const artifactContent = {
      topic,
      data: mapData
    };

    const { data, error } = await supabase.from("artifacts").insert({
      user_id: userId,
      title,
      type: 'mindmap',
      content: artifactContent,
      description: `Mapa mental de ${topic}`,
      ai_context: { agent: 'odonto-gpt', model: 'google/gemini-2.0-flash-exp' },
      metadata: { nodes: Object.keys(mapData).length }
    }).select().single();

    if (error) return `Error saving mind map: ${error.message}`;
    return `Mapa mental salvo com sucesso! ID: ${data.id}`;
  },
});

export const saveImageAnalysis = tool({
  description: "Saves a dental image analysis artifact to the database.",
  inputSchema: z.object({
    userId: z.string(),
    title: z.string(),
    analysis: z.string(),
    imageUrl: z.string().optional().default(""),
    findings: z.array(z.string()).optional().default([]),
    recommendations: z.array(z.string()).optional().default([]),
    metadata: z.record(z.any()).optional().default({}),
  }),
  execute: async ({ userId, title, analysis, imageUrl, findings, recommendations, metadata }) => {
    const supabase = createSupabaseClient();

    const artifactContent = {
      imageUrl,
      analysis,
      findings,
      recommendations
    };

    const { data, error } = await supabase.from("artifacts").insert({
      user_id: userId,
      title,
      type: 'image',
      content: artifactContent,
      description: analysis.substring(0, 100) + '...',
      ai_context: { agent: 'odonto-gpt', model: 'google/gpt-4o' },
      metadata: metadata || {}
    }).select().single();

    if (error) return JSON.stringify({ success: false, message: `Erro ao salvar: ${error.message}` });

    return JSON.stringify({
      success: true,
      message: `Analise de imagem salva com sucesso! ID: ${data.id}`,
      artifact: { id: data.id, title: data.title, type: "image" }
    });
  }
});

// --- ARTIFACT GENERATION TOOL (for chat) ---

export const generateArtifact = tool({
  description: "Generates a structured educational artifact based on the conversation context. Use this to create study materials like summaries, flashcards, quizzes, or research dossiers.",
  inputSchema: z.object({
    type: z.enum(['summary', 'flashcards', 'quiz', 'research-dossier', 'clinical-protocol', 'study-guide', 'case-analysis']).describe("Type of artifact to generate"),
    title: z.string().describe("Title of the artifact"),
    content: z.any().describe("Structured content of the artifact"),
    topic: z.string().optional().describe("Main topic covered"),
  }),
  execute: async ({ type, title, content, topic }) => {
    // This tool returns the artifact structure for rendering in the UI
    // Actual persistence should be done via specific save tools
    return {
      type,
      title,
      content,
      topic: topic || title,
      createdAt: new Date().toISOString(),
      status: 'generated'
    };
  }
});
