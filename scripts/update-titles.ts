
import { createAdminClient } from '../lib/supabase/admin'
import { generateText } from 'ai'
import { openrouter } from '../lib/ai/openrouter'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function main() {
    const supabase = createAdminClient()
    console.log('Fetching recent sessions...')

    // 1. Fetch recent sessions that need a check (or all recent ones)
    // agent_sessions table not in generated types
    const { data: sessions, error } = await (supabase as any)
        .from('agent_sessions')
        .select('id, title, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(50) // Adjust limit as needed

    if (error) {
        console.error('Error fetching sessions:', error)
        return
    }

    console.log(`Found ${sessions.length} sessions. Processing...`)

    for (const session of sessions) {
        try {
            // 2. Fetch first user message
            // agent_messages table not in generated types
            const { data: messages, error: msgError } = await (supabase as any)
                .from('agent_messages')
                .select('content')
                .eq('session_id', session.id)
                .eq('role', 'user')
                .order('created_at', { ascending: true })
                .limit(1)

            if (msgError) {
                console.error(`Error fetching messages for session ${session.id}:`, msgError)
                continue
            }

            if (!messages || messages.length === 0) {
                console.log(`Skipping session ${session.id} (no first message)`)
                continue
            }

            const firstUserMessage = messages[0].content

            // Basic check: if title is already short and possibly generated, maybe skip?
            // But user asked to update "all recent", so let's just do it.
            // Or checking if title === firstUserMessage (which was the old behavior) could be a good heuristic
            // But let's just regenerate to be sure.

            console.log(`Generating title for session ${session.id}...`)

            const { text: newTitle } = await generateText({
                model: openrouter('google/gemini-2.0-flash-001'),
                prompt: `Gere um título muito curto (3 a 4 palavras) em português para esta conversa baseada na mensagem: "${firstUserMessage.substring(0, 500)}". Retorne apenas o título, sem aspas.`,
            })

            const finalTitle = newTitle.trim().replace(/^"|"$/g, '')

            // 3. Update title
            const { error: updateError } = await (supabase as any)
                .from('agent_sessions')
                .update({ title: finalTitle })
                .eq('id', session.id)

            if (updateError) {
                console.error(`Error updating session ${session.id}:`, updateError)
            } else {
                console.log(`Updated session ${session.id}: "${session.title}" -> "${finalTitle}"`)
            }

            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500))

        } catch (err) {
            console.error(`Failed to process session ${session.id}`, err)
        }
    }

    console.log('Update complete!')
}

main().catch(console.error)
