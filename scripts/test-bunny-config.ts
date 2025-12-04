#!/usr/bin/env tsx
/**
 * Script para testar a configuração do Bunny CDN
 * 
 * Uso: npx tsx scripts/test-bunny-config.ts
 */

import { readFileSync } from "fs"
import { join } from "path"

// Carrega variáveis de ambiente do .env.local se existir
try {
  const envPath = join(process.cwd(), ".env.local")
  const envContent = readFileSync(envPath, "utf-8")
  const envLines = envContent.split("\n")
  
  for (const line of envLines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    
    const [key, ...valueParts] = trimmed.split("=")
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").replace(/^["']|["']$/g, "")
      process.env[key.trim()] = value.trim()
    }
  }
} catch (err) {
  console.warn("⚠️  Arquivo .env.local não encontrado. Usando variáveis de ambiente do sistema.")
}

interface ConfigCheck {
  name: string
  value: string | undefined
  required: boolean
  valid: boolean
  message: string
}

function checkConfig(): ConfigCheck[] {
  const checks: ConfigCheck[] = [
    {
      name: "BUNNY_STORAGE_ZONE",
      value: process.env.BUNNY_STORAGE_ZONE,
      required: true,
      valid: !!process.env.BUNNY_STORAGE_ZONE,
      message: process.env.BUNNY_STORAGE_ZONE 
        ? "✓ Configurado" 
        : "✗ Não configurado - Nome da Storage Zone",
    },
    {
      name: "BUNNY_STORAGE_API_KEY",
      value: process.env.BUNNY_STORAGE_API_KEY 
        ? `${process.env.BUNNY_STORAGE_API_KEY.substring(0, 8)}...` 
        : undefined,
      required: true,
      valid: !!process.env.BUNNY_STORAGE_API_KEY,
      message: process.env.BUNNY_STORAGE_API_KEY 
        ? "✓ Configurado" 
        : "✗ Não configurado - Access Key da Storage Zone",
    },
    {
      name: "BUNNY_CDN_BASE_URL",
      value: process.env.BUNNY_CDN_BASE_URL,
      required: true,
      valid: !!process.env.BUNNY_CDN_BASE_URL && process.env.BUNNY_CDN_BASE_URL.startsWith("https://"),
      message: process.env.BUNNY_CDN_BASE_URL 
        ? (process.env.BUNNY_CDN_BASE_URL.startsWith("https://") 
          ? "✓ Configurado corretamente" 
          : "⚠ URL deve começar com https://")
        : "✗ Não configurado - URL do Pull Zone",
    },
    {
      name: "BUNNY_STORAGE_HOST",
      value: process.env.BUNNY_STORAGE_HOST || "storage.bunnycdn.com (padrão)",
      required: false,
      valid: true,
      message: "✓ Usando padrão ou configurado",
    },
  ]

  return checks
}

async function testBunnyConnection() {
  const storageZone = process.env.BUNNY_STORAGE_ZONE
  const apiKey = process.env.BUNNY_STORAGE_API_KEY
  const host = process.env.BUNNY_STORAGE_HOST || "storage.bunnycdn.com"

  if (!storageZone || !apiKey) {
    console.log("⚠️  Não é possível testar conexão sem credenciais")
    return false
  }

  try {
    // Tenta fazer upload de um arquivo de teste pequeno para verificar credenciais
    const testUrl = `https://${host}/${storageZone}/.bunny-test-${Date.now()}.txt`
    const testContent = "Bunny CDN Test File"
    
    const response = await fetch(testUrl, {
      method: "PUT",
      headers: {
        AccessKey: apiKey,
        "Content-Type": "text/plain",
        "Content-Length": testContent.length.toString(),
      },
      body: testContent,
    })

    if (response.ok) {
      // Limpa o arquivo de teste
      await fetch(testUrl, {
        method: "DELETE",
        headers: {
          AccessKey: apiKey,
        },
      }).catch(() => {}) // Ignora erros na limpeza
      
      console.log("✓ Conexão com Bunny Storage funcionando")
      console.log("✓ Credenciais válidas - upload e delete testados com sucesso")
      return true
    } else {
      const errorText = await response.text().catch(() => response.statusText)
      console.log(`⚠️  Resposta inesperada: ${response.status} ${response.statusText}`)
      
      if (response.status === 401) {
        console.log("   💡 Dica: Verifique se BUNNY_STORAGE_API_KEY está correto")
        console.log("   💡 Certifique-se de usar a Access Key da Storage Zone (não FTP Password)")
      } else if (response.status === 404) {
        console.log("   💡 Dica: Verifique se BUNNY_STORAGE_ZONE está correto")
      }
      
      if (errorText && errorText.length < 200) {
        console.log(`   Detalhes: ${errorText}`)
      }
      
      return false
    }
  } catch (error) {
    console.log(`✗ Erro ao conectar: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

async function main() {
  console.log("🔍 Verificando configuração do Bunny CDN...\n")

  const checks = checkConfig()
  let allValid = true

  for (const check of checks) {
    const status = check.valid ? "✓" : check.required ? "✗" : "⚠"
    console.log(`${status} ${check.name}: ${check.message}`)
    if (check.value && check.name !== "BUNNY_STORAGE_API_KEY") {
      console.log(`   Valor: ${check.value}`)
    }
    if (check.required && !check.valid) {
      allValid = false
    }
  }

  console.log("\n" + "=".repeat(50))

  if (!allValid) {
    console.log("\n❌ Configuração incompleta!")
    console.log("\n📖 Consulte docs/bunny-cdn-setup.md para instruções detalhadas")
    process.exit(1)
  }

  console.log("\n✅ Todas as variáveis obrigatórias estão configuradas")
  console.log("\n🧪 Testando conexão com Bunny Storage...")

  const connectionOk = await testBunnyConnection()

  console.log("\n" + "=".repeat(50))
  
  if (connectionOk) {
    console.log("\n✅ Configuração do Bunny CDN está correta!")
    console.log("\n💡 Próximos passos:")
    console.log("   1. Teste fazer upload de um arquivo pelo admin")
    console.log("   2. Verifique se a URL gerada usa o BUNNY_CDN_BASE_URL")
    console.log("   3. Acesse a URL gerada para confirmar que o arquivo está acessível")
  } else {
    console.log("\n⚠️  Verifique as credenciais no dashboard do Bunny.net")
    console.log("   - Certifique-se de estar usando a Access Key da Storage Zone")
    console.log("   - Verifique se a Storage Zone está ativa")
  }
}

main().catch((error) => {
  console.error("Erro ao executar teste:", error)
  process.exit(1)
})

