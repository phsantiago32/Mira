import React, { useState, useEffect, useRef } from 'react';
import { User, Comment, ForumPost, ViewType, Badge, Post } from '../types';
import { FileText, Bookmark, Shield, CheckCircle2, Heart, Zap, Star, X, LogOut, ChevronRight, Award, Flame, UserCheck, ShieldAlert, Book, MapPin, Activity, Edit2, Check, CalendarCheck, Trash2, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PREDEFINED_AVATARS } from '../constants';

interface GamificationProfileProps {
    user: User | null;
    onUpdateUser: (user: User) => void;
    helps: number;
    impact: number;
    badges: string[];
    activitiesCount: number;
    savedCount: number;
    followingCount: number;
    createdPosts?: ForumPost[];
    createdComments?: (Comment & { postId: string })[];
    userValidations?: ForumPost[];
    savedPosts?: Post[];
    language: string;
    onNavigateToPost: (postId: string) => void;
    onViewChange: (view: ViewType) => void;
    onDeletePost?: (postId: string) => void;
    onLogout: () => void;
}

const ALL_BADGES: Badge[] = [
    { id: '1', name: 'Pioneiro', icon: 'Flame', description: 'Um dos primeiros membros da comunidade MIRA.', unlocked: true, category: 'social' },
    { id: '2', name: 'Verificador', icon: 'UserCheck', description: 'Verificou como verdadeira 20 postagens na comunidade.', unlocked: true, category: 'trust' },
    { id: '4', name: 'Especialista em Documentos', icon: 'FileText', description: 'Gerou e utilizou minutas oficiais para vencer a burocracia.', unlocked: true, category: 'legal' },
    { id: '8', name: 'Estudante', icon: 'Book', description: 'Leu mais de 10 artigos produzidos pelo MIRA.', unlocked: true, category: 'legal' },
    { id: '9', name: 'Resiliente', icon: 'Heart', description: 'Membro ativo por mais de 6 meses.', unlocked: true, category: 'social' },
    { id: '10', name: 'Chat Expert', icon: 'CalendarCheck', description: 'Conversou com o MIRA por 10 dias seguidos.', unlocked: true, category: 'help' },
    { id: '11', name: 'Guia Local', icon: 'MapPin', description: 'Comentou e avaliou mais de 10 locais no Serviço para Imigrantes.', unlocked: true, category: 'social' },
    { id: '12', name: 'Sentinela', icon: 'ShieldAlert', description: 'Denunciou 10 conteúdos fraudulentos confirmados pela moderação.', unlocked: true, category: 'trust' },
];



const BadgeIcon = ({ icon, unlocked }: { icon: string, unlocked: boolean }) => {
    const props = { size: 24, className: unlocked ? 'text-white' : 'text-slate-300' };
    switch (icon) {
        case 'Flame': return <Flame {...props} />;
        case 'UserCheck': return <UserCheck {...props} />;
        case 'FileText': return <FileText {...props} />;
        case 'Book': return <Book {...props} />;
        case 'Heart': return <Heart {...props} />;
        case 'CalendarCheck': return <CalendarCheck {...props} />;
        case 'MapPin': return <MapPin {...props} />;
        case 'ShieldAlert': return <ShieldAlert {...props} />;
        default: return <Award {...props} />;
    }
};

export const GamificationProfile: React.FC<GamificationProfileProps> = ({
    user,
    onUpdateUser,
    helps = 24,
    impact = 15,
    badges = [],
    activitiesCount = 142,
    followingCount = 56,
    createdPosts = [],
    savedPosts = [],
    onNavigateToPost,
    onViewChange,
    onDeletePost,
    onLogout
}) => {
    const [activeTab, setActiveTab] = useState<'posts' | 'badges' | 'verified'>('posts');
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editBio, setEditBio] = useState(user?.bio || '');
    const [editAvatar, setEditAvatar] = useState(user?.avatar || '');

    const [isSaving, setIsSaving] = useState(false);

    const [preferences, setPreferences] = useState<any>({
        official_aima: true,
        legal_changes: true,
        doc_expiration: true,
        job_matches: true,
        map_urgency: true,
    });

    useEffect(() => {
        if (!user) return;
        supabase.from('user_preferences').select('*').eq('user_id', user.id).single()
            .then(({ data }) => {
                if (data) {
                    setPreferences(data);
                } else {
                    // Seed initial preferences
                    supabase.from('user_preferences').insert([{ user_id: user.id }]).then();
                }
            });
    }, [user]);

    const syncQueue = useRef<Record<string, NodeJS.Timeout>>({});

    const handleTogglePreference = async (key: string) => {
        const newVal = !preferences[key];
        setPreferences((prev: any) => ({ ...prev, [key]: newVal }));

        if (newVal && "Notification" in window && Notification.permission !== "granted") {
            await Notification.requestPermission();
        }

        if (user) {
            if (syncQueue.current[key]) clearTimeout(syncQueue.current[key]);
            syncQueue.current[key] = setTimeout(async () => {
                try {
                    await supabase.from('user_preferences').upsert({
                        user_id: user.id,
                        [key]: newVal
                    });
                } catch (e) { }
                delete syncQueue.current[key];
            }, 800);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: editName,
                    bio: editBio,
                    avatar_url: editAvatar
                })
                .eq('id', user.id);

            if (error) throw error;

            onUpdateUser({
                ...user,
                name: editName,
                bio: editBio,
                avatar: editAvatar
            });
            setIsEditing(false);

            // Tenta salvar metadata permanentemente na db de Autenticação do Supabase
            try {
                await supabase.auth.updateUser({
                    data: { name: editName, avatar_url: editAvatar }
                });
            } catch (e) { }
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            alert('Não foi possível salvar as alterações. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white min-h-full pb-20 animate-fade-in no-scrollbar overflow-y-auto">
            <div className="px-5 pt-6 pb-8 bg-slate-50 border-b border-slate-100 rounded-b-[2.5rem]">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Meu Perfil</h2>
                        <Shield size={16} className="text-mira-blue" fill="currentColor" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-xl transition-all shadow-sm border ${isEditing ? 'bg-mira-orange text-white border-mira-orange' : 'bg-white text-slate-600 border-slate-200'}`}>
                            {isEditing ? <X size={20} /> : <Edit2 size={20} />}
                        </button>
                        <button onClick={() => onLogout()} className="p-2 bg-white shadow-sm border border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors">
                            <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-6 px-1">
                    <div className="flex items-center gap-6">
                        <div className="relative shrink-0">
                            <div className="w-24 h-24 rounded-[2.5rem] p-[4px] bg-gradient-to-tr from-mira-yellow via-mira-orange to-mira-blue shadow-xl">
                                <div className="w-full h-full rounded-[2.3rem] bg-white p-[2px]">
                                    <img
                                        src={isEditing ? editAvatar : user?.avatar || PREDEFINED_AVATARS[0]}
                                        alt="Profile"
                                        className="w-full h-full rounded-[2.1rem] object-cover bg-slate-100"
                                        referrerPolicy="no-referrer"
                                        loading="lazy"
                                        onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=f97316&color=fff&bold=true&size=200`; }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="w-full bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-mira-orange-pastel"
                                        placeholder="Nome comunitário"
                                    />
                                    <input
                                        type="text"
                                        value={editBio}
                                        onChange={e => setEditBio(e.target.value)}
                                        className="w-full bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-mira-orange-pastel"
                                        placeholder="Frase curta de bio..."
                                        maxLength={80}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-2xl text-slate-900 tracking-tighter truncate">{user?.name}</h3>
                                        {user?.isVerified && <CheckCircle2 size={16} className="text-mira-blue fill-mira-blue" />}
                                    </div>
                                    <p className="text-sm font-bold text-slate-600 line-clamp-2 mt-1 italic opacity-80">{user?.bio || "Membro da comunidade MIRA"}</p>
                                    <p className="text-[10px] font-black text-mira-orange uppercase tracking-widest mt-2">{user?.trustLevel || 'Observador'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="animate-in slide-in-from-top-4 duration-300 space-y-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Star size={12} className="text-mira-yellow fill-mira-yellow" /> Foto de Perfil
                                    </p>
                                </div>
                                <div className="grid grid-cols-5 gap-3 max-h-[220px] overflow-y-auto pr-2 no-scrollbar">
                                    {PREDEFINED_AVATARS.map((url, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setEditAvatar(url)}
                                            className={`relative aspect-square rounded-2xl overflow-hidden transition-all active:scale-90 ${editAvatar === url ? 'ring-4 ring-mira-orange shadow-lg scale-95' : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}`}
                                        >
                                            <img src={url} alt="" className="w-full h-full object-cover bg-slate-100" referrerPolicy="no-referrer" loading="lazy" onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = `https://ui-avatars.com/api/?name=Avatar&background=e2e8f0&color=94a3b8&bold=true&size=200`; }} />
                                            {editAvatar === url && (
                                                <div className="absolute inset-0 bg-mira-orange/10 flex items-center justify-center">
                                                    <div className="bg-mira-orange text-white rounded-full p-1 shadow-sm">
                                                        <Check size={10} strokeWidth={4} />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all disabled:opacity-50"
                            >
                                <Check size={16} /> {isSaving ? 'A guardar...' : 'Salvar Perfil'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-4 gap-2 mt-10">
                    <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center text-slate-900 border border-slate-100 shadow-sm">
                        <CheckCircle2 size={18} className="mb-1 text-mira-green" />
                        <span className="font-black text-sm">{helps}</span>
                        <span className="text-[7px] font-black uppercase tracking-tighter opacity-40">Ajudas</span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center text-slate-900 border border-slate-100 shadow-sm">
                        <Activity size={18} className="mb-1 text-mira-blue" />
                        <span className="font-black text-sm">{activitiesCount}</span>
                        <span className="text-[7px] font-black uppercase tracking-tighter opacity-40">Atividades</span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center text-slate-900 border border-slate-100 shadow-sm">
                        <Zap size={18} className="mb-1 text-mira-orange" />
                        <span className="font-black text-sm">{user?.reputation || 0}</span>
                        <span className="text-[7px] font-black uppercase tracking-tighter opacity-40">Impacto</span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center text-slate-900 border border-slate-100 shadow-sm">
                        <Star size={18} className="mb-1 text-mira-yellow" />
                        <span className="font-black text-sm">{badges.length || 3}</span>
                        <span className="text-[7px] font-black uppercase tracking-tighter opacity-40">Selos</span>
                    </div>
                </div>
            </div>

            <div className="flex border-b border-slate-100 sticky top-0 bg-white z-10 overflow-x-auto no-scrollbar scroll-smooth">
                <button onClick={() => setActiveTab('posts')} className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'posts' ? 'text-slate-900 border-b-4 border-mira-orange' : 'text-slate-400'}`}>Publicações</button>
                <button onClick={() => setActiveTab('badges')} className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'badges' ? 'text-slate-900 border-b-4 border-mira-orange' : 'text-slate-400'}`}>Meus Selos</button>
                <button onClick={() => setActiveTab('verified')} className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'verified' ? 'text-slate-900 border-b-4 border-mira-orange' : 'text-slate-400'}`}>Salvos</button>
            </div>

            <div className="p-6">
                {activeTab === 'badges' && (
                    <div className="grid grid-cols-3 gap-6 animate-in fade-in duration-500">
                        {ALL_BADGES.map(badge => (
                            <div key={badge.id} className="flex flex-col items-center text-center group">
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${badge.unlocked ? 'bg-slate-900 shadow-lg shadow-slate-200' : 'bg-slate-100'}`}>
                                    <BadgeIcon icon={badge.icon} unlocked={badge.unlocked} />
                                </div>
                                <h5 className={`text-[9px] font-black uppercase tracking-tight leading-tight ${badge.unlocked ? 'text-slate-900' : 'text-slate-300'}`}>{badge.name}</h5>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'posts' && (
                    <div className="grid grid-cols-1 gap-4">
                        {createdPosts.length > 0 ? createdPosts.map(post => (
                            <div key={post.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-mira-blue transition-all group flex items-start justify-between">
                                <div onClick={() => onNavigateToPost(post.id)} className="flex-1 cursor-pointer">
                                    <span className="text-[8px] font-black bg-slate-50 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">{post.category}</span>
                                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-mira-blue leading-tight uppercase tracking-tight">{post.title}</h4>
                                </div>
                                {onDeletePost && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeletePost(post.id); }}
                                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                                        title="Eliminar Publicação"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        )) : (
                            <div className="text-center py-20 text-slate-300 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Sem publicações ainda</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'verified' && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        {savedPosts.length > 0 ? savedPosts.map(post => (
                            <div
                                key={post.id}
                                onClick={() => onNavigateToPost(post.id)}
                                className="flex gap-4 p-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden"
                            >
                                <div className="w-20 h-20 rounded-[1.8rem] overflow-hidden shrink-0 border border-slate-50 shadow-inner">
                                    <img src={post.backgroundImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" loading="lazy" />
                                </div>
                                <div className="flex flex-col justify-center min-w-0 flex-1">
                                    <span className="text-[8px] font-black bg-mira-blue-pastel text-mira-blue px-3 py-1 rounded-full uppercase tracking-widest w-fit mb-2">{post.category}</span>
                                    <h4 className="font-black text-slate-900 text-xs leading-tight line-clamp-2 mb-1 group-hover:text-mira-blue transition-colors uppercase tracking-tight">{post.title}</h4>
                                    <div className="flex items-center gap-2 mt-auto">
                                        <img src={post.authorAvatar} alt="" className="w-4 h-4 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{post.authorName}</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20 text-slate-300 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                                <Bookmark size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Nenhum item guardado</p>
                            </div>
                        )}
                    </div>
                )}


            </div>
        </div>
    );
};
