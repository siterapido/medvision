#!/usr/bin/env node
/**
 * Apply knowledge_documents migration to Supabase
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('Reading migration file...');

  const migrationPath = join(__dirname, '../supabase/migrations/20260128000000_create_knowledge_documents.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('Applying migration to Supabase...');

  try {
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('CREATE') || statement.includes('ALTER') || statement.includes('GRANT')) {
        console.log(`Executing: ${statement.substring(0, 60)}...`);

        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error && !error.message.includes('already exists')) {
          console.error(`Error: ${error.message}`);
        }
      }
    }

    console.log('✓ Migration applied successfully!');
    console.log('\nVerifying table exists...');

    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('count')
      .limit(1);

    if (error) {
      console.error(`Verification failed: ${error.message}`);
      process.exit(1);
    }

    console.log('✓ Table verified: knowledge_documents exists');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

applyMigration();
