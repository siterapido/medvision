#!/usr/bin/env tsx

/**
 * Script para gerenciar variáveis de ambiente na Vercel via CLI
 *
 * Uso:
 *   npm run vercel:env                 # Listar todas as variáveis
 *   npm run vercel:env:sync            # Sincronizar do .env.local para Vercel
 *   npm run vercel:env:add             # Adicionar nova variável
 *   npm run vercel:env:remove          # Remover variável
 *   tsx scripts/update-vercel-env.ts --env production  # Para ambiente específico
 *
 * Ambientes: production (default), preview, development
 */

import { execSync } from "child_process"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import dotenv from "dotenv"

// Cores para output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
}

type Environment = "production" | "preview" | "development"
type Command = "list" | "sync" | "add" | "remove"

interface Config {
  environment: Environment
  envFile: string
  command: Command
  varName?: string
  varValue?: string
}

// Parse argumentos da CLI
function parseArgs(): Config {
  const args = process.argv.slice(2)
  const config: Partial<Config> = {
    environment: "production",
    command: "list",
    envFile: ".env.local",
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case "--env":
      case "-e":
        config.environment = args[++i] as Environment
        break
      case "--file":
      case "-f":
        config.envFile = args[++i]
        break
      case "--add":
      case "-a":
        config.command = "add"
        config.varName = args[++i]
        config.varValue = args[++i]
        break
      case "--remove":
      case "-r":
        config.command = "remove"
        config.varName = args[++i]
        break
      case "--sync":
      case "-s":
        config.command = "sync"
        break
      case "--help":
      case "-h":
        printHelp()
        process.exit(0)
    }
  }

  return config as Config
}

function printHelp() {
  console.log(`
${colors.cyan}🚀 Gerenciador de Variáveis de Ambiente da Vercel${colors.reset}

${colors.yellow}Uso:${colors.reset}
  tsx scripts/update-vercel-env.ts [options]

${colors.yellow}Comandos:${colors.reset}
  --list, -l              Lista todas as variáveis (default)
  --sync, -s              Sincroniza do arquivo .env para Vercel
  --add, -a <NAME> <VAL>  Adiciona/atualiza uma variável
  --remove, -r <NAME>     Remove uma variável
  --help, -h              Mostra esta ajuda

${colors.yellow}Opções:${colors.reset}
  --env, -e <ENV>         Ambiente: production, preview, development
                          (default: production)
  --file, -f <FILE>       Arquivo .env de origem (default: .env.local)

${colors.yellow}Exemplos:${colors.reset}
  # Listar todas as variáveis de produção
  tsx scripts/update-vercel-env.ts

  # Listar variáveis de preview
  tsx scripts/update-vercel-env.ts --env preview

  # Sincronizar .env.local para produção
  tsx scripts/update-vercel-env.ts --sync

  # Sincronizar .env.production para preview
  tsx scripts/update-vercel-env.ts --sync --file .env.production --env preview

  # Adicionar uma variável
  tsx scripts/update-vercel-env.ts --add NEXT_PUBLIC_API_KEY "sk-123"

  # Remover uma variável
  tsx scripts/update-vercel-env.ts --remove OLD_VAR

${colors.yellow}Via npm:${colors.reset}
  npm run vercel:env              # Listar
  npm run vercel:env:sync         # Sincronizar
  npm run vercel:env:add VAR VAL  # Adicionar
  npm run vercel:env:remove VAR   # Remover
`)
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function exec(command: string, silent = false): string {
  try {
    const output = execSync(command, {
      encoding: "utf-8",
      stdio: silent ? "pipe" : "inherit",
    })
    return output
  } catch (error) {
    log(`❌ Erro ao executar comando: ${command}`, colors.red)
    throw error
  }
}

function listVariables(environment: Environment) {
  log(`\n📋 Variáveis de ambiente na Vercel (${environment}):\n`, colors.cyan)

  try {
    const output = exec("vercel env ls --json", true)
    const variables = JSON.parse(output)

    if (variables.length === 0) {
      log("  Nenhuma variável encontrada.", colors.yellow)
      return
    }

    // Filtrar por ambiente
    const filtered = variables.filter((v: any) => {
      if (environment === "production") return v.type === "production"
      if (environment === "preview") return v.type === "preview" || v.type === "development"
      if (environment === "development") return v.type === "development"
      return true
    })

    if (filtered.length === 0) {
      log(`  Nenhuma variável encontrada para ${environment}.`, colors.yellow)
      return
    }

    // Agrupar por tipo
    const grouped = filtered.reduce((acc: any, v: any) => {
      if (!acc[v.type]) acc[v.type] = []
      acc[v.type].push(v)
      return acc
    }, {})

    // Exibir agrupado
    Object.entries(grouped).forEach(([type, vars]: [string, any]) => {
      log(`\n  ${type.toUpperCase()}:`, colors.blue)
      vars.forEach((v: any) => {
        log(`    • ${v.key}`, colors.reset)
      })
    })

    log(`\n  Total: ${filtered.length} variável(is)\n`, colors.green)
  } catch (error) {
    log("  Erro ao listar variáveis. Verifique se está autenticado na Vercel.", colors.red)
    log("  Execute: vercel login", colors.yellow)
  }
}

function addVariable(name: string, value: string, environment: Environment) {
  log(`\n➕ Adicionando variável: ${name}`, colors.cyan)
  log(`   Ambiente: ${environment}`, colors.cyan)
  log(`   Valor: ${value ? "***" + value.slice(-4) : "(vazia)"}\n`, colors.cyan)

  // Determinar o tipo baseado no ambiente
  let type = environment
  if (environment === "preview") {
    type = "preview" // Adiciona para preview e development
  }

  // Usar vercel env add com valor via echo para evitar problemas com caracteres especiais
  try {
    const cmd = `echo "${value}" | vercel env add "${name}" ${type}`
    exec(cmd)
    log(`✅ Variável ${name} adicionada com sucesso!`, colors.green)
  } catch (error) {
    log(`❌ Erro ao adicionar variável ${name}`, colors.red)
    throw error
  }
}

function removeVariable(name: string, environment: Environment) {
  log(`\n🗑️  Removendo variável: ${name}`, colors.cyan)
  log(`   Ambiente: ${environment}\n`, colors.cyan)

  let type = environment
  if (environment === "preview") {
    type = "preview"
  }

  try {
    exec(`vercel env rm "${name}" ${type} --yes`)
    log(`✅ Variável ${name} removida com sucesso!`, colors.green)
  } catch (error) {
    log(`❌ Erro ao remover variável ${name}`, colors.red)
    log(`   A variável pode não existir no ambiente ${environment}`, colors.yellow)
  }
}

function syncVariables(envFile: string, environment: Environment) {
  log(`\n🔄 Sincronizando variáveis do ${envFile} para Vercel (${environment})\n`, colors.cyan)

  // Verificar se arquivo existe
  const envPath = join(process.cwd(), envFile)
  if (!existsSync(envPath)) {
    log(`❌ Arquivo ${envFile} não encontrado!`, colors.red)
    log(`   Caminho buscado: ${envPath}`, colors.yellow)
    process.exit(1)
  }

  // Carregar variáveis do arquivo
  const envConfig = dotenv.parse(readFileSync(envPath))

  if (Object.keys(envConfig).length === 0) {
    log(`❌ Nenhuma variável encontrada em ${envFile}`, colors.red)
    process.exit(1)
  }

  log(`   Encontradas: ${Object.keys(envConfig).length} variável(is)\n`, colors.blue)

  // Variáveis que devem ser apenas públicas
  const publicOnly = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_MAX_ATTACHMENT_MB",
    "NEXT_PUBLIC_SENTRY_DSN",
    "SENTRY_DSN",
  ]

  let successCount = 0
  let errorCount = 0

  // Sincronizar cada variável
  for (const [key, value] of Object.entries(envConfig)) {
    try {
      log(`   • ${key}`, colors.blue)

      // Adicionar para o ambiente apropriado
      let type = environment
      if (environment === "production") {
        // Em produção, variáveis públicas vão para todos os ambientes
        if (publicOnly.some((prefix) => key.startsWith(prefix))) {
          exec(`echo "${value}" | vercel env add "${key}"`, true)
        } else {
          exec(`echo "${value}" | vercel env add "${key}" production`, true)
        }
      } else if (environment === "preview") {
        exec(`echo "${value}" | vercel env add "${key}" preview`, true)
      } else {
        exec(`echo "${value}" | vercel env add "${key}" development`, true)
      }

      successCount++
    } catch (error) {
      log(`     ✗ Erro ao adicionar ${key}`, colors.red)
      errorCount++
    }
  }

  log(`\n✅ Sincronização concluída!`, colors.green)
  log(`   Sucesso: ${successCount}`, colors.green)
  if (errorCount > 0) {
    log(`   Erros: ${errorCount}`, colors.red)
  }
  log("")
}

function main() {
  const config = parseArgs()

  // Verificar se está autenticado na Vercel
  try {
    exec("vercel whoami --json", true)
  } catch (error) {
    log("\n❌ Você não está autenticado na Vercel!", colors.red)
    log("   Execute: vercel login", colors.yellow)
    log("")
    process.exit(1)
  }

  // Executar comando
  switch (config.command) {
    case "list":
      listVariables(config.environment)
      break
    case "add":
      if (!config.varName) {
        log("❌ Nome da variável é obrigatório para --add", colors.red)
        log("   Uso: --add NOME VALOR", colors.yellow)
        process.exit(1)
      }
      addVariable(config.varName, config.varValue || "", config.environment)
      break
    case "remove":
      if (!config.varName) {
        log("❌ Nome da variável é obrigatório para --remove", colors.red)
        log("   Uso: --remove NOME", colors.yellow)
        process.exit(1)
      }
      removeVariable(config.varName, config.environment)
      break
    case "sync":
      syncVariables(config.envFile, config.environment)
      break
  }
}

// Executar
if (require.main === module) {
  main()
}

export { main, parseArgs, listVariables, addVariable, removeVariable, syncVariables }
