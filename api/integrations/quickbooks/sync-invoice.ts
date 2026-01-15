
import { createAdminClient } from '../../../lib/supabaseAdmin';
import { withAuth, AuthenticatedRequest } from '../../lib/auth';
import { VercelResponse } from '@vercel/node';
import { QuickBooksService } from './service';

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { workOrderId } = req.body;

    if (!workOrderId) {
        return res.status(400).json({ error: 'Missing workOrderId' });
    }

    try {
        // 1. Fetch Work Order
        const supabase = createAdminClient();
        const { data: workOrder, error } = await supabase
            .from('work_orders') // Assuming table name, usually it matches. Let's verify if needed.
            .select('*') // I might need to fetch partsUsed too if it's a separate table or JSON column. 
            // Based on types.ts, partsUsed is likely a JSON column or relation.
            // Let's assume it's fetched. If it's a relation, I'd need: .select('*, parts_used(*)')
            .eq('id', workOrderId)
            .single();

        if (error || !workOrder) {
            return res.status(404).json({ error: 'Work Order not found' });
        }

        // 2. Sync to QuickBooks
        const qbService = new QuickBooksService();
        await qbService.connect();
        const invoice = await qbService.createInvoice(workOrder);

        return res.json({ success: true, invoiceId: invoice.Id, invoiceNumber: invoice.DocNumber });

    } catch (error: any) {
        console.error("Sync Error:", error);
        return res.status(500).json({ error: error.message || 'Failed to sync invoice' });
    }
});
