import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';≤

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyLogin() {
    const email = 'jaimelannister@westeros.com';
    const password = 'TestPass123!';

    console.log(`Testing login for ${email}...`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Login failed:', error.message);
        console.error('Full error object:', error);
        process.exit(1);
    }

    console.log('Login successful! User ID:', data.user?.id);
    console.log('Session access token available:', !!data.session?.access_token);
}

verifyLogin();
