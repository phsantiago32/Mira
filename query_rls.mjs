import fs from 'fs';
const token = process.env.SUPABASE_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;

if (!token || !ref) {
  console.error('Error: SUPABASE_TOKEN and SUPABASE_PROJECT_REF environment variables must be set.');
  process.exit(1);
}

async function run() {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: `SELECT policyname, qual, with_check, cmd FROM pg_policies WHERE tablename = 'profiles';` })
    });
    const data = await res.json();
    fs.writeFileSync('rls_out.json', JSON.stringify(data, null, 2));
}
run();
