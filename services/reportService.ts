import { supabase } from '../lib/supabase';

export const submitReportRest = async (type: string, content: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error('User not authenticated');
    }

    const { error } = await supabase
        .from('reports')
        .insert([{
            user_id: userId,
            type: type,
            content: content
        }]);

    if (error) {
        console.error('submitReportRest error:', error);
        throw new Error(`Falha ao submeter form: ${error.message}`);
    }

    return true;
};
