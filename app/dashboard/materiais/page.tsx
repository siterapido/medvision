import Link from "next/link"
import { FileText, Download, File } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"
import Image from "next/image"

const resourceTypeLabels: Record<string, string> = {
  ebook: "E-book",
  slides: "Slides",
  checklist: "Checklist",
  template: "Template",
  video: "Vídeo",
  link: "Link",
  outro: "Outro",
}

const resourceTypeColors: Record<string, string> = {
  ebook: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  slides: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  checklist: "bg-green-500/10 text-green-400 border-green-500/30",
  template: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  video: "bg-red-500/10 text-red-400 border-red-500/30",
  link: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  outro: "bg-gray-500/10 text-gray-400 border-gray-500/30",
}

type DashboardMaterial = {
  id: string
  title: string
  description: string | null
  pages: number | null
  tags: string[]
  resource_type: string
  file_url: string
}

export default async function MateriaisPage() {
  const supabase = await createClient()
  const { data: materials } = await supabase
    .from("materials")
    .select("id, title, description, pages, tags, resource_type, file_url")
    .order("created_at", { ascending: false })

  const library: DashboardMaterial[] = (materials ?? []).map((material) => ({
    id: material.id,
    title: material.title,
    description: material.description,
    pages: material.pages ?? null,
    tags: material.tags ?? [],
    resource_type: material.resource_type,
    file_url: material.file_url,
  }))

  const hasMaterials = library.length > 0

  return (
    <DashboardScrollArea>
      <div className="mx-auto w-full max-w-7xl space-y-8">
        {/* Header simples */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">Materiais</h1>
          <p className="text-base text-slate-600">
            Acesse e-books, slides, checklists e outros materiais de apoio para seu consultório.
          </p>
        </div>

        {/* Grid de materiais */}
        {!hasMaterials ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm text-slate-600">
              Nenhum material disponível no momento.{" "}
              <Link className="font-semibold text-primary hover:underline" href="/admin/materiais">
                Cadastre novos materiais
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {library.map((material) => {
              const typeLabel = resourceTypeLabels[material.resource_type] ?? material.resource_type
              const typeColor = resourceTypeColors[material.resource_type] ?? resourceTypeColors.outro
              const tagList = material.tags ?? []
              const pageLabel =
                material.pages && material.pages > 0
                  ? `${material.pages} ${material.pages === 1 ? "página" : "páginas"}`
                  : null

              return (
                <Card
                  key={material.id}
                  className="group overflow-hidden border-slate-200 bg-white transition-all hover:shadow-lg hover:border-primary/50"
                >
                  {/* Capa do arquivo */}
                  <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                    <File className="h-20 w-20 text-slate-400 group-hover:text-primary transition-colors" />
                    {/* Badge do tipo no canto superior direito */}
                    <div className="absolute top-3 right-3">
                      <Badge className={`${typeColor} border font-semibold uppercase text-xs tracking-wider`}>
                        {typeLabel}
                      </Badge>
                    </div>
                  </div>

                  {/* Conteúdo do card */}
                  <div className="p-5 space-y-4">
                    {/* Título e descrição */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 group-hover:text-primary transition-colors">
                        {material.title}
                      </h3>
                      {material.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">{material.description}</p>
                      )}
                    </div>

                    {/* Tags */}
                    {tagList.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tagList.slice(0, 3).map((tag) => (
                          <Badge
                            key={`${material.id}-${tag}`}
                            variant="outline"
                            className="text-xs font-medium text-slate-600 border-slate-300"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {tagList.length > 3 && (
                          <Badge variant="outline" className="text-xs font-medium text-slate-600 border-slate-300">
                            +{tagList.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Informações e botão de download */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      {pageLabel && (
                        <span className="text-xs text-slate-500 font-medium">{pageLabel}</span>
                      )}
                      <Button
                        asChild
                        size="sm"
                        className="ml-auto bg-primary hover:bg-primary/90 text-white"
                      >
                        <Link href={material.file_url} download aria-label={`Baixar ${material.title}`}>
                          <Download className="mr-2 h-4 w-4" />
                          Baixar
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardScrollArea>
  )
}
