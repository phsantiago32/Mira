import { createClient } from '@supabase/supabase-js';

const token = 'sbp_94aeed3fe712bdf7ff4a5c4301037568675fd933';
const ref = 'ychwhxkxsxmuvabxlyjn';

async function run() {
    const query = `
        SELECT id, name, role FROM profiles LIMIT 5;
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
    console.log(JSON.stringify(data, null, 2));
}

run().catch(console.error);
