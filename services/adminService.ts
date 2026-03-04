import { supabase } from '../lib/supabase';
import { Post, Comment, User } from '../types';

export const adminService = {
    /**
     * Fetch all user profiles for moderation
     */
    async fetchUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }

        return data.map((profile: any) => ({
            id: profile.id,
            name: profile.name,
            email: profile.email, // Note: This might be null if not in public profile
            avatar: profile.avatar_url,
            reputation: profile.reputation || 0,
            trustLevel: profile.trust_level || 'Observador',
            role: profile.role || 'member',
            isMuted: profile.is_muted || false,
            isBlocked: profile.is_blocked || false,
            registrationDate: profile.created_at
        }));
    },

    /**
     * Block or unblock a user
     */
    async toggleBlockUser(userId: string, isBlocked: boolean) {
        const { error } = await supabase
            .from('profiles')
            .update({ is_blocked: isBlocked })
            .eq('id', userId);

        if (error) throw error;
    },

    /**
     * Permanently delete a user
     */
    async deleteUser(userId: string) {
        // Due to RLS and FKs, we might need a stored procedure or to delete related data first
        // For now, we attempt to delete the profile (which should trigger a CASCADE if set up)
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) throw error;
    },

    /**
     * Block an email address
     */
    async blockEmail(email: string) {
        const { error } = await supabase
            .from('denied_emails')
            .insert([{ email }]);

        if (error) throw error;
    },

    /**
     * Fetch all denied emails
     */
    async fetchDeniedEmails(): Promise<string[]> {
        const { data, error } = await supabase
            .from('denied_emails')
            .select('email');

        if (error) return [];
        return data.map(d => d.email);
    },

    /**
     * Unblock an email
     */
    async unblockEmail(email: string) {
        const { error } = await supabase
            .from('denied_emails')
            .delete()
            .eq('email', email);

        if (error) throw error;
    },

    /**
     * Fetch all reported posts
     */
    async fetchReportedPosts(): Promise<Post[]> {
        const { data, error } = await supabase
            .from('posts')
            .select('*, profiles(name, avatar_url)')
            .gt('reports', 0)
            .order('reports', { ascending: false });

        if (error || !data) return [];

        return data.map((row: any) => ({
            id: row.id,
            authorId: row.author_id,
            authorName: row.profiles?.name || 'Membro Oculto',
            authorAvatar: row.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.profiles?.name || 'M')}`,
            title: row.title,
            content: row.content,
            category: row.category,
            reports: row.reports || 0,
            timestamp: new Date(row.created_at).toLocaleDateString(),
            validationStatus: row.validation_status
        } as any));
    },

    /**
     * Delete a post as admin
     */
    async adminDeletePost(postId: string) {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);

        if (error) throw error;
    },

    /**
     * Manage Suggestions & Complaints
     */
    async fetchSuggestions() {
        const { data: oldData, error: e1 } = await supabase.from('suggestions').select('*, profiles(name)').order('created_at', { ascending: false });
        const { data: newData, error: e2 } = await supabase.from('reports').select('*').eq('type', 'suggestion').order('created_at', { ascending: false });

        const mappedNew = (newData || []).map(r => ({
            id: r.id,
            profiles: { name: 'REST Form' },
            subject: 'Nova Sugestão',
            content: r.content,
            created_at: r.created_at
        }));

        return [...(oldData || []), ...mappedNew].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    async fetchComplaints() {
        const { data: oldData } = await supabase.from('complaints').select('*, profiles(name)').order('created_at', { ascending: false });
        const { data: newData } = await supabase.from('reports').select('*').eq('type', 'service_queue').order('created_at', { ascending: false });

        const mappedNew = (newData || []).map(r => ({
            id: r.id,
            profiles: { name: 'REST Form' },
            subject: 'Fila de Serviço',
            content: r.content,
            created_at: r.created_at
        }));

        return [...(oldData || []), ...mappedNew].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    async deleteSuggestion(id: string) {
        await supabase.from('suggestions').delete().eq('id', id);
        await supabase.from('reports').delete().eq('id', id);
    },

    async deleteComplaint(id: string) {
        await supabase.from('complaints').delete().eq('id', id);
        await supabase.from('reports').delete().eq('id', id);
    },

    async fetchCommunityReports() {
        const { data: oldData } = await supabase
            .from('community_reports')
            .select('*, profiles:user_id(name), posts:post_id(content), comments:comment_id(content)')
            .order('created_at', { ascending: false });

        const { data: newData } = await supabase.from('reports').select('*').in('type', ['post_report', 'comment_report']).order('created_at', { ascending: false });

        const mappedNew = await Promise.all((newData || []).map(async r => {
            let targetId = null;
            let isPost = r.type === 'post_report';
            const match = r.content?.match(/ID:\s*([a-zA-Z0-9-]+)/);
            if (match) targetId = match[1];

            // Fetch missing content for better admin view
            let contentRef = 'Conteúdo Restrito/Apagado';
            if (targetId) {
                if (isPost) {
                    const { data: postData } = await supabase.from('posts').select('content').eq('id', targetId).maybeSingle();
                    if (postData) contentRef = postData.content;
                } else {
                    const { data: commentData } = await supabase.from('comments').select('content').eq('id', targetId).maybeSingle();
                    if (commentData) contentRef = commentData.content;
                }
            }

            return {
                id: r.id,
                profiles: { name: 'REST Form' },
                reporter_email: '',
                reason: r.content,
                post_id: targetId,
                is_post_type: isPost, // hidden field to determine table
                posts: isPost ? { content: contentRef } : null,
                comments: !isPost ? { content: contentRef } : null,
                created_at: r.created_at
            };
        }));

        return [...(oldData || []), ...mappedNew].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    async deleteCommunityReport(id: string) {
        await supabase.from('community_reports').delete().eq('id', id);
        await supabase.from('reports').delete().eq('id', id);
    },

    async adminDeleteReportedContent(r: any) {
        // Determinar ID real
        let targetId = r.post_id;
        let isPost = r.is_post_type !== undefined ? r.is_post_type : (r.posts != null);

        if (!targetId && typeof r.reason === 'string') {
            const match = r.reason.match(/ID:\s*([a-zA-Z0-9-]+)/);
            if (match) targetId = match[1];
        }

        if (targetId) {
            if (isPost) {
                await supabase.from('posts').delete().eq('id', targetId);
            } else {
                await supabase.from('comments').delete().eq('id', targetId);
            }
        }

        await this.deleteCommunityReport(r.id);
    },

    /**
     * AI Knowledge Management
     */
    async fetchAIKnowledge() {
        const { data, error } = await supabase.from('suggestions')
            .select('*')
            .like('subject', '[SABER IA]%')
            .order('created_at', { ascending: false });
        if (error) throw error;

        return data.map((item: any) => {
            const lines = item.content.split('\n');
            const categoryMatch = lines.find((l: string) => l.startsWith('Categoria:'))?.replace('Categoria:', '').trim() || '';
            const sourceMatch = lines.find((l: string) => l.startsWith('Fonte:'))?.replace('Fonte:', '').trim() || '';
            const infoText = lines.filter((l: string) => !l.startsWith('Categoria:') && !l.startsWith('Fonte:')).join('\n').trim();

            return {
                id: item.id,
                topic: item.subject.replace('[SABER IA] ', ''),
                information: infoText,
                category: categoryMatch,
                source: sourceMatch,
                created_at: item.created_at
            };
        });
    },

    async addAIKnowledge(knowledge: { topic: string, information: string, category: string, source: string }) {
        const { error } = await supabase.from('suggestions').insert([{
            subject: `[SABER IA] ${knowledge.topic}`,
            content: `Categoria: ${knowledge.category}\nFonte: ${knowledge.source}\n${knowledge.information}`
        }]);
        if (error) throw error;
    },

    async deleteAIKnowledge(id: string) {
        const { error } = await supabase.from('suggestions').delete().eq('id', id);
        if (error) throw error;
    }
};
