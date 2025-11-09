import { z } from "zod"

// Schema para criação/edição de curso
export const courseFormSchema = z.object({
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
  area: z.string().min(1, "A área é obrigatória"),
  difficulty: z.enum(["Iniciante", "Intermediário", "Avançado"], {
    required_error: "Selecione o nível de dificuldade",
  }).describe("Nível de dificuldade do curso"),
  course_type: z.enum(["Ondonto GPT", "Premium"], {
    required_error: "Selecione o tipo de curso",
  }),
  price: z.string().optional(),
  tags: z.string().optional(),
  duration: z.string().optional(),
  thumbnail_url: z.string().optional(),
})

export type CourseFormData = z.infer<typeof courseFormSchema>

// Schema para operações em lote
export const bulkActionSchema = z.object({
  courseIds: z.array(z.string().uuid()).min(1, "Selecione pelo menos um curso"),
  action: z.enum(["delete", "publish", "unpublish"]),
})

export type BulkActionData = z.infer<typeof bulkActionSchema>
