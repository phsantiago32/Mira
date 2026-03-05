import { createClient } from '@supabase/supabase-js';

const token = process.env.SUPABASE_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;
const TEST_ID = 'test-fake-user-123';

if (!token || !ref) {
  console.error('Error: SUPABASE_TOKEN and SUPABASE_PROJECT_REF environment variables must be set.');
  process.exit(1);
}

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
