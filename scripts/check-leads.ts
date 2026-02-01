import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkLeads() {
    const { data: leads, error, count } = await supabaseAdmin
        .from('leads')
        .select('id, name, phone, email, status, source, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`\nTotal leads na tabela: ${count}\n`);
    console.log('Ultimos 10 leads importados:\n');

    leads?.forEach((l, i) => {
        console.log(`${i + 1}. ${l.name || '(sem nome)'}`);
        console.log(`   Phone: ${l.phone}`);
        console.log(`   Email: ${l.email || '-'}`);
        console.log(`   Status: ${l.status}`);
        console.log(`   Source: ${l.source}`);
        console.log('');
    });

    // Count by source
    const { data: sourceCounts } = await supabaseAdmin
        .from('leads')
        .select('source')
        .not('source', 'is', null);

    if (sourceCounts) {
        const counts = sourceCounts.reduce((acc, l) => {
            acc[l.source] = (acc[l.source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log('\nLeads por origem:');
        Object.entries(counts).forEach(([source, cnt]) => {
            console.log(`  - ${source}: ${cnt}`);
        });
    }
}

checkLeads().catch(console.error);
