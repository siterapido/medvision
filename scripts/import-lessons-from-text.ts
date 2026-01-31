#!/usr/bin/env tsx
/**
 * Script para importar aulas de um curso a partir de dados em texto
 * 
 * Uso: npx tsx scripts/import-lessons-from-text.ts
 * 
 * Requer variáveis de ambiente:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import { resolve } from "path"
import { readFileSync } from "fs"

// Carregar variáveis de ambiente
const envPath = resolve(process.cwd(), ".env.local")
dotenv.config({ path: envPath })

// Também tentar ler diretamente do arquivo caso dotenv não funcione
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
let supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim()

if (!supabaseUrl || !supabaseKey) {
  try {
    const envContent = readFileSync(envPath, "utf-8")
    const lines = envContent.split("\n")
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=") && !supabaseUrl) {
        supabaseUrl = trimmed.split("=")[1]?.trim().replace(/^["']|["']$/g, "")
      }
      if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=") && !supabaseKey) {
        supabaseKey = trimmed.split("=")[1]?.trim().replace(/^["']|["']$/g, "")
      }
      if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=") && !supabaseKey) {
        supabaseKey = trimmed.split("=")[1]?.trim().replace(/^["']|["']$/g, "")
      }
    }
  } catch (error) {
    // Ignorar erro de leitura
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variáveis de ambiente não encontradas!")
  console.error(`   Arquivo .env.local: ${envPath}`)
  console.error(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✅" : "❌"}`)
  console.error(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅" : "❌"}`)
  console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅" : "❌"}`)
  console.error("\n   Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas no .env.local")
  process.exit(1)
}

const COURSE_ID = "1ec7ee66-0597-4fb8-add6-f9dc4e6f0f2c"

// Dados das aulas fornecidos pelo usuário
const LESSONS_DATA = `
Apresentação	Prescrição em Odontologia - Modulos e Aulas
Introdução a Terapéutica	Introducão à Terapéutica
Introducão a Terapéutica	Tipos de Receitas Odontológicas
Introducão a Terapéutica	Receita Comum em Odontologia
Introducão a Terapéutica	Receita Especial em Odontologia
Introducão a Terapéutica	Atestado x Declaração
Antibióticos	Antibióticos - Conceitos Iniciais
Antibióticos	Tipos de Antibióticos na Odontologia
Antibióticos	Antibióticos Betalactâmicos - parte 1
Antibióticos	Antibióticos Betalactâmicos - parte 2
Antibióticos	Antibióticos Macrolídeos
Antibióticos	Antibióticos Azalídeos
Antibióticos	Antibióticos Tetraciclina
Antibióticos	Antibióticos Quinolonas
Antibióticos	Antibióticos Clindamicina
Antibióticos	Antibióticos mais indicados na gravidez
Analgésicos	Prescrição de Analgésicos em Odontologia
Analgésicos	Analgésicos Opióides
Analgésicos	Prescrição de Associações Analgésicas
Antidepressivos	Prescrição de Antidepressivos em Odontologia
Anticonvulsivantes	Prescrição de Anticonvulsivantes em Odontologia
Anti-inflamatórios	Prescrição de Anti-inflamatórios em Odontologia
Anti-inflamatórios	Prescrição de Anti-inflamatórios em Odontologia - parte 2
Anti-inflamatórios	Prescrição de Anti-inflamatórios em Odontologia - parte 3
Anti-inflamatórios	Prescrição de Anti-inflamatórios em Odontologia - parte 4
Anti-inflamatórios	Prescrição de Anti-inflamatórios em Odontologia - parte 5
Anti-inflamatórios	Prescrição de Anti-inflamatórios em Odontologia - parte 6
Anti-inflamatórios	Prescrição de Anti-inflamatórios em Odontologia - parte 7
Anti-inflamatórios	Prescrição de Anti-inflamatórios esteroides em Odontologia
Ansiolíticos	Prescrição de Benzodiazepínicos em Odontologia
Relaxantes Musculares	Prescrição de Relaxantes Musculares em Odontologia
Anestésicos Locais	Anestésicos Locais em Odontologia
Terapêutica aplicada a Ortodontia	Terapêutica Aplicada a Ortodontia
Terapêutica aplicada a Ortodontia	Fármacos que atrasam a movimentação ortodôntica
Terapêutica aplicada a Ortodontia	Fármacos que aceleram a movimentação ortodôntica
Terapêutica aplicada a Ortodontia	Fármacos de escolha para Ortodontia
Certificado	Certificado
`

interface LessonRow {
  module: string
  title: string
}

function parseLessonsData(data: string): LessonRow[] {
  const lines = data
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  return lines.map((line) => {
    const parts = line.split("\t")
    if (parts.length < 2) {
      throw new Error(`Linha inválida: ${line}`)
    }
    return {
      module: parts[0].trim(),
      title: parts[1].trim(),
    }
  })
}

async function checkModuleSupport(supabase: any) {
  const { error: tableError } = await supabase.from("lesson_modules").select("id").limit(1)
  const lessonModulesTable = !tableError || tableError.code !== "PGRST205"

  const { error: columnError } = await supabase.from("lessons").select("module_id").limit(1)
  const lessonsModuleIdColumn = !columnError || columnError.code !== "42703"

  return {
    lessonModulesTable,
    lessonsModuleIdColumn,
    supportsModules: lessonModulesTable && lessonsModuleIdColumn,
  }
}

async function resolveOrCreateModule(
  supabase: any,
  courseId: string,
  moduleTitle: string,
  moduleOrder: number,
  moduleSupport: { supportsModules: boolean }
): Promise<{ id: string | null; title: string }> {
  const normalizedTitle = moduleTitle.trim() || "Sem módulo"

  if (!moduleSupport.supportsModules) {
    return { id: null, title: normalizedTitle }
  }

  // Verificar se módulo já existe
  const { data: existing, error: existingError } = await supabase
    .from("lesson_modules")
    .select("id, title")
    .eq("course_id", courseId)
    .eq("title", normalizedTitle)
    .maybeSingle()

  if (!existingError && existing) {
    return {
      id: existing.id,
      title: existing.title || normalizedTitle,
    }
  }

  // Criar novo módulo
  const { data: inserted, error: insertError } = await supabase
    .from("lesson_modules")
    .insert({
      course_id: courseId,
      title: normalizedTitle,
      order_index: moduleOrder,
    })
    .select("id, title")
    .single()

  if (insertError) {
    console.error(`⚠️  Erro ao criar módulo "${normalizedTitle}":`, insertError.message)
    // Tentar buscar novamente caso tenha sido criado por outra operação
    const { data: fallback } = await supabase
      .from("lesson_modules")
      .select("id, title")
      .eq("course_id", courseId)
      .eq("title", normalizedTitle)
      .maybeSingle()

    if (fallback) {
      return { id: fallback.id, title: fallback.title || normalizedTitle }
    }

    return { id: null, title: normalizedTitle }
  }

  return {
    id: inserted?.id || null,
    title: inserted?.title || normalizedTitle,
  }
}

async function importLessons() {
  console.log("🚀 Iniciando importação de aulas...")
  console.log(`📚 Curso ID: ${COURSE_ID}\n`)

  try {
    if (!supabaseKey || !supabaseUrl) {
      throw new Error("Supabase credentials not found")
    }
    // Limpar chave de possíveis quebras de linha ou espaços extras
    const cleanKey = supabaseKey.replace(/\s+/g, "").trim()
    const cleanUrl = supabaseUrl.trim()
    
    console.log(`🔗 Conectando ao Supabase...`)
    console.log(`   URL: ${cleanUrl.substring(0, 30)}...`)
    console.log(`   Key: ${cleanKey.substring(0, 20)}...\n`)
    
    const supabase = createClient(cleanUrl, cleanKey)

    // Verificar se o curso existe
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title")
      .eq("id", COURSE_ID)
      .single()

    if (courseError || !course) {
      throw new Error(`Curso não encontrado: ${courseError?.message || "Curso não existe"}`)
    }

    console.log(`✅ Curso encontrado: ${course.title}\n`)

    // Verificar suporte a módulos
    const moduleSupport = await checkModuleSupport(supabase)
    console.log(`📦 Suporte a módulos: ${moduleSupport.supportsModules ? "✅ Sim" : "❌ Não"}\n`)

    // Parsear dados
    const lessonsRows = parseLessonsData(LESSONS_DATA)
    console.log(`📝 Total de aulas a importar: ${lessonsRows.length}\n`)

    // Agrupar por módulo
    const moduleOrderMap = new Map<string, number>()
    let currentModuleOrder = 0
    const lessonsByModule = new Map<string, LessonRow[]>()

    for (const lesson of lessonsRows) {
      if (!moduleOrderMap.has(lesson.module)) {
        moduleOrderMap.set(lesson.module, currentModuleOrder++)
      }
      if (!lessonsByModule.has(lesson.module)) {
        lessonsByModule.set(lesson.module, [])
      }
      lessonsByModule.get(lesson.module)!.push(lesson)
    }

    console.log(`📦 Módulos encontrados: ${moduleOrderMap.size}`)
    for (const [module, order] of moduleOrderMap.entries()) {
      const count = lessonsByModule.get(module)?.length || 0
      console.log(`  ${order + 1}. ${module}: ${count} aula(s)`)
    }
    console.log()

    // Criar ou resolver módulos
    const moduleMap = new Map<string, { id: string | null; title: string }>()
    const sortedModules = Array.from(moduleOrderMap.entries()).sort((a, b) => a[1] - b[1])

    console.log("🔨 Criando/resolvendo módulos...")
    for (const [moduleName, order] of sortedModules) {
      const moduleRef = await resolveOrCreateModule(supabase, COURSE_ID, moduleName, order, moduleSupport)
      moduleMap.set(moduleName, moduleRef)
      console.log(`  ✅ ${moduleName}${moduleRef.id ? ` (ID: ${moduleRef.id})` : ""}`)
    }
    console.log()

    // Criar payload de aulas
    let orderIndex = 0
    const lessonsPayload = []

    for (const [moduleName] of sortedModules) {
      const moduleLessons = lessonsByModule.get(moduleName) || []
      const moduleRef = moduleMap.get(moduleName)!

      for (const lesson of moduleLessons) {
        const payload: Record<string, unknown> = {
          course_id: COURSE_ID,
          title: lesson.title,
          description: null,
          video_url: null,
          duration_minutes: null,
          module_title: moduleRef.title,
          order_index: orderIndex++,
          materials: [],
          available_at: null,
        }

        if (moduleSupport.supportsModules && moduleRef.id) {
          payload.module_id = moduleRef.id
        }

        lessonsPayload.push(payload)
      }
    }

    console.log(`📋 Preparando ${lessonsPayload.length} aula(s) para importação...\n`)

    // Inserir aulas em lote
    const { data: insertedLessons, error: insertError } = await supabase
      .from("lessons")
      .insert(lessonsPayload)
      .select("id, title")

    if (insertError) {
      throw new Error(`Erro ao inserir aulas: ${insertError.message}`)
    }

    console.log(`✅ Importação concluída com sucesso!`)
    console.log(`📊 ${insertedLessons?.length || 0} aula(s) importada(s)\n`)

    if (insertedLessons && insertedLessons.length > 0) {
      console.log("📋 Aulas criadas:")
      insertedLessons.forEach((lesson, index) => {
        console.log(`  ${index + 1}. ${lesson.title}`)
      })
      console.log()
    }

    console.log(`🌐 Acesse: http://localhost:3000/admin/cursos/${COURSE_ID}/aulas`)
  } catch (error) {
    console.error("\n❌ Erro ao importar aulas:", error)
    if (error instanceof Error) {
      console.error(`   Mensagem: ${error.message}`)
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`)
      }
    }
    process.exit(1)
  }
}

// Executar importação
importLessons()
  .then(() => {
    console.log("\n✨ Script finalizado")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal:", error)
    process.exit(1)
  })
