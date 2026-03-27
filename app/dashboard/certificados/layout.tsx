import { redirect } from "next/navigation"
import { createClient, getUser } from "@/lib/supabase/server"
import { DisabledFeatureModal } from "@/components/disabled-feature-modal"

export default async function CertificadosLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      <DisabledFeatureModal feature="certificados" />
      {children}
    </>
  )
}
