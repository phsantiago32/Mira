
import React, { useState, useMemo } from 'react';
import { BookOpen, TrendingUp, ChevronRight, Mic2, Search, Filter, ChevronDown, FileText, Bot, ExternalLink, Calendar, X, Send, Mail, GraduationCap, ArrowLeft, Share2, Info, Globe, Building2, Sparkles } from 'lucide-react';
import { Course, UNIFIED_CATEGORIES, CATEGORIES } from '../types';
import { t } from '../utils/translations';
import { citeSource } from '../modules/OfficialDataSources';
import { analytics } from '../services/analyticsService';
import { IEFP_MASSIVE_DATABASE } from '../utils/iefpCoursesDatabase';

interface LearningHubProps {
  courses: Course[];
  onNavigateToChat: () => void;
  onEarnPoints: (points: number, badgeId?: string) => void;
  onNavigateToContact: () => void;
  language: string;
}

const MIRA_ARTICLES = [
  {
    id: 401,
    title: 'Regularização 2026: O Novo Artigo 91',
    summary: 'Aprenda como as novas regras de 2026 para estudantes facilitam a obtenção de residência em Portugal.',
    content: `Em 2026, as regras de regularização via estudos foram simplificadas pela nova Reforma Administrativa.

Principais Novidades:
1. Matrícula Digital: O processo agora é 100% online através do portal gov.pt/estudos.
2. Visto Automático: Estudantes de instituições certificadas pela ANQEP recebem pré-aprovação imediata.
3. Transição Laboral: Permissão total de trabalho desde o primeiro dia de aulas.

Para saber mais detalhes e tirar dúvidas específicas para o seu caso, converse com o nosso assistente digital MIRA! Ele está treinado com toda a base de dados de 2026.`,
    sourceId: 'aima',
    date: '10 Jan 2026',
    category: CATEGORIES.EDUCATION,
    readTime: '5',
    image: 'https://picsum.photos/seed/mira_edu/1200/800'
  },
  {
    id: 402,
    title: 'Saúde em Portugal: Guia do Utente 2026',
    summary: 'Como aceder ao SNS e obter o seu número de utente de forma rápida.',
    content: `O acesso à saúde em Portugal para imigrantes foi reforçado em 2026.
    
    Passos Essenciais:
    1. Registo no Centro de Saúde local.
    2. Apresentação de Prova de Residência ou Atestado da Junta.
    3. Obtenção do Número de Utente digital.`,
    sourceId: 'sns',
    date: '15 Fev 2026',
    category: CATEGORIES.HEALTH,
    readTime: '7',
    image: 'https://picsum.photos/seed/mira_health/1200/800'
  }
];

const IEFP_SYNCED_COURSES: Course[] = [
  { id: 'iefp-link-1', title: 'Pesquisa de Ofertas de Formação (IEFP)', description: 'Pesquise e consulte as mais recentes vagas de formação disponíveis no portal IEFP Online.', category: CATEGORIES.EDUCATION, type: 'Online/Presencial', duration: 'Variável', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=50', isIefpSynced: true, link: 'https://iefponline.iefp.pt/IEFP/pesquisas/search.do?cat=ofertaFormacao' },
  { id: 'iefp-link-2', title: 'Portal Passaporte Qualifica', description: 'Aceda ao seu Centro Qualifica para registo, orientação e encaminhamento em ofertas de qualificação de adultos.', category: CATEGORIES.EDUCATION, type: 'Plataforma', duration: 'Contínuo', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=50', isIefpSynced: true, link: 'https://www.passaportequalifica.gov.pt/cicLogin.xhtml' },
  { id: 'iefp-link-3', title: 'Formação Geral IEFP', description: 'Informações detalhadas sobre todas as modalidades de formação profissional disponíveis no IEFP.', category: CATEGORIES.EDUCATION, type: 'Portal', duration: 'Variável', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&q=50', isIefpSynced: true, link: 'https://www.iefp.pt/formacao' },
  { id: 'iefp-link-4', title: 'Portal IEFP Online', description: 'Plataforma digital de emprego e formação profissional. Registo e acesso a serviços online para candidatos.', category: CATEGORIES.WORK, type: 'Serviço Digital', duration: 'Livre', image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&q=50', isIefpSynced: true, link: 'https://iefponline.iefp.pt/IEFP/index2.jsp' },
  { id: 'iefp-link-5', title: 'Cursos de Aprendizagem (IEFP)', description: 'Formação inicial direcionada a jovens para obtenção de certificação escolar e profissional.', category: CATEGORIES.EDUCATION, type: 'Presencial', duration: 'Longo Prazo', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=50', isIefpSynced: true, link: 'https://www.iefp.pt/cursos-de-aprendizagem1' },
  { id: 'iefp-link-6', title: 'Cursos de Educação e Formação para Adultos (EFA)', description: 'Eleve as suas qualificações com os cursos EFA. Direcionado a adultos que procuram melhorar escolaridade ou competências profissionais.', category: CATEGORIES.EDUCATION, type: 'Híbrido/Presencial', duration: 'Variável', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=50', isIefpSynced: true, link: 'https://www.iefp.pt/cursos-de-educacao-e-formacao-para-adultos' }
];

export const LearningHub: React.FC<LearningHubProps> = ({ courses, onNavigateToChat, onEarnPoints, onNavigateToContact, language }) => {
  const [activeTab, setActiveTab] = useState<'articles' | 'courses'>('articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<typeof MIRA_ARTICLES[0] | null>(null);

  const filteredArticles = MIRA_ARTICLES.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const allCourses = useMemo(() => {
    // Combinar todas as fontes: links rápidos IEFP + base de dados completa IEFP + cursos do Supabase DB
    // Evitar duplicatas pelo id
    const seen = new Set<string>();
    const combined = [...IEFP_SYNCED_COURSES, ...IEFP_MASSIVE_DATABASE, ...courses];
    return combined.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [courses]);
  const filteredCourses = allCourses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (selectedArticle) {
    return (
      <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300 font-['Plus_Jakarta_Sans']">
        <div className="relative h-64 w-full overflow-hidden">
          <img src={selectedArticle.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20"></div>
          <button onClick={() => setSelectedArticle(null)} className="absolute top-6 left-6 p-3 bg-white/90 backdrop-blur-md rounded-2xl text-slate-900 shadow-xl active:scale-95"><ArrowLeft size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar pb-32">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[10px] font-black bg-mira-blue text-white px-3 py-1.5 rounded-full uppercase tracking-widest">{selectedArticle.category}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={12} /> {selectedArticle.date}
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight uppercase">{selectedArticle.title}</h1>
            <div className="prose prose-slate max-w-none text-base text-slate-700 font-medium leading-relaxed whitespace-pre-line">
              {selectedArticle.content}
            </div>
            <div onClick={onNavigateToChat} className="mt-10 p-6 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] cursor-pointer hover:bg-indigo-100 transition-all flex items-center gap-4 group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-mira-blue shadow-sm"><Bot size={28} /></div>
              <div>
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Deseja saber mais sobre este tópico?</p>
                <p className="text-[10px] text-mira-blue font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">Converse agora com o MIRA <ChevronRight size={12} className="inline" /></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white pb-24 font-['Plus_Jakarta_Sans']">
      <div className="bg-white border-b border-slate-100 p-6 space-y-6 sticky top-0 z-20">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">LEARNING HUB</h2>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Conhecimento para Integração 2026</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
            <button onClick={() => setActiveTab('articles')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'articles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Artigos</button>
            <button onClick={() => setActiveTab('courses')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'courses' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Cursos</button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Pesquisar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-mira-blue-pastel transition-all shadow-inner outline-none" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
        {activeTab === 'articles' ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            {filteredArticles.map(article => (
              <div key={article.id} onClick={() => setSelectedArticle(article)} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-mira-blue transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-black bg-slate-50 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-widest">{article.category}</span>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                    <Calendar size={10} /> {article.date}
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-lg leading-tight mb-2 group-hover:text-mira-blue transition-colors uppercase tracking-tight">{article.title}</h4>
                <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">{article.summary}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-500">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all group relative">
                <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest">{course.category}</div>
                  {course.isIefpSynced && (
                    <div className="absolute bottom-4 left-4 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg"><Sparkles size={14} /></div>
                  )}
                </div>
                <div className="p-6">
                  <h4 className="font-black text-lg text-slate-900 tracking-tight uppercase leading-tight mb-2">{course.title}</h4>
                  <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={14} /> {course.duration}</span>
                    <button onClick={() => { onEarnPoints(10); if (course.link) window.open(course.link, '_blank'); else alert('Inscrito!'); }} className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-lg ${course.isIefpSynced ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>Aceder <ExternalLink size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
