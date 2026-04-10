#!/usr/bin/env tsx

/**
 * Script de Validação de Variáveis de Ambiente
 * 
 * Uso: npx tsx scripts/validate-env.ts
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"

// Carregar .env.local manualmente
function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), ".env.local")
    const envContent = readFileSync(envPath, "utf-8")
    
    envContent.split("\n").forEach((line) => {
      // Ignorar comentários e linhas vazias
      if (!line || line.trim().startsWith("#")) return
      
      // Parse KEY=VALUE
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()
        
        // Remover aspas se existirem
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        
        // Não sobrescrever variáveis já definidas
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  } catch (error) {
    console.warn("⚠️  Não foi possível carregar .env.local:", error)
  }
}

// Carregar variáveis antes de validar
loadEnvLocal()

// Cores para output
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

async function validateEnv() {
  log("cyan", "\n╔══════════════════════════════════════════════════════════════╗")
  log("cyan", "║     Validação de Variáveis de Ambiente - MedVision          ║")
  log("cyan", "╚══════════════════════════════════════════════════════════════╝\n")

  let hasErrors = false
  const warnings: string[] = []

  // 1. Verificar NEXT_PUBLIC_SUPABASE_URL
  log("blue", "📍 Verificando NEXT_PUBLIC_SUPABASE_URL...")
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    log("red", "❌ NEXT_PUBLIC_SUPABASE_URL não está definida")
    hasErrors = true
  } else if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
    log("red", `❌ NEXT_PUBLIC_SUPABASE_URL parece inválida: ${supabaseUrl}`)
    hasErrors = true
  } else {
    const ref = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
    if (ref && ref[1]) {
      log("green", `✅ NEXT_PUBLIC_SUPABASE_URL válida (ref: ${ref[1]})`)
    } else {
      log("yellow", `⚠️  NEXT_PUBLIC_SUPABASE_URL parece válida, mas formato inesperado`)
      warnings.push("Formato inesperado na URL do Supabase")
    }
  }

  // 2. Verificar NEXT_PUBLIC_SUPABASE_ANON_KEY
  log("blue", "\n🔑 Verificando NEXT_PUBLIC_SUPABASE_ANON_KEY...")
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) {
    log("red", "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida")
    hasErrors = true
  } else if (!anonKey.startsWith("eyJ")) {
    log("red", "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY parece inválida (deve ser um JWT)")
    hasErrors = true
  } else {
    const decoded = decodeJWT(anonKey)
    if (decoded && decoded.role === "anon") {
      log("green", `✅ NEXT_PUBLIC_SUPABASE_ANON_KEY válida`)
      if (decoded.ref && supabaseUrl) {
        const urlRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
        if (decoded.ref === urlRef) {
          log("green", `✅ ref da chave anon bate com a URL (${decoded.ref})`)
        } else {
          log("red", `❌ ref da chave anon (${decoded.ref}) NÃO bate com a URL (${urlRef})`)
          hasErrors = true
        }
      }
    } else {
      log("red", "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY inválida ou não é role 'anon'")
      hasErrors = true
    }
  }

  // 3. Verificar SUPABASE_SERVICE_ROLE_KEY
  log("blue", "\n🔐 Verificando SUPABASE_SERVICE_ROLE_KEY...")
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    log("red", "❌ SUPABASE_SERVICE_ROLE_KEY não está definida")
    log("yellow", "   → Esta chave é necessária para criar usuários admin/vendedores")
    hasErrors = true
  } else if (!serviceKey.startsWith("eyJ")) {
    log("red", "❌ SUPABASE_SERVICE_ROLE_KEY parece inválida (deve ser um JWT)")
    hasErrors = true
  } else {
    const decoded = decodeJWT(serviceKey)
    if (decoded && decoded.role === "service_role") {
      log("green", `✅ SUPABASE_SERVICE_ROLE_KEY válida`)
      if (decoded.ref && supabaseUrl) {
        const urlRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
        if (decoded.ref === urlRef) {
          log("green", `✅ ref da service key bate com a URL (${decoded.ref})`)
        } else {
          log("red", `❌ ref da service key (${decoded.ref}) NÃO bate com a URL (${urlRef})`)
          log("yellow", `   → Você está usando uma chave de outro projeto!`)
          log("yellow", `   → Obtenha a chave correta em: https://supabase.com/dashboard/project/${urlRef}/settings/api`)
          hasErrors = true
        }
      }
    } else {
      log("red", "❌ SUPABASE_SERVICE_ROLE_KEY inválida ou não é role 'service_role'")
      hasErrors = true
    }
  }

  // 4. Testar conexão com Supabase (se as credenciais básicas existirem)
  if (supabaseUrl && anonKey && !hasErrors) {
    log("blue", "\n🌐 Testando conexão com Supabase...")
    try {
      const supabase = createClient(supabaseUrl, anonKey)
      const { data, error } = await supabase.from("profiles").select("count").limit(1)
      
      if (error) {
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          log("yellow", `⚠️  Conexão OK, mas tabela 'profiles' não existe`)
          log("yellow", `   → Execute as migrações: npm run db:push ou aplique manualmente`)
          warnings.push("Tabela profiles não encontrada")
        } else {
          log("yellow", `⚠️  Conexão estabelecida, mas erro ao consultar: ${error.message}`)
          warnings.push(`Erro na consulta: ${error.message}`)
        }
      } else {
        log("green", "✅ Conexão com Supabase estabelecida com sucesso")
      }
    } catch (error) {
      log("red", `❌ Erro ao tentar conectar com Supabase: ${error}`)
      hasErrors = true
    }
  }

  // 5. Verificar outras variáveis importantes
  log("blue", "\n🔧 Verificando outras variáveis...")
  
  const optionalVars = [
    { name: "NEXT_PUBLIC_SITE_URL", required: true },
    { name: "APP_URL", required: true },
    { name: "BUNNY_STORAGE_ZONE", required: false },
    { name: "BUNNY_STORAGE_API_KEY", required: false },
    { name: "BUNNY_CDN_BASE_URL", required: false },
    { name: "Z_API_INSTANCE_ID", required: false },
    { name: "Z_API_TOKEN", required: false },
    { name: "Z_API_CLIENT_TOKEN", required: false },
    { name: "OPENAI_API_KEY", required: false },
  ]

  for (const { name, required } of optionalVars) {
    if (process.env[name]) {
      log("green", `✅ ${name} definida`)
    } else {
      if (required) {
        log("red", `❌ ${name} não está definida (obrigatória)`)
        hasErrors = true
      } else {
        log("yellow", `⚠️  ${name} não está definida (opcional)`)
      }
    }
  }

  // Validação de completude Z-API
  log("blue", "\n📱 Verificando configuração Z-API (WhatsApp)...")
  const zapiInstanceId = process.env.Z_API_INSTANCE_ID
  const zapiToken = process.env.Z_API_TOKEN
  const zapiClientToken = process.env.Z_API_CLIENT_TOKEN
  const hasAnyZapi = zapiInstanceId || zapiToken || zapiClientToken
  const hasAllZapi = zapiInstanceId && zapiToken && zapiClientToken

  if (hasAnyZapi && !hasAllZapi) {
    log("yellow", "⚠️  Z-API parcialmente configurada:")
    if (!zapiInstanceId) log("yellow", "   → Z_API_INSTANCE_ID não definida")
    if (!zapiToken) log("yellow", "   → Z_API_TOKEN não definida")
    if (!zapiClientToken) log("yellow", "   → Z_API_CLIENT_TOKEN não definida")
    log("yellow", "   → Todas as 3 variáveis são necessárias para o WhatsApp funcionar")
    warnings.push("Z-API parcialmente configurada")
  } else if (hasAllZapi) {
    log("green", "✅ Z-API (WhatsApp) completamente configurada")
  } else {
    log("yellow", "⚠️  Z-API não configurada (integração WhatsApp desabilitada)")
  }

  // Resumo
  log("cyan", "\n╔══════════════════════════════════════════════════════════════╗")
  log("cyan", "║                         RESUMO                               ║")
  log("cyan", "╚══════════════════════════════════════════════════════════════╝\n")

  if (hasErrors) {
    log("red", "❌ Foram encontrados ERROS CRÍTICOS na configuração")
    log("yellow", "\n📝 Próximos passos:")
    log("yellow", "   1. Corrija os erros apontados acima")
    log("yellow", "   2. Consulte: docs/TROUBLESHOOTING_ENV.md")
    log("yellow", "   3. Execute este script novamente para validar")
    process.exit(1)
  } else if (warnings.length > 0) {
    log("yellow", `⚠️  Configuração funcional, mas com ${warnings.length} aviso(s)`)
    warnings.forEach((w, i) => log("yellow", `   ${i + 1}. ${w}`))
    log("green", "\n✅ Você pode prosseguir, mas considere resolver os avisos")
  } else {
    log("green", "✅ Todas as variáveis de ambiente estão CORRETAS!")
    log("green", "🚀 Você pode iniciar o servidor com: npm run dev")
  }
}

// Executar validação
validateEnv().catch((error) => {
  console.error("Erro inesperado:", error)
  process.exit(1)
})

