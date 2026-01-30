"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
    certificateTemplateSchema,
    issueCertificateSchema,
    type CertificateTemplateFormData,
    type IssueCertificateData
} from "@/lib/validations/certificate"

export type ActionResult<T = void> = {
    success: boolean
    data?: T
    error?: string
    fieldErrors?: Record<string, string[]>
}

/**
 * Creates a new certificate template
 */
export async function createCertificateTemplate(
    formData: CertificateTemplateFormData
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = certificateTemplateSchema.safeParse(formData)

        if (!parsed.success) {
            // Simple error flattening for now
            return {
                success: false,
                error: "Dados inválidos",
                fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>
            }
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: "Usuário não autenticado" }
        }

        // Check permission
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role !== 'admin') {
            return { success: false, error: "Permissão negada" }
        }

        const { data, error } = await supabase
            .from("certificate_templates")
            .insert(parsed.data)
            .select("id")
            .single()

        if (error) {
            console.error("Error creating template:", error)
            return { success: false, error: "Erro ao criar modelo de certificado" }
        }

        revalidatePath("/admin/certificados")
        return { success: true, data: { id: data.id } }

    } catch (error) {
        console.error("Unexpected error:", error)
        return { success: false, error: "Erro inesperado" }
    }
}

/**
 * Updates an existing certificate template
 */
export async function updateCertificateTemplate(
    id: string,
    formData: CertificateTemplateFormData
): Promise<ActionResult> {
    try {
        const parsed = certificateTemplateSchema.safeParse(formData)

        if (!parsed.success) {
            return {
                success: false,
                error: "Dados inválidos",
                fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>
            }
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: "Usuário não autenticado" }
        }

        // Check permission
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role !== 'admin') {
            return { success: false, error: "Permissão negada" }
        }

        const { error } = await supabase
            .from("certificate_templates")
            .update(parsed.data)
            .eq("id", id)

        if (error) {
            console.error("Error updating template:", error)
            return { success: false, error: "Erro ao atualizar modelo" }
        }

        revalidatePath("/admin/certificados")
        return { success: true }

    } catch (error) {
        console.error("Unexpected error:", error)
        return { success: false, error: "Erro inesperado" }
    }
}

/**
 * Issues a certificate to a user
 */
export async function issueCertificate(
    data: IssueCertificateData
): Promise<ActionResult<{ id: string; code: string }>> {
    try {
        const parsed = issueCertificateSchema.safeParse(data)
        if (!parsed.success) return { success: false, error: "Dados inválidos" }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: "Usuário não autenticado" }
        }

        // Check permission - strictly admin for now
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role !== 'admin') {
            return { success: false, error: "Permissão negada" }
        }

        // Get template details to calc expiry and snapshot data
        const { data: template, error: tmplError } = await supabase
            .from('certificate_templates')
            .select('*')
            .eq('id', parsed.data.template_id)
            .single()

        if (tmplError || !template) return { success: false, error: "Modelo não encontrado" }

        // Generate unique code (simple UUID segment for now, could be more complex)
        const code = crypto.randomUUID().split('-')[0].toUpperCase()

        // Snapshot metadata (Student Name, Course Title)
        // Fetching user profile and course title manually to ensure snapshot accuracy
        const { data: userProfile } = await supabase.from('profiles').select('name').eq('id', parsed.data.user_id).single()

        let courseTitle = ''
        if (parsed.data.course_id) {
            const { data: course } = await supabase.from('courses').select('title').eq('id', parsed.data.course_id).single()
            courseTitle = course?.title || ''
        }

        const issueDate = new Date()
        let expiryDate = null
        if (template.validity_period_days) {
            const d = new Date(issueDate)
            d.setDate(d.getDate() + template.validity_period_days)
            expiryDate = d.toISOString()
        }

        const insertData = {
            code,
            template_id: parsed.data.template_id,
            user_id: parsed.data.user_id,
            course_id: parsed.data.course_id || template.course_id, // Use passed course or template default
            issue_date: issueDate.toISOString(),
            expiry_date: expiryDate,
            metadata: {
                student_name: userProfile?.name || 'Estudante',
                course_title: courseTitle,
                hours: parsed.data.custom_hours || template.hours
            },
            status: 'active'
        }

        const { data: cert, error } = await supabase
            .from('certificates')
            .insert(insertData)
            .select('id, code')
            .single()

        if (error) {
            console.error("Error issuing certificate:", error)
            return { success: false, error: "Erro ao emitir certificado" }
        }

        revalidatePath("/admin/certificados")
        return { success: true, data: cert }

    } catch (error) {
        console.error("Unexpected error:", error)
        return { success: false, error: "Erro inesperado na emissão" }
    }
}

/**
 * Fetches all certificate templates
 */
export async function getCertificateTemplates() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching templates:", error)
        return []
    }
    return data
}

/**
 * Fetches certificates for the current user
 */
export async function getUserCertificates() {
    const supabase = await createClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return []

    const { data, error } = await supabase
        .from('certificates')
        .select(`
            *,
            template:certificate_templates(*),
            course:courses(title)
        `)
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false })

    if (error) {
        console.error("Error fetching user certificates:", error)
        return []
    }
    return data
}

export async function requestCertificate(courseId: string) {
    const supabase = await createClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return { success: false, error: "Usuário não autenticado" }

    // Check if request already exists
    const { data: existing } = await supabase
        .from('certificate_requests')
        .select('status')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single()

    if (existing) {
        return { success: false, error: "Você já solicitou um certificado para este curso." }
    }

    const { error } = await supabase.from('certificate_requests').insert({
        user_id: user.id,
        course_id: courseId,
        status: 'pending'
    })

    if (error) {
        console.error("Error asking for certificate:", error)
        return { success: false, error: "Erro ao solicitar certificado" }
    }

    revalidatePath('/dashboard/certificados')
    return { success: true }
}

export async function getUserRequests() {
    const supabase = await createClient()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return []

    const { data, error } = await supabase
        .from('certificate_requests')
        .select(`*, course:courses(title)`)
        .eq('user_id', user.id)
        .order('request_date', { ascending: false })

    if (error) return []
    return data
}
