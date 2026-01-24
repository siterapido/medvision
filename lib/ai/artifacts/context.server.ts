/**
 * Server-only context initialization
 * This file uses next/headers and must only be imported in server components/routes
 */

import { createClient } from '@/lib/supabase/server';
import { setContext, type OdontoContext } from './context';

/**
 * Inicializa o contexto com dados do usuário
 * SERVER-ONLY: Uses Supabase server client with cookies
 */
export async function initializeContext(
  userId: string,
  sessionId: string,
  agentId?: string
): Promise<OdontoContext> {
  const supabase = await createClient();

  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, profession, cro, university, semester, specialty_interest, level')
    .eq('id', userId)
    .single();

  const context: OdontoContext = {
    userId,
    sessionId,
    userProfile: {
      name: profile?.name || undefined,
      email: profile?.email || undefined,
      profession: profile?.profession || undefined,
      cro: profile?.cro || undefined,
      university: profile?.university || undefined,
      semester: profile?.semester || undefined,
      specialty: profile?.specialty_interest || undefined,
      level: profile?.level || undefined,
    },
    permissions: ['read', 'write', 'create_artifacts'],
    agentId,
    metadata: {},
  };

  setContext(context);
  return context;
}
