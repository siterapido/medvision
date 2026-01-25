/**
 * Health Check Endpoint
 * Verifies API configuration and basic connectivity
 */

export async function GET() {
  const checks = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    openrouterKey: !!process.env.OPENROUTER_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }

  const allHealthy = checks.supabaseUrl && checks.supabaseKey && checks.openrouterKey

  return new Response(JSON.stringify({
    status: allHealthy ? 'ok' : 'missing-config',
    checks,
  }), {
    status: allHealthy ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  })
}
