
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Explicitly load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error("ERROR: .env.local not found!");
    process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase URL or Service Key in env vars.");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const ADMIN_USER = {
    email: 'admin@fotabong.com',
    password: 'admin123', // Change this after first login!
    name: 'System Admin',
    role: 'ADMIN',
    permissions: ['ALL'],
};

async function seedAdmin() {
    console.log(`Seeding Admin User: ${ADMIN_USER.email}`);

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_USER.email,
        password: ADMIN_USER.password,
        email_confirm: true,
        user_metadata: { name: ADMIN_USER.name }
    });

    if (authError) {
        console.error('Error creating auth user:', authError.message);
        // If user already exists, try to fetch them to proceed with profile check
        if (authError.message.includes('already registered')) {
            console.log("User already exists, attempting to find...");
            // We can't easily validly get the ID without signing in or listing, 
            // but for seeding we usually stop here or upsert.
            // Let's try to list to find the ID.
            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const existing = users.users.find(u => u.email === ADMIN_USER.email);
            if (existing) {
                console.log("Found existing auth user ID:", existing.id);
                // Proceed to upsert profile
                await upsertProfile(existing.id);
                return;
            }
        }
        return;
    }

    console.log(`Auth user created. ID: ${authData.user.id}`);
    await upsertProfile(authData.user.id);
}

async function upsertProfile(userId: string) {
    console.log("Creating/Updating public profile...");
    const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert({
            id: userId,
            email: ADMIN_USER.email,
            name: ADMIN_USER.name,
            role: ADMIN_USER.role,
            permissions: ADMIN_USER.permissions,
            status: 'ACTIVE'
        });

    if (profileError) {
        console.error('Error creating profile:', profileError.message);
    } else {
        console.log('SUCCESS: Admin profile created/updated.');
        console.log('You can now log in with:', ADMIN_USER.email, '/', ADMIN_USER.password);
    }
}

seedAdmin();
