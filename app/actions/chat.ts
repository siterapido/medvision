'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { ChatService } from '@/lib/ai/chat-service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getUserSessions() {
    const user = await getUser()
    if (!user) return []

    const supabase = await createClient()
    const service = new ChatService(supabase)
    return await service.getUserSessions(user.id)
}

export async function getSessionMessages(sessionId: string) {
    const supabase = await createClient()
    const service = new ChatService(supabase)
    return await service.getMessages(sessionId)
}

export async function createNewSession(agentId: string) {
    const user = await getUser()
    if (!user) throw new Error("User not found")

    const supabase = await createClient()
    const service = new ChatService(supabase)
    const session = await service.createSession(user.id, agentId)
    return session.id
}

export async function deleteSession(sessionId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('agent_sessions').delete().eq('id', sessionId)

    if (error) throw error
    revalidatePath('/dashboard/chat')
}

export async function getSharedMemories() {
    const user = await getUser()
    if (!user) return []

    const supabase = await createClient()
    const { data } = await supabase
        .from('agent_memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return data || []
}

