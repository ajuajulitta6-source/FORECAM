import { withAuth } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabase';
import { hasPermission } from '../lib/permissions';
import { InventoryBaseSchema } from '../lib/schemas';

export default withAuth(async (req, res) => {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid inventory ID' });
    }

    // GET - Fetch single item
    if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin
            .from('inventory')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }
        return res.status(200).json(data);
    }

    // PATCH - Update item
    if (req.method === 'PATCH') {
        if (!hasPermission(req.user!, 'MANAGE_INVENTORY')) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        try {
            // Partial validation
            const updateData = InventoryBaseSchema.partial().parse(req.body);

            const { data, error } = await supabaseAdmin
                .from('inventory')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            await supabaseAdmin.from('activity_logs').insert({
                user_id: req.user!.id,
                action: 'Updated Inventory',
                type: 'UPDATE',
                target: data.name,
                metadata: { inventory_id: id, changes: updateData }
            });

            return res.status(200).json(data);
        } catch (error: any) {
            if (error.issues) {
                return res.status(400).json({ error: 'Validation failed', details: error.issues });
            }
            console.error('Update inventory error:', error);
            return res.status(500).json({ error: 'Failed to update inventory' });
        }
    }

    // DELETE - Remove item
    if (req.method === 'DELETE') {
        if (!hasPermission(req.user!, 'MANAGE_INVENTORY')) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const { error } = await supabaseAdmin
            .from('inventory')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete inventory error:', error);
            return res.status(500).json({ error: 'Failed to delete inventory' });
        }

        await supabaseAdmin.from('activity_logs').insert({
            user_id: req.user!.id,
            action: 'Deleted Inventory',
            type: 'DELETE',
            target: id
        });

        return res.status(200).json({ message: 'Inventory item deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
});
