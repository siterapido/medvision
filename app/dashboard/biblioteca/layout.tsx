import { redirect } from "next/navigation"
import { createClient, getUser } from "@/lib/supabase/server"
import { UnavailablePage } from "@/components/unavailable-page"

export default async function BibliotecaLayout({ children }: { children: React.ReactNode }) {
    const user = await getUser()
    if (user) {
        const supabase = await createClient()
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan_type')
            .eq('id', user.id)
            .single()

        if (!profile?.plan_type || profile.plan_type === 'free') {
            redirect('/dashboard')
        }
    }

    return (
        <>
            <UnavailablePage
                title="Biblioteca Digital"
                description="Nossa biblioteca está passando por uma atualização completa para oferecer a melhor experiência de estudo. Em breve ela estará disponível com novos recursos."
            />
            {children}
        </>
    )
}
