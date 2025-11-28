import { z } from "zod"

export const liveStatusEnum = z.enum(["scheduled", "live", "completed"], {
  required_error: "Selecione o status da live",
})

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

// Schema para criação/edição de live (tabela live_events)
export const liveFormSchema = z.object({
  title: z
    .string()
    .min(3, "O título deve ter pelo menos 3 caracteres")
    .max(200, "O título deve ter no máximo 200 caracteres"),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres")
    .max(5000, "A descrição deve ter no máximo 5000 caracteres")
    .optional()
    .or(z.literal("")),
  instructor_name: z
    .string()
    .min(2, "O nome do instrutor deve ter pelo menos 2 caracteres")
    .max(200, "O nome do instrutor deve ter no máximo 200 caracteres"),
  thumbnail_url: z.string().optional(),
  start_at: z
    .string()
    .refine((val) => {
      if (!val) return false
      const d = new Date(val)
      return !Number.isNaN(d.getTime())
    }, "Informe uma data/horário válida"),
  duration_minutes: z
    .preprocess(toNumber, z.number().int().min(15, "Duração mínima de 15 minutos").max(600, "Limite de 10 horas"))
    .default(60),
  status: liveStatusEnum.default("scheduled"),
  is_featured: z.boolean().optional(),
})

export type LiveFormData = z.infer<typeof liveFormSchema>

export const bulkLiveActionSchema = z.object({
  liveIds: z.array(z.string().uuid()).min(1, "Selecione pelo menos uma live"),
  action: z.literal("delete"),
})

export type BulkLiveActionData = z.infer<typeof bulkLiveActionSchema>
