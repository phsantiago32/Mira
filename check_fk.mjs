import fs from 'fs';
const token = 'sbp_94aeed3fe712bdf7ff4a5c4301037568675fd933';
const ref = 'ychwhxkxsxmuvabxlyjn';

async function run() {
    const query = `
        SELECT 
            conname AS constraint_name, 
            conrelid::regclass AS table_name, 
            confrelid::regclass AS foreign_table_name, 
            confdeltype
        FROM pg_constraint c 
        WHERE confrelid::regclass::text IN ('posts', 'profiles') AND confdeltype != 'c';
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
    fs.writeFileSync('fk_checked.json', JSON.stringify(data, null, 2));
}

run().catch(console.error);
