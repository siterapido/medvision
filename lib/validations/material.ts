import { z } from "zod"

export const materialResourceTypes = [
  "ebook",
  "slides",
  "checklist",
  "template",
  "video",
  "link",
  "outro",
] as const

export const materialFormSchema = z.object({
  title: z
    .string()
    .min(3, "O título deve ter pelo menos 3 caracteres")
    .max(200, "O título deve ter no máximo 200 caracteres"),
  description: z
    .string()
    .max(2000, "A descrição deve ter no máximo 2.000 caracteres")
    .optional()
    .or(z.literal("")),
  pages: z.coerce.number().int().nonnegative("Informe o número de páginas"),
  tags: z.string().optional().or(z.literal("")),
  file_url: z.string().min(3, "Informe o link do material"),
  resource_type: z.enum(materialResourceTypes, {
    required_error: "Selecione o tipo de material",
  }),
  is_available: z.coerce.boolean().optional(),
})

export type MaterialFormData = z.infer<typeof materialFormSchema>

export const materialResourceOptions = [
  { value: "ebook", label: "E-book" },
  { value: "slides", label: "Slides" },
  { value: "checklist", label: "Checklist" },
  { value: "template", label: "Template" },
  { value: "video", label: "Vídeo" },
  { value: "link", label: "Link externo" },
  { value: "outro", label: "Outro" },
]
