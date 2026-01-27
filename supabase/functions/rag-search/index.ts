import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Generate embedding for text using OpenRouter API (OpenAI text-embedding-3-small)
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const truncatedText = text.substring(0, 8000); // Limit to 8000 chars to avoid token limits

    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: truncatedText,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Embedding API error:", error);
      throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      throw new Error("No embedding returned from API");
    }

    return data.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Format vector as PostgreSQL vector string
 */
function formatVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/**
 * Main handler
 */
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const requestBody = await req.json();
    const {
      query,
      userId,
      specialties,
      maxDocuments = 5,
      maxMemories = 3,
      semanticWeight = 0.7,
      keywordWeight = 0.3,
      matchThreshold = 0.5,
    } = requestBody;

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: query" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[RAG-SEARCH] Query: "${query}", User: ${userId || "anonymous"}`);

    // Generate embedding for the query
    const embedding = await generateEmbedding(query);
    const embeddingStr = formatVector(embedding);

    // Search knowledge documents
    const { data: documents, error: docError } = await supabase.rpc(
      "hybrid_search_knowledge",
      {
        p_query_embedding: embeddingStr,
        p_query_text: query,
        p_match_threshold: matchThreshold,
        p_match_count: maxDocuments,
        p_specialties: specialties || null,
        p_semantic_weight: semanticWeight,
        p_keyword_weight: keywordWeight,
      }
    );

    if (docError) {
      console.error("Document search error:", docError);
    }

    // Search user memories if userId is provided
    let memories = [];
    if (userId) {
      const { data: memoryData, error: memError } = await supabase.rpc(
        "hybrid_search_memories",
        {
          p_user_id: userId,
          p_query_embedding: embeddingStr,
          p_query_text: query,
          p_match_threshold: matchThreshold,
          p_match_count: maxMemories,
          p_memory_types: ["long_term", "fact"],
          p_semantic_weight: semanticWeight,
          p_keyword_weight: keywordWeight,
        }
      );

      if (memError) {
        console.error("Memory search error:", memError);
      } else {
        memories = memoryData || [];
      }
    }

    // Format response
    const formattedDocuments = (documents || []).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      source: doc.source,
      specialty: doc.specialty,
      sourceType: doc.source_type,
      chunkIndex: doc.chunk_index,
      totalChunks: doc.total_chunks,
      semanticScore: parseFloat((doc.semantic_score || 0).toFixed(3)),
      keywordScore: parseFloat((doc.keyword_score || 0).toFixed(3)),
      combinedScore: parseFloat((doc.combined_score || 0).toFixed(3)),
    }));

    const formattedMemories = (memories || []).map((mem: any) => ({
      id: mem.id,
      content: mem.content,
      topic: mem.topic,
      type: mem.type,
      semanticScore: parseFloat((mem.semantic_score || 0).toFixed(3)),
      keywordScore: parseFloat((mem.keyword_score || 0).toFixed(3)),
      combinedScore: parseFloat((mem.combined_score || 0).toFixed(3)),
      createdAt: mem.created_at,
    }));

    console.log(
      `[RAG-SEARCH] Results: ${formattedDocuments.length} documents, ${formattedMemories.length} memories`
    );

    return new Response(
      JSON.stringify({
        success: true,
        query,
        documents: formattedDocuments,
        userContext: formattedMemories,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("[RAG-SEARCH] Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
