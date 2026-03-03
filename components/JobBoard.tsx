
import React, { useState, useEffect } from 'react';
import { JobPost, WORK_TOPICS, CATEGORIES } from '../types';
import { Search, Briefcase, ExternalLink, MapPin, Building2, TrendingUp, ChevronDown, Filter, X, SlidersHorizontal, Map as MapIcon, Globe, FileText, RefreshCcw, AlertTriangle, Volume2, AlertCircle } from 'lucide-react';
import { analytics } from '../services/analyticsService';
import { supabase } from '../lib/supabase';
import { t } from '../utils/translations';
import { PROTECTED_JOBS } from '../utils/protectedData';
import { audioService } from '../services/audioService';

interface JobBoardProps {
  language: string;
  isAdmin?: boolean;
}

const JOB_TRENDS = [
  { id: 1, name: 'Turismo & Hotelaria', demandLevel: 'Muito Alta', averageSalary: '850 - 1.200', growth: '+15%' },
  { id: 2, name: 'Tecnologia (TI)', demandLevel: 'Alta', averageSalary: '1.200 - 3.500', growth: '+22%' },
  { id: 3, name: 'Construção Civil', demandLevel: 'Muito Alta', averageSalary: '900 - 1.500', growth: '+10%' },
  { id: 4, name: 'Energias Renováveis', demandLevel: 'Média', averageSalary: '1.100 - 2.000', growth: '+30%' },
  { id: 5, name: 'Saúde & Cuidados', demandLevel: 'Alta', averageSalary: '1.000 - 1.800', growth: '+12%' },
];

const PT_LOCATIONS = [
  "Todos", "Lisboa", "Porto", "Braga", "Setúbal", "Faro", "Coimbra", "Aveiro", "Remoto", "Leiria", "Santarém", "Viseu", "Évora"
];



export const JobBoard: React.FC<JobBoardProps> = ({ language, isAdmin }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'trends'>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Todos');
  const [selectedWorkTopic, setSelectedWorkTopic] = useState('Todos');
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);

    // Resilience: Hydro-charge from local cache immediately
    const cached = localStorage.getItem('mira_jobs_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setJobs(parsed);
          setLoading(false); // Immediate display!
          console.log("MIRA: Rehydrated Jobs from localStorage");
        }
      } catch (e) { }
    }

    try {
      const { data, error } = await supabase.from('job_posts').select('*').order('created_at', { ascending: false });

      let formattedJobs: JobPost[] = [];
      if (!error && data && data.length > 0) {
        formattedJobs = data.map(dbJob => ({
          id: dbJob.id,
          title: dbJob.title || 'Sem título',
          location: dbJob.location || 'Portugal',
          sourceName: dbJob.source_name || 'MIRA',
          sourceUrl: dbJob.source_url || '#',
          datePosted: 'Hoje',
          tags: dbJob.tags || [],
          category: dbJob.category || 'Emprego e Formação',
          workTopic: dbJob.work_topic || 'Outros'
        }));
      }

      // ALWAYS ensure protected jobs are included at the end or top
      const finalJobs = [...formattedJobs];
      PROTECTED_JOBS.forEach(pj => {
        if (!finalJobs.some(j => j.id === pj.id || j.title === pj.title)) {
          finalJobs.push(pj);
        }
      });

      setJobs(finalJobs);
      localStorage.setItem('mira_jobs_cache', JSON.stringify(finalJobs));

    } catch (err: any) {
      console.error("MIRA Exception in JobBoard:", err);
      // Fallback
      setJobs(prev => {
        const base = prev.length > 0 ? [...prev] : [];
        PROTECTED_JOBS.forEach(pj => {
          if (!base.some(j => j.id === pj.id || j.title === pj.title)) {
            base.push(pj);
          }
        });
        return base;
      });
    } finally {
      setLoading(false); // Only end loading if it wasn't already stopped by cache
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'Todos' || job.location === selectedCity;
    const matchesTopic = selectedWorkTopic === 'Todos' || job.workTopic === selectedWorkTopic;
    return matchesSearch && matchesCity && matchesTopic;
  });

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      {/* Header Sticky Section */}
      <div className="bg-white px-6 pt-8 pb-4 space-y-6 z-30 border-b border-slate-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{t('jobs_title', language)}</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-mira-green animate-pulse"></div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{t('jobs_subtitle', language)}</p>
            </div>
          </div>
          <button
            onClick={() => fetchJobs()}
            disabled={loading}
            className="p-3 bg-slate-50 text-slate-400 hover:text-mira-orange hover:bg-mira-orange-pastel rounded-2xl transition-all active:rotate-180 duration-500 w-full sm:w-auto flex justify-center shrink-0"
            title="Sincronizar Vagas"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'jobs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              {t('nav_vagas', language)}
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'trends' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              Insights
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            analytics.track('europass_click', 'u1');
            window.open('https://europa.eu/europass/eportfolio/screen/cv-editor/legacy-cv-editor?lang=pt', '_blank');
          }}
          className="w-full bg-mira-blue text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all active:scale-95"
        >
          <FileText size={18} /> {t('jobs_create_cv', language)}
        </button>

        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-mira-orange transition-colors" size={20} />
              <input
                type="text"
                placeholder={t('jobs_search_placeholder', language)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:border-mira-orange outline-none transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-mira-orange-pastel border border-transparent transition-all"
                >
                  {PT_LOCATIONS.map(city => (
                    <option key={city} value={city}>{city === 'Todos' ? t('jobs_all_districts', language) : city}</option>
                  ))}
                </select>
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>

              <div className="relative flex-1">
                <select
                  value={selectedWorkTopic}
                  onChange={(e) => setSelectedWorkTopic(e.target.value)}
                  className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-800 focus:border-mira-orange focus:bg-white transition-all outline-none appearance-none"
                >
                  <option value="Todos">{t('jobs_all_areas', language)}</option>
                  {WORK_TOPICS.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 space-y-6 pb-10 mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-pulse">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
              <Briefcase size={40} />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">{t('jobs_loading', language)}</p>
              <p className="text-xs font-bold text-slate-400">{t('jobs_loading_desc', language)}</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="p-4 bg-red-50 text-red-500 rounded-3xl"><AlertCircle size={32} /></div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{error}</p>
            <button onClick={() => fetchJobs()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Tentar Novamente</button>
          </div>
        ) : activeTab === 'jobs' ? (
          filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-5">
              {filteredJobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => {
                    analytics.track('job_click', 'u1', job.category, job);
                    window.open(job.sourceUrl, '_blank');
                  }}
                  className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-mira-orange hover:shadow-xl hover:shadow-orange-100/30 transition-all cursor-pointer group active:scale-[0.98] relative overflow-hidden"
                >
                  {job.tags.includes('Urgente') && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-[1.5rem] shadow-sm">
                      {t('jobs_urgent', language)}
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[8px] font-black text-white uppercase tracking-widest bg-mira-blue px-2 py-1 rounded-md">{job.workTopic}</span>
                      </div>
                      <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-mira-orange transition-colors line-clamp-2 uppercase tracking-tight">{job.title}</h3>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-slate-50 rounded-lg flex items-center justify-center">
                            <Building2 size={12} className="text-slate-400" />
                          </div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[100px]">{job.sourceName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-slate-50 rounded-lg flex items-center justify-center">
                            <MapPin size={12} className="text-slate-400" />
                          </div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{job.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        {t('jobs_published_ago', language)} {job.datePosted}
                      </span>
                    </div>
                    <div className="bg-slate-900 text-white p-2.5 rounded-xl group-hover:bg-mira-orange transition-colors">
                      <ExternalLink size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200">
                <Search size={48} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pode haver um problema na ligação ou os filtros são muito restritos</p>
                <p className="text-sm font-medium text-slate-400 px-10 leading-relaxed">Temos {jobs.length} vagas no total. Tente selecionar "Todos os Distritos" e "Todas as Áreas".</p>
              </div>
              <button
                onClick={() => { setSelectedCity('Todos'); setSelectedWorkTopic('Todos'); setSearchQuery(''); }}
                className="px-8 py-3 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Resetar Filtros
              </button>
            </div>
          )
        ) : (
          <div className="space-y-6">
            <div className="p-10 bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-mira-blue rounded-full blur-[80px] opacity-40"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-mira-orange rounded-full blur-[80px] opacity-20"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp size={24} className="text-mira-yellow" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">{t('jobs_insight_title', language)}</h4>
                </div>
                <p className="text-xl font-black tracking-tight leading-tight mb-4">
                  {t('jobs_growth_desc', language)}
                </p>
                <div className="flex gap-4">
                  <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">{t('jobs_avg_salary', language)}</p>
                    <p className="text-md font-black">1.450€</p>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">{t('jobs_active_offers', language)}</p>
                    <p className="text-md font-black">+4.200</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {JOB_TRENDS.map(trend => (
                <div key={trend.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-mira-blue hover:shadow-lg transition-all">
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 text-lg tracking-tight uppercase">{trend.name}</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{t('jobs_avg_salary', language)}</span>
                        <span className="text-xs font-black text-slate-600">{trend.averageSalary}€</span>
                      </div>
                      <div className="w-px h-6 bg-slate-100"></div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Crescimento</span>
                        <span className="text-xs font-black text-mira-green">{trend.growth}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm ${trend.demandLevel === 'Muito Alta' ? 'bg-red-50 text-red-500' : 'bg-mira-orange-pastel text-mira-orange'}`}>
                      {trend.demandLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
