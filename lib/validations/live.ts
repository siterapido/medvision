import { z } from "zod"

export const liveStatusEnum = z.enum(["agendada", "realizada", "cancelada"], {
  required_error: "Selecione o status da live",
})

// Schema para criação/edição de live
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
  instructor: z
    .string()
    .min(2, "O nome do instrutor deve ter pelo menos 2 caracteres")
    .max(200, "O nome do instrutor deve ter no máximo 200 caracteres"),
  thumbnail_url: z.string().optional(),
  scheduled_at: z
    .string()
    .refine((val) => {
      if (!val) return false
      const d = new Date(val)
      return !Number.isNaN(d.getTime()) && d.getTime() > Date.now()
    }, "A data/horário deve ser no futuro"),
  status: liveStatusEnum.default("agendada"),
  is_published: z.boolean().optional(),
})

export type LiveFormData = z.infer<typeof liveFormSchema>

export const bulkLiveActionSchema = z.object({
  liveIds: z.array(z.string().uuid()).min(1, "Selecione pelo menos uma live"),
  action: z.enum(["delete", "publish", "unpublish"]),
})

export type BulkLiveActionData = z.infer<typeof bulkLiveActionSchema>