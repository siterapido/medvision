import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setAdminRole(email: string) {
    console.log(`Setting admin role for: ${email}`);

    // Find user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
        console.error("Error listing users:", listError);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error(`User not found: ${email}`);
        return;
    }

    console.log(`User found - ID: ${user.id}`);

    // Update profile role to admin
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)
        .select();

    if (error) {
        console.error("Error updating role:", error);
        return;
    }

    console.log(`Role updated to admin successfully!`);
    console.log('Updated profile:', data);
}

const email = process.argv[2] || 'gestorthierry@gmail.com';
setAdminRole(email);
