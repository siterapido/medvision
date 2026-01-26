import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { UnifiedSidebar } from "@/components/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export default async function NewDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  // Read sidebar state from cookies
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get('sidebar_state')?.value
  const defaultOpen = sidebarState !== 'false'

  // Get user profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, plan_type, subscription_status')
    .eq('id', user.id)
    .single()

  const userData = {
    id: user.id,
    name: profile?.full_name || user.user_metadata?.full_name || null,
    email: user.email,
    avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
    plan_type: profile?.plan_type || 'free',
    subscription_status: profile?.subscription_status || 'inactive',
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <UnifiedSidebar user={userData} />
      <SidebarInset>
        <DashboardShell>
          {children}
        </DashboardShell>
      </SidebarInset>
    </SidebarProvider>
  )
}
