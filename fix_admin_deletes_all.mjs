import { createClient } from '@supabase/supabase-js';

const token = process.env.SUPABASE_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;

if (!token || !ref) {
  console.error('Error: SUPABASE_TOKEN and SUPABASE_PROJECT_REF environment variables must be set.');
  process.exit(1);
}

async function run() {
    const query = `
    DROP POLICY IF EXISTS "app_suggestions: admin delete" ON app_suggestions;
    CREATE POLICY "app_suggestions: admin delete" ON app_suggestions FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles AS admin WHERE admin.id = auth.uid() AND admin.role = 'admin'::user_role)
    );

    DROP POLICY IF EXISTS "service_reports: admin delete" ON service_reports;
    CREATE POLICY "service_reports: admin delete" ON service_reports FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles AS admin WHERE admin.id = auth.uid() AND admin.role = 'admin'::user_role)
    );

    DROP POLICY IF EXISTS "suggestions: admin delete" ON suggestions;
    CREATE POLICY "suggestions: admin delete" ON suggestions FOR DELETE USING (
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
