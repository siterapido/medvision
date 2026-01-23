import { OdontoAIChat } from '@/components/dashboard/odonto-ai-chat'
import { getSessionMessages } from '@/app/actions/chat'
import { UIMessage } from 'ai'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Chat | Odonto GPT',
  description: 'Converse com seu tutor inteligente de Odontologia',
}

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const resolvedSearchParams = await searchParams
  const id = resolvedSearchParams.id

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialMessages: UIMessage[] = []

  if (id) {
    try {
      const savedMessages = await getSessionMessages(id)
      // Convert DB messages to AI SDK Message format
      initialMessages = savedMessages.map(m => ({
        id: m.id,
        role: m.role as any,
        content: m.content || "",
        parts: [{ type: 'text', text: m.content || "" }] as any,
        // If we stored tool calls/results in metadata or specialized columns, we'd map them here.
        // For now simplest text restoration.
      }))
    } catch (error) {
      console.error("Error fetching messages", error)
    }
  }

  return (
    <OdontoAIChat
      initialMessages={initialMessages}
      initialChatId={id}
      userId={user?.id}
      userName={user?.user_metadata?.full_name || user?.user_metadata?.name}
    />
  )
}
