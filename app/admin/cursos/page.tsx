import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { CourseManagement } from "./course-management"
import { Loader2 } from "lucide-react"

export const metadata = {
  title: "Gestão de Cursos | Admin",
  description: "Gerenciar cursos da plataforma",
}

async function CoursesContent() {
  const supabase = await createClient()

  // Buscar cursos ordenados por created_at
  let { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar cursos:", error)

    const isRLSError = error.message?.includes("infinite recursion") || error.code === "42P17"
    const isMissingColumnError = error.message?.includes("updated_at") || error.message?.includes("column")

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="text-center space-y-3">
            <p className="text-red-400 text-lg font-semibold">Erro ao carregar cursos</p>
            <p className="text-sm text-slate-400">{error.message}</p>
          </div>

          {/* Erro de RLS */}
          {isRLSError && (
            <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-left">
              <p className="text-yellow-400 font-semibold mb-3 text-lg">
                ⚠️ Configuração RLS Necessária
              </p>
              <p className="text-slate-300 mb-4">
                As políticas de Row Level Security (RLS) estão causando recursão infinita.
                Execute o script de correção:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300 mb-4">
                <li>Abra o Supabase SQL Editor</li>
                <li>Execute o arquivo: <code className="bg-slate-800 px-2 py-1 rounded">FIX_RLS_POLICIES.sql</code></li>
                <li>Aguarde a confirmação de sucesso</li>
                <li>Recarregue esta página</li>
              </ol>
              <a
                href="https://supabase.com/dashboard/project/qphofwxpmmhfplylozsh/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded transition-colors"
              >
                Abrir SQL Editor →
              </a>
            </div>
          )}

          {/* Erro de coluna faltando */}
          {isMissingColumnError && !isRLSError && (
            <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-left">
              <p className="text-yellow-400 font-semibold mb-3 text-lg">
                ⚠️ Migration Necessária
              </p>
              <p className="text-slate-300 mb-4">
                Colunas essenciais estão faltando na tabela de cursos.
                Execute o script de migration:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300 mb-4">
                <li>Abra o Supabase SQL Editor</li>
                <li>Execute o arquivo: <code className="bg-slate-800 px-2 py-1 rounded">SIMPLE_MIGRATION.sql</code></li>
                <li>Aguarde a mensagem de sucesso</li>
                <li>Depois execute: <code className="bg-slate-800 px-2 py-1 rounded">FIX_RLS_POLICIES.sql</code></li>
                <li>Recarregue esta página</li>
              </ol>
              <a
                href="https://supabase.com/dashboard/project/qphofwxpmmhfplylozsh/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded transition-colors"
              >
                Abrir SQL Editor →
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  return <CourseManagement courses={courses || []} />
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto" />
        <p className="text-slate-400">Carregando cursos...</p>
      </div>
    </div>
  )
}

export default function AdminCoursesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F192F] via-[#131D37] to-[#0B1627] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Gestão de Cursos</h1>
          <p className="text-slate-400">
            Gerencie todos os cursos da plataforma
          </p>
        </div>

        {/* Content */}
        <Suspense fallback={<LoadingState />}>
          <CoursesContent />
        </Suspense>
      </div>
    </div>
  )
}
