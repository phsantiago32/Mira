import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { User, Post, ViewType } from '../types';
import {
    Users, ShieldAlert, MailX, Trash2, Ban, ShieldCheck,
    Search, Filter, ChevronRight, AlertCircle, CheckCircle2,
    MoreVertical, UserMinus, ShieldOff, MessageSquare, Sparkles, RefreshCcw, Briefcase, Map as MapIcon, X
} from 'lucide-react';
import { COLORS } from '../constants';
import { supabase } from '../lib/supabase';
import { PROTECTED_JOBS, PROTECTED_SERVICES } from '../utils/protectedData';

interface AdminHubProps {
    onBack: () => void;
}

export const AdminHub: React.FC<AdminHubProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'content' | 'suggestions' | 'knowledge' | 'sync'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [complaints, setComplaints] = useState<any[]>([]);
    const [communityReports, setCommunityReports] = useState<any[]>([]);
    const [aiKnowledge, setAIKnowledge] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [newKnowledge, setNewKnowledge] = useState({ topic: '', information: '', category: '', source: '' });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const data = await adminService.fetchUsers();
                setUsers(data);
            } else if (activeTab === 'content') {
                const { data } = await supabase.from('posts').select('*').order('reports', { ascending: false });
                setPosts(data as any || []);
            } else if (activeTab === 'suggestions') {
                const suggs = await adminService.fetchSuggestions();
                const comps = await adminService.fetchComplaints();
                const commReports = await adminService.fetchCommunityReports();
                setSuggestions(suggs);
                setComplaints(comps);
                setCommunityReports(commReports);
            } else if (activeTab === 'knowledge') {
                const data = await adminService.fetchAIKnowledge();
                setAIKnowledge(data);
            }
        } catch (err) {
            setMessage({ text: 'Erro ao carregar dados', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: () => Promise<void>) => {
        try {
            await action();
            setMessage({ text: 'Operação realizada com sucesso!', type: 'success' });
            loadData();
        } catch (err: any) {
            setMessage({ text: err.message || 'Erro na operação', type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAddKnowledge = async () => {
        if (!newKnowledge.topic || !newKnowledge.information) return;
        await handleAction(() => adminService.addAIKnowledge(newKnowledge));
        setNewKnowledge({ topic: '', information: '', category: '', source: '' });
        alert("✅ Informação enviada para a Base MIRA e Injetada no Chat com sucesso!");
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Plus_Jakarta_Sans']">
            {/* Header */}
            <div className="bg-slate-900 text-white p-8 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Central de Moderação</h2>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Mira Administrator Engine v4.5</p>
                    </div>
                    <button onClick={onBack} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-4 bg-white/5 p-2 rounded-3xl backdrop-blur-md">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-auto min-w-[120px] md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-white/60 hover:text-white'}`}
                    >
                        <Users size={16} /> Usuários
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`flex-auto min-w-[120px] md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-white/60 hover:text-white'}`}
                    >
                        <ShieldAlert size={16} /> Conteúdo
                    </button>
                    <button
                        onClick={() => setActiveTab('suggestions')}
                        className={`flex-auto min-w-[120px] md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'suggestions' ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-white/60 hover:text-white'}`}
                    >
                        <Sparkles size={16} /> Sugestões
                    </button>
                    <button
                        onClick={() => setActiveTab('knowledge')}
                        className={`flex-auto min-w-[120px] md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'knowledge' ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-white/60 hover:text-white'}`}
                    >
                        <MessageSquare size={16} /> Saber AI
                    </button>
                    <button
                        onClick={() => setActiveTab('sync')}
                        className={`flex-auto min-w-[120px] md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sync' ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-white/60 hover:text-white'}`}
                    >
                        <RefreshCcw size={16} /> Sync
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
                {message && (
                    <div className={`mb-8 p-6 rounded-[2rem] border-2 flex items-center gap-4 animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                        {message.type === 'success' ? <CheckCircle2 className="shrink-0" size={20} /> : <AlertCircle className="shrink-0" size={20} />}
                        <p className="text-xs font-black uppercase tracking-widest">{message.text}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <RefreshCcw className="animate-spin text-slate-200" size={40} />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Acedendo aos servidores seguros...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {activeTab === 'users' && (
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-6 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 mb-4">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Exemplo / Instrução</p>
                                    <p className="text-xs text-indigo-900 font-bold">Aqui você gere a comunidade. Pode suspender contas que violem as regras ou promover moderadores.</p>
                                </div>
                                {users.map(u => (
                                    <div key={u.id} className="p-6 bg-slate-50 rounded-[2.5rem] flex items-center justify-between border border-transparent hover:border-slate-200 transition-all">
                                        <div className="flex items-center gap-4">
                                            <img src={u.avatar} className="w-12 h-12 rounded-2xl shadow-sm" alt="" />
                                            <div>
                                                <p className="font-black text-slate-900 text-sm uppercase">{u.name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAction(() => adminService.toggleBlockUser(u.id, !u.isBlocked))} className={`p-3 rounded-xl transition-all ${u.isBlocked ? 'bg-red-600 text-white' : 'bg-white text-slate-400 hover:text-red-600 shadow-sm'}`}>
                                                {u.isBlocked ? <ShieldCheck size={18} /> : <UserMinus size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div className="grid grid-cols-1 gap-6">
                                <div className="p-8 bg-red-50 rounded-[3rem] border border-red-100">
                                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Moderação de Posts</p>
                                    <p className="text-xs text-red-900 font-bold leading-relaxed">Posts reportados pelos usuários aparecem aqui. <br />Ex: "Este post contém fake news sobre vistorias da AIMA".</p>
                                </div>
                                {posts.map(p => (
                                    <div key={p.id} className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-red-100 text-red-600 rounded-xl"><ShieldAlert size={16} /></div>
                                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{p.reports || 0} Denúncias</p>
                                            </div>
                                            <button onClick={() => handleAction(() => adminService.adminDeletePost(p.id))} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-tight">{p.title}</h4>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{p.content}</p>
                                    </div>
                                ))}
                                {posts.length === 0 && <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200"><p className="text-xs font-black text-slate-300 uppercase tracking-widest">Nenhuma denúncia ativa</p></div>}
                            </div>
                        )}

                        {activeTab === 'suggestions' && (
                            <div className="space-y-12">
                                <div className="p-8 bg-mira-orange-pastel/20 rounded-[3rem] border border-mira-orange/10">
                                    <p className="text-[10px] font-black text-mira-orange uppercase tracking-widest mb-2">Canal de Feedback</p>
                                    <p className="text-xs text-slate-800 font-bold">Aqui chegam os pedidos de novos recursos. <br />Ex: "Gostaria de ver o tempo de espera real nas juntas de freguesia".</p>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Sugestões de Melhoria</h3>
                                    {suggestions.map(s => (
                                        <div key={s.id} className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-[10px] font-black text-mira-orange uppercase tracking-widest">{s.profiles?.name || 'Membro'}</span>
                                                <button onClick={() => handleAction(() => adminService.deleteSuggestion(s.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                            </div>
                                            <h4 className="font-bold text-slate-900">{s.subject}</h4>
                                            <p className="text-xs text-slate-500">{s.content}</p>
                                        </div>
                                    ))}
                                    {suggestions.length === 0 && <p className="text-center text-[10px] font-black text-slate-300 uppercase py-10">Nenhuma sugestão nova</p>}
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Denúncias & Queixas</h3>
                                    {complaints.map(c => (
                                        <div key={c.id} className="p-8 bg-red-50 border border-red-100 rounded-[3rem] shadow-sm space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">RELATADO POR: {c.profiles?.name || 'Membro'}</span>
                                                <button onClick={() => handleAction(() => adminService.deleteComplaint(c.id))} className="text-red-300 hover:text-red-600"><Trash2 size={16} /></button>
                                            </div>
                                            <h4 className="font-bold text-red-800">{c.subject}</h4>
                                            <p className="text-xs text-red-600/80">{c.content}</p>
                                        </div>
                                    ))}
                                    {complaints.length === 0 && <p className="text-center text-[10px] font-black text-slate-300 uppercase py-10">Nenhuma denúncia nova</p>}
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Relatórios da Comunidade</h3>
                                    {communityReports.map(r => (
                                        <div key={r.id} className="p-8 bg-slate-900 text-white rounded-[3rem] shadow-sm space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-mira-orange uppercase tracking-widest leading-none">DENUNCIANTE: {r.profiles?.name || 'Membro'}</span>
                                                    {r.reporter_email && <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">{r.reporter_email}</span>}
                                                </div>
                                                <button onClick={() => handleAction(() => adminService.deleteCommunityReport(r.id))} className="text-white/20 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Motivo / Explicação</p>
                                                <p className="text-xs font-bold leading-relaxed">{r.reason}</p>
                                            </div>
                                            <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                                                <p className="text-[10px] font-black text-mira-orange uppercase tracking-widest mb-2">Conteúdo Original ({r.post_id ? 'Post' : 'Comentário'})</p>
                                                <p className="text-xs font-medium text-white/60 line-clamp-3">{r.posts?.content || r.comments?.content || 'Conteúdo não disponível'}</p>
                                            </div>
                                            <div className="pt-2">
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{new Date(r.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {communityReports.length === 0 && <p className="text-center text-[10px] font-black text-slate-300 uppercase py-10">Nenhum relatório de comunidade</p>}
                                </div>
                            </div>
                        )}

                        {activeTab === 'knowledge' && (
                            <div className="space-y-8">
                                <div className="p-8 bg-slate-900 text-white rounded-[3rem]">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Base de Conhecimento AI</p>
                                    <p className="text-xs text-slate-300 font-bold">Injecte informações oficiais aqui para que o Chat MIRA saiba responder com precisão. <br />Ex: Mudanças na Lei da Imigração conforme Diário da República.</p>
                                </div>
                                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 space-y-6">
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Injetar Conhecimento Oficial</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            placeholder="Tópico (ex: AIMA Vistos)"
                                            className="px-6 py-4 bg-white rounded-2xl text-xs font-bold border border-slate-200 outline-none focus:border-slate-900"
                                            value={newKnowledge.topic}
                                            onChange={e => setNewKnowledge({ ...newKnowledge, topic: e.target.value })}
                                        />
                                        <input
                                            placeholder="Categoria"
                                            className="px-6 py-4 bg-white rounded-2xl text-xs font-bold border border-slate-200 outline-none focus:border-slate-900"
                                            value={newKnowledge.category}
                                            onChange={e => setNewKnowledge({ ...newKnowledge, category: e.target.value })}
                                        />
                                        <input
                                            placeholder="Fonte (ex: Diário da República)"
                                            className="px-6 py-4 bg-white rounded-2xl text-xs font-bold border border-slate-200 outline-none focus:border-slate-900"
                                            value={newKnowledge.source}
                                            onChange={e => setNewKnowledge({ ...newKnowledge, source: e.target.value })}
                                        />
                                    </div>
                                    <textarea
                                        placeholder="Informação detalhada para o MIRA usar..."
                                        className="w-full h-32 px-6 py-4 bg-white rounded-2xl text-xs font-bold border border-slate-200 outline-none focus:border-slate-900 resize-none"
                                        value={newKnowledge.information}
                                        onChange={e => setNewKnowledge({ ...newKnowledge, information: e.target.value })}
                                    />
                                    <button
                                        onClick={handleAddKnowledge}
                                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl"
                                    >
                                        Adicionar à Base do MIRA
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Conhecimento Ativo</h4>
                                    {aiKnowledge.map(k => (
                                        <div key={k.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex justify-between items-start gap-4">
                                            <div>
                                                <p className="font-black text-slate-900 text-xs uppercase">{k.topic}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">{k.source} • {k.category}</p>
                                                <p className="text-xs text-slate-500 line-clamp-2">{k.information}</p>
                                            </div>
                                            <button onClick={() => handleAction(() => adminService.deleteAIKnowledge(k.id))} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'sync' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-200">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Painel de Sincronização</p>
                                    <p className="text-xs text-slate-800 font-bold">Use estes botões para importar dados de fontes externas automaticamente. <br />Ex: Buscar vagas de emprego em portais parceiros.</p>
                                </div>
                                <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white space-y-10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-mira-orange/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-white/10 rounded-2xl"><RefreshCcw className="text-mira-orange" /></div>
                                            <div>
                                                <h4 className="text-2xl font-black tracking-tighter uppercase">Painel de Pipelines</h4>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Sincronização Massiva de Dados</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <button
                                                disabled={isSyncing}
                                                onClick={async () => {
                                                    setIsSyncing(true);
                                                    setMessage({ text: 'Iniciando Pipeline de Vagas...', type: 'success' });
                                                    try {
                                                        const jobsToUpsert = PROTECTED_JOBS.map(job => ({
                                                            id: job.id,
                                                            title: job.title,
                                                            location: job.location,
                                                            source_name: job.sourceName,
                                                            source_url: job.sourceUrl,
                                                            date_posted: job.datePosted,
                                                            tags: job.tags,
                                                            category: job.category,
                                                            work_topic: job.workTopic
                                                        }));
                                                        const { error } = await supabase.from('job_posts').upsert(jobsToUpsert, { onConflict: 'id' });
                                                        if (error) throw error;
                                                        setMessage({ text: `Pipeline VAGAS concluído (${PROTECTED_JOBS.length} novas inserções)`, type: 'success' });
                                                    } catch (err: any) {
                                                        console.error(err);
                                                        setMessage({ text: 'Erro ao sincronizar vagas.', type: 'error' });
                                                    } finally {
                                                        setIsSyncing(false);
                                                    }
                                                }}
                                                className="group p-10 bg-white/5 border border-white/10 rounded-[2.5rem] text-left hover:bg-white/10 transition-all relative"
                                            >
                                                <Briefcase className="text-mira-orange mb-6 group-hover:scale-110 transition-transform" size={32} />
                                                <p className="font-black text-white text-lg tracking-tight uppercase">Sincronizar Vagas</p>
                                                <p className="text-[10px] text-white/40 font-bold uppercase mt-2">API: IEFP / Indeed / LinkedIn</p>
                                                {isSyncing && <div className="absolute inset-0 bg-slate-900/60 rounded-[2.5rem] flex items-center justify-center"><RefreshCcw className="animate-spin text-white" /></div>}
                                            </button>

                                            <button
                                                disabled={isSyncing}
                                                onClick={async () => {
                                                    setIsSyncing(true);
                                                    setMessage({ text: 'Atualizando Base de Serviços...', type: 'success' });
                                                    try {
                                                        const servicesToUpsert = PROTECTED_SERVICES.map(s => ({
                                                            id: s.id,
                                                            title: s.title,
                                                            category: s.category,
                                                            lat: s.lat,
                                                            lng: s.lng,
                                                            address: s.address,
                                                            city: s.city,
                                                            phone: s.phone,
                                                            email: s.email,
                                                            website: s.website,
                                                            avg_rating: s.avgRating
                                                        }));
                                                        const { error } = await supabase.from('map_alerts').upsert(servicesToUpsert, { onConflict: 'id' });
                                                        if (error) throw error;
                                                        setMessage({ text: `Serviços Local-Gov Sincronizados (${PROTECTED_SERVICES.length} entidades)`, type: 'success' });
                                                    } catch (err: any) {
                                                        console.error(err);
                                                        setMessage({ text: 'Erro ao sincronizar serviços.', type: 'error' });
                                                    } finally {
                                                        setIsSyncing(false);
                                                    }
                                                }}
                                                className="group p-10 bg-white/5 border border-white/10 rounded-[2.5rem] text-left hover:bg-white/10 transition-all"
                                            >
                                                <MapIcon className="text-mira-blue-light mb-6 group-hover:scale-110 transition-transform" size={32} />
                                                <p className="font-black text-white text-lg tracking-tight uppercase">Sincronizar Serviços</p>
                                                <p className="text-[10px] text-white/40 font-bold uppercase mt-2">DB: AIMA / SNS / SEF-DATA</p>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};
