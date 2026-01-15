import { VercelRequest, VercelResponse } from '@vercel/node';
import { createAdminClient } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        // use a dedicated client for auth to avoid polluting admin client state
        const authClient = createAdminClient();
        const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: authError.message
            });
        }

        // Use a FRESH admin client for database operations to ensure we bypass RLS correctly
        // and aren't affected by the user context from the authClient
        const adminDb = createAdminClient();

        const { data: profile, error: profileError } = await adminDb
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profile) {
            console.error("Profile Fetch Error for ID " + authData.user.id + ":", profileError);
            return res.status(500).json({
                error: `Failed to fetch user profile: ${profileError?.message || 'Profile missing in public.users table'}`
            });
        }

        // Check if user is active
        if (profile.status !== 'ACTIVE') {
            return res.status(403).json({ error: 'Account is not active' });
        }

        // Log activity
        await adminDb.from('activity_logs').insert({
            user_id: authData.user.id,
            action: 'User Login',
            type: 'LOGIN',
            metadata: { email }
        });

        // Return user and session
        return res.status(200).json({
            user: profile,
            session: authData.session
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return res.status(500).json({
            error: 'Login failed',
            message: error.message
        });
    }
}
