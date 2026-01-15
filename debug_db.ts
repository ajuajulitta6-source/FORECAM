
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

async function debugDB() {
    console.log("--- DEBUGGING DATABASE ---");

    // 1. Check user_invitations table
    console.log("\n1. Checking 'user_invitations' table...");
    try {
        const { error } = await supabase.from('user_invitations').select('count', { count: 'exact', head: true });
        if (error) {
            console.error("❌ Error accessing user_invitations:", error.message);
        } else {
            console.log("✅ 'user_invitations' table exists and is accessible.");
        }
    } catch (e) {
        console.error("❌ Exception checking user_invitations:", e);
    }

    // 2. Check work_orders table
    console.log("\n2. Checking 'work_orders' table...");
    try {
        const { error } = await supabase.from('work_orders').select('count', { count: 'exact', head: true });
        if (error) {
            console.error("❌ Error accessing work_orders:", error.message);
        } else {
            console.log("✅ 'work_orders' table exists and is accessible.");
        }
    } catch (e) {
        console.error("❌ Exception checking work_orders:", e);
    }
}

debugDB();
