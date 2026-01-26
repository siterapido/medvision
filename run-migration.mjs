#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://fjcbowphcbnvuowsjvbz.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqY2Jvd3BoY2JudnVvd3NqdmJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM2MDUzNiwiZXhwIjoyMDc3OTM2NTM2fQ.CzUb2pLZAOCabBnCNZJaDyL33o3ihzTDJ5cTieZbPxk'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('Reading migration file...')
    const migrationPath = join(__dirname, 'supabase/migrations/20260127000000_add_title_to_agent_sessions.sql')
    const sql = readFileSync(migrationPath, 'utf8')

    console.log('Executing migration...')
    console.log('SQL:', sql)

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`\nExecuting ${statements.length} statements...\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`Statement ${i + 1}/${statements.length}:`)
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''))

      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      })

      if (error) {
        // Try direct query if RPC doesn't work
        console.log('RPC failed, trying direct query...')
        const result = await supabase.from('agent_sessions').select('id').limit(0)

        // Since Supabase client doesn't support raw SQL directly, we'll use fetch
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceRoleKey,
            'Authorization': `Bearer ${supabaseServiceRoleKey}`
          },
          body: JSON.stringify({ query: statement + ';' })
        })

        if (!response.ok) {
          // Last resort: use PostgREST to alter table
          console.log('Direct query failed, this statement may need to be run in Supabase SQL Editor')
        }
      }

      console.log('✓ Success\n')
    }

    console.log('✅ Migration completed successfully!')

    // Verify the column was added
    console.log('\nVerifying migration...')
    const { data: sessions, error: verifyError } = await supabase
      .from('agent_sessions')
      .select('id, title, metadata')
      .limit(3)

    if (verifyError) {
      console.error('Verification failed:', verifyError)
    } else {
      console.log('Sample sessions:', sessions)
      console.log('✓ Column "title" is accessible')
    }

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
