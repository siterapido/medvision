import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function resetPassword() {
    const userId = 'f7e00e9d-319a-4ad3-a2b3-5a23af38aa47'; // ID for marckexpert1@gmail.com
    const newPassword = '@Admin2025';

    console.log(`Resetting password for user ID: ${userId} to: ${newPassword}...`);

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
    );

    if (error) {
        console.error('Error updating password:', error.message);
        process.exit(1);
    }

    console.log('Password reset successfully for user ID:', userId);
}

resetPassword();
