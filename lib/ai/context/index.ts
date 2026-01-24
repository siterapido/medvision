/**
 * Context Module Exports
 *
 * Thread-safe context management using AsyncLocalStorage.
 */

export {
  // Types
  type OdontoContext,
  type UserProfile,
  // Core functions
  runWithContext,
  getContext,
  getContextSafe,
  hasContext,
  // Helpers
  getUserId,
  getSessionId,
  getAgentId,
  hasPermission,
  getProfileInfo,
  getMetadata,
  // Factories
  createMinimalContext,
  createContext,
  // Legacy
  requireContext,
  getContextOptional,
} from './async-context'
