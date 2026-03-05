import fs from 'fs';
const token = process.env.SUPABASE_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;

if (!token || !ref) {
  console.error('Error: SUPABASE_TOKEN and SUPABASE_PROJECT_REF environment variables must be set.');
  process.exit(1);
}

async function run() {
    const query = `
        SELECT 
            conname AS constraint_name, 
            conrelid::regclass AS table_name, 
            confrelid::regclass AS foreign_table_name, 
            confdeltype
        FROM pg_constraint c 
        WHERE confrelid::regclass::text IN ('posts', 'profiles');
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
    fs.writeFileSync('all_fk_checked.json', JSON.stringify(data, null, 2));
}

run().catch(console.error);
