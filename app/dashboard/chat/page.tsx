import { OdontoAIChat } from '@/components/dashboard/odonto-ai-chat'
import { getSessionMessages } from '@/app/actions/chat'
import { Message } from 'ai'

export const metadata = {
  title: 'Chat | Odonto GPT',
  description: 'Converse com seu tutor inteligente de Odontologia',
}

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const resolvedSearchParams = await searchParams
  const id = resolvedSearchParams.id

  let initialMessages: Message[] = []

  if (id) {
    try {
      const savedMessages = await getSessionMessages(id)
      // Convert DB messages to AI SDK Message format
      initialMessages = savedMessages.map(m => ({
        id: m.id,
        role: m.role as any,
        content: m.content || "",
        // If we stored tool calls/results in metadata or specialized columns, we'd map them here.
        // For now simplest text restoration.
      }))
    } catch (error) {
      console.error("Error fetching messages", error)
    }
  }

  return <OdontoAIChat initialMessages={initialMessages} initialChatId={id} />
}
