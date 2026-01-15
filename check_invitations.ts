import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkInvitations() {
    try {
        console.log('Checking recent invitations...\n');

        const { data, error } = await supabaseAdmin
            .from('user_invitations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error:', error);
            return;
        }

        if (!data || data.length === 0) {
            console.log('❌ No invitations found in database');
            console.log('\nYou need to create an invitation from the admin panel first!');
            return;
        }

        console.log(`✅ Found ${data.length} recent invitation(s):\n`);

        data.forEach((inv, index) => {
            console.log(`${index + 1}. Email: ${inv.email}`);
            console.log(`   Role: ${inv.role}`);
            console.log(`   Used: ${inv.used ? 'Yes ❌' : 'No ✅'}`);
            console.log(`   Expires: ${new Date(inv.expires_at).toLocaleString()}`);
            console.log(`   Token: ${inv.token.substring(0, 20)}...`);
            console.log(`   Link: http://localhost:3000/#/signup?token=${inv.token}`);
            console.log('');
        });

    } catch (err) {
        console.error('Error:', err);
    }
}

checkInvitations();
