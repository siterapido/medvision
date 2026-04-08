
import { ChatWithArtifactPanel } from '@/components/chat'
import { getSessionMessages } from '@/app/actions/chat'
import { createClient } from '@/lib/supabase/server'
import { getRemainingTrialDays } from '@/lib/trial'
import { UIMessage } from 'ai'
import { notFound, redirect } from 'next/navigation'

// Force dynamic rendering to ensure fresh data on each navigation
export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Chat | Odonto GPT',
    description: 'Converse com seu tutor inteligente de Odontologia',
}

export default async function ChatPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Verify if chat exists and belongs to user
    const { data: chat, error } = await supabase
        .from('agent_sessions')
        .select('id, user_id, title')
        .eq('id', id)
        .single()

    if (error || !chat || chat.user_id !== user.id) {
        notFound()
    }

    // 2. Fetch subscription info
    let subscriptionInfo = {
        isPro: false,
        trialDaysRemaining: 0,
    }
    let userImage: string | undefined = undefined

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, plan_type, trial_ends_at')
        .eq('id', user.id)
        .single()

    if (profile) {
        const isPro = profile.plan_type && profile.plan_type !== 'free'
        const trialDaysRemaining = isPro ? 0 : getRemainingTrialDays(profile.trial_ends_at)
        subscriptionInfo = { isPro: !!isPro, trialDaysRemaining }
        if (profile.avatar_url) userImage = profile.avatar_url
    }

    const userName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name
    userImage = userImage || user.user_metadata?.avatar_url || user.user_metadata?.picture

    // 3. Fetch messages
    // Using direct DB access or actions, similar to main chat page but specific for ID
    // The main page used 'getSessionMessages' but imported from '@/app/actions/chat' which might be different
    // Let's check where getSessionMessages is defined.
    // In the original file it was import { getSessionMessages } from '@/app/actions/chat'

    // I will stick to what the original file had, but since I don't have visibility on '@/app/actions/chat',
    // I will assume it works or try to locate it if it fails.
    // Actually, I should use the same import as the main page if possible.
    // Wait, I saw `import { getSessionMessages } from '@/app/actions/chat'` in the previous view_file.

    // 3. Fetch messages using the shared action
    let initialMessages: UIMessage[] = []

    try {
        const savedMessages = await getSessionMessages(id)
        if (savedMessages) {
            initialMessages = savedMessages.map((m) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant' | 'system',
                parts: [{ type: 'text', text: m.content || '' }],
            }))
        }
    } catch (error) {
        console.error('Failed to load messages', error)
    }

    return (
        <ChatWithArtifactPanel
            key={id}
            id={id}
            initialMessages={initialMessages}
            userName={userName}
            userImage={userImage}
            subscriptionInfo={subscriptionInfo}
        />
    )
}
