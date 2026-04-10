import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db/pool';

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY não configurado.');

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/text-embedding-3-small', input: text.substring(0, 8000) }),
  });

  if (!response.ok) throw new Error(`Embedding API error: ${response.status}`);
  const data = await response.json();
  if (!data.data?.length) throw new Error('Nenhum embedding retornado.');
  return data.data[0].embedding as number[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      userId,
      specialties = null,
      maxDocuments = 5,
      maxMemories = 3,
      semanticWeight = 0.7,
      keywordWeight = 0.3,
      matchThreshold = 0.5,
    } = body;

    if (!query) {
      return NextResponse.json({ error: 'Missing required parameter: query' }, { status: 400 });
    }

    const embedding = await generateEmbedding(query);
    const embeddingStr = `[${embedding.join(',')}]`;
    const sql = getSql();

    const documents = await sql`
      SELECT * FROM hybrid_search_knowledge(
        ${embeddingStr}::vector,
        ${query},
        ${matchThreshold},
        ${maxDocuments},
        ${specialties}::text[],
        ${semanticWeight},
        ${keywordWeight}
      )
    `;

    let memories: Record<string, unknown>[] = [];
    if (userId) {
      memories = await sql`
        SELECT * FROM hybrid_search_memories(
          ${userId},
          ${embeddingStr}::vector,
          ${query},
          ${matchThreshold},
          ${maxMemories},
          ARRAY['long_term', 'fact']::text[],
          ${semanticWeight},
          ${keywordWeight}
        )
      `;
    }

    const formattedDocuments = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      source: doc.source,
      specialty: doc.specialty,
      sourceType: doc.source_type,
      chunkIndex: doc.chunk_index,
      totalChunks: doc.total_chunks,
      semanticScore: parseFloat(Number(doc.semantic_score ?? 0).toFixed(3)),
      keywordScore: parseFloat(Number(doc.keyword_score ?? 0).toFixed(3)),
      combinedScore: parseFloat(Number(doc.combined_score ?? 0).toFixed(3)),
    }));

    const formattedMemories = memories.map((mem) => ({
      id: mem.id,
      content: mem.content,
      topic: mem.topic,
      type: mem.type,
      semanticScore: parseFloat(Number(mem.semantic_score ?? 0).toFixed(3)),
      keywordScore: parseFloat(Number(mem.keyword_score ?? 0).toFixed(3)),
      combinedScore: parseFloat(Number(mem.combined_score ?? 0).toFixed(3)),
      createdAt: mem.created_at,
    }));

    return NextResponse.json({
      success: true,
      query,
      documents: formattedDocuments,
      userContext: formattedMemories,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[rag-search]', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
