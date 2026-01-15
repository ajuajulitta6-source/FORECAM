import { supabaseAdmin as supabase } from '../lib/supabase';

const handler = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    if (req.method === 'GET') {
        const currentUserId = user.id;

        // Fetch messages where user is sender OR receiver
        // OR user is ADMIN and receiver is 'ADMIN'

        // Ensure accurate query based on authenticated user
        let query = supabase.from('messages').select('*').order('created_at', { ascending: false });

        if (user.role === 'ADMIN') {
            // Admins see their own messages + messages sent to 'ADMIN'
            query = query.or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId},receiver_id.eq.ADMIN`);
        } else {
            // Regular users see their own messages
            query = query.or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Fetch messages error:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data);
    }

    if (req.method === 'POST') {
        const { receiverId, subject, body, type, relatedEntityId } = req.body;

        if (!receiverId || !subject || !body) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data, error } = await supabase.from('messages').insert({
            sender_id: user.id, // Securely set sender from auth context
            receiver_id: receiverId,
            subject,
            body,
            type: type || 'GENERAL',
            related_entity_id: relatedEntityId || null,
            is_read: false
        }).select().single();

        if (error) {
            console.error('Create message error:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(data);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
};

export default withAuth(handler as any);
