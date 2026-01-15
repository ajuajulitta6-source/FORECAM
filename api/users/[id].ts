import { withAuth, AuthenticatedRequest } from '../lib/auth';
import { createAdminClient } from '../lib/supabase';
import type { Request, Response } from 'express';


const handler = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = (req as any).params;

    if (req.method !== 'DELETE') {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // Authorization: Only ADMINs can delete users
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // Prevent self-deletion
    if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    try {
        const supabaseAdmin = createAdminClient();

        // 1. Delete from auth.users (if it exists there)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id as string);

        if (authError) {
            console.error('Failed to delete auth user:', authError);
            // We continue to ensure public.users is also cleaned up if auth delete failed/skipped
        }

        // 2. Explicitly delete from public.users to be sure
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', id);

        if (dbError) {
            console.error('Failed to delete public user:', dbError);
            return res.status(500).json({ error: dbError.message });
        }

        // Log the action
        await supabaseAdmin.from('activity_logs').insert({
            user_id: req.user.id,
            action: 'Deleted User',
            type: 'DELETE',
            target: id,
            timestamp: new Date().toISOString()
        });

        return res.status(200).json({ message: 'User deleted successfully' });

    } catch (error: any) {
        console.error('Delete user server error:', error);
        return res.status(500).json({ error: error.message });
    }
};

export default withAuth(handler as any);
