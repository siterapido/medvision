/**
 * Service layer for artifacts management
 * Handles all database operations for artifacts
 */

import { createClient } from '@/lib/supabase/server'
import type {
    Artifact,
    CreateArtifactInput,
    UpdateArtifactInput,
    ArtifactListParams,
    PaginatedArtifacts,
} from '@/lib/types/artifacts'

export class ArtifactsService {
    /**
     * List artifacts with pagination and filters
     */
    static async listArtifacts(
        userId: string,
        params: ArtifactListParams = {}
    ): Promise<PaginatedArtifacts> {
        const supabase = await createClient()
        const {
            page = 1,
            limit = 12,
            type,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = params

        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('artifacts')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)

        // Apply type filter
        if (type) {
            query = query.eq('type', type)
        }

        // Apply search filter (searches in title and description)
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
        }

        // Apply sorting
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })

        // Apply pagination
        query = query.range(from, to)

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Failed to list artifacts: ${error.message}`)
        }

        return {
            data: (data || []) as Artifact[],
            total: count || 0,
            page,
            limit,
            hasMore: count ? from + limit < count : false,
        }
    }

    /**
     * Get a single artifact by ID
     */
    static async getArtifact(id: string, userId: string): Promise<Artifact | null> {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('artifacts')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return null // Not found
            }
            throw new Error(`Failed to get artifact: ${error.message}`)
        }

        return data as Artifact
    }

    /**
     * Create a new artifact
     */
    static async createArtifact(
        input: CreateArtifactInput,
        userId: string
    ): Promise<Artifact> {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('artifacts')
            .insert({
                user_id: userId,
                title: input.title,
                description: input.description,
                type: input.type,
                content: input.content,
                metadata: input.metadata || {},
                ai_context: input.aiContext,
            })
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create artifact: ${error.message}`)
        }

        return data as Artifact
    }

    /**
     * Update an existing artifact
     */
    static async updateArtifact(
        id: string,
        input: UpdateArtifactInput,
        userId: string
    ): Promise<Artifact> {
        const supabase = await createClient()

        const updateData: any = {}
        if (input.title !== undefined) updateData.title = input.title
        if (input.description !== undefined) updateData.description = input.description
        if (input.content !== undefined) updateData.content = input.content
        if (input.metadata !== undefined) updateData.metadata = input.metadata

        const { data, error } = await supabase
            .from('artifacts')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('Artifact not found')
            }
            throw new Error(`Failed to update artifact: ${error.message}`)
        }

        return data as Artifact
    }

    /**
     * Delete an artifact
     */
    static async deleteArtifact(id: string, userId: string): Promise<void> {
        const supabase = await createClient()

        const { error } = await supabase
            .from('artifacts')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) {
            throw new Error(`Failed to delete artifact: ${error.message}`)
        }
    }

    /**
     * Get artifact statistics for a user
     */
    static async getArtifactStats(userId: string) {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('artifact_stats')
            .select('*')
            .eq('user_id', userId)

        if (error) {
            throw new Error(`Failed to get artifact stats: ${error.message}`)
        }

        return data || []
    }
}
