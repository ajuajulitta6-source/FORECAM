import { withAuth } from '../lib/auth';
import { createAdminClient, createUserClient } from '../lib/supabase';
import { randomBytes } from 'crypto';

export default withAuth(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, role, permissions } = req.body;

    // Debug logging
    console.log('Invite Request User:', {
        id: req.user?.id,
        role: req.user?.role,
        permissions: req.user?.permissions
    });

    // Check if user has permission to invite
    const canInvite = req.user?.role === 'ADMIN' || req.user?.permissions?.includes('MANAGE_TEAM');
    if (!canInvite) {
        return res.status(403).json({ error: `Permission denied: MANAGE_TEAM required. Role: ${req.user?.role}, Perms: ${req.user?.permissions}` });
    }

    console.log('Permission check passed');

    // Security: Non-admins cannot create Admin users
    if (role === 'ADMIN' && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Security Warning: Only Admins can create other Admin accounts' });
    }

    if (!email || !role) {
        return res.status(400).json({ error: 'Email and role required' });
    }

    try {
        // Check if user already exists
        const supabaseAdmin = createAdminClient();
        const { data: existing } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Generate secure invitation token
        const token = randomBytes(32).toString('hex');
        console.log('Token generated');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        // Use User Client for Insert (Respects RLS Policy "Managers can invite")
        const authToken = req.headers.authorization?.replace('Bearer ', '');
        const userClient = createUserClient(authToken!);

        const { data: invitation, error } = await userClient
            .from('user_invitations')
            .insert({
                email,
                role,
                permissions: permissions || [],
                invited_by: req.user!.id,
                token,
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('User Client Insert Error:', error);
            throw error;
        }

        console.log('Invitation inserted DB');

        // Log activity
        await supabaseAdmin.from('activity_logs').insert({
            user_id: req.user!.id,
            action: 'Invited User',
            type: 'CREATE',
            target: email,
            metadata: { role, permissions }
        });

        // Send Email
        const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3000';
        const inviteLink = `${frontendUrl}/#/signup?token=${token}`;

        const { sendEmail } = await import('../lib/email');
        const emailSent = await sendEmail(
            email,
            "You're invited to CMMS",
            `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>Welcome to CMMS!</h2>
                <p>You have been invited to join the Construction Management System as a <b>${role}</b>.</p>
                <p>Click the button below to accept the invitation and set up your account:</p>
                <a href="${inviteLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Accept Invitation</a>
                <p>Or copy this link: <br> ${inviteLink}</p>
                <p>This link expires in 7 days.</p>
            </div>
            `
        );

        return res.status(200).json({
            message: 'Invitation created successfully',
            invitation: {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                expires_at: invitation.expires_at
            },
            inviteLink
        });
    } catch (error: any) {
        console.error('CRITICAL INVITE ERROR:', error);
        return res.status(500).json({
            error: `Invite Failed: ${error.message || error.details || 'Unknown error'}`,
            details: error
        });
    }
});
