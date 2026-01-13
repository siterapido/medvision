/**
 * Session Cache Utility
 *
 * Client-side cache for agent sessions to improve performance and reduce API calls.
 * Uses localStorage for persistence across page reloads.
 */

export type AgentSession = {
  id: string
  agentType: "qa" | "image-analysis" | "orchestrated"
  status: "active" | "completed" | "error"
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  messageCount?: number
}

export type CachedSessionData = {
  sessions: AgentSession[]
  lastFetch: number
}

const CACHE_KEY = "agent_sessions_cache"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached sessions from localStorage
 */
export function getCachedSessions(): AgentSession[] {
  if (typeof window === "undefined") return []

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return []

    const data: CachedSessionData = JSON.parse(cached)
    const now = Date.now()

    // Check if cache is still valid
    if (now - data.lastFetch > CACHE_DURATION) {
      // Cache expired, clear it
      localStorage.removeItem(CACHE_KEY)
      return []
    }

    return data.sessions || []
  } catch (error) {
    console.error("[SessionCache] Error reading cache:", error)
    return []
  }
}

/**
 * Set cached sessions in localStorage
 */
export function setCachedSessions(sessions: AgentSession[]): void {
  if (typeof window === "undefined") return

  try {
    const data: CachedSessionData = {
      sessions,
      lastFetch: Date.now(),
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("[SessionCache] Error writing cache:", error)
  }
}

/**
 * Add or update a session in cache
 */
export function updateCachedSession(session: AgentSession): void {
  const sessions = getCachedSessions()
  const index = sessions.findIndex((s) => s.id === session.id)

  if (index >= 0) {
    // Update existing session
    sessions[index] = session
  } else {
    // Add new session at the beginning
    sessions.unshift(session)
  }

  // Limit cache to 50 most recent sessions
  const limitedSessions = sessions.slice(0, 50)
  setCachedSessions(limitedSessions)
}

/**
 * Remove a session from cache
 */
export function removeCachedSession(sessionId: string): void {
  const sessions = getCachedSessions()
  const filtered = sessions.filter((s) => s.id !== sessionId)
  setCachedSessions(filtered)
}

/**
 * Clear all cached sessions
 */
export function clearCachedSessions(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.error("[SessionCache] Error clearing cache:", error)
  }
}

/**
 * Check if cache is expired
 */
export function isCacheExpired(): boolean {
  if (typeof window === "undefined") return true

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return true

    const data: CachedSessionData = JSON.parse(cached)
    const now = Date.now()

    return now - data.lastFetch > CACHE_DURATION
  } catch (error) {
    return true
  }
}

/**
 * Fetch sessions from API with cache support
 */
export async function fetchSessions(options: {
  limit?: number
  offset?: number
  agentType?: string
  forceRefresh?: boolean
}): Promise<{ sessions: AgentSession[]; fromCache: boolean }> {
  const { limit = 20, offset = 0, agentType, forceRefresh = false } = options

  // Try to get from cache if not forcing refresh
  if (!forceRefresh && !isCacheExpired()) {
    const cached = getCachedSessions()
    if (cached.length > 0) {
      return {
        sessions: cached.slice(offset, offset + limit),
        fromCache: true,
      }
    }
  }

  // Fetch from API
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })

    if (agentType) {
      params.append("agentType", agentType)
    }

    const response = await fetch(`/api/sessions?${params}`)

    if (!response.ok) {
      throw new Error("Failed to fetch sessions")
    }

    const data = await response.json()

    // Update cache
    if (data.sessions) {
      setCachedSessions(data.sessions)
    }

    return {
      sessions: data.sessions || [],
      fromCache: false,
    }
  } catch (error) {
    console.error("[SessionCache] Error fetching sessions:", error)

    // Fallback to cache if API fails
    const cached = getCachedSessions()
    if (cached.length > 0) {
      return {
        sessions: cached.slice(offset, offset + limit),
        fromCache: true,
      }
    }

    return {
      sessions: [],
      fromCache: false,
    }
  }
}

/**
 * Delete a session via API and update cache
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error("Failed to delete session")
    }

    // Remove from cache
    removeCachedSession(sessionId)

    return true
  } catch (error) {
    console.error("[SessionCache] Error deleting session:", error)
    return false
  }
}
