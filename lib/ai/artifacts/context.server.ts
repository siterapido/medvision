/**
 * Server-only context initialization
 * This file uses next/headers and must only be imported in server components/routes
 */

import { createClient } from '@/lib/supabase/server';
import { setContext, type OdontoContext } from './context';

/**
 * Inicializa o contexto com dados do usuário
 * SERVER-ONLY: Uses Supabase server client with cookies
 *
 * Resiliente a colunas ausentes: tenta buscar os campos completos e faz
 * fallback para os campos básicos se a migração ainda não foi aplicada.
 */
export async function initializeContext(
  userId: string,
  sessionId: string,
  agentId?: string
): Promise<OdontoContext> {
  const supabase = await createClient();

  // Tenta buscar perfil completo (inclui colunas da migração 20260327000001)
  let profile: Record<string, any> | null = null;

  const { data: fullProfile, error: fullError } = await supabase
    .from('profiles')
    .select('name, email, profession, cro, institution, university, semester, specialty_interest, academic_level')
    .eq('id', userId)
    .single();

  if (!fullError) {
    profile = fullProfile;
  } else {
    // Fallback: busca apenas colunas que existem desde o início
    const { data: basicProfile } = await supabase
      .from('profiles')
      .select('name, email, profession, cro, institution')
      .eq('id', userId)
      .single();
    profile = basicProfile;
  }

  const context: OdontoContext = {
    userId,
    sessionId,
    userProfile: {
      name: profile?.name || undefined,
      email: profile?.email || undefined,
      profession: profile?.profession || undefined,
      cro: profile?.cro || undefined,
      // university: nova coluna (migração 20260327000001), com fallback para 'institution'
      university: profile?.university || profile?.institution || undefined,
      semester: profile?.semester || undefined,
      specialty: profile?.specialty_interest || undefined,
      // academic_level: nova coluna da migração 20260327000001
      level: profile?.academic_level || undefined,
    },
    permissions: ['read', 'write', 'create_artifacts'],
    agentId,
    metadata: {},
  };

  setContext(context);
  return context;
}
