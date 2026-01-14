import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function verifyAndResetUser() {
    const email = 'marckexpert1@gmail.com';
    const password = '@Admin2026';

    console.log(`Attempting login for user: ${email} with public client...`);

    const { data, error } = await supabasePublic.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Login failed:', error.message);

        console.log(`\nAttempting to reset password for ${email} with admin client...`);
        const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            // We don't have ID, so we need to find it or use updateUser which might need ID.
            // Wait, listUsers failed before. Let's try getUserByEmail if available or just listUsers again hoping it was transient?
            // actually admin.updateUserById needs ID. admin.createUser or admin.listUsers.
            // let's try to just update user by email if possible? No, usually by ID.
            // Let's try attempting to create the user, if it exists it will fail but maybe give us ID?
            // Or we can blindly try to update using a different method if possible.

            // Checking if we can just reset password/email without ID? No.
            // Let's try listUsers again, maybe the error was transient.
        );
        // Let's rely on listUsers specifically.
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
            console.error("Critical: Could not list users to find ID for password reset.", listError);
            return;
        }

        const user = users.find(u => u.email === email);
        if (!user) {
            console.log("User not found in list. Creating user...");
            const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true
            });
            if (createError) {
                console.error("Error creating user:", createError);
            } else {
                console.log("User created successfully:", createData.user.id);
                console.log("Try logging in again.");
            }
            return;
        }

        console.log(`User found (ID: ${user.id}). Updating password...`);
        const { data: updateDataResult, error: updateErrorResult } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: password }
        );

        if (updateErrorResult) {
            console.error("Error updating password:", updateErrorResult);
        } else {
            console.log("Password updated successfully.");

            // Verify login again
            console.log("Verifying login after reset...");
            const { error: finalLoginError } = await supabasePublic.auth.signInWithPassword({
                email,
                password,
            });
            if (finalLoginError) {
                console.error("Login still failed:", finalLoginError.message);
            } else {
                console.log("Login successful after reset!");
            }
        }

    } else {
        console.log('Login successful!');
        console.log(`User ID: ${data.user.id}`);
        console.log(`Email: ${data.user.email}`);
    }
}

verifyAndResetUser();
