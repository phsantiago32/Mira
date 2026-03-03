import { supabase } from '../lib/supabase';

export const submitReportRest = async (type: string, content: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error('User not authenticated');
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/reports`;
    const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const token = session.access_token;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': apikey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            user_id: userId,
            type: type,
            content: content
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Falha ao submeter form: ${response.status} ${errText}`);
    }

    return true;
};
