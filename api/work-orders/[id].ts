import { withAuth } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabase';

export default withAuth(async (req, res) => {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid work order ID' });
    }

    if (req.method === 'GET') {
        return handleGet(req, res, id);
    } else if (req.method === 'PATCH') {
        return handlePatch(req, res, id);
    } else if (req.method === 'DELETE') {
        return handleDelete(req, res, id);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
});

async function handleGet(req: any, res: any, id: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('work_orders')
            .select(`
        *,
        asset:assets(*),
        assigned_to:users!assigned_to_id(*),
        requested_by:users!requested_by_id(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Work order not found' });
        }

        // Check access
        const canView =
            req.user!.role === 'ADMIN' ||
            data.assigned_to_id === req.user!.id ||
            data.requested_by_id === req.user!.id;

        if (!canView) {
            return res.status(403).json({ error: 'Access denied' });
        }

        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(500).json({
            error: 'Failed to fetch work order',
            message: error.message
        });
    }
}

async function handlePatch(req: any, res: any, id: string) {
    try {
        // Check if work order exists and user has access
        const { data: existing, error: fetchError } = await supabaseAdmin
            .from('work_orders')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return res.status(404).json({ error: 'Work order not found' });
        }

        const canUpdate =
            req.user!.role === 'ADMIN' ||
            existing.assigned_to_id === req.user!.id ||
            existing.requested_by_id === req.user!.id;

        if (!canUpdate) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Update work order
        const { data, error } = await supabaseAdmin
            .from('work_orders')
            .update({
                ...req.body,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await supabaseAdmin.from('activity_logs').insert({
            user_id: req.user!.id,
            action: 'Updated Work Order',
            type: 'UPDATE',
            target: data.title,
            metadata: { work_order_id: id, changes: req.body }
        });

        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(500).json({
            error: 'Failed to update work order',
            message: error.message
        });
    }
}

async function handleDelete(req: any, res: any, id: string) {
    if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        const { error } = await supabaseAdmin
            .from('work_orders')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await supabaseAdmin.from('activity_logs').insert({
            user_id: req.user!.id,
            action: 'Deleted Work Order',
            type: 'DELETE',
            target: id
        });

        return res.status(200).json({ message: 'Work order deleted' });
    } catch (error: any) {
        return res.status(500).json({
            error: 'Failed to delete work order',
            message: error.message
        });
    }
}
