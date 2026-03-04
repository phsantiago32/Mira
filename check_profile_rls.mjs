import { createClient } from '@supabase/supabase-js';

const token = 'sbp_94aeed3fe712bdf7ff4a5c4301037568675fd933';
const ref = 'ychwhxkxsxmuvabxlyjn';

async function run() {
    // We already fixed RLS for admin delete:
    // CREATE POLICY "profiles: admin delete" ON profiles FOR DELETE USING 
    // ( EXISTS (SELECT 1 FROM profiles AS admin WHERE admin.id = auth.uid() AND admin.role = 'admin'::user_role) );

    // Also need to check if there is any other block.
    const query = `
        SELECT policyname, cmd, qual 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND cmd = 'DELETE';
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
