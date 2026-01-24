import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { ChatHeader } from '@/components/chat/chat-header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Read sidebar state from cookies
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get('sidebar_state')?.value
  const defaultOpen = sidebarState !== 'false'

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <ChatSidebar
        userId={user?.id}
        userName={user?.user_metadata?.full_name || user?.user_metadata?.name}
        userImage={user?.user_metadata?.avatar_url}
      />
      <SidebarInset>
        <ChatHeader />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
