import React, { useMemo, useState } from 'react';
import { ViewType, User as UserType, Post, NotificationPreferences } from '../types';
import {
  Briefcase, Map as MapIcon, FileText,
  Bell, HeartHandshake, Bot, ShieldCheck,
  Heart, BookOpen, User, CheckCircle2, MessageSquare, Sparkles, ArrowRight, BellRing, X, ToggleLeft, ToggleRight, ShieldAlert, AlertTriangle, Activity, Scale, Newspaper, ShieldQuestion, LogOut, MessageCircle, ChevronRight
} from 'lucide-react';
import { t } from '../utils/translations';
import { analytics } from '../services/analyticsService';
import { supabase } from '../lib/supabase';
import { submitReportRest } from '../services/reportService';
interface HomeViewProps {
  user: UserType;
  onViewChange: (view: ViewType) => void;
  language: string;
  onLogout: () => void;
}

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    authorId: 'a1',
    authorName: 'Guia de Portugal',
    authorAvatar: 'https://i.pravatar.cc/150?u=guia',
    authorBio: 'Especialista em documentação AIMA.',
    title: 'NIF em 24h em 2026: O que mudou',
    content: 'Pessoal, as novas regras de 2026 para o NIF digital funcionam muito bem. Validaram meu representante em 10 minutos pelo novo portal MIRA-GOV! 🇵🇹✨ #NIF2026 #Portugal #Digital',
    category: 'Documentos & Regularização',
    backgroundImage: 'https://images.unsplash.com/photo-1583922606661-0822ed0bd916?w=800&q=80',
    tags: ['NIF', '2026', 'Portugal'],
    likes: 842,
    comments: [],
    isVerified: true,
    isFraudWarning: false,
    timestamp: '45 min',
    reports: 0,
    urgency: 1,
    validationStatus: "validated",
    usefulVotes: 156,
    fakeVotes: 0,
    reviewVotes: 5
  }
];

import { useToast } from './Toast';

export const HomeView: React.FC<HomeViewProps> = ({ user, onViewChange, language, onLogout }) => {
  const { showToast } = useToast();
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    OFFICIAL_AIMA: true,
    LEGAL_CHANGES: true,
    JOB_MATCHES: true,
    COMMUNITY_REPUTATION: true,
    MAP_URGENCY: true,
    MIRA_INSIGHTS: true,
    SOCIAL_CONNECT: true,
    MIRA_ARTICLE: true,
    COMMUNITY_REPLY: true,
    COMMUNITY_FOLLOW_UP: true
  });

  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionData, setSuggestionData] = useState({ subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuggestionSubmit = async () => {
    if (!suggestionData.message || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitReportRest('suggestion', `Assunto: ${suggestionData.subject || 'Geral'}\nMensagem: ${suggestionData.message}`);

      setShowSuggestionModal(false);
      setSuggestionData({ subject: '', message: '' });
      showToast("Sugestão enviada com sucesso! Pode ver na Central de Moderação.", "success");
    } catch (err: any) {
      console.error('handleSuggestionSubmit error:', err);
      showToast(`Erro ao registar sugestão: ${err?.message || 'Tente novamente.'}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAccess = [
    { id: ViewType.COMMUNITY, label: t('nav_community', language), icon: HeartHandshake, color: 'bg-mira-orange-pastel text-mira-orange' },
    { id: ViewType.ASSISTANT, label: 'Chat MIRA', icon: Bot, color: 'bg-mira-blue-pastel text-mira-blue' },
    { id: ViewType.DOCUMENTS, label: t('nav_docs', language), icon: FileText, color: 'bg-mira-blue-pastel text-mira-blue' },
    { id: ViewType.JOBS, label: t('nav_vagas', language), icon: Briefcase, color: 'bg-mira-yellow-pastel text-mira-yellow' },
    { id: ViewType.MAP, label: t('nav_map', language), icon: MapIcon, color: 'bg-mira-green-pastel text-mira-green' },
    { id: ViewType.LEARNING, label: t('nav_learning', language), icon: BookOpen, color: 'bg-mira-yellow-pastel text-mira-yellow' },
    { id: ViewType.PRIVACY, label: t('nav_privacy', language), icon: ShieldCheck, color: 'bg-mira-orange-pastel text-mira-orange' },
    { id: ViewType.PROFILE, label: t('nav_profile', language), icon: User, color: 'bg-mira-green-pastel text-mira-green' },
  ];

  const relevantPosts = useMemo(() => {
    return [...MOCK_POSTS].sort((a, b) => (b.likes + b.comments.length) - (a.likes + a.comments.length));
  }, []);

  const toggleNotif = (key: keyof NotificationPreferences) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white min-h-screen pb-32 animate-fade-in overflow-x-hidden relative font-['Plus_Jakarta_Sans']">
      {/* Alertas Estratégicos Modal */}
      {showNotifSettings && (
        <div className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl relative border border-white/20 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-mira-orange text-white rounded-2xl shadow-lg"><Bell size={24} strokeWidth={3} /></div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">GESTÃO DE ALERTAS</h3>
              </div>
              <button onClick={() => setShowNotifSettings(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={24} className="text-slate-400" /></button>
            </div>

            <div className="space-y-4">
              {[
                { id: 'OFFICIAL_AIMA', label: 'Direto da AIMA/Gov', icon: ShieldCheck, color: 'text-indigo-600' },
                { id: 'LEGAL_CHANGES', label: 'Leis em Tempo Real', icon: Scale, color: 'text-mira-blue' },
                { id: 'JOB_MATCHES', label: 'Vagas do seu Perfil', icon: Briefcase, color: 'text-mira-orange' },
                { id: 'MAP_URGENCY', label: 'Urgências nos Balcões', icon: AlertTriangle, color: 'text-red-600' },
                { id: 'SOCIAL_CONNECT', label: 'Interações Comunitárias', icon: MessageSquare, color: 'text-mira-green' },
                { id: 'MIRA_ARTICLE', label: 'Novo Artigo MIRA', icon: Newspaper, color: 'text-indigo-500' },
                { id: 'COMMUNITY_REPLY', label: 'Comentário no seu Post', icon: MessageCircle, color: 'text-mira-orange' },
                { id: 'COMMUNITY_FOLLOW_UP', label: 'Comentário em Post seguido', icon: Activity, color: 'text-mira-blue' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[2rem] border border-slate-100 transition-all hover:bg-white">
                  <div className="flex items-center gap-4">
                    <item.icon size={20} className={`${item.color}`} strokeWidth={2.5} />
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{item.label}</span>
                  </div>
                  <button onClick={() => toggleNotif(item.id as keyof NotificationPreferences)} className={`transition-all active:scale-90 ${(prefs as any)[item.id] ? 'text-mira-orange' : 'text-slate-300'}`}>
                    {(prefs as any)[item.id] ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => setShowNotifSettings(false)} className="w-full bg-slate-900 text-white py-6 rounded-[2.2rem] font-black uppercase text-xs tracking-[0.2em] mt-8 shadow-2xl active:scale-95 transition-all">Guardar Preferências</button>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="px-6 pt-12 pb-10 bg-slate-50/70 rounded-b-[4rem] border-b border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-mira-orange/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <button onClick={() => onViewChange(ViewType.PROFILE)} className="w-16 h-16 rounded-[24px] overflow-hidden border-4 border-white shadow-xl ring-2 ring-mira-orange/10 active:scale-95 transition-transform">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
            <div className="flex items-center gap-4">
              <div className="cursor-pointer" onClick={() => onViewChange(ViewType.PROFILE)}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">MIRA APP 2026</p>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{user.name}</h1>
              </div>
              <button onClick={() => setShowNotifSettings(true)} className="p-3 bg-white rounded-2xl shadow-xl border border-slate-50 text-mira-orange active:scale-90 transition-all">
                <BellRing size={22} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-12 space-y-12">
        {/* CAIXA IA REDUZIDA */}
        <section className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div onClick={() => onViewChange(ViewType.ASSISTANT)} className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl group cursor-pointer active:scale-[0.98] transition-all border border-white/5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] -mr-16 -mt-16 transition-all group-hover:scale-125 duration-1000"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-mira-blue/20 backdrop-blur-2xl border border-white/10 rounded-[1rem] flex items-center justify-center shadow-2xl">
                  <Bot size={24} className="text-mira-blue" />
                </div>
                <div className="bg-white/20 backdrop-blur-xl px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                  <Sparkles size={10} className="text-mira-yellow fill-mira-yellow" />
                  <span className="text-[8px] font-black uppercase tracking-widest">{t('home_ai_badge', language)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tighter leading-none">{t('home_ai_cta_title', language)}</h2>
                <p className="text-[11px] font-bold text-slate-300 opacity-80 leading-relaxed max-w-[200px]">{t('home_ai_cta_desc', language)}</p>
              </div>
              <div className="pt-2">
                <div className="bg-white text-slate-900 px-6 py-2.5 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest inline-flex items-center gap-2 group-hover:gap-4 transition-all">
                  {t('home_ai_btn', language)} <ArrowRight size={14} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ECOSYSTEM Grid */}
        <section>
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">{t('home_ecosystem', language)}</h3>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {quickAccess.map((item) => (
              <button key={item.id} onClick={() => onViewChange(item.id)} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all text-center group active:scale-95 flex flex-col items-center justify-center">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4 transition-all group-hover:scale-110 shadow-sm ${item.color}`}><item.icon size={32} /></div>
                <p className="font-black text-slate-900 text-xs tracking-tight uppercase group-hover:text-mira-orange">{item.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Community Highlights */}
        <section>
          <div className="flex justify-between items-end mb-8 px-2">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">{t('home_community', language)}</h3>
              <p className="text-2xl font-black text-slate-900 tracking-tighter mt-1">{t('home_popular_title', language)}</p>
            </div>
            <button onClick={() => onViewChange(ViewType.COMMUNITY)} className="text-[10px] font-black text-mira-blue uppercase tracking-widest px-6 py-2.5 bg-mira-blue-pastel rounded-2xl transition-all shadow-sm active:scale-95">{t('home_see_all', language)}</button>
          </div>
          <div className="grid grid-cols-1 gap-8">
            {relevantPosts.map(post => (
              <div key={post.id} onClick={() => onViewChange(ViewType.COMMUNITY)} className="relative h-60 rounded-[3.5rem] overflow-hidden shadow-xl group cursor-pointer border border-slate-100">
                <img src={post.backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={post.authorAvatar} alt="" className="w-8 h-8 rounded-full border-2 border-white/40 shadow-sm" referrerPolicy="no-referrer" />
                    <span className="text-xs font-black text-white/90 uppercase tracking-widest">{post.authorName}</span>
                  </div>
                  <h4 className="font-black text-white text-xl tracking-tight uppercase drop-shadow-lg">{post.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 mb-4">
          <button
            onClick={() => setShowSuggestionModal(true)}
            className="w-full bg-mira-orange/10 border-2 border-dashed border-mira-orange/30 p-8 rounded-[3rem] flex items-center justify-between group hover:bg-mira-orange/20 transition-all active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-mira-orange text-white rounded-2xl shadow-lg">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <div className="text-left">
                <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{t('home_suggest_improvements', language)}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ajudar a crescer o MIRA</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl text-mira-orange shadow-sm border border-slate-100 group-hover:translate-x-1 transition-transform">
              <ChevronRight size={20} />
            </div>
          </button>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex justify-center gap-8">
            <button onClick={() => onViewChange(ViewType.PRIVACY)} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-mira-orange transition-colors">{t('home_legal_policy', language)}</button>
            <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-mira-orange transition-colors">{t('home_terms', language)}</button>
          </div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
            {t('home_copyright', language)}
          </p>
        </div>
      </div>
      {/* SUGGESTION MODAL */}
      {showSuggestionModal && (
        <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl relative">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-mira-orange-pastel text-mira-orange rounded-2xl">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{t('home_suggestion_title', language)}</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t('home_suggestion_subtitle', language)}</p>
                </div>
              </div>
              <button onClick={() => setShowSuggestionModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">{t('home_subject', language)}</label>
                <input
                  type="text"
                  value={suggestionData.subject}
                  onChange={e => setSuggestionData({ ...suggestionData, subject: e.target.value })}
                  placeholder="Ex: Novo recurso, erro no mapa..."
                  className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-xs font-bold focus:bg-white focus:border-mira-orange outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">{t('home_description', language)}</label>
                <textarea
                  value={suggestionData.message}
                  onChange={e => setSuggestionData({ ...suggestionData, message: e.target.value })}
                  placeholder="Conte-nos como podemos melhorar o MIRA..."
                  className="w-full h-40 p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] text-xs font-bold focus:bg-white focus:border-mira-orange outline-none transition-all resize-none"
                />
              </div>
              <button
                onClick={handleSuggestionSubmit}
                disabled={!suggestionData.message || isSubmitting}
                className="w-full bg-mira-orange text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-orange-100 active:scale-95 transition-all mt-4 disabled:opacity-30"
              >
                {isSubmitting ? t('home_sending', language) : t('home_send_suggestion', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
