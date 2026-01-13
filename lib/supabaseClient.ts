
import { createClient } from '@supabase/supabase-js';

// Configuration provided
const supabaseUrl = 'https://kacchemekzgggelaazsb.supabase.co';
const supabaseKey = 'sb_publishable_S3cMk4nDX-oDvknEvxnD6w_h1f0Gknh';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
