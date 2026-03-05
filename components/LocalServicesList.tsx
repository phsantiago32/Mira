
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { submitReportRest } from '../services/reportService';
import { Search, Filter, MapPin, Phone, Mail, Globe, Star, Building2, ChevronRight, Info, MessageSquare, Clock, Zap, RefreshCcw, AlertTriangle, Volume2, AlertCircle, ChevronDown, X, CheckCircle2 } from 'lucide-react';
import { MAP_CATEGORIES, MapAlert } from '../types';
import { t } from '../utils/translations';
import { audioService } from '../services/audioService';
import { PROTECTED_SERVICES } from '../utils/protectedData';
import { useToast } from './Toast';

interface LocalServicesListProps {
    language: string;
}

export const LocalServicesList: React.FC<LocalServicesListProps> = ({ language }) => {
    const { showToast } = useToast();
    const [services, setServices] = useState<MapAlert[]>([]);
    const [filteredServices, setFilteredServices] = useState<MapAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [queueModalOpen, setQueueModalOpen] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [reviewText, setReviewText] = useState('');
    const [ratingStars, setRatingStars] = useState(5);
    const [queueStatus, setQueueStatus] = useState('normal');

    const [queueStatuses, setQueueStatuses] = useState<Record<string, string>>({});
    const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
    const [serviceReviews, setServiceReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    const fetchQueueStatus = async () => {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const { data, error } = await supabase
                .from('service_reports')
                .select('service_id, status, created_at')
                .gte('created_at', oneHourAgo)
                .order('created_at', { ascending: false });

            if (!error && data) {
                const latestStatuses: Record<string, string> = {};
                // Since it's ordered by descending created_at, the first one seen per service is latest
                data.forEach(report => {
                    if (!latestStatuses[report.service_id]) {
                        latestStatuses[report.service_id] = report.status;
                    }
                });
                setQueueStatuses(latestStatuses);
            }
        } catch (err) {
            console.error('Error fetching queue status', err);
        }
    };

    const fetchServices = async (retries = 3) => {
        setLoading(true);
        setError(null);
        fetchQueueStatus();

        const cached = localStorage.getItem('mira_services_cache');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setServices(parsed);
                    setFilteredServices(parsed);
                    // Critical UX fix: If we have cache, stop loading immediately
                    // so the screen doesn't clear to show skeletons again
                    setLoading(false);
                }
            } catch (e) { }
        }

        try {
            const { data, error } = await supabase
                .from('map_alerts')
                .select('*')
                .order('title', { ascending: true });

            if (error) throw error;

            let mappedData: MapAlert[] = [];
            if (data && data.length > 0) {
                mappedData = data.map(item => ({
                    id: item.id,
                    title: item.title || 'Serviço Sem Nome',
                    category: item.category || 'Geral',
                    lat: item.lat || 0,
                    lng: item.lng || 0,
                    distance: 'N/A',
                    address: item.address || 'Morada não disponível',
                    city: item.city || 'Portugal',
                    phone: item.phone || '',
                    email: item.email || '',
                    website: item.website || '',
                    avgRating: item.avg_rating ?? 0.0,
                    ratings: []
                }));
            }

            // ALWAYS ensure protected services are included to prevent empty state
            const finalData = [...mappedData];

            // Add protected services that aren't already there (by ID or Title)
            PROTECTED_SERVICES.forEach(ps => {
                if (!finalData.some(d => d.id === ps.id || d.title === ps.title)) {
                    finalData.push(ps);
                }
            });

            setServices(finalData);
            setFilteredServices(finalData);
            localStorage.setItem('mira_services_cache', JSON.stringify(finalData));

        } catch (err: any) {
            console.error('MIRA Services Exception:', err);
            setError(err.message || 'Erro de conexão');

            // Fallback to cache + protected if error
            setServices(prev => prev.length > 0 ? prev : PROTECTED_SERVICES);
            setFilteredServices(prev => prev.length > 0 ? prev : PROTECTED_SERVICES);

            if (retries > 0) setTimeout(() => fetchServices(retries - 1), 2500);
        } finally {
            setLoading(false); // Only end loading if it wasn't already stopped by cache
        }
    };

    const fetchReviewsForService = async (serviceName: string) => {
        setLoadingReviews(true);
        try {
            const { data, error } = await supabase
                .from('complaints')
                .select('*')
                .ilike('subject', `%Avaliação de Serviço: ${serviceName}%`)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setServiceReviews(data);
            } else {
                setServiceReviews([]);
            }
        } catch (err) {
            setServiceReviews([]);
        } finally {
            setLoadingReviews(false);
        }
    };

    const toggleServiceExpansion = (service: MapAlert) => {
        if (expandedServiceId === service.id) {
            setExpandedServiceId(null);
            setServiceReviews([]);
        } else {
            setExpandedServiceId(service.id);
            fetchReviewsForService(service.title);
        }
    };

    const openRatingModal = (serviceId: string) => {
        setSelectedServiceId(serviceId);
        setRatingStars(5);
        setReviewText('');
        setRatingModalOpen(true);
    };

    const submitRating = async () => {
        if (!selectedServiceId || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const serviceName = services.find(s => s.id === selectedServiceId)?.title || 'Serviço Desconhecido';

            // 1. Fetch all existing reviews to calculate true average (Trustpilot style)
            const { data: existingReviews } = await supabase
                .from('complaints')
                .select('subject')
                .ilike('subject', `%Avaliação de Serviço: ${serviceName}%`);

            let totalStars = ratingStars; // Include the new rating
            let count = 1;

            if (existingReviews) {
                existingReviews.forEach(r => {
                    const match = r.subject.match(/\((\d)/);
                    if (match) {
                        totalStars += parseInt(match[1], 10);
                        count++;
                    }
                });
            }

            const trueAverage = Number((totalStars / count).toFixed(1));

            // 2. Update service with true computed average
            await supabase.from('map_alerts').update({
                avg_rating: trueAverage
            }).eq('id', selectedServiceId);

            // Update UI immediately
            setServices(prev => prev.map(s => s.id === selectedServiceId ? { ...s, avgRating: trueAverage } : s));
            setFilteredServices(prev => prev.map(s => s.id === selectedServiceId ? { ...s, avgRating: trueAverage } : s));


            if (reviewText.trim().length > 0) {
                await submitReportRest('service_rating', `Serviço: ${serviceName} - Avaliação: ${ratingStars} estrelas\nMensagem: ${reviewText}`);

                // Optimistically add the new review to local state so it shows instantly
                const optimisticReview = {
                    id: `opt-${Date.now()}`,
                    subject: `Avaliação de Serviço: ${serviceName} (${ratingStars} estrelas)`,
                    content: reviewText,
                    created_at: new Date().toISOString()
                };
                setServiceReviews(prev => [optimisticReview, ...prev]);
            }

            // Auto-expand the reviews section for this service so the user can see it
            setExpandedServiceId(selectedServiceId);
            if (reviewText.trim().length === 0) {
                // If no text, still fetch to show existing reviews
                fetchReviewsForService(serviceName);
            }

            showToast(t('service_rate_success', language) || "Avaliação enviada com sucesso!", 'success');
            setRatingModalOpen(false);
        } catch (err) {
            console.error('Rate error:', err);
            showToast("Erro ao enviar avaliação. Tente novamente.", 'error');
            setRatingModalOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openQueueModal = (serviceId: string) => {
        setSelectedServiceId(serviceId);
        setQueueStatus('normal');
        setQueueModalOpen(true);
    };

    const submitQueueReport = async () => {
        if (!selectedServiceId || isSubmitting) return;
        setIsSubmitting(true);
        // Optimistic update: show badge immediately on the service card
        const serviceIdForUpdate = selectedServiceId;
        const statusForUpdate = queueStatus;
        setQueueStatuses(prev => ({ ...prev, [serviceIdForUpdate]: statusForUpdate }));
        try {
            await submitReportRest('service_queue', `Serviço: Serviço ID ${serviceIdForUpdate}\nFila reportada como: ${statusForUpdate.toUpperCase()}`);
            showToast(t('service_queue_reported', language) || "Estado da fila atualizado!", 'success');
            setQueueModalOpen(false);
        } catch (err) {
            console.error('Queue report exception:', err);
            showToast("Erro ao atualizar fila. Tente novamente.", 'error');
            setQueueModalOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        let result = services;
        if (selectedCategory !== 'Todos') result = result.filter(s => s.category === selectedCategory);
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.title.toLowerCase().includes(term) ||
                s.address.toLowerCase().includes(term) ||
                s.city.toLowerCase().includes(term)
            );
        }
        setFilteredServices(result);
    }, [searchTerm, selectedCategory, services]);

    return (
        <div className="flex flex-col min-h-screen bg-white font-['Plus_Jakarta_Sans'] pb-24">
            {/* Header Modernizado */}
            <div className="bg-white px-6 pt-8 pb-4 space-y-6 z-30 border-b border-slate-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                            {t('service_guide_title', language)}
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-mira-blue animate-pulse"></div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                {t('service_guide_subtitle', language)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchServices()}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-mira-blue hover:bg-mira-blue/5 rounded-2xl transition-all active:rotate-180 duration-500 w-full sm:w-auto flex justify-center shrink-0 border border-slate-100"
                    >
                        <RefreshCcw size={22} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-mira-blue transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder={t('service_search_place', language)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-mira-blue transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative group flex-1">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-mira-blue transition-colors pointer-events-none" size={18} />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full pl-12 pr-10 py-5 sm:py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 outline-none focus:bg-white focus:border-mira-blue transition-all shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="Todos">{t('map_all_areas', language)}</option>
                            {Array.from(new Set(services.map(s => s.category))).sort().map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                </div>
            </div>


            {/* Grid de Serviços */}
            <div className="px-6 space-y-6 pb-10 mt-4">
                {loading && services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-pulse">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                            <Building2 size={40} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">{t('service_loading', language)}</p>
                    </div>
                ) : filteredServices.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5">
                        {filteredServices.map((service) => (
                            <div key={service.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-mira-blue hover:shadow-xl hover:shadow-blue-100/30 transition-all cursor-pointer group active:scale-[0.98] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-[40px] -mr-12 -mt-12 transition-all group-hover:bg-mira-blue/10"></div>

                                <div className="relative z-10 flex flex-col gap-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-mira-blue group-hover:bg-white transition-all shadow-sm border border-slate-100 shrink-0">
                                                <Building2 size={20} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black text-slate-900 leading-tight tracking-tight uppercase group-hover:text-mira-blue transition-colors line-clamp-2">
                                                    {service.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-mira-blue animate-pulse shrink-0"></span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{service.category}</span>
                                                    </div>
                                                    {queueStatuses[service.id] && (
                                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm border ${queueStatuses[service.id] === 'empty' ? 'bg-mira-green/10 text-mira-green border-mira-green/20' : queueStatuses[service.id] === 'normal' ? 'bg-mira-yellow/10 text-mira-yellow-dark border-mira-yellow/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                            <Clock size={10} />
                                                            {queueStatuses[service.id] === 'empty' ? 'Sem Fila' : queueStatuses[service.id] === 'normal' ? 'Fila Normal' : 'Lotado'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-mira-yellow-pastel text-mira-yellow-dark px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm self-start">
                                            <Star size={14} fill="currentColor" className="fill-mira-yellow shrink-0" />
                                            <span className="text-xs font-black">{service.avgRating}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-transparent flex items-start gap-3">
                                            <div className="w-8 h-8 bg-white rounded-xl shadow-sm text-mira-blue shrink-0 flex items-center justify-center">
                                                <MapPin size={14} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('map_located_at', language)}</p>
                                                <p className="text-[11px] font-bold text-slate-700 leading-relaxed max-w-[90%]">
                                                    {(() => {
                                                        // Extrai qualquer URL que esteja misturada no texto do endereço
                                                        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
                                                        let cleanAddr = service.address || '';
                                                        cleanAddr = cleanAddr.replace(urlRegex, '').replace(/\s*-\s*$/, '').replace(/,\s*$/, '').trim();
                                                        return cleanAddr;
                                                    })()}
                                                    {service.city && `, ${service.city}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {service.phone && (
                                                <a href={`tel:${service.phone}`} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 hover:border-mira-blue hover:text-mira-blue transition-all">
                                                    <Phone size={14} className="shrink-0" />
                                                    <span className="text-[9px] font-black tracking-widest">{service.phone}</span>
                                                </a>
                                            )}
                                            {(() => {
                                                const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
                                                const embeddedMatch = service.address ? service.address.match(urlRegex) : null;
                                                const finalWebsite = service.website || (embeddedMatch ? embeddedMatch[0] : null);

                                                if (finalWebsite) {
                                                    const validUrl = finalWebsite.startsWith('http') ? finalWebsite : `https://${finalWebsite}`;
                                                    return (
                                                        <a href={validUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-mira-blue hover:bg-mira-blue hover:text-white transition-all">
                                                            <Globe size={14} className="shrink-0" />
                                                            <span className="text-[9px] font-black tracking-widest">Website</span>
                                                        </a>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>

                                    {/* BOTOES APROVADOS E FUNCIONAIS */}
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openRatingModal(service.id); }}
                                            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 bg-mira-orange border border-mira-orange rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-mira-orange-dark shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                                        >
                                            <MessageSquare size={14} className="shrink-0" />
                                            {t('service_rate_btn', language)}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openQueueModal(service.id); }}
                                            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 border border-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all shadow-sm"
                                        >
                                            <Clock size={14} className="shrink-0" />
                                            {t('service_queue_btn', language)}
                                        </button>
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleServiceExpansion(service); }}
                                        className="w-full flex items-center justify-center py-2 px-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-mira-blue transition-colors border-t border-slate-50 mt-1"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{t('service_read_reviews', language)}</span>
                                            <ChevronDown size={14} className={`transform transition-transform duration-300 ${expandedServiceId === service.id ? 'rotate-180 text-mira-blue' : ''}`} />
                                        </div>
                                    </button>

                                    {/* Expanded Reviews Content */}
                                    {expandedServiceId === service.id && (
                                        <div className="pt-4 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-300">
                                            {loadingReviews ? (
                                                <div className="text-center py-6 text-slate-300 flex justify-center"><RefreshCcw className="animate-spin" size={20} /></div>
                                            ) : serviceReviews.length > 0 ? (
                                                serviceReviews.map(r => {
                                                    // Extrair nivel de estrela do subject (e.g. "Avaliação de Serviço: Teste (5 estrelas)")
                                                    const starMatch = r.subject.match(/\((\d)/);
                                                    const st = starMatch ? parseInt(starMatch[1], 10) : 5;
                                                    return (
                                                        <div key={r.id} className="bg-slate-50 p-4 rounded-2xl border border-transparent flex flex-col gap-2">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex gap-1 text-mira-yellow">
                                                                    {[...Array(st)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                                                </div>
                                                                <span className="text-[9px] font-black tracking-widest text-slate-300 uppercase">
                                                                    {new Date(r.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs font-bold text-slate-600 leading-relaxed">"{r.content}"</p>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <div className="text-center py-4 px-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Sem texto de avaliação</p>
                                                    <p className="text-[10px] font-medium text-slate-400 mt-1">Ainda não existem comentários detalhados registados para este serviço.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                            <Search size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{t('service_no_results', language)}</h3>
                            <p className="text-xs font-bold text-slate-400 leading-relaxed">Não encontramos o que procura? Tente outros termos ou limpe os filtros.</p>
                        </div>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}
                            className="px-8 py-3 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm"
                        >
                            {t('service_clear_filters', language)}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de Avaliação */}
            {ratingModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t('service_rate_modal_title', language)}</h3>
                            <button onClick={() => setRatingModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-colors active:scale-90">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRatingStars(star)}
                                        className={`transition-colors active:scale-90 p-1 ${ratingStars >= star ? 'text-mira-yellow' : 'text-slate-200 hover:text-mira-yellow/50'}`}
                                    >
                                        <Star size={32} fill="currentColor" />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="Descreva a sua experiência..."
                                className="w-full h-32 p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-900 resize-none outline-none focus:bg-white focus:border-mira-blue transition-all placeholder:text-slate-400"
                            />
                            <button
                                onClick={submitRating}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-mira-blue text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-mira-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg flex justify-center items-center gap-2"
                            >
                                {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : t('service_rate_submit', language)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Fila */}
            {queueModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t('service_queue_modal_title', language)}</h3>
                            <button onClick={() => setQueueModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-colors active:scale-90">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <button
                                onClick={() => setQueueStatus('empty')}
                                className={`w-full p-5 rounded-[1.5rem] border-2 transition-all flex items-center justify-between group ${queueStatus === 'empty' ? 'border-mira-green bg-mira-green/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                            >
                                <span className={`text-[11px] font-black uppercase tracking-widest ${queueStatus === 'empty' ? 'text-mira-green' : 'text-slate-600'}`}>{t('service_queue_empty', language)}</span>
                                {queueStatus === 'empty' && <CheckCircle2 size={18} className="text-mira-green" />}
                            </button>
                            <button
                                onClick={() => setQueueStatus('normal')}
                                className={`w-full p-5 rounded-[1.5rem] border-2 transition-all flex items-center justify-between group ${queueStatus === 'normal' ? 'border-mira-yellow bg-mira-yellow/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                            >
                                <span className={`text-[11px] font-black uppercase tracking-widest ${queueStatus === 'normal' ? 'text-mira-yellow' : 'text-slate-600'}`}>{t('service_queue_normal', language)}</span>
                                {queueStatus === 'normal' && <CheckCircle2 size={18} className="text-mira-yellow" />}
                            </button>
                            <button
                                onClick={() => setQueueStatus('crowded')}
                                className={`w-full p-5 rounded-[1.5rem] border-2 transition-all flex items-center justify-between group ${queueStatus === 'crowded' ? 'border-red-500 bg-red-500/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                            >
                                <span className={`text-[11px] font-black uppercase tracking-widest ${queueStatus === 'crowded' ? 'text-red-500' : 'text-slate-600'}`}>{t('service_queue_crowded', language)}</span>
                                {queueStatus === 'crowded' && <CheckCircle2 size={18} className="text-red-500" />}
                            </button>

                            <button
                                onClick={submitQueueReport}
                                disabled={isSubmitting}
                                className="w-full mt-4 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg flex justify-center items-center gap-2"
                            >
                                {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : t('service_queue_submit', language)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
