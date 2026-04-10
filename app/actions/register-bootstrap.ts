"use server"

import { neonAuth } from "@neondatabase/auth/next/server"

import { getSql } from "@/lib/db/pool"
import { DEFAULT_ROLE } from "@/lib/auth/roles"
import { calculateTrialEndDate } from "@/lib/trial"

export type RegisterBootstrapInput = {
  name: string
  email: string
  whatsapp: string
  profession: string
  institution: string | null
  trialDays: number
}

/**
 * Cria ou atualiza o perfil após cadastro (substitui trigger no auth.users).
 */
export async function bootstrapProfileAfterSignup(input: RegisterBootstrapInput) {
  const { user } = await neonAuth()
  if (!user) {
    return { error: "Sessão não encontrada após o cadastro." }
  }

  const sql = getSql()
  const now = new Date()
  const trialEnd = calculateTrialEndDate(now, input.trialDays)

  await sql.query(
    `INSERT INTO public.profiles (
      id, email, name, role, whatsapp, profession, institution,
      trial_started_at, trial_ends_at, trial_used, plan_type, subscription_status,
      pipeline_stage, last_active_at, created_at, updated_at
    ) VALUES (
      $1::uuid, $2, $3, $4, $5, $6, $7,
      $8::timestamptz, $9::timestamptz, false, 'free', 'free',
      'cadastro', $8::timestamptz, now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.profiles.name),
      whatsapp = COALESCE(EXCLUDED.whatsapp, public.profiles.whatsapp),
      profession = COALESCE(EXCLUDED.profession, public.profiles.profession),
      institution = COALESCE(EXCLUDED.institution, public.profiles.institution),
      trial_started_at = COALESCE(public.profiles.trial_started_at, EXCLUDED.trial_started_at),
      trial_ends_at = COALESCE(public.profiles.trial_ends_at, EXCLUDED.trial_ends_at),
      updated_at = now()`,
    [
      user.id,
      input.email,
      input.name,
      DEFAULT_ROLE,
      input.whatsapp,
      input.profession,
      input.institution,
      now.toISOString(),
      trialEnd.toISOString(),
    ],
  )

  return { ok: true }
}

/**
 * Ajusta trial e pipeline após signup quando já existe sessão.
 */
export async function applyTrialAfterSignup(input: {
  trialDays: number
  pipelineStageFallback: string
}) {
  const { user } = await neonAuth()
  if (!user) return { error: "Não autenticado" }

  const sql = getSql()
  const now = new Date()
  const trialEnd = calculateTrialEndDate(now, input.trialDays)

  const existing = await sql.query(
    `SELECT pipeline_stage FROM public.profiles WHERE id = $1::uuid LIMIT 1`,
    [user.id],
  )
  const current = (existing as { pipeline_stage: string | null }[])[0]
  const pipeline = current?.pipeline_stage || input.pipelineStageFallback

  await sql.query(
    `UPDATE public.profiles SET
      trial_started_at = $2::timestamptz,
      trial_ends_at = $3::timestamptz,
      trial_used = false,
      pipeline_stage = $4,
      updated_at = now()
    WHERE id = $1::uuid`,
    [user.id, now.toISOString(), trialEnd.toISOString(), pipeline],
  )

  return { ok: true }
}
