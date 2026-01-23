import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const envOk = Boolean(url && anon)
  const urlValid = typeof url === "string" && /^https?:\/\//.test(url)

  let supabaseOk = false
  let dbSample = 0
  let error: unknown = null

  if (envOk && url && anon) {
    try {
      const supabase = createServerClient(url, anon, {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // noop in health check
          },
        },
      })

      const { data, error: dbErr } = await supabase.from("agent_sessions").select("id").limit(1)
      if (dbErr) throw dbErr
      supabaseOk = true
      dbSample = Array.isArray(data) ? data.length : 0
    } catch (e) {
      error = (e as Error).message ?? String(e)
    }
  }

  return NextResponse.json({
    ok: envOk && urlValid && supabaseOk,
    env: {
      url: Boolean(url),
      anon: Boolean(anon),
      urlValid,
    },
    supabase: {
      connected: supabaseOk,
      sampleCount: dbSample,
      error,
    },
  })
}

