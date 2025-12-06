import { execSync } from "child_process"
import fs from "fs"
import path from "path"

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations")

// Cores para o console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  bold: "\x1b[1m",
}

function getLocalMigrations(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`${colors.red}Diretório de migrações não encontrado: ${MIGRATIONS_DIR}${colors.reset}`)
    process.exit(1)
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
}

function getRemoteMigrations(): string[] {
  try {
    // Executa o comando supabase migration list e captura a saída
    // A saída geralmente é uma tabela com colunas: Local | Remote | Time (UTC) | Version | Name
    // Precisamos parsear isso ou usar --json se disponível (versões mais recentes suportam --json)
    
    // Tentar usar formato JSON primeiro (mais robusto)
    try {
      const output = execSync("npx supabase migration list --output json", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] })
      const migrations = JSON.parse(output)
      // migrations é um array de objetos { name, version, timestamp, ... }
      // Filtramos apenas as que estão aplicadas remotamente (remote timestamp não nulo)
      return migrations
        .filter((m: any) => m.remote)
        .map((m: any) => `${m.version}_${m.name}.sql`)
    } catch (e) {
      // Fallback para parsing de texto se JSON não for suportado ou falhar
      const output = execSync("npx supabase migration list", { encoding: "utf-8" })
      const lines = output.split("\n")
      
      // Pular cabeçalho e linhas vazias
      // Formato típico: 
      //  Local  | Remote           | Time (UTC)              | Version        | Name
      // ----------------------------------------------------------------------------------
      //  X      | 2023-10-25...    | 2023-10-25 10:00:00...  | 20231025100000 | description...
      
      const appliedMigrations: string[] = []
      
      for (const line of lines) {
        if (line.includes("|") && !line.includes("Local") && !line.includes("---")) {
          const parts = line.split("|").map(p => p.trim())
          if (parts.length >= 5) {
            const version = parts[3]
            const name = parts[4]
            const remoteStatus = parts[1] // Geralmente a data ou "X" se não aplicado
            
            // Se remoteStatus não estiver vazio e não for algo indicando "não aplicado"
            // Nota: Dependendo da versão do CLI, pode ser um checkbox ou data
            if (remoteStatus && remoteStatus.length > 0) {
              appliedMigrations.push(`${version}_${name}.sql`)
            }
          }
        }
      }
      return appliedMigrations
    }
  } catch (error) {
    console.error(`${colors.red}Erro ao buscar migrações remotas. Verifique se você está logado e linkado ao projeto.${colors.reset}`)
    console.error((error as Error).message)
    process.exit(1)
  }
}

async function main() {
  console.log(`${colors.blue}${colors.bold}Verificando sincronização de migrações...${colors.reset}\n`)

  const localMigrations = getLocalMigrations()
  
  // Se não tiver migrações locais, algo está errado ou é um projeto novo
  if (localMigrations.length === 0) {
    console.log(`${colors.yellow}Nenhuma migração local encontrada.${colors.reset}`)
    return
  }

  console.log(`Encontradas ${colors.bold}${localMigrations.length}${colors.reset} migrações locais.`)
  console.log(`Consultando banco de dados remoto...`)

  const remoteMigrations = getRemoteMigrations()
  console.log(`Encontradas ${colors.bold}${remoteMigrations.length}${colors.reset} migrações aplicadas remotamente.\n`)

  // Encontrar migrações pendentes (estão no local mas não no remoto)
  // Nota: A comparação exata de nome pode falhar se o CLI formatar diferente.
  // Melhor comparar por prefixo de versão (timestamp)
  
  const pendingMigrations = localMigrations.filter(local => {
    const version = local.split("_")[0]
    // Verifica se existe alguma remota com essa versão
    return !remoteMigrations.some(remote => remote.startsWith(version))
  })

  if (pendingMigrations.length === 0) {
    console.log(`${colors.green}✓ Todas as migrações estão sincronizadas!${colors.reset}`)
    process.exit(0)
  } else {
    console.log(`${colors.yellow}⚠ ${colors.bold}${pendingMigrations.length} migração(ões) pendente(s):${colors.reset}`)
    pendingMigrations.forEach(migration => {
      console.log(`  - ${colors.red}${migration}${colors.reset}`)
    })
    
    console.log(`\n${colors.blue}Para corrigir, execute:${colors.reset}`)
    console.log(`  ${colors.bold}npm run db:push${colors.reset}`)
    
    // Se estiver em CI, falhar o build
    if (process.env.CI) {
      console.log(`\n${colors.red}Falha na validação de migrações em ambiente CI.${colors.reset}`)
      process.exit(1)
    }
    
    process.exit(1) // Falhar também localmente para chamar atenção
  }
}

main().catch(console.error)


