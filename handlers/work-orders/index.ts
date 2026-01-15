import { withAuth } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabase';
import { hasPermission } from '../lib/permissions';
import { WorkOrderSchema } from '../lib/schemas';

export default withAuth(async (req, res) => {
    if (req.method === 'GET') {
        return handleGet(req, res);
    } else if (req.method === 'POST') {
        return handlePost(req, res);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
});

async function handleGet(req: any, res: any) {
    try {
        const { status, assignedTo, priority, type } = req.query;

        let query = supabaseAdmin
            .from('work_orders')
            .select(`
        *,
        asset:assets(*),
        assigned_to:users!assigned_to_id(id, name, email, avatar),
        requested_by:users!requested_by_id(id, name, email, avatar)
      `);

        // Apply filters
        if (status) query = query.eq('status', status);
        if (assignedTo) query = query.eq('assigned_to_id', assignedTo);
        if (priority) query = query.eq('priority', priority);
        if (type) query = query.eq('type', type);

        // Role-based filtering
        if (req.user!.role !== 'ADMIN' && !hasPermission(req.user!, 'MANAGE_WORK_ORDERS')) {
            // Non-admins can only see work orders they're involved in
            query = query.or(`assigned_to_id.eq.${req.user!.id},requested_by_id.eq.${req.user!.id}`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json(data || []);
    } catch (error: any) {
        console.error('Get work orders error:', error);
        return res.status(500).json({
            error: 'Failed to fetch work orders',
            message: error.message
        });
    }
}

async function handlePost(req: any, res: any) {
    if (!hasPermission(req.user!, 'MANAGE_WORK_ORDERS')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }

    try {
        let workOrderData;
        try {
            workOrderData = WorkOrderSchema.parse(req.body);
        } catch (validationError: any) {
            return res.status(400).json({ error: 'Validation failed', details: validationError.errors });
        }

        const workOrder = {
            ...workOrderData,
            requested_by_id: req.user!.id,
            created_at: new Date().toISOString()
        };

        // Schema validation handles required fields now

        const { data, error } = await supabaseAdmin
            .from('work_orders')
            .insert(workOrder)
            .select(`
        *,
        asset:assets(*),
        assigned_to:users!assigned_to_id(id, name, email),
        requested_by:users!requested_by_id(id, name, email)
      `)
            .single();

        if (error) throw error;

        // Log activity
        await supabaseAdmin.from('activity_logs').insert({
            user_id: req.user!.id,
            action: 'Created Work Order',
            type: 'CREATE',
            target: data.title,
            metadata: { work_order_id: data.id }
        });

        return res.status(201).json(data);
    } catch (error: any) {
        console.error('Create work order error:', error);
        return res.status(500).json({
            error: 'Failed to create work order',
            message: error.message
        });
    }
}
