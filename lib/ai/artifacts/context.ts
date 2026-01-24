/**
 * Typed Context para o sistema de artefatos
 * Gerencia estado global durante execução de tools
 *
 * NOTE: This file is client-safe. Server-only functions are in context.server.ts
 */

// ========================================
// CONTEXT TYPES
// ========================================
export interface UserProfile {
  name?: string;
  email?: string;
  profession?: string;
  cro?: string;
  university?: string;
  semester?: string;
  specialty?: string;
  level?: string;
}

export interface OdontoContext {
  userId: string;
  sessionId: string;
  userProfile: UserProfile;
  permissions: string[];
  agentId?: string;
  metadata?: Record<string, any>;
}

// ========================================
// CONTEXT STORE (usando AsyncLocalStorage para isolamento)
// ========================================
let currentContext: OdontoContext | null = null;

/**
 * Define o contexto atual para a execução
 */
export function setContext(context: OdontoContext): void {
  currentContext = context;
}

/**
 * Obtém o contexto atual
 * @throws Error se contexto não estiver definido
 */
export function getContext(): OdontoContext {
  if (!currentContext) {
    throw new Error(
      '[OdontoContext] Context not initialized. Call setContext() before using tools.'
    );
  }
  return currentContext;
}

/**
 * Obtém o contexto de forma segura (pode retornar null)
 */
export function getContextSafe(): OdontoContext | null {
  return currentContext;
}

/**
 * Limpa o contexto atual
 */
export function clearContext(): void {
  currentContext = null;
}

/**
 * Cria contexto mínimo para testes ou uso simplificado
 */
export function createMinimalContext(
  userId: string,
  sessionId: string
): OdontoContext {
  return {
    userId,
    sessionId,
    userProfile: {},
    permissions: ['read', 'write'],
  };
}

// ========================================
// CONTEXT HELPERS
// ========================================

/**
 * Verifica se usuário tem permissão específica
 */
export function hasPermission(permission: string): boolean {
  const ctx = getContextSafe();
  return ctx?.permissions.includes(permission) ?? false;
}

/**
 * Obtém informação do perfil de forma segura
 */
export function getProfileInfo(): UserProfile {
  const ctx = getContextSafe();
  return ctx?.userProfile ?? {};
}

/**
 * Adiciona metadata ao contexto atual
 */
export function addMetadata(key: string, value: any): void {
  const ctx = getContextSafe();
  if (ctx) {
    ctx.metadata = ctx.metadata ?? {};
    ctx.metadata[key] = value;
  }
}

// ========================================
// CONTEXT WRAPPER FOR TOOL EXECUTION
// ========================================

/**
 * Executa uma função com contexto garantido
 */
export async function withContext<T>(
  context: OdontoContext,
  fn: () => Promise<T>
): Promise<T> {
  const previousContext = currentContext;
  try {
    setContext(context);
    return await fn();
  } finally {
    currentContext = previousContext;
  }
}

/**
 * Decorator para garantir contexto em tools
 */
export function requireContext<T extends (...args: any[]) => any>(
  fn: T
): T {
  return ((...args: Parameters<T>) => {
    const ctx = getContext(); // Vai lançar erro se não existir
    return fn(...args);
  }) as T;
}
