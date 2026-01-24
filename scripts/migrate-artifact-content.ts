import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrate() {
  console.log('Starting artifact migration...')

  // 1. Fetch all artifacts without versions
  const { data: artifacts, error } = await supabase
    .from('artifacts')
    .select('*')

  if (error) {
    console.error('Error fetching artifacts:', error)
    return
  }

  console.log(`Found ${artifacts.length} artifacts to process.`)

  for (const artifact of artifacts) {
    // Check if version 1 already exists
    const { data: existingVersion } = await supabase
      .from('artifact_versions')
      .select('id')
      .eq('artifact_id', artifact.id)
      .eq('version', 1)
      .single()

    if (!existingVersion) {
      console.log(`Creating version 1 for artifact: ${artifact.id} (${artifact.title})`)
      
      const { error: insertError } = await supabase
        .from('artifact_versions')
        .insert({
          artifact_id: artifact.id,
          version: 1,
          content: artifact.content,
          snapshot_content: artifact.content,
          user_initiated: false,
          created_at: artifact.created_at,
        })

      if (insertError) {
        console.error(`Error creating version for ${artifact.id}:`, insertError)
      }
    } else {
      console.log(`Version 1 already exists for artifact: ${artifact.id}`)
    }
  }

  console.log('Migration completed.')
}

migrate().catch(console.error)
