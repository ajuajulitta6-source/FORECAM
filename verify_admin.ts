
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
    console.log("Checking Auth User...");
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error listing users:", error);
        return;
    }

    const admin = users.find(u => u.email === 'admin@fotabong.com');
    if (!admin) {
        console.error("Admin user not found in Auth!");
        return;
    }
    console.log("Auth User Found:", admin.id);

    console.log("Checking Public Profile...");
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', admin.id)
        .single();

    if (profileError) {
        console.error("Error fetching profile:", profileError);
    } else {
        console.log("Profile Found:", profile);
    }
}

verify();
