import { SupabaseClient } from '@supabase/supabase-js'

export interface AgentSession {
    id: string
    user_id: string
    agent_type: string
    title?: string
    status: string
    metadata?: any
    created_at: string
    updated_at: string
}

export interface AgentMessage {
    id: string
    session_id: string
    agent_id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    tool_calls?: any
    tool_results?: any
    metadata?: any
    created_at: string
}

export class ChatService {
    constructor(private supabase: SupabaseClient) { }

    async createSession(userId: string, agentId: string, title?: string, id?: string): Promise<AgentSession> {
        const insertData: any = {
            user_id: userId,
            agent_type: agentId,
            title: title || 'Nova Conversa',
            status: 'active'
        }
        if (id) insertData.id = id

        const { data, error } = await this.supabase
            .from('agent_sessions')
            .insert(insertData)
            .select()
            .single()

        if (error) throw error
        return data
    }

    async getSession(sessionId: string): Promise<AgentSession | null> {
        const { data, error } = await this.supabase
            .from('agent_sessions')
            .select('*')
            .eq('id', sessionId)
            .single()

        if (error) return null
        return data
    }

    async updateSessionTitle(sessionId: string, title: string) {
        const { error } = await this.supabase
            .from('agent_sessions')
            .update({ title })
            .eq('id', sessionId)

        if (error) console.error('Error updating session title', error)
    }

    async getUserSessions(userId: string): Promise<AgentSession[]> {
        const { data, error } = await this.supabase
            .from('agent_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })

        if (error) throw error
        return data
    }

    async getMessages(sessionId: string): Promise<AgentMessage[]> {
        const { data, error } = await this.supabase
            .from('agent_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })

        if (error) throw error
        return data
    }

    async saveMessage(sessionId: string, message: Partial<AgentMessage>): Promise<AgentMessage> {
        // Ensure tool info is correctly stored
        const { data, error } = await this.supabase
            .from('agent_messages')
            .insert({
                session_id: sessionId,
                agent_id: message.agent_id || 'system',
                role: message.role,
                content: message.content,
                tool_calls: message.tool_calls,
                tool_results: message.tool_results,
                metadata: message.metadata
            })
            .select()
            .single()

        if (error) throw error
        return data
    }

    async searchMemories(userId: string, query: string, limit = 5) {
        // TODO: Implement vector search when available
        // For now just return recent shared memories
        const { data } = await this.supabase
            .from('agent_memories')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)
        return data || []
    }

    async saveMemory(userId: string, agentId: string, content: string, type: 'short_term' | 'long_term' | 'fact' = 'fact', shared: boolean = true) {
        const { error } = await this.supabase
            .from('agent_memories')
            .insert({
                user_id: userId,
                agent_id: agentId,
                content,
                type,
                shared
            })
        if (error) console.error('Error saving memory', error)
    }
}
