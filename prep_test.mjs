import { createClient } from '@supabase/supabase-js';

const token = 'sbp_94aeed3fe712bdf7ff4a5c4301037568675fd933';
const ref = 'ychwhxkxsxmuvabxlyjn';
const TEST_ID = 'test-fake-user-123';

async function run() {
    // 1. Fetch available profiles to see if we have our admin user ID
    let query = `SELECT id FROM profiles WHERE role = 'admin' LIMIT 1;`;
    let res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    let data = await res.json();
    const adminId = data[0]?.id;

    if (!adminId) {
        console.log("No admin found to test RLS");
        return;
    }

    // 2. Insert a fake profile
    query = `INSERT INTO profiles (id, name, role) VALUES ('${TEST_ID}', 'Fake User', 'member') ON CONFLICT (id) DO NOTHING;`;
    await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });

    console.log("Inserted fake user.");

    // We can't easily test RLS using the postgres service role because service_role bypasses RLS.
    // The policy is active, tested by checking pg_policies. We will use browser test.
}

run().catch(console.error);
