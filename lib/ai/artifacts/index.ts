/**
 * Sistema de Artefatos do Odonto GPT
 *
 * Exporta schemas, streaming, contexto e persistência
 * para uso em tools do AI SDK v6
 */

// Schemas Zod e tipos
export * from './schemas';

// Context management (client-safe)
export {
  type OdontoContext,
  type UserProfile,
  setContext,
  getContext,
  getContextSafe,
  clearContext,
  createMinimalContext,
  hasPermission,
  getProfileInfo,
  addMetadata,
  withContext,
  requireContext,
} from './context';

// NOTE: initializeContext is server-only and must be imported directly:
// import { initializeContext } from '@/lib/ai/artifacts/context.server';

// Streaming
export {
  StreamingArtifact,
  streamSummary,
  streamFlashcard,
  streamQuiz,
  streamResearch,
  streamReport,
  ArtifactStore,
  artifactStore,
} from './streaming';

// Persistence
export {
  persistArtifact,
  createPersistentSummary,
  createPersistentFlashcard,
  createPersistentQuiz,
  createPersistentResearch,
  createPersistentReport,
} from './persistence';
