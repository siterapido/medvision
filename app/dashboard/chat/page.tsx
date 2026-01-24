import { ChatWithArtifactPanel } from '@/components/chat'
import { getSessionMessages } from '@/app/actions/chat'
import { UIMessage } from 'ai'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Chat | Odonto GPT',
  description: 'Converse com seu tutor inteligente de Odontologia',
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const id = resolvedSearchParams.id

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialMessages: UIMessage[] = []

  if (id) {
    try {
      const savedMessages = await getSessionMessages(id)
      // Convert DB messages to AI SDK v5+ UIMessage format
      // IMPORTANTE: Usar apenas 'parts', nao 'content' (deprecated em v5+)
      initialMessages = savedMessages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        parts: [{ type: 'text' as const, text: m.content || '' }],
      }))
    } catch (error) {
      console.error('Error fetching messages', error)
    }
  }

  return (
    <ChatWithArtifactPanel
      id={id}
      initialMessages={initialMessages}
      userName={user?.user_metadata?.full_name || user?.user_metadata?.name}
    />
  )
}
