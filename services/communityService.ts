import { supabase } from '../lib/supabase';
import { Post, Comment, ValidationStatus } from '../types';
import { submitReportRest } from './reportService';

export const communityService = {
    async fetchPosts(userId?: string, limit: number = 15, offset: number = 0): Promise<Post[]> {
        const { data, error } = await supabase
            .from('posts')
            .select(`
        *,
        author:profiles!posts_author_id_fkey (name, avatar_url, bio),
        comments (
          id, content, created_at, author_id, likes,
          author:profiles!comments_author_id_fkey (name, avatar_url),
          comment_likes (user_id)
        ),
        post_votes (id, user_id, vote_type)
      `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching posts:', error);
            // Throw so App.tsx can keep existing PROTECTED_POSTS instead of overwriting with empty
            throw error;
        }

        if (!data) return [];

        return data.map((row: any) => {
            const likesCount = row.post_votes?.filter((v: any) => v.vote_type === 'like').length || 0;
            const usefulCount = row.post_votes?.filter((v: any) => v.vote_type === 'useful').length || 0;
            const fakeCount = row.post_votes?.filter((v: any) => v.vote_type === 'fake').length || 0;

            const formattedComments: Comment[] = (row.comments || []).map((c: any) => ({
                id: c.id,
                authorId: c.author_id,
                authorName: c.author?.name || 'Membro Oculto',
                authorAvatar: c.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author?.name || 'M')}&background=f97316&color=fff&bold=true&size=200`,
                content: c.content,
                timestamp: new Date(c.created_at).toLocaleDateString() + ' ' + new Date(c.created_at).toLocaleTimeString().slice(0, 5),
                likes: c.likes || 0,
                isLikedByUser: userId ? (c.comment_likes || []).some((cl: any) => cl.user_id === userId) : false
            }));

            const isLikedByUser = userId ? row.post_votes?.some((v: any) => v.vote_type === 'like' && v.user_id === userId) : false;
            const factVote = userId ? row.post_votes?.find((v: any) => (v.vote_type === 'useful' || v.vote_type === 'fake') && v.user_id === userId) : null;
            const userVote = factVote ? (factVote.vote_type === 'useful' ? 'true' : 'false') : undefined;

            return {
                id: row.id,
                authorId: row.author_id,
                authorName: row.author?.name || 'Membro Oculto',
                authorAvatar: row.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.author?.name || 'M')}&background=f97316&color=fff&bold=true&size=200`,
                authorBio: row.author?.bio || '',
                title: row.title || 'Post Comunitário',
                content: row.content,
                category: row.category,
                workTopic: row.work_topic,
                geoTag: row.geo_tag,
                backgroundImage: row.background_image,
                tags: row.tags || [],
                likes: likesCount,
                isLikedByUser,
                userVote,
                comments: formattedComments,
                isVerified: row.is_verified || false,
                isFraudWarning: row.is_fraud_warning || false,
                urgency: row.urgency || 0,
                validationStatus: (row.validation_status as ValidationStatus) || 'pending',
                usefulVotes: usefulCount,
                fakeVotes: fakeCount,
                reviewVotes: 0,
                timestamp: new Date(row.created_at).toLocaleDateString(),
                reports: row.reports || 0
            };
        });
    },

    async fetchPostById(postId: string, userId?: string): Promise<Post | null> {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                author:profiles!posts_author_id_fkey (name, avatar_url, bio),
                comments (
                    id, content, created_at, author_id, likes,
                    author:profiles!comments_author_id_fkey (name, avatar_url),
                    comment_likes (user_id)
                ),
                post_votes (id, user_id, vote_type)
            `)
            .eq('id', postId)
            .single();

        if (error || !data) {
            console.error('Error fetching post by ID:', error);
            return null;
        }

        const likesCount = data.post_votes?.filter((v: any) => v.vote_type === 'like').length || 0;
        const usefulCount = data.post_votes?.filter((v: any) => v.vote_type === 'useful').length || 0;
        const fakeCount = data.post_votes?.filter((v: any) => v.vote_type === 'fake').length || 0;

        const formattedComments: Comment[] = (data.comments || []).map((c: any) => ({
            id: c.id,
            authorId: c.author_id,
            authorName: c.author?.name || 'Membro Oculto',
            authorAvatar: c.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author?.name || 'M')}&background=f97316&color=fff&bold=true&size=200`,
            content: c.content,
            timestamp: new Date(c.created_at).toLocaleDateString(),
            likes: c.likes || 0,
            isLikedByUser: userId ? (c.comment_likes || []).some((cl: any) => cl.user_id === userId) : false
        }));

        const isLikedByUser = userId ? data.post_votes?.some((v: any) => v.vote_type === 'like' && v.user_id === userId) : false;
        const factVote = userId ? data.post_votes?.find((v: any) => (v.vote_type === 'useful' || v.vote_type === 'fake') && v.user_id === userId) : null;
        const userVote = factVote ? (factVote.vote_type === 'useful' ? 'true' : 'false') : undefined;

        return {
            id: data.id,
            authorId: data.author_id,
            authorName: data.author?.name || 'Membro Oculto',
            authorAvatar: data.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.author?.name || 'M')}&background=f97316&color=fff&bold=true&size=200`,
            authorBio: data.author?.bio || '',
            title: data.title || 'Post Comunitário',
            content: data.content,
            category: data.category,
            workTopic: data.work_topic,
            geoTag: data.geo_tag,
            backgroundImage: data.background_image,
            tags: data.tags || [],
            likes: likesCount,
            isLikedByUser,
            userVote,
            comments: formattedComments,
            isVerified: data.is_verified || false,
            urgency: data.urgency || 0,
            usefulVotes: usefulCount,
            fakeVotes: fakeCount,
            timestamp: new Date(data.created_at).toLocaleDateString(),
            reports: data.reports || 0
        } as Post;
    },

    async createPost(postData: any) {
        const { data, error } = await supabase.from('posts').insert([
            {
                author_id: postData.authorId,
                title: postData.title,
                content: postData.content,
                category: postData.category || 'Geral',
                background_image: postData.backgroundImage,
                validation_status: 'pending',
                created_at: new Date().toISOString()
            }
        ]).select().single();

        if (error) {
            console.error('Error creating post:', error);
            throw error;
        }
        return data;
    },

    async deletePost(postId: string, userId: string) {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('author_id', userId);

        if (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    },

    async createComment(postId: string, authorId: string, content: string) {
        const { data, error } = await supabase.from('comments').insert([
            {
                post_id: postId,
                author_id: authorId,
                content
            }
        ]).select().single();

        if (error) throw error;
        return data;
    },

    async voteOrLike(postId: string, userId: string, voteType: 'useful' | 'fake' | 'like') {
        const inTypes = voteType === 'like' ? ['like'] : ['useful', 'fake'];
        const { data: existing } = await supabase
            .from('post_votes')
            .select('id, vote_type')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .in('vote_type', inTypes)
            .maybeSingle();

        if (existing) {
            if (existing.vote_type === voteType) {
                const { error } = await supabase.from('post_votes').delete().eq('id', existing.id);
                if (error) throw error;
                return 'removed';
            }

            const { error } = await supabase.from('post_votes').update({ vote_type: voteType }).eq('id', existing.id);
            if (error) throw error;
            return 'updated';
        } else {
            const { error } = await supabase.from('post_votes').insert([{ post_id: postId, user_id: userId, vote_type: voteType }]);
            if (error) throw error;
            return 'inserted';
        }
    },

    async toggleCommentLike(commentId: string, userId: string) {
        const { data: existing } = await supabase
            .from('comment_likes')
            .select('*')
            .eq('comment_id', commentId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            const { error: delError } = await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId);
            if (delError) throw delError;

            await supabase.rpc('decrement_comment_likes', { c_id: commentId });
            return 'removed';
        } else {
            const { error: insError } = await supabase.from('comment_likes').insert([{ comment_id: commentId, user_id: userId }]);
            if (insError) throw insError;

            await supabase.rpc('increment_comment_likes', { c_id: commentId });
            return 'inserted';
        }
    },

    async reportContent(data: { postId?: string, commentId?: string, userId: string, reason: string, email?: string, name?: string }) {
        const type = data.postId ? 'post_report' : 'comment_report';
        const targetId = data.postId || data.commentId || 'desconhecido';
        const contentStr = `Denúncia de ${type === 'post_report' ? 'Post' : 'Comentário'} ID: ${targetId}\nMotivo: ${data.reason}\nReportado por: ${data.email || data.name || 'Anónimo'}`;

        await submitReportRest(type, contentStr);

        // Try to increment post report counter, but don't fail if RPC doesn't exist
        if (data.postId) {
            try {
                await supabase.rpc('increment_post_reports', { p_id: data.postId });
            } catch (rpcErr) {
                // RPC may not be deployed - silently ignore, report was already saved
                console.warn('increment_post_reports RPC not available:', rpcErr);
            }
        }
    },

    async toggleSavedPost(postId: string, userId: string) {
        const { data: existing } = await supabase
            .from('saved_posts')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', userId);
            if (error) throw error;
            return 'removed';
        } else {
            const { error } = await supabase.from('saved_posts').insert([{ post_id: postId, user_id: userId }]);
            if (error) throw error;
            return 'inserted';
        }
    }
};
