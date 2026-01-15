import { withAuth } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabase';
import { hasPermission } from '../lib/permissions';
import { InventorySchema } from '../lib/schemas';

export default withAuth(async (req, res) => {
    if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin
            .from('inventory')
            .select('*')
            .order('name');

        if (error) {
            console.error('Fetch inventory error:', error);
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
        if (!hasPermission(req.user!, 'MANAGE_INVENTORY')) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        try {
            const itemData = InventorySchema.parse(req.body);

            const { data, error } = await supabaseAdmin
                .from('inventory')
                .insert(itemData)
                .select()
                .single();

            if (error) {
                console.error('Create inventory error:', error);
                return res.status(500).json({ error: error.message });
            }

            return res.status(201).json(data);
        } catch (validationError: any) {
            return res.status(400).json({ error: 'Validation failed', details: validationError.errors });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
});
