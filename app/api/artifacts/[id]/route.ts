/**
 * API Route: /api/artifacts/[id]
 * Handles get, update, and delete operations for individual artifacts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ArtifactsService } from '@/lib/services/artifacts'
import { z } from 'zod'

// Validation schema for updating artifacts
const updateArtifactSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(2000).optional(),
    content: z.any().optional(),
    metadata: z.record(z.any()).optional(),
})

/**
 * GET /api/artifacts/[id]
 * Get a single artifact by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const artifact = await ArtifactsService.getArtifact(params.id, user.id)

        if (!artifact) {
            return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })
        }

        return NextResponse.json(artifact)
    } catch (error) {
        console.error('Error getting artifact:', error)
        return NextResponse.json(
            { error: 'Failed to get artifact' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/artifacts/[id]
 * Update an artifact
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
        const validationResult = updateArtifactSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation error',
                    details: validationResult.error.errors,
                },
                { status: 400 }
            )
        }

        const artifact = await ArtifactsService.updateArtifact(
            params.id,
            validationResult.data,
            user.id
        )

        return NextResponse.json(artifact)
    } catch (error: any) {
        console.error('Error updating artifact:', error)

        if (error.message === 'Artifact not found') {
            return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })
        }

        return NextResponse.json(
            { error: 'Failed to update artifact' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/artifacts/[id]
 * Delete an artifact
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await ArtifactsService.deleteArtifact(params.id, user.id)

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('Error deleting artifact:', error)
        return NextResponse.json(
            { error: 'Failed to delete artifact' },
            { status: 500 }
        )
    }
}
