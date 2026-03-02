import { supabase } from '../lib/supabase';
import { User } from '../types';

export const authService = {
    async fetchProfileWithRetry(userId: string, retries = 3, delay = 500): Promise<any | null> {
        for (let i = 0; i < retries; i++) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (!error && data) return data;

                // If error is persistent (not a race condition), we might want to break early
                // but let's retry anyway in case it's a transient RLS issue
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                }
            } catch (e) {
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                }
            }
        }
        return null;
    },

    mapProfileToUser(profile: any, sessionUser: any): User {
        return {
            id: profile.id,
            email: sessionUser.email || profile.email || '',
            name: profile.name || sessionUser.user_metadata?.name || 'Usuário Novo',
            avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}`,
            bio: profile.bio || '',
            nationality: profile.nationality || 'Não especificada',
            ageRange: profile.age_range || '',
            location: profile.location || '',
            mainChallenge: profile.main_challenge || '',
            reputation: profile.reputation || 0,
            trustLevel: profile.trust_level || 'Observador',
            isVerified: profile.is_verified || false,
            role: profile.role || 'member',
            isMuted: profile.is_muted || false,
            registrationDate: profile.updated_at || new Date().toISOString()
        };
    },

    async createFallbackProfile(userId: string, email: string, name?: string): Promise<User> {
        const isAdmin = email.includes('amandasabreu');
        const defaultName = name || (isAdmin ? 'Amanda Admin' : 'Usuário Comunidade');

        const { data, error } = await supabase.from('profiles').insert([{
            id: userId,
            name: defaultName,
            email: email,
            role: isAdmin ? 'admin' : 'member'
        }]).select().single();

        const profileData = data || {
            id: userId,
            name: defaultName,
            email: email,
            role: isAdmin ? 'admin' : 'member',
            reputation: 500,
            trust_level: 'Curador Comunitário',
            is_verified: true
        };

        return {
            id: profileData.id,
            email: email,
            name: profileData.name,
            role: profileData.role as 'admin' | 'member' | 'mentor',
            reputation: profileData.reputation || 500,
            trustLevel: profileData.trust_level || 'Curador Comunitário',
            isVerified: profileData.is_verified || true,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(isAdmin ? 'Admin' : 'User')}`,
            bio: '',
            nationality: '',
            ageRange: '',
            location: '',
            mainChallenge: '',
            isMuted: false,
            registrationDate: new Date().toISOString()
        };
    }
};
