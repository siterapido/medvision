#!/usr/bin/env tsx
/**
 * Script para importar aulas diretamente no Supabase
 * 
 * Uso: npx tsx scripts/import-lessons-direct.ts
 * 
 * Requer SUPABASE_SERVICE_ROLE_KEY no .env.local
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"

const COURSE_ID = "1ec7ee66-0597-4fb8-add6-f9dc4e6f0f2c"

// Ler variáveis de ambiente do arquivo
function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local")
  try {
    const content = readFileSync(envPath, "utf-8")
    const env: Record<string, string> = {}
    
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith("#")) {
        const match = trimmed.match(/^([^=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          let value = match[2].trim()
          // Remove aspas se existirem
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          env[key] = value
        }
      }
    }
    
    return env
  } catch (error) {
    console.error("Erro ao ler .env.local:", error)
    return {}
  }
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variáveis de ambiente não encontradas!")
  console.error("   Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env.local")
  process.exit(1)
}

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️  AVISO: Usando NEXT_PUBLIC_SUPABASE_ANON_KEY ao invés de SUPABASE_SERVICE_ROLE_KEY")
  console.warn("   Isso pode causar problemas com RLS. Use SERVICE_ROLE_KEY para bypassar RLS.\n")
}

// Dados das aulas
const lessonsData = [
  { module: "Apresentação", title: "Prescrição em Odontologia - Modulos e Aulas" },
  { module: "Introdução a Terapéutica", title: "Introducão à Terapéutica" },
  { module: "Introducão a Terapéutica", title: "Tipos de Receitas Odontológicas" },
  { module: "Introducão a Terapéutica", title: "Receita Comum em Odontologia" },
  { module: "Introducão a Terapéutica", title: "Receita Especial em Odontologia" },
  { module: "Introducão a Terapéutica", title: "Atestado x Declaração" },
  { module: "Antibióticos", title: "Antibióticos - Conceitos Iniciais" },
  { module: "Antibióticos", title: "Tipos de Antibióticos na Odontologia" },
  { module: "Antibióticos", title: "Antibióticos Betalactâmicos - parte 1" },
  { module: "Antibióticos", title: "Antibióticos Betalactâmicos - parte 2" },
  { module: "Antibióticos", title: "Antibióticos Macrolídeos" },
  { module: "Antibióticos", title: "Antibióticos Azalídeos" },
  { module: "Antibióticos", title: "Antibióticos Tetraciclina" },
  { module: "Antibióticos", title: "Antibióticos Quinolonas" },
  { module: "Antibióticos", title: "Antibióticos Clindamicina" },
  { module: "Antibióticos", title: "Antibióticos mais indicados na gravidez" },
  { module: "Analgésicos", title: "Prescrição de Analgésicos em Odontologia" },
  { module: "Analgésicos", title: "Analgésicos Opióides" },
  { module: "Analgésicos", title: "Prescrição de Associações Analgésicas" },
  { module: "Antidepressivos", title: "Prescrição de Antidepressivos em Odontologia" },
  { module: "Anticonvulsivantes", title: "Prescrição de Anticonvulsivantes em Odontologia" },
  { module: "Anti-inflamatórios", title: "Prescrição de Anti-inflamatórios em Odontologia" },
  { module: "Anti-inflamatórios", title: "Prescrição de Anti-inflamatórios em Odontologia - parte 2" },
  { module: "Anti-inflamatórios", title: "Prescrição de Anti-inflamatórios em Odontologia - parte 3" },
  { module: "Anti-inflamatórios", title: "Prescrição de Anti-inflamatórios em Odontologia - parte 4" },
  { module: "Anti-inflamatórios", title: "Prescrição de Anti-inflamatórios em Odontologia - parte 5" },
  { module: "Anti-inflamatórios", title: "Prescrição de Anti-inflamatórios em Odontologia - parte 6" },
  { module: "Anti-inflamatórios", title: "Prescrição de Anti-inflamatórios em Odontologia - parte 7" },
  { module: "Anti-inflamatórios", title: "Prescrição de Anti-inflamatórios esteroides em Odontologia" },
  { module: "Ansiolíticos", title: "Prescrição de Benzodiazepínicos em Odontologia" },
  { module: "Relaxantes Musculares", title: "Prescrição de Relaxantes Musculares em Odontologia" },
  { module: "Anestésicos Locais", title: "Anestésicos Locais em Odontologia" },
  { module: "Terapêutica aplicada a Ortodontia", title: "Terapêutica Aplicada a Ortodontia" },
  { module: "Terapêutica aplicada a Ortodontia", title: "Fármacos que atrasam a movimentação ortodôntica" },
  { module: "Terapêutica aplicada a Ortodontia", title: "Fármacos que aceleram a movimentação ortodôntica" },
  { module: "Terapêutica aplicada a Ortodontia", title: "Fármacos de escolha para Ortodontia" },
  { module: "Certificado", title: "Certificado" },
]

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
    const supabase = createClient(supabaseUrl, supabaseKey)

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

    // Agrupar por módulo
    const moduleOrderMap = new Map<string, number>()
    let currentModuleOrder = 0
    const lessonsByModule = new Map<string, typeof lessonsData>()

    for (const lesson of lessonsData) {
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
      console.log("📋 Primeiras 10 aulas criadas:")
      insertedLessons.slice(0, 10).forEach((lesson, index) => {
        console.log(`  ${index + 1}. ${lesson.title}`)
      })
      if (insertedLessons.length > 10) {
        console.log(`  ... e mais ${insertedLessons.length - 10} aula(s)`)
      }
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

