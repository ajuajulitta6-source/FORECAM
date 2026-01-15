import { createClient } from '@supabase/supabase-js';
import type { Response } from 'express';
import { withAuth, AuthenticatedRequest } from '../lib/auth';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const handler = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = (req as any).params;
    const user = req.user!;

    if (req.method === 'PATCH') {
        const updates = req.body; // e.g., { is_read: true }

        // Security check: verify ownership/permission
        // Fetch message first to see who the receiver is
        const { data: message, error: fetchError } = await supabase
            .from('messages')
            .select('receiver_id')
            .eq('id', id)
            .single();

        if (fetchError || !message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Only receiver or ADMIN can update a message (e.g. mark read)
        if (message.receiver_id !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized to update this message' });
        }

        const { data, error } = await supabase
            .from('messages')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data);
    }

    res.setHeader('Allow', ['PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
};

export default withAuth(handler as any);
