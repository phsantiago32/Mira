import { createClient } from '@supabase/supabase-js';

const token = process.env.SUPABASE_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;

if (!token || !ref) {
  console.error('Error: SUPABASE_TOKEN and SUPABASE_PROJECT_REF environment variables must be set.');
  process.exit(1);
}

async function run() {
    const query = `
    DROP POLICY IF EXISTS "profiles: select" ON profiles;
    CREATE POLICY "profiles: select" ON profiles FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "profiles: insert" ON profiles;
    CREATE POLICY "profiles: insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  `;

    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    });

    const data = await res.json();
    console.log("Response:", data);
}
run();
