
import { createClient } from '@supabase/supabase-js';

// Access environment variables directly since this runs on server/API function
// Safe, lazy-loaded env access
export const createAdminClient = () => {
    // Access environment variables inside the function
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase URL or Service Role Key (Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)');
    }
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
