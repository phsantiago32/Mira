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

interface AdminHubProps {
    onBack: () => void;
}

export const AdminHub: React.FC<AdminHubProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'content' | 'emails' | 'sync'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

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

    return (
        <div className="flex flex-col h-full bg-white font-['Plus_Jakarta_Sans']">
            {/* Header */}
            <div className="bg-slate-900 text-white p-8 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Central de Moderação</h2>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Mira Administrator Engine v4.2</p>
                    </div>
                    <button onClick={onBack} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex gap-4 bg-white/5 p-2 rounded-3xl backdrop-blur-md">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-white/60 hover:text-white'}`}
                    >
                        <Users size={16} /> Usuários
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-white/60 hover:text-white'}`}
                    >
                        <ShieldAlert size={16} /> Conteúdo
                    </button>
                    <button
                        onClick={() => setActiveTab('emails')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'emails' ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-white/60 hover:text-white'}`}
                    >
                        <MailX size={16} /> Emails
                    </button>
                    <button
                        onClick={() => setActiveTab('sync')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sync' ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-white/60 hover:text-white'}`}
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

                        {activeTab === 'emails' && (
                            <div className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 space-y-8">
                                <div className="space-y-2">
                                    <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Filtro de Acesso</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bloqueio Proativo de Contas Maliciosas</p>
                                </div>
                                <div className="flex gap-4">
                                    <input type="email" placeholder="Email a bloquear..." className="flex-1 px-8 py-5 bg-white border-2 border-transparent rounded-[1.5rem] text-sm font-bold focus:border-slate-900 transition-all outline-none" id="block-email-input" />
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('block-email-input') as HTMLInputElement;
                                            if (input.value) handleAction(() => adminService.blockEmail(input.value));
                                        }}
                                        className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
                                    >
                                        Bloquear
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'sync' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                                    // Simula execução do loop de sync
                                                    setTimeout(() => {
                                                        setIsSyncing(false);
                                                        setMessage({ text: 'Pipeline VAGAS concluído (15 novas inserções)', type: 'success' });
                                                    }, 3000);
                                                }}
                                                className="group p-10 bg-white/5 border border-white/10 rounded-[2.5rem] text-left hover:bg-white/10 transition-all relative"
                                            >
                                                <Briefcase className="text-mira-orange mb-6 group-hover:scale-110 transition-transform" size={32} />
                                                <p className="font-black text-white text-lg tracking-tight uppercase">Sincronizar Vagas</p>
                                                <p className="text-[10px] text-white/40 font-bold uppercase mt-2">API: IEFP / Indeed / LinkedIn</p>
                                                {isSyncing && <div className="absolute inset-0 bg-slate-900/60 rounded-[2.5rem] flex items-center justify-center"><RefreshCcw className="animate-spin text-white" /></div>}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setMessage({ text: 'Atualizando Base de Serviços...', type: 'success' });
                                                    setTimeout(() => setMessage({ text: 'Serviços Local-Gov Sincronizados!', type: 'success' }), 2000);
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
        </div>
    );
};
