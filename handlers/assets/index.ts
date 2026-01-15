import { withAuth } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabase';
import { hasPermission } from '../lib/permissions';
import { AssetSchema } from '../lib/schemas';

export default withAuth(async (req, res) => {
    if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin
            .from('assets')
            .select('*')
            .order('name');

        if (error) {
            console.error('Fetch assets error:', error);
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
        if (!hasPermission(req.user!, 'MANAGE_ASSETS')) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        try {
            const assetData = AssetSchema.parse(req.body);

            const { data, error } = await supabaseAdmin
                .from('assets')
                .insert({
                    ...assetData,
                    created_by: req.user!.id
                })
                .select()
                .single();

            if (error) {
                console.error('Create asset error:', error);
                return res.status(500).json({ error: error.message });
            }

            return res.status(201).json(data);
        } catch (validationError: any) {
            return res.status(400).json({ error: 'Validation failed', details: validationError.errors });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
});
