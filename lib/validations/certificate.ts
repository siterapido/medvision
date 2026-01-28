import { z } from "zod"

// Schema for individual signatures
export const signatureSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    role: z.string().min(1, "Cargo é obrigatório"),
    imageUrl: z.string().url("URL da imagem inválida").optional().or(z.literal("")),
})

// Schema for layout configuration (flexible for now)
export const layoutConfigSchema = z.record(z.any()).optional()

// Schema for creating/updating a certificate template
export const certificateTemplateSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    description: z.string().optional(),
    course_id: z.string().uuid("ID do curso inválido").optional().nullable(),
    background_url: z.string().url("URL do fundo inválida").optional().or(z.literal("")),
    hours: z.number().min(0, "Horas devem ser positivas"),
    signatures: z.array(signatureSchema).optional(),
    layout_config: layoutConfigSchema,
    validity_period_days: z.number().min(1).optional().nullable(),
    available_start: z.string().optional().nullable(), // ISO string date
    available_end: z.string().optional().nullable(),
})

export type CertificateTemplateFormData = z.infer<typeof certificateTemplateSchema>

// Schema for issuing a certificate
export const issueCertificateSchema = z.object({
    template_id: z.string().uuid("Template inválido"),
    user_id: z.string().uuid("Usuário inválido"),
    course_id: z.string().uuid("Curso inválido").optional(),
    custom_hours: z.number().optional(), // Override template hours if needed
})

export type IssueCertificateData = z.infer<typeof issueCertificateSchema>
