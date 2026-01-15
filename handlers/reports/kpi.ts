import { withAuth } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabase';
import { hasPermission } from '../lib/permissions';

export default withAuth(async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!hasPermission(req.user!, 'VIEW_ANALYTICS')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }

    try {
        // Fetch work orders
        const { data: workOrders } = await supabaseAdmin
            .from('work_orders')
            .select('*');

        // Fetch inventory
        const { data: inventory } = await supabaseAdmin
            .from('inventory')
            .select('*');

        // Calculate KPIs
        const totalWorkOrders = workOrders?.length || 0;
        const openWorkOrders = workOrders?.filter(wo => wo.status !== 'COMPLETED').length || 0;
        const completedToday = workOrders?.filter(wo => {
            const today = new Date().toISOString().split('T')[0];
            return wo.status === 'COMPLETED' && wo.updated_at?.startsWith(today);
        }).length || 0;

        const lowStockItems = inventory?.filter(item => item.quantity <= item.min_quantity).length || 0;

        // Calculate total parts cost
        const totalPartsCost = workOrders?.reduce((total, wo) => {
            const partsCost = wo.parts_used?.reduce((sum: number, part: any) =>
                sum + (part.costAtTime * part.quantity), 0) || 0;
            return total + partsCost;
        }, 0) || 0;

        return res.status(200).json({
            totalWorkOrders,
            openWorkOrders,
            completedToday,
            lowStockItems,
            totalPartsCost,
            completionRate: totalWorkOrders > 0
                ? Math.round(((totalWorkOrders - openWorkOrders) / totalWorkOrders) * 100)
                : 0
        });
    } catch (error: any) {
        return res.status(500).json({
            error: 'Failed to fetch KPIs',
            message: error.message
        });
    }
});
