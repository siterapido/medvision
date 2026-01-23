import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/dashboard/sidebar"
import { cn } from "@/lib/utils"

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

  // Get user profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, plan_type, subscription_status')
    .eq('id', user.id)
    .single()

  const userData = {
    name: profile?.full_name || user.user_metadata?.full_name || null,
    email: user.email,
    avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
    plan_type: profile?.plan_type || 'free',
    subscription_status: profile?.subscription_status || 'inactive',
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={userData} />
      {/* Main content area - adjusts based on sidebar state via CSS */}
      <main className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        "ml-16 lg:ml-64" // Default: collapsed on mobile, expanded on desktop
      )}>
        {children}
      </main>
    </div>
  )
}
