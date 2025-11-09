import type { SupabaseClient } from "@supabase/supabase-js"
import type { PostgrestError } from "@supabase/postgrest-js"

export type LessonModuleSupport = {
  lessonModulesTable: boolean
  lessonsModuleIdColumn: boolean
}

export const LESSON_MODULE_SUPPORT_ERROR =
  "A tabela de módulos ainda não foi criada. Execute supabase/migrations/013_lesson_modules.sql no Supabase e tente novamente."

let supportCache: LessonModuleSupport | null = null
let detectionPromise: Promise<LessonModuleSupport> | null = null

export function isLessonModulesTableMissingError(error: PostgrestError | null): boolean {
  return error?.code === "PGRST205"
}

export function isLessonsModuleIdColumnMissingError(error: PostgrestError | null): boolean {
  return error?.code === "42703"
}

async function detectLessonModuleSupport(
  client: SupabaseClient<any, any, any>
): Promise<LessonModuleSupport> {
  const { error: tableError } = await client.from("lesson_modules").select("id").limit(1)
  const lessonModulesTable = !tableError || !isLessonModulesTableMissingError(tableError)

  if (tableError && !isLessonModulesTableMissingError(tableError)) {
    console.error("Erro ao verificar acesso a lesson_modules:", tableError)
  }

  const { error: columnError } = await client.from("lessons").select("module_id").limit(1)
  const lessonsModuleIdColumn = !columnError || !isLessonsModuleIdColumnMissingError(columnError)

  if (columnError && !isLessonsModuleIdColumnMissingError(columnError)) {
    console.error("Erro ao verificar coluna lessons.module_id:", columnError)
  }

  return {
    lessonModulesTable,
    lessonsModuleIdColumn,
  }
}

export async function getLessonModuleSupport(
  client: SupabaseClient<any, any, any>
): Promise<LessonModuleSupport> {
  if (supportCache) {
    return supportCache
  }

  if (!detectionPromise) {
    detectionPromise = detectLessonModuleSupport(client)
  }

  supportCache = await detectionPromise
  detectionPromise = null
  return supportCache
}

export function supportsLessonModules(support: LessonModuleSupport) {
  return support.lessonModulesTable && support.lessonsModuleIdColumn
}
