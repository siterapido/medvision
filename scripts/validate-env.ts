#!/usr/bin/env tsx

/**
 * Valida variáveis de ambiente (stack primário: Neon + DATABASE_URL)
 *
 * Uso: npx tsx scripts/validate-env.ts
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"
import { neon } from "@neondatabase/serverless"

function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), ".env.local")
    const envContent = readFileSync(envPath, "utf-8")

    envContent.split("\n").forEach((line) => {
      if (!line || line.trim().startsWith("#")) return
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  } catch (error) {
    console.warn("⚠️  Não foi possível carregar .env.local:", error)
  }
}

loadEnvLocal()

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
}

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], "base64").toString("utf-8")
    return JSON.parse(payload)
  } catch {
    return null
  }
}

function isValidPostgresUrl(url: string) {
  return url.startsWith("postgres://") || url.startsWith("postgresql://")
}

/** Validação legada (projeto ainda com URL Supabase no .env) */
async function validateSupabaseLegacy(
  hasErrors: { v: boolean },
  warnings: string[]
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return
  }

  log("blue", "\n📦 Modo legado: NEXT_PUBLIC_SUPABASE_URL definida — validando chaves...")

  if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
    log("red", "❌ NEXT_PUBLIC_SUPABASE_URL parece inválida")
    hasErrors.v = true
  } else {
    const ref = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
    if (ref?.[1]) {
      log("green", `✅ URL Supabase (ref: ${ref[1]})`)
    } else {
      log("yellow", "⚠️  Formato inesperado em NEXT_PUBLIC_SUPABASE_URL")
      warnings.push("Formato inesperado na URL do Supabase")
    }
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) {
    log("red", "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida")
    hasErrors.v = true
  } else if (!anonKey.startsWith("eyJ")) {
    log("red", "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY parece inválida (JWT esperado)")
    hasErrors.v = true
  } else {
    const decoded = decodeJWT(anonKey)
    if (decoded && decoded.role === "anon") {
      log("green", "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY válida")
    } else {
      log("red", "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY inválida (role não é anon)")
      hasErrors.v = true
    }
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    log("red", "❌ SUPABASE_SERVICE_ROLE_KEY não está definida")
    hasErrors.v = true
  } else if (!serviceKey.startsWith("eyJ")) {
    log("red", "❌ SUPABASE_SERVICE_ROLE_KEY parece inválida")
    hasErrors.v = true
  } else {
    const decoded = decodeJWT(serviceKey)
    if (decoded && decoded.role === "service_role") {
      log("green", "✅ SUPABASE_SERVICE_ROLE_KEY válida")
    } else {
      log("red", "❌ SUPABASE_SERVICE_ROLE_KEY inválida (role service_role esperada)")
      hasErrors.v = true
    }
  }

  if (supabaseUrl && anonKey && !hasErrors.v) {
    log("blue", "🌐 Testando conexão Supabase (legado)...")
    try {
      const supabase = createClient(supabaseUrl, anonKey)
      const { error } = await supabase.from("profiles").select("count").limit(1)
      if (error) {
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          log("yellow", "⚠️  Conexão OK, tabela 'profiles' não encontrada (migrações?)")
          warnings.push("Tabela profiles não encontrada (legado)")
        } else {
          log("yellow", `⚠️  ${error.message}`)
          warnings.push(`Supabase: ${error.message}`)
        }
      } else {
        log("green", "✅ Conexão Supabase (legado) ok")
      }
    } catch (error) {
      log("red", `❌ ${error}`)
      hasErrors.v = true
    }
  }
}

async function validateEnv() {
  log("cyan", "\n╔══════════════════════════════════════════════════════════════╗")
  log("cyan", "║     Validação de Variáveis de Ambiente - MedVision         ║")
  log("cyan", "╚══════════════════════════════════════════════════════════════╝\n")

  let hasErrors = false
  const warnings: string[] = []
  const errRef = { v: false }

  // 1) Neon / DATABASE_URL (obrigatório no stack atual)
  log("blue", "🗄️  Verificando DATABASE_URL (Neon/Postgres)...")
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    log("red", "❌ DATABASE_URL não está definida (necessária para o app e crons)")
    hasErrors = true
  } else if (!isValidPostgresUrl(databaseUrl)) {
    log("red", "❌ DATABASE_URL deve ser postgres:// ou postgresql://")
    hasErrors = true
  } else {
    log("green", "✅ DATABASE_URL com formato de URL PostgreSQL")
    try {
      const sql = neon(databaseUrl)
      await sql`SELECT 1`
      log("green", "✅ Conexão ao banco (SELECT 1) ok")
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      log("red", `❌ Falha ao conectar com DATABASE_URL: ${msg}`)
      hasErrors = true
    }
  }

  // 2) Vercel crons (recomendado em produção)
  log("blue", "\n⏰ Verificando CRON_SECRET (rotas /api/cron/*)...")
  if (!process.env.CRON_SECRET) {
    log("yellow", "⚠️  CRON_SECRET não definida — obrigatória na Vercel para crons autenticados")
    log("yellow", "   → production: adicione em Vercel → Settings → Environment Variables")
    warnings.push("CRON_SECRET ausente (crons em produção exigem)")
  } else {
    if (process.env.CRON_SECRET.length < 16) {
      log("yellow", "⚠️  CRON_SECRET muito curta (recomendado: ≥ 16 caracteres aleatórios)")
      warnings.push("CRON_SECRET curta")
    } else {
      log("green", "✅ CRON_SECRET definida")
    }
  }

  // 3) Supabase só se ainda houver legado
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    await validateSupabaseLegacy(errRef, warnings)
    hasErrors = hasErrors || errRef.v
  } else {
    log("blue", "\n📭 Stack Neon: variáveis Supabase legado omitidas (esperado)")
  }

  // 4) Outras
  log("blue", "\n🔧 Outras variáveis...")

  const otherRequired = [
    { name: "NEXT_PUBLIC_SITE_URL", required: true },
    { name: "APP_URL", required: true },
  ] as const

  for (const { name, required } of otherRequired) {
    if (process.env[name]) {
      log("green", `✅ ${name} definida`)
    } else if (required) {
      log("red", `❌ ${name} não está definida (obrigatória)`)
      hasErrors = true
    } else {
      log("yellow", `⚠️  ${name} não está definida`)
    }
  }

  const optionalVars = [
    "BUNNY_STORAGE_ZONE",
    "BUNNY_STORAGE_API_KEY",
    "BUNNY_CDN_BASE_URL",
    "Z_API_INSTANCE_ID",
    "Z_API_TOKEN",
    "Z_API_CLIENT_TOKEN",
    "OPENAI_API_KEY",
  ]
  for (const name of optionalVars) {
    if (process.env[name]) {
      log("green", `✅ ${name} definida`)
    } else {
      log("yellow", `⚠️  ${name} não está definida (opcional)`)
    }
  }

  log("blue", "\n📱 Z-API (WhatsApp)...")
  const zapiInstanceId = process.env.Z_API_INSTANCE_ID
  const zapiToken = process.env.Z_API_TOKEN
  const zapiClientToken = process.env.Z_API_CLIENT_TOKEN
  const hasAnyZapi = zapiInstanceId || zapiToken || zapiClientToken
  const hasAllZapi = zapiInstanceId && zapiToken && zapiClientToken

  if (hasAnyZapi && !hasAllZapi) {
    log("yellow", "⚠️  Z-API parcialmente configurada")
    if (!zapiInstanceId) log("yellow", "   → Z_API_INSTANCE_ID")
    if (!zapiToken) log("yellow", "   → Z_API_TOKEN")
    if (!zapiClientToken) log("yellow", "   → Z_API_CLIENT_TOKEN")
    warnings.push("Z-API parcial")
  } else if (hasAllZapi) {
    log("green", "✅ Z-API completa")
  } else {
    log("yellow", "⚠️  Z-API não configurada (WhatsApp desabilitado)")
  }

  log("cyan", "\n╔══════════════════════════════════════════════════════════════╗")
  log("cyan", "║                         RESUMO                               ║")
  log("cyan", "╚══════════════════════════════════════════════════════════════╝\n")

  if (hasErrors) {
    log("red", "❌ Foram encontrados erros críticos na configuração")
    log("yellow", "\n📝 Dica: veja .env.example e docs/TROUBLESHOOTING_ENV.md se existir")
    process.exit(1)
  } else if (warnings.length > 0) {
    log("yellow", `⚠️  ${warnings.length} aviso(s)`)
    warnings.forEach((w, i) => log("yellow", `   ${i + 1}. ${w}`))
    log("green", "\n✅ Pode prosseguir; considere corrigir os avisos em produção")
  } else {
    log("green", "✅ Variáveis ok — npm run dev")
  }
}

validateEnv().catch((error) => {
  console.error("Erro inesperado:", error)
  process.exit(1)
})
