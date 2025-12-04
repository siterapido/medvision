#!/usr/bin/env tsx
/**
 * Script para importar aulas via API
 * 
 * Uso: npx tsx scripts/import-lessons-via-api.ts
 * 
 * Requer que o servidor Next.js esteja rodando (npm run dev)
 */

const COURSE_ID = "1ec7ee66-0597-4fb8-add6-f9dc4e6f0f2c"
const API_URL = "http://localhost:3000"

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

async function importLessons() {
  console.log("🚀 Iniciando importação de aulas via API...")
  console.log(`📚 Curso ID: ${COURSE_ID}`)
  console.log(`🌐 API URL: ${API_URL}\n`)

  // Agrupar por módulo e criar payload
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

  // Criar payload de aulas
  let orderIndex = 0
  const lessonsPayload = []

  const sortedModules = Array.from(moduleOrderMap.entries()).sort((a, b) => a[1] - b[1])

  for (const [moduleName] of sortedModules) {
    const moduleLessons = lessonsByModule.get(moduleName) || []
    for (const lesson of moduleLessons) {
      lessonsPayload.push({
        title: lesson.title,
        description: null,
        video_url: null,
        duration_minutes: null,
        module_title: moduleName,
        order_index: orderIndex++,
        materials: [],
        available_at: null,
      })
    }
  }

  console.log(`📋 Preparando ${lessonsPayload.length} aula(s) para importação...\n`)

  try {
    const response = await fetch(`${API_URL}/api/admin/courses/${COURSE_ID}/lessons/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lessons: lessonsPayload,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`)
    }

    console.log(`✅ Importação concluída com sucesso!`)
    const message = result.message || `${lessonsPayload.length} aula(s) importada(s)`
    console.log(`📊 ${message}`)
    console.log(`\n🌐 Acesse: ${API_URL}/admin/cursos/${COURSE_ID}/aulas`)
  } catch (error) {
    console.error("\n❌ Erro ao importar aulas:", error)
    if (error instanceof Error) {
      console.error(`   Mensagem: ${error.message}`)
      if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")) {
        console.error("\n💡 Dica: Certifique-se de que o servidor Next.js está rodando:")
        console.error("   npm run dev")
      }
    }
    process.exit(1)
  }
}

importLessons()
  .then(() => {
    console.log("\n✨ Script finalizado")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal:", error)
    process.exit(1)
  })

