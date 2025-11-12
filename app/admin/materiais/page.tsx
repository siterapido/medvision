import { createClient } from "@/lib/supabase/server"
import { MaterialsManager, type AdminMaterialRow } from "@/components/admin/materials-manager"

export const metadata = {
  title: "Materiais | Admin",
  description: "Gerencie a biblioteca de materiais e e-books",
}

export default async function AdminMaterialsPage() {
  const supabase = await createClient()
  const { data: materials } = await supabase
    .from("materials")
    .select("id, title, description, pages, tags, resource_type, file_url, created_at")
    .order("created_at", { ascending: false })

  const preparedMaterials: AdminMaterialRow[] = (materials ?? []).map((material) => ({
    id: material.id,
    title: material.title,
    description: material.description,
    pages: material.pages ?? 0,
    tags: (material.tags ?? []) as string[],
    resource_type: material.resource_type,
    file_url: material.file_url,
    created_at: material.created_at,
  }))

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Biblioteca de materiais</p>
        <h1 className="text-3xl font-bold text-white">Materiais publicados</h1>
        <p className="text-sm text-slate-400">
          Centralize guias, checklists e roteiros em um único lugar e mantenha o dashboard sincronizado.
        </p>
      </div>

      <MaterialsManager materials={preparedMaterials} />
    </div>
  )
}
