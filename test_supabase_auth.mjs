import { createClient } from '@supabase/supabase-js';
import process from 'process';

process.loadEnvFile('./.env.local');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    const testEmail = process.env.TEST_ADMIN_EMAIL;
    const testPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!testEmail || !testPassword) {
        console.error('Error: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables must be set.');
        process.exit(1);
    }

    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
    });
    console.log('User id:', user?.id);

    const fetchProfile = supabase.from('profiles').select('*').eq('id', user.id).single();
    const timeout = new Promise((resolve) => setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), 2000));

    const profileResult = await Promise.race([fetchProfile, timeout]);
    console.log('Profile result:', JSON.stringify(profileResult, null, 2));
}
test();
