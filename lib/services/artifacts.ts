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
    AIContext,
} from '@/lib/types/artifacts'
import { ARTIFACT_VALID_TYPES, isValidArtifactType } from '@/lib/constants/artifact-types'

/** Normaliza linha snake_case do Postgres para o tipo Artifact. */
function mapArtifactRow(row: Record<string, any>): Artifact {
    return {
        id: row.id,
        userId: row.user_id ?? row.userId,
        title: row.title,
        description: row.description ?? '',
        type: row.type,
        content: row.content,
        metadata: row.metadata ?? {},
        aiContext: (row.ai_context ?? row.aiContext ?? {
            model: 'gpt-4o',
            agent: 'MedVision AI',
        }) as AIContext,
        createdAt: row.created_at ?? row.createdAt,
        updatedAt: row.updated_at ?? row.updatedAt,
        patientKey: row.patient_key ?? row.patientKey ?? null,
        orgId: row.org_id ?? row.orgId ?? null,
        signedAt: row.signed_at ?? row.signedAt ?? null,
    }
}

export class ArtifactsService {
    static readonly VALID_TYPES = ARTIFACT_VALID_TYPES

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

        // Apply sorting (DB columns are snake_case)
        const sortColumn =
            sortBy === 'createdAt'
                ? 'created_at'
                : sortBy === 'updatedAt'
                  ? 'updated_at'
                  : sortBy === 'title'
                    ? 'title'
                    : 'created_at'
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

        // Apply pagination
        query = query.range(from, to)

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Failed to list artifacts: ${error.message}`)
        }

        return {
            data: (data || []).map(mapArtifactRow),
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

        return data ? mapArtifactRow(data) : null
    }

    /**
     * Create a new artifact
     */
    static async createArtifact(
        input: CreateArtifactInput,
        userId: string
    ): Promise<Artifact> {
        // Validar tipo antes de inserir
        if (!isValidArtifactType(input.type)) {
            throw new Error(`Invalid artifact type: ${input.type}. Must be one of: ${ARTIFACT_VALID_TYPES.join(', ')}`)
        }

        const supabase = await createClient()

        const metadata = input.metadata || {}
        const patientKey =
            input.patientKey ??
            (typeof metadata.patientKey === 'string' ? metadata.patientKey : undefined)
        const orgId =
            input.orgId ??
            (typeof metadata.orgId === 'string' ? metadata.orgId : undefined)

        const insertRow: Record<string, unknown> = {
            user_id: userId,
            title: input.title,
            description: input.description,
            type: input.type,
            content: input.content,
            metadata,
            ai_context: input.aiContext,
        }

        if (patientKey?.trim()) {
            insertRow.patient_key = patientKey.trim()
        }
        if (orgId?.trim()) {
            insertRow.org_id = orgId.trim()
        }

        const { data, error } = await supabase
            .from('artifacts')
            .insert(insertRow)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create artifact: ${error.message}`)
        }

        return mapArtifactRow(data)
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

        return mapArtifactRow(data)
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
