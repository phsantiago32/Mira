import { createClient } from '@supabase/supabase-js';

const token = 'sbp_94aeed3fe712bdf7ff4a5c4301037568675fd933';
const ref = 'ychwhxkxsxmuvabxlyjn';

async function run() {
    const query = `
    DROP POLICY IF EXISTS "profiles: admin delete" ON profiles;
    CREATE POLICY "profiles: admin delete" ON profiles FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles AS admin WHERE admin.id = auth.uid() AND admin.role = 'admin'::user_role)
    );

    DROP POLICY IF EXISTS "comments: admin delete" ON comments;
    CREATE POLICY "comments: admin delete" ON comments FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles AS admin WHERE admin.id = auth.uid() AND admin.role = 'admin'::user_role)
    );

    DROP POLICY IF EXISTS "suggestions: admin delete" ON suggestions;
    CREATE POLICY "suggestions: admin delete" ON suggestions FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles AS admin WHERE admin.id = auth.uid() AND admin.role = 'admin'::user_role)
    );

    DROP POLICY IF EXISTS "reports: admin delete" ON reports;
    CREATE POLICY "reports: admin delete" ON reports FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles AS admin WHERE admin.id = auth.uid() AND admin.role = 'admin'::user_role)
    );

    DROP POLICY IF EXISTS "community_reports: admin delete" ON community_reports;
    CREATE POLICY "community_reports: admin delete" ON community_reports FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles AS admin WHERE admin.id = auth.uid() AND admin.role = 'admin'::user_role)
    );

    DROP POLICY IF EXISTS "posts: admin delete" ON posts;
    CREATE POLICY "posts: admin delete" ON posts FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles AS admin WHERE admin.id = auth.uid() AND admin.role = 'admin'::user_role)
    );
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

run().catch(console.error);
