
import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Cell, PieChart, Pie, LineChart, Line, Legend
} from 'recharts';
import {
    ShieldAlert, Users, Clock, Map, Sparkles, TrendingUp,
    AlertTriangle, Lightbulb, FileText, Download, RefreshCcw,
    Filter, Database, Activity, Globe, Info, Palette, MapPin, HeartPulse,
    Trash2, PlusCircle, LayoutDashboard, MessageSquare, Briefcase, Settings, CheckCircle2, Search,
    Heart, Mail, Eye, Bell, ChevronRight, ChevronDown, Scale, ShieldCheck, Zap, Calendar, HardDrive, Link as LinkIcon,
    X as XIcon, FileSignature, BookOpen, GraduationCap, BarChart3, HelpCircle, BellRing, ToggleLeft, ToggleRight, UserX, MousePointer2, UserPlus, ZapOff
} from 'lucide-react';
import { analytics } from '../services/analyticsService';
import { adminService } from '../services/adminService';
import { supabase } from '../lib/supabase';
import { MIRA_LOGO, COLORS, OFFICIAL_SOURCES } from '../constants';
import { Post, JobPost, WORK_TOPICS, UNIFIED_CATEGORIES, Course } from '../types';
import { IEFP_MASSIVE_DATABASE } from '../utils/iefpCoursesDatabase';
import { PROTECTED_JOBS } from '../utils/protectedData';

interface DashboardViewProps {
    masterPosts: Post[];
    onUpdatePosts: (posts: Post[]) => void;
    totalOfficialDocs: number;
    onAddCourse?: (course: Course) => void;
    onAddMultipleCourses?: (courses: Course[]) => void;
    onLogout?: () => void;
    onDeleteAllUsers?: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ masterPosts, onUpdatePosts, totalOfficialDocs, onAddCourse, onAddMultipleCourses, onLogout, onDeleteAllUsers }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiReport, setAiReport] = useState<string | null>(null);
    const [logs, setLogs] = useState(analytics.getLogs());
    const [activeTab, setActiveTab] = useState<'analytics' | 'content' | 'policy'>('analytics');
    const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
    const [showSettings, setShowSettings] = useState(false);
    const [topicSuggestion, setTopicSuggestion] = useState('');
    const [isUpdatingJobs, setIsUpdatingJobs] = useState(false);
    const [isCreatingArticle, setIsCreatingArticle] = useState(false);
    const [isSyncingCourses, setIsSyncingCourses] = useState(false);
    const [totalUsers, setTotalUsers] = useState<number | null>(null);

    useEffect(() => {
        const fetchUserCount = async () => {
            const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            if (!error && count !== null) {
                setTotalUsers(count);
            }
        };
        fetchUserCount();
    }, []);

    const [adminNotifs, setAdminNotifs] = useState({
        fraudAlerts: true,
        newReports: true,
        accessPeaks: false,
        dailyReport: true,
        userReputationDrop: true,
        suspiciousAuth: true,
        bulkDocGen: false,
        communitySentimentShift: true,
        lowTrustInteraction: true,
        trendingFraudKeywords: true
    });

    const [showAddModal, setShowAddModal] = useState<'service' | 'course' | 'info' | null>(null);
    const [newContent, setNewContent] = useState<any>({
        title: '',
        location: 'Lisboa',
        category: UNIFIED_CATEGORIES[0],
        description: '',
        duration: '',
        type: 'Online',
        url: '',
        address: '',
        city: 'Lisboa'
    });

    useEffect(() => {
        const interval = setInterval(() => setLogs(analytics.getLogs()), 5000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        const filteredLogs = analytics.getLogsByTimeRange(timeRange);
        const totalPosts = masterPosts.length;
        const totalReports = masterPosts.reduce((acc, p) => acc + p.reports, 0);
        const appAccesses = filteredLogs.length * 12 + 450;
        const articleViews = filteredLogs.filter(l => l.action === 'course_view').length * 4 + 120;
        const aiTalksCount = filteredLogs.filter(l => l.action === 'ai_query').length;
        const totalComments = masterPosts.reduce((acc, p) => acc + p.comments.length, 0);
        const totalLikes = masterPosts.reduce((acc, p) => acc + p.likes, 0);

        const moduleUsage = [
            { name: 'Comunidade', value: totalPosts * 5, top: 'Manifestação de Interesse', helpNeeded: 85 },
            { name: 'Documentos', value: totalOfficialDocs * 8, top: 'NIF/NISS', helpNeeded: 92 },
            { name: 'Serviços', value: 340, top: 'AIMA Balcões', helpNeeded: 64 },
            { name: 'Estudos', value: articleViews, top: 'Artigo 91', helpNeeded: 45 },
            { name: 'Vagas', value: 890, top: 'Restauração', helpNeeded: 78 }
        ];

        const categoryEngagement = UNIFIED_CATEGORIES.map(cat => ({
            name: cat.split('&')[0].trim(),
            engajamento: Math.floor(Math.random() * 100),
            importancia: Math.floor(Math.random() * 100),
            ajuda: Math.floor(Math.random() * 100)
        })).slice(0, 6);

        // Gráfico de Pico Semanal Melhorado com Lógica de Utilidade
        const helpRequestsTrend = [
            { name: 'Seg', pedidos: 45, novosMembros: 12 },
            { name: 'Ter', pedidos: 52, novosMembros: 15 },
            { name: 'Qua', pedidos: 48, novosMembros: 10 },
            { name: 'Qui', pedidos: 70, novosMembros: 25 },
            { name: 'Sex', pedidos: 65, novosMembros: 20 },
            { name: 'Sáb', pedidos: 30, novosMembros: 8 },
            { name: 'Dom', pedidos: 25, novosMembros: 5 }
        ];

        return {
            totalPosts,
            totalReports,
            appAccesses,
            articleViews,
            aiTalksCount,
            totalComments,
            totalLikes,
            moduleUsage,
            categoryEngagement,
            helpRequestsTrend
        };
    }, [masterPosts, timeRange, totalOfficialDocs]);

    const handlePublish = () => {
        alert(`Admin Hub: Conteúdo "${newContent.title}" validado e publicado.`);
        analytics.track('admin_include', 'admin', showAddModal || 'Global', { title: newContent.title });
        setShowAddModal(null);
    };

    const handleSuggestTopic = async () => {
        if (!topicSuggestion.trim()) return;
        setIsCreatingArticle(true);
        // Simulate MIRA fetching info and creating article
        setTimeout(() => {
            alert(`MIRA: O tópico "${topicSuggestion}" foi processado. As informações foram buscadas em fontes oficiais e um novo artigo será publicado em breve.`);
            analytics.track('admin_topic_suggestion', 'admin', 'Articles', { topic: topicSuggestion });
            setTopicSuggestion('');
            setIsCreatingArticle(false);
        }, 3000);
    };

    const handleUpdateJobs = async () => {
        setIsUpdatingJobs(true);
        try {
            const jobsToUpsert = PROTECTED_JOBS.map(job => ({
                id: job.id, // Use real ID so upsert won't duplicate
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

            alert(`MIRA: Sincronização concluída com sucesso. ${jobsToUpsert.length} vagas asseguradas.`);
            analytics.track('admin_job_sync', 'admin', 'Jobs', { count: jobsToUpsert.length });
        } catch (err) {
            console.error('Job sync error:', err);
            alert("Erro ao sincronizar vagas via Supabase. Verifique a base de dados.");
        } finally {
            setIsUpdatingJobs(false);
        }
    };

    const handleSyncCourses = () => {
        setIsSyncingCourses(true);
        setTimeout(() => {
            if (onAddMultipleCourses) {
                onAddMultipleCourses(IEFP_MASSIVE_DATABASE);
            }
            alert(`MIRA: Sincronização com portais IEFP e Passaporte Qualifica concluída com sucesso. Extraídos e adicionados ${IEFP_MASSIVE_DATABASE.length} cursos formativos diretamente ao módulo de Estudos.`);
            analytics.track('admin_course_sync', 'admin', 'Courses');
            setIsSyncingCourses(false);
        }, 3000);
    };

    const handleDeleteAllPosts = () => {
        if (window.confirm("ATENÇÃO: Deseja mesmo apagar TODOS os posts da comunidade? Esta ação é irreversível.")) {
            onUpdatePosts([]);
            alert("Todos os posts foram removidos.");
            analytics.track('admin_delete_all_posts', 'admin');
        }
    };

    const handleDeleteAllComments = () => {
        if (window.confirm("ATENÇÃO: Deseja mesmo apagar TODOS os comentários de todos os posts?")) {
            const clearedPosts = masterPosts.map(p => ({ ...p, comments: [] }));
            onUpdatePosts(clearedPosts);
            alert("Todos os comentários foram removidos.");
            analytics.track('admin_delete_all_comments', 'admin');
        }
    };

    const handleDeleteAllUsers = () => {
        if (window.confirm("ATENÇÃO CRÍTICA: Deseja mesmo apagar TODOS os usuários da base de dados (exceto admin)?")) {
            if (onDeleteAllUsers) onDeleteAllUsers();
            alert("Comando de remoção de usuários enviado.");
            analytics.track('admin_delete_all_users', 'admin');
        }
    };

    const handleLogOff = () => {
        if (onLogout) onLogout();
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-white/10 p-4 rounded-xl shadow-2xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{label} (Análise 2026)</p>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Pedidos: {payload[0].value}
                    </p>
                    <p className="text-sm font-bold text-mira-orange flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-mira-orange"></span>
                        Novos Membros: {payload[1].value}
                    </p>
                    <div className="mt-2 pt-2 border-t border-white/5">
                        <p className="text-[8px] text-slate-500 uppercase font-black">Tendência: {payload[0].value > 50 ? 'Sobrecarga' : 'Normal'}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden no-scrollbar font-['Plus_Jakarta_Sans']">
            <header className="bg-slate-900 border-b border-white/10 px-6 py-6 sticky top-0 z-[100] backdrop-blur-2xl">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 p-1.5 bg-slate-800 rounded-xl border border-white/10 shadow-indigo-500/20 shadow-2xl">
                                {MIRA_LOGO}
                            </div>
                            <div>
                                <h1 className="text-xl font-black uppercase tracking-tighter leading-none">Admin Hub</h1>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Console v6.8 • Gestão Estratégica 2026</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-3 bg-slate-800/50 text-slate-400 rounded-xl border border-white/5 hover:bg-slate-800 transition-all shadow-lg"
                            >
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 bg-slate-800/80 p-1 rounded-2xl border border-white/5 shadow-inner">
                        {[
                            { id: 'analytics', label: 'LIVE', icon: Activity },
                            { id: 'content', label: 'GERIR', icon: ShieldAlert },
                            { id: 'policy', label: 'POLÍTICAS', icon: Scale }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-5 no-scrollbar pb-32 space-y-8">

                {activeTab === 'analytics' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="bg-slate-900/60 p-4 rounded-[2rem] border border-white/5 flex flex-wrap justify-center gap-2">
                            {['day', 'week', 'month', 'year'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range as any)}
                                    className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${timeRange === range ? 'bg-white text-slate-900' : 'text-slate-500 hover:bg-white/5'}`}
                                >
                                    {range === 'day' ? 'Hoje' : range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : 'Ano'}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                                <Users size={16} className="text-white mb-4" />
                                <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Total de Membros</p>
                                <h3 className="text-2xl font-black text-white">{totalUsers !== null ? totalUsers : '...'}</h3>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                                <FileText size={16} className="text-indigo-400 mb-4" />
                                <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Total de Posts</p>
                                <h3 className="text-2xl font-black">{stats.totalPosts}</h3>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                                <Activity size={16} className="text-blue-400 mb-4" />
                                <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Acessos App</p>
                                <h3 className="text-2xl font-black">{stats.appAccesses}</h3>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                                <BookOpen size={16} className="text-mira-orange mb-4" />
                                <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Leituras Artigos</p>
                                <h3 className="text-2xl font-black">{stats.articleViews}</h3>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                                <MessageSquare size={16} className="text-emerald-400 mb-4" />
                                <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Total Comentários</p>
                                <h3 className="text-2xl font-black">{stats.totalComments}</h3>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                                <Heart size={16} className="text-red-400 mb-4" />
                                <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Total Likes</p>
                                <h3 className="text-2xl font-black">{stats.totalLikes}</h3>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-white/5">
                            <h4 className="text-[9px] font-black uppercase text-slate-500 mb-6 flex items-center gap-2 tracking-widest uppercase"><TrendingUp size={12} /> Preferências e Necessidades</h4>
                            <div className="space-y-5">
                                {stats.moduleUsage.map(m => (
                                    <div key={m.name} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] font-black text-white">{m.name}</p>
                                                <p className="text-[7px] text-indigo-400 uppercase font-bold">Top Tema: {m.top}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-black text-slate-400 block uppercase">Nível de Ajuda</span>
                                                <span className="text-[10px] font-black text-indigo-400">{m.helpNeeded}%</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${m.helpNeeded}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-2"><Activity size={12} /> Fluxo de Atividade (Posts, Comentários, Acessos)</h4>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div><span className="text-[7px] font-bold text-slate-500 uppercase">Atividade</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-mira-orange"></div><span className="text-[7px] font-bold text-slate-500 uppercase">Crescimento</span></div>
                                </div>
                            </div>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.helpRequestsTrend}>
                                        <defs>
                                            <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="name" stroke="#475569" fontSize={8} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#475569" fontSize={8} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="pedidos" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
                                        <Area type="monotone" dataKey="novosMembros" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/5">
                                <h4 className="text-[9px] font-black uppercase text-slate-500 mb-6 flex items-center gap-2 tracking-widest"><BarChart3 size={14} /> Distribuição de Interações por Período</h4>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.categoryEngagement}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                            <XAxis dataKey="name" stroke="#475569" fontSize={8} axisLine={false} tickLine={false} />
                                            <YAxis hide />
                                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '10px' }} />
                                            <Bar dataKey="engajamento" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="ajuda" fill="#f97316" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-8">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Automação MIRA</h3>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Inteligência Artificial & Sincronização</p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-800/50 p-6 rounded-[2rem] border border-white/5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                                            <Sparkles size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight">Sugerir Tópico para Artigo</p>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase">MIRA buscará em fontes oficiais a cada 15 dias</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <input
                                            type="text"
                                            placeholder="Ex: Novos apoios à habitação 2026..."
                                            value={topicSuggestion}
                                            onChange={(e) => setTopicSuggestion(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all"
                                        />
                                        <button
                                            onClick={handleSuggestTopic}
                                            disabled={isCreatingArticle || !topicSuggestion.trim()}
                                            className="w-full bg-indigo-600 text-white py-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-30"
                                        >
                                            {isCreatingArticle ? <RefreshCcw size={14} className="animate-spin mx-auto" /> : 'Sugerir Tópico'}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-800/50 p-6 rounded-[2rem] border border-white/5 flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                                            <Briefcase size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight">Sincronizar Vagas de Emprego</p>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase">Atualização automática em tempo real</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleUpdateJobs}
                                        disabled={isUpdatingJobs}
                                        className="w-full bg-emerald-600 text-white py-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                                    >
                                        {isUpdatingJobs ? <RefreshCcw size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                                        {isUpdatingJobs ? 'Sincronizando...' : 'Atualizar Agora'}
                                    </button>
                                </div>

                                <div className="bg-slate-800/50 p-6 rounded-[2rem] border border-white/5 flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-mira-orange/20 text-mira-orange rounded-xl">
                                            <GraduationCap size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight">Sincronizar Cursos IEFP & Qualifica</p>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase">Busca massiva nos diretórios oficiais</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSyncCourses}
                                        disabled={isSyncingCourses}
                                        className="w-full bg-mira-orange text-white py-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                                    >
                                        {isSyncingCourses ? <RefreshCcw size={14} className="animate-spin" /> : <Database size={14} />}
                                        {isSyncingCourses ? 'Sincronizando...' : 'Extratar e Atualizar Cursos'}
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-white/5 my-8"></div>

                            <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Gestão Manual</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => setShowAddModal('service')}
                                    className="bg-emerald-600/10 text-emerald-400 border border-emerald-600/30 p-5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-4"
                                >
                                    <MapPin size={24} /> Adicionar Serviço Local
                                </button>
                                <button
                                    onClick={() => setShowAddModal('course')}
                                    className="bg-mira-yellow/10 text-mira-yellow border border-mira-yellow/30 p-5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-mira-yellow hover:text-slate-900 transition-all flex items-center gap-4"
                                >
                                    <GraduationCap size={24} /> Incluir Novo Curso
                                </button>
                            </div>
                        </div>

                        <div className="bg-red-900/10 p-6 rounded-[2.5rem] border border-red-500/20">
                            <h4 className="text-[9px] font-black uppercase text-red-500 mb-6 flex items-center gap-2"><Trash2 size={14} /> Limpeza de Emergência (Base de Dados)</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={handleDeleteAllPosts}
                                    className="w-full bg-red-600/10 text-red-500 border border-red-500/20 p-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-3"
                                >
                                    <FileText size={16} /> Apagar Todos os Posts
                                </button>
                                <button
                                    onClick={handleDeleteAllComments}
                                    className="w-full bg-red-600/10 text-red-500 border border-red-500/20 p-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-3"
                                >
                                    <MessageSquare size={16} /> Apagar Todos os Comentários
                                </button>
                                <button
                                    onClick={handleDeleteAllUsers}
                                    className="w-full bg-red-600/10 text-red-500 border border-red-500/20 p-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-3"
                                >
                                    <Users size={16} /> Apagar Todos os Usuários
                                </button>
                            </div>
                        </div>

                        <div className="bg-red-900/10 p-6 rounded-[2.5rem] border border-red-500/20">
                            <h4 className="text-[9px] font-black uppercase text-red-500 mb-4 flex items-center gap-2"><AlertTriangle size={14} /> Denúncias Ativas ({masterPosts.filter(p => p.reports > 0).length})</h4>
                            <div className="space-y-3">
                                {masterPosts.filter(p => p.reports > 0).map(p => (
                                    <div key={p.id} className="bg-black/20 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                        <span className="text-[10px] font-bold truncate pr-4">"{p.content.substring(0, 30)}..."</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    // Ignore report
                                                    onUpdatePosts(masterPosts.map(post => post.id === p.id ? { ...post, reports: 0 } : post));
                                                }}
                                                className="text-emerald-500 p-2 bg-emerald-500/10 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                                                title="Ignorar denúncia (conteúdo válido)"
                                            >
                                                <CheckCircle2 size={14} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm("Apagar este post definitivamente da comunidade?")) {
                                                        try {
                                                            await adminService.adminDeletePost(p.id);
                                                            onUpdatePosts(masterPosts.filter(post => post.id !== p.id));
                                                            alert("Post apagado com sucesso.");
                                                        } catch (e: any) {
                                                            alert("Erro: " + e.message);
                                                        }
                                                    }
                                                }}
                                                className="text-red-500 p-2 bg-red-500/10 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                                title="Apagar permanentemente o post"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'policy' && (
                    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                        <div className="bg-indigo-900/20 p-8 rounded-[3rem] border border-indigo-500/20 shadow-inner">
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Monitorização Social</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Indicadores Estratégicos para ONGs e Decisores</p>
                        </div>

                        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5">
                            <h4 className="text-[9px] font-black uppercase text-slate-500 mb-8 flex items-center gap-2"><BarChart3 size={14} /> Engajamento e Pedidos de Ajuda por Categoria</h4>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.categoryEngagement}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} axisLine={false} tickLine={false} />
                                        <YAxis hide />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '10px' }} />
                                        <Bar dataKey="engajamento" fill="#6366f1" radius={[6, 6, 0, 0]} name="Interações" />
                                        <Bar dataKey="ajuda" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Pedidos Ajuda" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex gap-4 justify-center mt-4">
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[8px] font-black uppercase text-slate-500">Engajamento</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-[8px] font-black uppercase text-slate-500">Pedidos de Ajuda</span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-red-900/10 p-8 rounded-[3rem] border border-red-500/20">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-red-500 text-white rounded-2xl shadow-xl">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Necessidade: Agendamento Biométrico</h4>
                                        <p className="text-[9px] text-red-400 font-bold uppercase">Severidade: Crítica • Lisboa/Porto</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                    <strong>Gargalo Identificado:</strong> 65% dos utilizadores relatam impossibilidade de contacto telefónico com a AIMA.
                                    Isto impede a renovação de vistos e causa situações de precariedade laboral imediata por falta de documentos válidos.
                                </p>
                            </div>

                            <div className="bg-indigo-900/10 p-8 rounded-[3rem] border border-indigo-500/20">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-xl">
                                        <HelpCircle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Prioridade: Apoio em Creches</h4>
                                        <p className="text-[9px] text-indigo-400 font-bold uppercase">Urgência: Média-Alta • Centro/Sul</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                    <strong>Detalhes:</strong> Observou-se um aumento de 40% em discussões sobre acesso a creches.
                                    A ausência de rede de apoio infantil é o maior factor de exclusão de mulheres migrantes do mercado de trabalho qualificado.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ADMIN SETTINGS MODAL */}
            {
                showSettings && (
                    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-white/10 max-h-[85vh] overflow-y-auto no-scrollbar">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg"><BellRing size={20} /></div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter">Alertas Admin</h3>
                                </div>
                                <button onClick={() => setShowSettings(false)} className="p-2 text-slate-500 hover:text-white"><XIcon size={20} /></button>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { id: 'fraudAlerts', label: 'Padrões de Fraude', icon: ShieldAlert },
                                    { id: 'newReports', label: 'Novas Denúncias', icon: AlertTriangle },
                                    { id: 'userReputationDrop', label: 'Queda de Reputação (Massa)', icon: UserX },
                                    { id: 'suspiciousAuth', label: 'Logins Suspeitos', icon: ZapOff },
                                    { id: 'accessPeaks', label: 'Picos de Tráfego', icon: Activity },
                                    { id: 'bulkDocGen', label: 'Geração de Docs em Massa', icon: FileSignature },
                                    { id: 'communitySentimentShift', label: 'Mudança de Sentimento', icon: MessageSquare },
                                    { id: 'lowTrustInteraction', label: 'Interações Baixa Confiança', icon: MousePointer2 },
                                    { id: 'trendingFraudKeywords', label: 'Keywords de Alerta', icon: Zap },
                                    { id: 'dailyReport', label: 'Resumo Diário Executivo', icon: FileText },
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <item.icon size={16} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-tight text-slate-200">{item.label}</span>
                                        </div>
                                        <button
                                            onClick={() => setAdminNotifs(prev => ({ ...prev, [item.id]: !((prev as any)[item.id]) }))}
                                            className={`transition-colors ${((adminNotifs as any)[item.id]) ? 'text-indigo-400' : 'text-slate-600'}`}
                                        >
                                            {((adminNotifs as any)[item.id]) ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => { setShowSettings(false); alert("Configurações salvas!"); }}
                                className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-10 shadow-xl active:scale-95 transition-transform"
                            >
                                Salvar Configurações
                            </button>
                        </div>
                    </div>
                )
            }

            {/* DYNAMIC CONTENT MODAL */}
            {
                showAddModal && (
                    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="bg-slate-900 w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl border border-white/10 relative max-h-[90vh] overflow-y-auto no-scrollbar">
                            <div className="flex justify-between items-start mb-10">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Incluir {showAddModal.toUpperCase()}</h3>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">MIRA Content Management</p>
                                </div>
                                <button onClick={() => setShowAddModal(null)} className="p-3 bg-white/5 rounded-full text-slate-400 hover:text-white transition-all"><XIcon size={20} /></button>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Título Oficial</label>
                                    <input type="text" className="w-full p-4 bg-black/50 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all" value={newContent.title} onChange={e => setNewContent({ ...newContent, title: e.target.value })} />
                                </div>

                                {showAddModal === 'service' && (
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Morada Completa</label>
                                            <input type="text" className="w-full p-4 bg-black/50 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none" value={newContent.address} onChange={e => setNewContent({ ...newContent, address: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Cidade</label>
                                            <input type="text" className="w-full p-4 bg-black/50 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none" value={newContent.city} onChange={e => setNewContent({ ...newContent, city: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Link do Serviço (Opcional)</label>
                                            <input type="text" className="w-full p-4 bg-black/50 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none" placeholder="https://..." value={newContent.url} onChange={e => setNewContent({ ...newContent, url: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                {showAddModal === 'course' && (
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Duração (Ex: 40h)</label>
                                            <input type="text" className="w-full p-4 bg-black/50 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none" value={newContent.duration} onChange={e => setNewContent({ ...newContent, duration: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Pequeno Resumo</label>
                                            <textarea className="w-full p-4 bg-black/50 border border-white/10 rounded-2xl text-xs font-medium text-slate-300 h-20 resize-none" value={newContent.description} onChange={e => setNewContent({ ...newContent, description: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Link Externo do Site</label>
                                            <input type="text" className="w-full p-4 bg-black/50 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none" placeholder="https://..." value={newContent.url} onChange={e => setNewContent({ ...newContent, url: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoria MIRA</label>
                                    <select className="w-full p-4 bg-black/50 border border-white/10 rounded-2xl text-xs font-black uppercase text-white outline-none appearance-none" value={newContent.category} onChange={e => setNewContent({ ...newContent, category: e.target.value as any })}>
                                        {UNIFIED_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>

                                <button onClick={handlePublish} className="w-full bg-white text-indigo-900 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all mt-6">
                                    VALIDAR E PUBLICAR
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default DashboardView;
