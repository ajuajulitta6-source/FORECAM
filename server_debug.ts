import dotenv from 'dotenv';
console.log("Starting debug...");
dotenv.config({ path: '.env.local' });
console.log("Dotenv loaded.");
console.log("SUPABASE_URL length:", (process.env.SUPABASE_URL || '').length);

import { createClient } from '@supabase/supabase-js';
console.log("Supabase import ok");

const main = async () => {
    try {
        console.log("Importing login...");
        const login = await import('./api/auth/login');
        console.log("Login imported");
    } catch (e) {
        console.error("Import failed", e);
    }
}
main();
