/**
 * Custom hooks for artifacts management
 * Uses SWR for data fetching and caching
 */

'use client'

import useSWR from 'swr'
import { useState } from 'react'
import type {
    Artifact,
    CreateArtifactInput,
    UpdateArtifactInput,
    ArtifactListParams,
    PaginatedArtifacts,
} from '@/lib/types/artifacts'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

/**
 * Hook to list artifacts with pagination and filters
 */
export function useArtifacts(params: ArtifactListParams = {}) {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.set('page', params.page.toString())
    if (params.limit) queryParams.set('limit', params.limit.toString())
    if (params.type) queryParams.set('type', params.type)
    if (params.search) queryParams.set('search', params.search)
    if (params.sortBy) queryParams.set('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder)

    const { data, error, isLoading, mutate } = useSWR<PaginatedArtifacts>(
        `/api/artifacts?${queryParams.toString()}`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 5000,
        }
    )

    return {
        data: data?.data || [],
        total: data?.total || 0,
        page: data?.page || 1,
        hasMore: data?.hasMore || false,
        isLoading,
        error,
        mutate,
    }
}

/**
 * Hook to get a single artifact by ID
 */
export function useArtifact(id: string | null) {
    const { data, error, isLoading, mutate } = useSWR<Artifact>(
        id ? `/api/artifacts/${id}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
        }
    )

    return {
        artifact: data,
        isLoading,
        error,
        mutate,
    }
}

/**
 * Hook to create a new artifact
 */
export function useCreateArtifact() {
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const create = async (input: CreateArtifactInput): Promise<Artifact | null> => {
        setIsCreating(true)
        setError(null)

        try {
            const response = await fetch('/api/artifacts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(input),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to create artifact')
            }

            const artifact = await response.json()
            return artifact
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error')
            setError(error)
            return null
        } finally {
            setIsCreating(false)
        }
    }

    return {
        create,
        isCreating,
        error,
    }
}

/**
 * Hook to update an artifact
 */
export function useUpdateArtifact() {
    const [isUpdating, setIsUpdating] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const update = async (
        id: string,
        input: UpdateArtifactInput
    ): Promise<Artifact | null> => {
        setIsUpdating(true)
        setError(null)

        try {
            const response = await fetch(`/api/artifacts/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(input),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update artifact')
            }

            const artifact = await response.json()
            return artifact
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error')
            setError(error)
            return null
        } finally {
            setIsUpdating(false)
        }
    }

    return {
        update,
        isUpdating,
        error,
    }
}

/**
 * Hook to delete an artifact
 */
export function useDeleteArtifact() {
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const deleteArtifact = async (id: string): Promise<boolean> => {
        setIsDeleting(true)
        setError(null)

        try {
            const response = await fetch(`/api/artifacts/${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to delete artifact')
            }

            return true
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error')
            setError(error)
            return false
        } finally {
            setIsDeleting(false)
        }
    }

    return {
        deleteArtifact,
        isDeleting,
        error,
    }
}
