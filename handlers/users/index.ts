import { withAuth } from '../lib/auth';
import { createAdminClient } from '../lib/supabase';
import { hasPermission } from '../lib/permissions';

export default withAuth(async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const supabaseAdmin = createAdminClient();
        let query = supabaseAdmin
            .from('users')
            .select('id, name, email, role, avatar, permissions, status, created_at');

        // Non-admins can only see active users
        if (req.user!.role !== 'ADMIN') {
            query = query.eq('status', 'ACTIVE');
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json(data || []);
    } catch (error: any) {
        return res.status(500).json({
            error: 'Failed to fetch users',
            message: error.message
        });
    }
});
