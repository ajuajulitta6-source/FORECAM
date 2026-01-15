import { VercelRequest, VercelResponse } from '@vercel/node';
import { createAdminClient } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token } = req.query;

    if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        // Fetch invitation details
        const supabaseAdmin = createAdminClient();
        const { data: invitation, error } = await supabaseAdmin
            .from('user_invitations')
            .select('email, role, expires_at, used')
            .eq('token', token)
            .single();

        if (error || !invitation) {
            return res.status(404).json({ error: 'Invalid invitation token' });
        }

        // Check if already used
        if (invitation.used) {
            return res.status(400).json({ error: 'This invitation has already been used' });
        }

        // Check expiry
        if (new Date(invitation.expires_at) < new Date()) {
            return res.status(400).json({ error: 'This invitation has expired' });
        }

        return res.status(200).json({
            email: invitation.email,
            role: invitation.role,
            expires_at: invitation.expires_at
        });
    } catch (error: any) {
        console.error('Verify invitation error:', error);
        return res.status(500).json({
            error: 'Failed to verify invitation',
            message: error.message
        });
    }
}
