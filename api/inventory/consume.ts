import { withAuth } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabase';
import { hasPermission } from '../lib/permissions';

export default withAuth(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!hasPermission(req.user!, 'MANAGE_INVENTORY')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { inventoryId, quantity } = req.body;

    if (!inventoryId || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid inventory ID or quantity' });
    }

    try {
        // Get current item
        const { data: item, error: fetchError } = await supabaseAdmin
            .from('inventory')
            .select('*')
            .eq('id', inventoryId)
            .single();

        if (fetchError || !item) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }

        // Check if sufficient stock
        if (item.quantity < quantity) {
            return res.status(400).json({
                error: 'Insufficient stock',
                available: item.quantity,
                requested: quantity
            });
        }

        // Update quantity
        const newQuantity = item.quantity - quantity;
        const { data: updated, error: updateError } = await supabaseAdmin
            .from('inventory')
            .update({ quantity: newQuantity })
            .eq('id', inventoryId)
            .select()
            .single();

        if (updateError) throw updateError;

        // Log activity
        await supabaseAdmin.from('activity_logs').insert({
            user_id: req.user!.id,
            action: 'Consumed Inventory',
            type: 'UPDATE',
            target: item.name,
            metadata: {
                inventory_id: inventoryId,
                quantity_consumed: quantity,
                new_quantity: newQuantity
            }
        });

        // Check for low stock alert
        if (newQuantity <= item.min_quantity) {
            await supabaseAdmin.from('activity_logs').insert({
                user_id: req.user!.id,
                action: newQuantity === 0 ? 'Stock Depleted' : 'Low Stock Warning',
                type: 'SYSTEM',
                target: `${item.name} (Qty: ${newQuantity} / Min: ${item.min_quantity})`,
                metadata: { inventory_id: inventoryId }
            });
        }

        return res.status(200).json({
            message: 'Inventory consumed successfully',
            item: updated,
            lowStock: newQuantity <= item.min_quantity
        });
    } catch (error: any) {
        console.error('Consume inventory error:', error);
        return res.status(500).json({
            error: 'Failed to consume inventory',
            message: error.message
        });
    }
});
