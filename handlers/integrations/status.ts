
import { createAdminClient } from '../../lib/supabaseAdmin';
import { withAuth, AuthenticatedRequest } from '../lib/auth';
import { VercelResponse } from '@vercel/node';

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('integration_settings')
            .select('*');

        if (error) throw error;

        const statuses = data.map(setting => ({
            service: setting.service_name,
            isEnabled: setting.is_enabled,
            isConnected: !!setting.access_token, // If we have a token, we consider it connected
            lastSync: setting.updated_at
        }));

        // Fill in missing services with default disabled state
        const services = ['QUICKBOOKS', 'HUBSPOT'];
        services.forEach(s => {
            if (!statuses.find(st => st.service === s)) {
                statuses.push({ service: s, isEnabled: false, isConnected: false, lastSync: null });
            }
        });

        return res.json(statuses);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});
