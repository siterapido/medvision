import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

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
      <SidebarInset className="flex flex-col min-h-svh">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ml-1" />
          <span className="font-semibold">Odonto GPT</span>
        </header>
        <main className="flex-1 overflow-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
