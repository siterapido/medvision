import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createTestUser() {
    const email = 'jaimelannister@westeros.com';
    const password = 'TestPass123!';

    console.log(`Checking if user ${email} exists...`);

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        process.exit(1);
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log(`User ${email} already exists (ID: ${existingUser.id}). Updating password and confirming email...`);
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password: password,
            email_confirm: true
        });

        if (updateError) {
            console.error('Error updating user:', updateError);
            process.exit(1);
        }
        console.log('User updated successfully.');
    } else {
        console.log(`User ${email} does not exist. Creating...`);
        const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createError) {
            console.error('Error creating user:', createError);
            console.error('If this error persists, check if the service role key is valid and has admin privileges.');
            process.exit(1);
        }
        console.log(`User created successfully (ID: ${data.user.id}).`);
    }
}

createTestUser();
