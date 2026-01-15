import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to get env vars with validation
const getEnvVar = (key: string) => {
    const value = process.env[key];
    if (!value) {
        console.error(`Missing environment variable: ${key}`);
        // Return empty string to prevent crash on access, but will fail connection
        return '';
    }
    return value;
};

// Server-side admin client factory (prevents state pollution)
export const createAdminClient = () => {
    const url = getEnvVar('SUPABASE_URL');
    const serviceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !serviceKey) {
        throw new Error('Supabase Configuration Missing. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }

    return createClient(url, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

// Deprecated singleton - kept for temporary compat, but should be replaced
// Use lazy initialization for singleton to avoid top-level crashes
let adminInstance: SupabaseClient | null = null;

// Cast the proxy to SupabaseClient<any, "public", any> to be compatible with typical usage
export const supabaseAdmin = new Proxy({} as SupabaseClient<any, "public", any>, {
    get: (_target, prop) => {
        if (!adminInstance) {
            adminInstance = createAdminClient();
        }
        return (adminInstance as any)[prop];
    }
});

// Create client with user's JWT token
export const createUserClient = (token: string) => {
    const url = getEnvVar('SUPABASE_URL');
    const anonKey = getEnvVar('SUPABASE_ANON_KEY');

    if (!url || !anonKey) {
        throw new Error('Supabase Configuration Missing. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    return createClient(url, anonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    });
};

