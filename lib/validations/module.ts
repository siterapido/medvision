import { z } from "zod"

export const moduleFormSchema = z.object({
  course_id: z.string().uuid("ID do curso inválido"),
  title: z.string().min(3, "Título do módulo deve ter no mínimo 3 caracteres").max(120, "Título do módulo é muito longo"),
  description: z.string().max(500, "Descrição muito longa").optional(),
  order_index: z.number().int().nonnegative("Ordem inválida").optional().default(0),
})

export type ModuleFormData = z.infer<typeof moduleFormSchema>

export const moduleUpdateSchema = z.object({
  id: z.string().uuid("ID do módulo inválido"),
  title: z.string().min(3, "Título do módulo deve ter no mínimo 3 caracteres").max(120, "Título do módulo é muito longo").optional(),
  description: z.string().max(500, "Descrição muito longa").optional(),
  order_index: z.number().int().nonnegative("Ordem inválida").optional(),
})

export type ModuleUpdateData = z.infer<typeof moduleUpdateSchema>
