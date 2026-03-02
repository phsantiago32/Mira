import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { User, Post, ViewType } from '../types';
import {
    Users, ShieldAlert, MailX, Trash2, Ban, ShieldCheck,
    Search, Filter, ChevronRight, AlertCircle, CheckCircle2,
    MoreVertical, UserMinus, ShieldOff, MessageSquare, Sparkles
} from 'lucide-react';
import { COLORS } from '../constants';

interface AdminHubProps {
    onBack: () => void;
}

export const AdminHub: React.FC<AdminHubProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'content' | 'emails'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [deniedEmails, setDeniedEmails] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'users') {
                const data = await adminService.fetchUsers();
                setUsers(data);
            } else if (activeTab === 'emails') {
                const data = await adminService.fetchDeniedEmails();
                setDeniedEmails(data);
            }
        } catch (err) {
            console.error('Error loading admin data:', err);
        }
        setIsLoading(false);
    };

    const handleBlockUser = async (userId: string, currentStatus: boolean) => {
        try {
            await adminService.toggleBlockUser(userId, !currentStatus);
            setMessage({ text: `Usuário ${!currentStatus ? 'bloqueado' : 'desbloqueado'} com sucesso!`, type: 'success' });
            loadData();
        } catch (err) {
            setMessage({ text: 'Erro ao alterar status do usuário.', type: 'error' });
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Tem certeza que deseja DELETAR permanentemente este usuário? Esta ação não pode ser desfeita.')) return;
        try {
            await adminService.deleteUser(userId);
            setMessage({ text: 'Usuário deletado com sucesso!', type: 'success' });
            loadData();
        } catch (err) {
            setMessage({ text: 'Erro ao deletar usuário.', type: 'error' });
        }
    };

    const handleBlockEmail = async (email: string) => {
        if (!email.includes('@')) return;
        try {
            await adminService.blockEmail(email);
            setMessage({ text: 'Email bloqueado com sucesso!', type: 'success' });
            setSearchTerm('');
            loadData();
        } catch (err) {
            setMessage({ text: 'Erro ao bloquear email.', type: 'error' });
        }
    };

    const handleUnblockEmail = async (email: string) => {
        try {
            await adminService.unblockEmail(email);
            setMessage({ text: 'Email liberado com sucesso!', type: 'success' });
            loadData();
        } catch (err) {
            setMessage({ text: 'Erro ao liberar email.', type: 'error' });
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-20 p-4 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Admin Hub</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Painel de Controlo e Moderação</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onBack}
                        className="p-3 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-slate-900 shadow-sm transition-all"
                    >
                        <ChevronRight className="rotate-180" size={20} />
                    </button>
                    {/* Botão de Sair no Admin Hub */}
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('mira_force_logout'))}
                        className="p-3 bg-red-50 text-red-500 rounded-2xl border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Sair do Painel"
                    >
                        <ShieldOff size={20} />
                    </button>
                    {/* Botão de Reset de Sistema EXCLUSIVO no Admin Hub */}
                    <button
                        onClick={() => { if (window.confirm("RESET TOTAL: Isso irá limpar todo o lixo do navegador e resolver problemas de login. Continuar?")) { localStorage.clear(); sessionStorage.clear(); window.location.reload(); } }}
                        className="p-3 bg-orange-50 text-orange-500 rounded-2xl border border-orange-100 hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                        title="Reset de Sistema"
                    >
                        <Sparkles size={20} />
                    </button>
                </div>
            </div>

            {/* Stats Quick View */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Usuários</p>
                    <p className="text-xl font-black text-slate-800">{users.length}</p>
                </div>
                <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Emails Bloqueados</p>
                    <p className="text-xl font-black text-slate-800">{deniedEmails.length}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-[2rem] border border-orange-100 shadow-sm">
                    <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-1">Denúncias Ativas</p>
                    <p className="text-xl font-black text-orange-600">0</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white p-1.5 rounded-[2rem] border border-slate-100 shadow-sm">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Users size={14} /> Usuários
                </button>
                <button
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <ShieldAlert size={14} /> Conteúdo
                </button>
                <button
                    onClick={() => setActiveTab('emails')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'emails' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <MailX size={14} /> Emails
                </button>
            </div>

            {/* Alerts */}
            {message && (
                <div className={`p-4 rounded-[1.5rem] border flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <p className="text-[11px] font-bold uppercase">{message.text}</p>
                    <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100"><Trash2 size={14} /></button>
                </div>
            )}

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder={activeTab === 'emails' ? "Bloquear novo email..." : "Pesquisar..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && activeTab === 'emails' && handleBlockEmail(searchTerm)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-slate-100 transition-all"
                />
                {activeTab === 'emails' && (
                    <button
                        onClick={() => handleBlockEmail(searchTerm)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                        Bloquear
                    </button>
                )}
            </div>

            {/* List Container */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando dados...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {activeTab === 'users' && users
                            .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(u => (
                                <div key={u.id} className="p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                    <img src={u.avatar} className="w-12 h-12 rounded-2xl object-cover bg-slate-100" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black text-slate-800 text-sm tracking-tight">{u.name}</h4>
                                            {u.role === 'admin' && <span className="bg-indigo-100 text-indigo-600 text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest">Admin</span>}
                                            {u.isBlocked && <span className="bg-red-100 text-red-600 text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest">Bloqueado</span>}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleBlockUser(u.id, u.isBlocked || false)}
                                            className={`p-2 rounded-xl border transition-all ${u.isBlocked ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}
                                            title={u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                                        >
                                            {u.isBlocked ? <ShieldCheck size={18} /> : <Ban size={18} />}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(u.id)}
                                            className="p-2 bg-slate-50 border border-slate-100 text-slate-400 hover:text-red-600 rounded-xl transition-all"
                                            title="Deletar Usuário"
                                        >
                                            <UserMinus size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                        {activeTab === 'emails' && deniedEmails
                            .filter(e => e.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(email => (
                                <div key={email} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                                            <MailX size={18} />
                                        </div>
                                        <span className="font-bold text-slate-800 text-sm">{email}</span>
                                    </div>
                                    <button
                                        onClick={() => handleUnblockEmail(email)}
                                        className="p-2 text-slate-400 hover:text-green-600 transition-colors"
                                        title="Liberar Email"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}

                        {activeTab === 'content' && (
                            <div className="p-20 text-center">
                                <MessageSquare className="mx-auto text-slate-200 mb-4" size={48} />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhuma denúncia pendente</p>
                            </div>
                        )}

                        {((activeTab === 'users' && users.length === 0) || (activeTab === 'emails' && deniedEmails.length === 0)) && !isLoading && (
                            <div className="p-20 text-center">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum dado encontrado</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Debug Info</h5>
                <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                    Este painel permite a gestão direta da base de dados Supabase. <br />
                    Ações marcadas em vermelho são permanentes.
                </p>
            </div>
        </div>
    );
};
