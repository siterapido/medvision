import { createClient } from '@/lib/supabase/client'
import type { Artifact } from '@/components/artifacts/types'

export interface ArtifactVersion {
  id: string
  artifact_id: string
  version: number
  content: any
  snapshot_content: any
  diff_from_previous?: any
  user_initiated: boolean
  created_at: string
}

export interface VersionHistoryItem {
  version_id: string
  version_number: number
  created_at: string
  user_initiated: boolean
  summary: string
}

/**
 * Service for managing artifact versions
 */
export const artifactVersionService = {
  /**
   * Create a new version for an artifact
   */
  async createVersion(
    artifactId: string,
    content: any,
    userInitiated: boolean = false
  ): Promise<ArtifactVersion | null> {
    const supabase = createClient()

    // Get current max version
    const { data: latestVersion } = await supabase
      .from('artifact_versions')
      .select('version, snapshot_content')
      .eq('artifact_id', artifactId)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const newVersionNumber = (latestVersion?.version ?? 0) + 1
    
    // Calculate simple diff if needed (optional for now)
    const diff = null

    const { data, error } = await supabase
      .from('artifact_versions')
      .insert({
        artifact_id: artifactId,
        version: newVersionNumber,
        content: content,
        snapshot_content: content,
        user_initiated: userInitiated,
        diff_from_previous: diff,
      })
      .select()
      .single()

    if (error) {
      console.error('[versionService] Error creating version:', error)
      return null
    }

    return data as ArtifactVersion
  },

  /**
   * Get version history for an artifact
   */
  async getHistory(artifactId: string): Promise<VersionHistoryItem[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('get_artifact_version_history', {
      p_artifact_id: artifactId,
    })

    if (error) {
      console.error('[versionService] Error fetching history:', error)
      return []
    }

    return data as VersionHistoryItem[]
  },

  /**
   * Restore an artifact to a specific version
   */
  async restoreVersion(versionId: string): Promise<string | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('restore_artifact_version', {
      p_version_id: versionId,
    })

    if (error) {
      console.error('[versionService] Error restoring version:', error)
      return null
    }

    return data as string // Returns artifactId
  },

  /**
   * Get a specific version's full content
   */
  async getVersionContent(versionId: string): Promise<any | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('artifact_versions')
      .select('snapshot_content')
      .eq('id', versionId)
      .single()

    if (error) {
      console.error('[versionService] Error fetching version content:', error)
      return null
    }

    return data.snapshot_content
  }
}
