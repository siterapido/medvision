/**
 * API Route: /api/artifacts
 * Handles listing and creating artifacts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ArtifactsService } from '@/lib/services/artifacts'
import { z } from 'zod'

// Validation schema for creating artifacts
const createArtifactSchema = z.object({
    title: z.string().min(1).max(500),
    description: z.string().max(2000).optional().default(''),
    type: z.enum(['chat', 'document', 'code', 'image', 'vision', 'research', 'exam', 'summary', 'flashcards', 'mindmap', 'other']),
    content: z.any(),
    metadata: z.record(z.any()).optional(),
    aiContext: z.object({
        model: z.string(),
        agent: z.string(),
        temperature: z.number().optional(),
        maxTokens: z.number().optional(),
        systemPrompt: z.string().optional(),
        timestamp: z.string().optional(),
    }).optional().default({ model: 'gpt-4o', agent: 'OdontoVision AI' }),
})

/**
 * GET /api/artifacts
 * List artifacts with pagination and filters
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Parse query parameters
        const searchParams = request.nextUrl.searchParams
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '12')
        const type = searchParams.get('type') as any
        const search = searchParams.get('search') || undefined
        const sortBy = (searchParams.get('sortBy') || 'createdAt') as any
        const sortOrder = (searchParams.get('sortOrder') || 'desc') as any

        const result = await ArtifactsService.listArtifacts(user.id, {
            page,
            limit,
            type,
            search,
            sortBy,
            sortOrder,
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('[API /artifacts GET] Error listing artifacts:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        })

        const errorMessage = error instanceof Error ? error.message : 'Failed to list artifacts'
        return NextResponse.json(
            { error: 'Failed to list artifacts', details: errorMessage },
            { status: 500 }
        )
    }
}

/**
 * POST /api/artifacts
 * Create a new artifact
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Validate input
        const validationResult = createArtifactSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation error',
                    details: validationResult.error.errors,
                },
                { status: 400 }
            )
        }

        const artifact = await ArtifactsService.createArtifact(
            validationResult.data as unknown as import('@/lib/types/artifacts').CreateArtifactInput,
            user.id
        )

        return NextResponse.json(artifact, { status: 201 })
    } catch (error) {
        console.error('Error creating artifact:', error)
        return NextResponse.json(
            { error: 'Failed to create artifact' },
            { status: 500 }
        )
    }
}
