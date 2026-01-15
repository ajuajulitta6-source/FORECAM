
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomBytes } from 'crypto';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('--- Testing DB Insert ---');

    // 1. Get a valid user for invited_by
    const { data: user, error: userError } = await supabase.from('users').select('id, email').limit(1).single();

    if (userError || !user) {
        console.error('Failed to get user:', userError);
        return;
    }

    console.log('Using inviter:', user.id, user.email);

    // 2. Try Insert
    const token = randomBytes(32).toString('hex');
    const payload = {
        email: `test-${Date.now()}@example.com`,
        role: 'TECHNICIAN',
        permissions: ['MANAGE_WORK_ORDERS'],
        invited_by: user.id,
        token: token,
        expires_at: new Date(Date.now() + 86400000).toISOString()
    };

    console.log('Attempting insert with:', payload);

    const { data, error } = await supabase.from('user_invitations').insert(payload).select().single();

    if (error) {
        console.error('INSERT FAILED:', error);
    } else {
        console.log('INSERT SUCCESS:', data);
    }
}

testInsert();
