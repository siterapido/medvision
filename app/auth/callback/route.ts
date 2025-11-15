import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const FALLBACK_PATH = '/dashboard'

export function sanitizeNextPath(nextPath: string | null) {
  if (!nextPath) return FALLBACK_PATH
  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) return FALLBACK_PATH
  return nextPath
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = sanitizeNextPath(requestUrl.searchParams.get('next'))

  if (!code) {
    console.warn('[auth/callback] Missing `code` param, redirecting user to login')
    return NextResponse.redirect(new URL('/login?error=auth_callback_missing_code', requestUrl.origin))
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[auth/callback] Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/login?error=auth_callback_error', requestUrl.origin))
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin))
  } catch (err) {
    console.error('[auth/callback] Unexpected error exchanging code for session:', err)
    return NextResponse.redirect(new URL('/login?error=auth_callback_error', requestUrl.origin))
  }
}
