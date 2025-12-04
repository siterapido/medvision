import { z } from "zod"

import { uuidSchemaWithMessage } from "@/lib/validations/uuid"

/**
 * Schema para material de aula
 */
export const lessonMaterialSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  type: z.enum(["pdf", "slides", "checklist", "link", "video", "template", "outro"]),
  url: z.string().url("URL inválida").or(z.string().min(1, "URL é obrigatória")),
  description: z.string().optional(),
})

export type LessonMaterialData = z.infer<typeof lessonMaterialSchema>

/**
 * Schema para criação de aula
 */
export const lessonFormSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres").max(200, "Título muito longo"),
  description: z.string().optional(),
  video_url: z.string().url("URL do vídeo inválida").optional().or(z.literal("")),
  duration_minutes: z.number().int().positive("Duração deve ser maior que zero").optional(),
  module_id: uuidSchemaWithMessage("ID do módulo inválido").optional(),
  module_title: z.string().min(1, "Módulo é obrigatório"),
  order_index: z.number().int().nonnegative("Ordem inválida"),
  materials: z.array(lessonMaterialSchema).optional().default([]),
  available_at: z.string().datetime().optional().or(z.literal("")),
})

export type LessonFormData = z.infer<typeof lessonFormSchema>

/**
 * Schema para criação em lote de aulas (usado pelo CourseWorkspace)
 */
export const bulkLessonsSchema = z.object({
  course_id: uuidSchemaWithMessage("ID do curso inválido"),
  lessons: z.array(lessonFormSchema).min(1, "Pelo menos uma aula é necessária"),
})

export type BulkLessonsData = z.infer<typeof bulkLessonsSchema>

/**
 * Schema para atualização de aula
 */
export const lessonUpdateSchema = lessonFormSchema.partial().extend({
  id: uuidSchemaWithMessage("ID da aula inválido"),
})

export type LessonUpdateData = z.infer<typeof lessonUpdateSchema>

/**
 * Schema para reordenação de aulas
 */
export const reorderLessonsSchema = z.object({
  course_id: uuidSchemaWithMessage("ID do curso inválido"),
  lesson_orders: z.array(
    z.object({
      id: uuidSchemaWithMessage("ID da aula inválido"),
      order_index: z.number().int().nonnegative("Ordem inválida"),
    })
  ).min(1, "Pelo menos uma aula é necessária"),
})

export type ReorderLessonsData = z.infer<typeof reorderLessonsSchema>

/**
 * Schema para mover aula entre módulos
 */
export const moveLessonSchema = z.object({
  lesson_id: uuidSchemaWithMessage("ID da aula inválido"),
  course_id: uuidSchemaWithMessage("ID do curso inválido"),
  target_module_id: uuidSchemaWithMessage("ID do módulo inválido").nullable(),
  new_order_index: z.number().int().nonnegative("Ordem inválida"),
})

export type MoveLessonData = z.infer<typeof moveLessonSchema>
