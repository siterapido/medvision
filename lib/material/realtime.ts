export type MaterialsPayload = { new: any; old: any; eventType: "INSERT" | "UPDATE" | "DELETE" }
export type MaterialRow = {
  id: string
  title: string
  description?: string | null
  resource_type: string
  file_url: string
}

export function mapPayloadToMaterial(payload: MaterialsPayload): MaterialRow | null {
  const row = payload.eventType === "DELETE" ? payload.old : payload.new
  if (!row?.id) return null
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: row.description ?? null,
    resource_type: String(row.resource_type ?? "outro"),
    file_url: String(row.file_url ?? ""),
  }
}

export function applyMaterialsChange(list: MaterialRow[], payload: MaterialsPayload): MaterialRow[] {
  const mapped = mapPayloadToMaterial(payload)
  if (!mapped) return list
  if (payload.eventType === "DELETE") {
    return list.filter((m) => m.id !== mapped.id)
  }
  const exists = list.find((m) => m.id === mapped.id)
  if (exists) {
    return list.map((m) => (m.id === mapped.id ? { ...m, ...mapped } : m))
  }
  return [...list, mapped]
}

