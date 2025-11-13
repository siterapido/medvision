export type Material = {
  id: string
  title: string
  resource_type: string
  tags?: string[]
}

export function groupByType(materials: Material[]): Record<string, Material[]> {
  return materials.reduce<Record<string, Material[]>>((acc, m) => {
    const key = m.resource_type || "outro"
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})
}

export function filterByQuery(materials: Material[], q: string): Material[] {
  const query = (q || "").trim().toLowerCase()
  if (!query) return materials
  return materials.filter((m) => {
    const hay = `${m.title} ${(m.tags || []).join(" ")}`.toLowerCase()
    return hay.includes(query)
  })
}

