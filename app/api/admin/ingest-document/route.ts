/**
 * API Route: Document Ingestion for RAG Knowledge Base
 *
 * Ingests documents into the knowledge_documents table with:
 * - Automatic chunking (1500 chars with 200 char overlap)
 * - Embedding generation via OpenRouter
 * - Metadata extraction
 *
 * Protected by Bearer token authentication (ADMIN_API_KEY)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateEmbedding, formatEmbeddingForPostgres } from "@/lib/ai/memory/embeddings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Split text into chunks with overlap
 */
function chunkText(
  text: string,
  maxSize: number = 1500,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxSize;

    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + maxSize / 2) {
        end = breakPoint + 1;
      }
    }

    const chunk = text.slice(start, end).trim();

    // Only include chunks with meaningful content
    if (chunk.length > 50) {
      chunks.push(chunk);
    }

    // Move start position with overlap
    start = end - overlap;
  }

  return chunks;
}

/**
 * POST handler for document ingestion
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authorization
    const authHeader = req.headers.get("authorization");
    const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`;

    if (authHeader !== expectedToken) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing API key" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      title,
      content,
      sourceType, // 'textbook', 'article', 'protocol', 'guideline', 'course_material'
      sourceName, // e.g., 'Endodontia Clássica', 'Journal of Dental Research'
      specialty, // e.g., 'endodontia', 'periodontia', 'implantologia'
      author,
      chapter,
    } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: title and content" },
        { status: 400 }
      );
    }

    if (!sourceType || !["textbook", "article", "protocol", "guideline", "course_material"].includes(sourceType)) {
      return NextResponse.json(
        {
          error:
            'Invalid sourceType. Must be one of: textbook, article, protocol, guideline, course_material',
        },
        { status: 400 }
      );
    }

    // Split content into chunks
    const chunks = chunkText(content);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Content is too short or empty after chunking" },
        { status: 400 }
      );
    }

    console.log(
      `[Ingest] Processing document: "${title}" into ${chunks.length} chunks`
    );

    // Generate parent document ID
    const parentId = crypto.randomUUID();
    const results = [];

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      try {
        // Generate embedding for chunk
        const embedding = await generateEmbedding(chunks[i]);

        // Prepare document record
        const docRecord = {
          id: i === 0 ? parentId : crypto.randomUUID(),
          title: chunks.length > 1 ? `${title} (parte ${i + 1}/${chunks.length})` : title,
          content: chunks[i],
          source_type: sourceType,
          source_name: sourceName || null,
          specialty: specialty || null,
          author: author || null,
          chapter: chapter || null,
          chunk_index: i,
          total_chunks: chunks.length,
          parent_document_id: i > 0 ? parentId : null,
          embedding: embedding && embedding.length > 0
            ? formatEmbeddingForPostgres(embedding)
            : null,
          metadata: {
            ingestedAt: new Date().toISOString(),
            embeddingModel: "openai/text-embedding-3-small",
            chunkSize: chunks[i].length,
          },
        };

        // Insert into database
        const { data, error } = await supabase
          .from("knowledge_documents")
          .insert([docRecord])
          .select("id");

        if (error) {
          console.error(`[Ingest] Error inserting chunk ${i}:`, error);
          results.push({
            chunkIndex: i,
            success: false,
            error: error.message,
          });
        } else {
          console.log(
            `[Ingest] Successfully ingested chunk ${i + 1}/${chunks.length}`
          );
          results.push({
            chunkIndex: i,
            success: true,
            id: data?.[0]?.id,
            contentLength: chunks[i].length,
            hasEmbedding: embedding && embedding.length > 0,
          });
        }
      } catch (error) {
        console.error(`[Ingest] Error processing chunk ${i}:`, error);
        results.push({
          chunkIndex: i,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Count successes and failures
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      message: `Ingested ${successCount}/${chunks.length} chunks successfully`,
      parentId,
      totalChunks: chunks.length,
      successCount,
      failureCount,
      results,
      metadata: {
        title,
        sourceType,
        sourceName,
        specialty,
        ingestedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Ingest] Fatal error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during ingestion",
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for health check
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.ADMIN_API_KEY}`;

  if (authHeader !== expectedToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: "ok",
    message: "Document ingestion API is ready",
    endpoint: "/api/admin/ingest-document",
    requiredFields: ["title", "content", "sourceType", "sourceName"],
    optionalFields: ["specialty", "author", "chapter"],
  });
}
