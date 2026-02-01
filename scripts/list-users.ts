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

async function listUsers() {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`\nTotal users: ${users.length}\n`);
    users.forEach((u, i) => {
        console.log(`${i + 1}. ${u.email} (ID: ${u.id})`);
    });
}

listUsers();
