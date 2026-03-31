import { getUser } from '@/lib/supabase/server'
import { getUserCredits } from '@/lib/credits/service'

export async function GET() {
  const user = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const credits = await getUserCredits(user.id)
  if (!credits) return Response.json({ error: 'Credits not found' }, { status: 404 })

  return Response.json(credits)
}
