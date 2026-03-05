import { createClient } from '@supabase/supabase-js';

const token = process.env.SUPABASE_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;

if (!token || !ref) {
  console.error('Error: SUPABASE_TOKEN and SUPABASE_PROJECT_REF environment variables must be set.');
  process.exit(1);
}

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
