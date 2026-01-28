import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CertificateTemplateForm } from "../../_components/certificate-template-form"

export default async function CertificateTemplatePage({ params }: { params: { id: string } }) {
    const supabase = await createClient()

    // Fetch courses for the dropdown
    const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .order("title")

    let initialData = null

    if (params.id !== "new") {
        const { data: template, error } = await supabase
            .from("certificate_templates")
            .select("*")
            .eq("id", params.id)
            .single()

        if (error || !template) {
            if (error?.code !== 'PGRST116') { // PGRST116 is no rows
                console.error(error)
            }
            return notFound()
        }
        initialData = template
    }

    return (
        <div className="container mx-auto py-10">
            <CertificateTemplateForm
                initialData={initialData}
                courses={courses || []}
            />
        </div>
    )
}
