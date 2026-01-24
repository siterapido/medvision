/**
 * Sistema de Artefatos do Odonto GPT
 *
 * Exporta schemas, streaming, contexto e persistência
 * para uso em tools do AI SDK v6
 */

// Schemas Zod e tipos
export * from './schemas';

// Context management
export {
  type OdontoContext,
  type UserProfile,
  setContext,
  getContext,
  getContextSafe,
  clearContext,
  initializeContext,
  createMinimalContext,
  hasPermission,
  getProfileInfo,
  addMetadata,
  withContext,
  requireContext,
} from './context';

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
