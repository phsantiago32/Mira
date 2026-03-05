import fs from 'fs';
const token = process.env.SUPABASE_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;

if (!token || !ref) {
  console.error('Error: SUPABASE_TOKEN and SUPABASE_PROJECT_REF environment variables must be set.');
  process.exit(1);
}

async function run() {
    const query = `
        SELECT tablename, policyname, cmd, qual, with_check 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('posts', 'comments', 'profiles', 'community_reports', 'suggestions');
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
    fs.writeFileSync('rls_checked.json', JSON.stringify(data, null, 2));
}

run().catch(console.error);
