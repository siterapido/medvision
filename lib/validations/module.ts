import { z } from "zod"

import { uuidSchemaWithMessage } from "@/lib/validations/uuid"

export const moduleFormSchema = z.object({
  course_id: z.string().uuid("ID do curso inválido"),
  title: z.string().min(3, "Título do módulo deve ter no mínimo 3 caracteres").max(120, "Título do módulo é muito longo"),
  description: z.string().max(500, "Descrição muito longa").optional(),
  order_index: z.number().int().nonnegative("Ordem inválida").optional().default(0),
  access_type: z.enum(["free", "premium"]).optional().default("free"),
})

export type ModuleFormData = z.infer<typeof moduleFormSchema>

export const moduleUpdateSchema = z.object({
  id: z.string().uuid("ID do módulo inválido"),
  title: z.string().min(3, "Título do módulo deve ter no mínimo 3 caracteres").max(120, "Título do módulo é muito longo").optional(),
  description: z.string().max(500, "Descrição muito longa").optional(),
  order_index: z.number().int().nonnegative("Ordem inválida").optional(),
  access_type: z.enum(["free", "premium"]).optional(),
})

export type ModuleUpdateData = z.infer<typeof moduleUpdateSchema>

export const reorderModulesSchema = z.object({
  course_id: uuidSchemaWithMessage("ID do curso inválido"),
  module_orders: z.array(
    z.object({
      id: uuidSchemaWithMessage("ID do módulo inválido"),
      order_index: z.number().int().nonnegative("Ordem inválida"),
    })
  ).min(1, "É preciso informar ao menos um módulo"),
})

export type ReorderModulesData = z.infer<typeof reorderModulesSchema>
