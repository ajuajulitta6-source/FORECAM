import { VercelRequest, VercelResponse } from '@vercel/node';
import { createAdminClient } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { password, name, token } = req.body;

    if (!password || !name || !token) {
        return res.status(400).json({ error: 'Name, password, and token are required' });
    }

    try {
        // Verify invitation token and get email from it
        const supabaseAdmin = createAdminClient();
        const { data: invitation, error: inviteError } = await supabaseAdmin
            .from('user_invitations')
            .select('*')
            .eq('token', token)
            .eq('used', false)
            .single();

        if (inviteError || !invitation) {
            return res.status(400).json({ error: 'Invalid or expired invitation' });
        }

        // Check expiry
        if (new Date(invitation.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Invitation has expired' });
        }

        // Get email from invitation
        const email = invitation.email;

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        });

        if (authError) {
            return res.status(400).json({
                error: 'Failed to create user',
                message: authError.message
            });
        }

        // Create user profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                name,
                role: invitation.role,
                permissions: invitation.permissions,
                status: 'ACTIVE',
                invited_by: invitation.invited_by
            })
            .select()
            .single();

        if (profileError) {
            // Rollback auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw profileError;
        }

        // Mark invitation as used
        await supabaseAdmin
            .from('user_invitations')
            .update({ used: true })
            .eq('id', invitation.id);

        // Create session for auto-login using signInWithPassword
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password
        });

        if (sessionError) {
            console.error('Session creation error:', sessionError);
        }

        // Log activity
        await supabaseAdmin.from('activity_logs').insert({
            user_id: authData.user.id,
            action: 'User Registered',
            type: 'CREATE',
            target: name
        });

        return res.status(201).json({
            message: 'Account created successfully',
            user: profile,
            session: sessionData?.session || null
        });
    } catch (error: any) {
        console.error('Signup error:', error);
        return res.status(500).json({
            error: 'Registration failed',
            message: error.message
        });
    }
}
