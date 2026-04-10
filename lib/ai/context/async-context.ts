/**
 * Thread-safe Context using AsyncLocalStorage
 *
 * Provides isolated context for each request, solving race conditions
 * in concurrent request handling. Used by tools and route handlers.
 */

import { AsyncLocalStorage } from 'async_hooks'

// ========================================
// CONTEXT TYPES
// ========================================

export interface UserProfile {
  name?: string
  email?: string
  profession?: string
  cro?: string
  university?: string
  semester?: string
  specialty?: string
  level?: string
  learningStyle?: 'visual' | 'reading' | 'practice' | 'mixed'
  responsePreference?: 'direct' | 'didactic' | 'hybrid'
}

export interface OdontoContext {
  userId: string
  sessionId: string
  userProfile: UserProfile
  permissions: string[]
  agentId?: string
  metadata?: Record<string, unknown>
}

// ========================================
// ASYNC LOCAL STORAGE INSTANCE
// ========================================

const asyncLocalStorage = new AsyncLocalStorage<OdontoContext>()

// ========================================
// CONTEXT FUNCTIONS
// ========================================

/**
 * Run a function with the given context.
 * All code within the callback will have access to the context via getContext().
 */
export async function runWithContext<T>(
  context: OdontoContext,
  fn: () => Promise<T>
): Promise<T> {
  return asyncLocalStorage.run(context, fn)
}

/**
 * Get the current context.
 * @throws Error if called outside of runWithContext
 */
export function getContext(): OdontoContext {
  const context = asyncLocalStorage.getStore()
  if (!context) {
    throw new Error(
      '[OdontoContext] Context not available. Ensure code is running within runWithContext().'
    )
  }
  return context
}

/**
 * Get the current context safely (returns null if not available).
 */
export function getContextSafe(): OdontoContext | null {
  return asyncLocalStorage.getStore() ?? null
}

/**
 * Check if context is available.
 */
export function hasContext(): boolean {
  return asyncLocalStorage.getStore() !== undefined
}

// ========================================
// CONTEXT HELPERS
// ========================================

/**
 * Get user ID from current context.
 */
export function getUserId(): string {
  return getContext().userId
}

/**
 * Get session ID from current context.
 */
export function getSessionId(): string {
  return getContext().sessionId
}

/**
 * Get agent ID from current context.
 */
export function getAgentId(): string {
  return getContext().agentId || 'medvision'
}

/**
 * Check if user has a specific permission.
 */
export function hasPermission(permission: string): boolean {
  const ctx = getContextSafe()
  return ctx?.permissions.includes(permission) ?? false
}

/**
 * Get user profile from context.
 */
export function getProfileInfo(): UserProfile {
  const ctx = getContextSafe()
  return ctx?.userProfile ?? {}
}

/**
 * Get metadata value from context.
 */
export function getMetadata<T = unknown>(key: string): T | undefined {
  const ctx = getContextSafe()
  return ctx?.metadata?.[key] as T | undefined
}

// ========================================
// CONTEXT FACTORY
// ========================================

/**
 * Create a minimal context for testing or simple use cases.
 */
export function createMinimalContext(
  userId: string,
  sessionId: string,
  agentId = 'medvision'
): OdontoContext {
  return {
    userId,
    sessionId,
    userProfile: {},
    permissions: ['read', 'write'],
    agentId,
    metadata: {},
  }
}

/**
 * Create a full context with user profile.
 */
export function createContext(params: {
  userId: string
  sessionId: string
  userProfile?: UserProfile
  permissions?: string[]
  agentId?: string
  metadata?: Record<string, unknown>
}): OdontoContext {
  return {
    userId: params.userId,
    sessionId: params.sessionId,
    userProfile: params.userProfile ?? {},
    permissions: params.permissions ?? ['read', 'write', 'create_artifacts'],
    agentId: params.agentId ?? 'medvision',
    metadata: params.metadata ?? {},
  }
}

// ========================================
// BACKWARD COMPATIBILITY
// ========================================

// Legacy exports for gradual migration from the old context system
export { getContext as requireContext }
export { getContextSafe as getContextOptional }
