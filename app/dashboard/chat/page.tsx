import { ChatWithArtifactPanel } from '@/components/chat'
import { getSessionMessages } from '@/app/actions/chat'
import { UIMessage } from 'ai'
import { createClient, getUser } from '@/lib/supabase/server'

import { getRemainingTrialDays } from '@/lib/trial'

// Force dynamic rendering to ensure fresh data on each navigation
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Chat | MedVision',
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
  const user = await getUser()


  // Buscar dados de assinatura do perfil
  let userImage: string | undefined = undefined
  let subscriptionInfo: { isPro: boolean; trialDaysRemaining: number } = {
    isPro: false,
    trialDaysRemaining: 0,
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, plan_type, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (profile) {
      const isPro = profile.plan_type && profile.plan_type !== 'free'
      const trialDaysRemaining = isPro ? 0 : getRemainingTrialDays(profile.trial_ends_at)
      subscriptionInfo = { isPro: !!isPro, trialDaysRemaining }

      // Update user image if available in profile
      if (profile.avatar_url) {
        userImage = profile.avatar_url
      }
    }
  }

  // Fallback to user metadata for image
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name
  userImage = userImage || user?.user_metadata?.avatar_url || user?.user_metadata?.picture

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
      key={id || 'new-chat'}
      id={id}
      initialMessages={initialMessages}
      userName={userName}
      userImage={userImage}
      subscriptionInfo={subscriptionInfo}
    />
  )
}
