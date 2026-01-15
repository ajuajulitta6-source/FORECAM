import { withAuth } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabase';
import { hasPermission } from '../lib/permissions';
import { AssetBaseSchema } from '../lib/schemas';

export default withAuth(async (req, res) => {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid asset ID' });
    }

    // GET - Fetch single asset
    if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin
            .from('assets')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        return res.status(200).json(data);
    }

    // PATCH - Update asset
    if (req.method === 'PATCH') {
        if (!hasPermission(req.user!, 'MANAGE_ASSETS')) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        try {
            // Partial validation for updates
            const updateData = AssetBaseSchema.partial().parse(req.body);

            const { data, error } = await supabaseAdmin
                .from('assets')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Log activity
            await supabaseAdmin.from('activity_logs').insert({
                user_id: req.user!.id,
                action: 'Updated Asset',
                type: 'UPDATE',
                target: data.name,
                metadata: { asset_id: id, changes: updateData }
            });

            return res.status(200).json(data);
        } catch (error: any) {
            if (error.issues) {
                return res.status(400).json({ error: 'Validation failed', details: error.issues });
            }
            console.error('Update asset error:', error);
            return res.status(500).json({ error: 'Failed to update asset' });
        }
    }

    // DELETE - Remove asset
    if (req.method === 'DELETE') {
        if (!hasPermission(req.user!, 'MANAGE_ASSETS')) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const { error } = await supabaseAdmin
            .from('assets')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete asset error:', error);
            return res.status(500).json({ error: 'Failed to delete asset' });
        }

        await supabaseAdmin.from('activity_logs').insert({
            user_id: req.user!.id,
            action: 'Deleted Asset',
            type: 'DELETE',
            target: id
        });

        return res.status(200).json({ message: 'Asset deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
});
