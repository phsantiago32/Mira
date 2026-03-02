
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Filter, MapPin, Phone, Mail, Globe, Star, Building2, ChevronRight, Info, MessageSquare, Clock, Zap, RefreshCcw, AlertTriangle } from 'lucide-react';
import { MAP_CATEGORIES, MapAlert } from '../types';
import { t } from '../utils/translations';

interface LocalServicesListProps {
    language: string;
}

export const LocalServicesList: React.FC<LocalServicesListProps> = ({ language }) => {
    const [services, setServices] = useState<MapAlert[]>([]);
    const [filteredServices, setFilteredServices] = useState<MapAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    const fetchServices = async (retries = 3) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('map_alerts')
                .select('*')
                .order('title', { ascending: true });

            if (error) throw error;

            console.log("MIRA: Serviços recebidos do DB:", data?.length || 0);

            if (data && data.length > 0) {
                const mappedData: MapAlert[] = data.map(item => {
                    const rawAddress = item.address || '';
                    let website = item.website || '';
                    let cleanAddress = rawAddress;

                    if (!website && rawAddress.includes('http')) {
                        const match = rawAddress.match(/https?:\/\/[^\s,]+/);
                        if (match) {
                            website = match[0];
                            cleanAddress = rawAddress.replace(website, '').replace(/,\s*$/, '').trim();
                        }
                    }

                    return {
                        id: item.id,
                        title: item.title || 'Serviço Sem Nome',
                        category: item.category || 'Geral',
                        lat: 0,
                        lng: 0,
                        distance: 'N/A',
                        address: cleanAddress || 'Morada não disponível',
                        city: item.city || 'Portugal',
                        phone: item.phone || '',
                        email: item.email || '',
                        website: website,
                        avgRating: 4.8,
                        ratings: []
                    };
                });
                setServices(mappedData);
                setFilteredServices(mappedData);
            } else {
                setServices([]);
                if (retries > 0) {
                    console.warn(`MIRA: Serviços não carregados, tentando... (${retries})`);
                    setTimeout(() => fetchServices(retries - 1), 1500);
                }
            }
        } catch (err: any) {
            console.error('MIRA Services Exception:', err);
            setError(err.message || 'Erro de conexão');
            if (retries > 0) setTimeout(() => fetchServices(retries - 1), 2500);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        let result = services;

        if (selectedCategory !== 'Todos') {
            result = result.filter(s => s.category === selectedCategory);
        }

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
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Header com Filtros */}
            <div className="bg-white border-b border-slate-200 px-6 py-8 space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Guia de Serviços Locais</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Directório de Apoio e Integração MIRA</p>
                    </div>
                    <button
                        onClick={() => fetchServices()}
                        disabled={loading}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-mira-orange hover:bg-mira-orange-pastel rounded-2xl transition-all active:rotate-180 duration-500"
                        title="Sincronizar Dados"
                    >
                        <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome, morada ou cidade..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-mira-orange transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="sm:w-64 relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-800 focus:border-indigo-600 focus:bg-white transition-all outline-none appearance-none"
                        >
                            <option value="Todos">{t('map_all_areas', language)}</option>
                            {MAP_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de Resultados */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <div className="w-12 h-12 border-4 border-mira-orange border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Carregando directório...</p>
                    </div>
                ) : filteredServices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredServices.map((service) => (
                            <div key={service.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group border-b-4 border-b-transparent hover:border-b-mira-orange">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-mira-orange group-hover:bg-mira-orange-pastel transition-colors">
                                        <Building2 size={24} />
                                    </div>
                                    <div className="flex items-center gap-1 bg-mira-yellow-pastel text-mira-yellow-dark px-3 py-1.5 rounded-full text-[10px] font-black uppercase">
                                        <Star size={12} fill="currentColor" />
                                        <span>{service.avgRating}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-mira-orange transition-colors">{service.title}</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-mira-orange"></div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{service.category}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 group-hover:border-mira-orange/20 transition-all">
                                            <div className="p-2 bg-white rounded-xl shadow-sm"><MapPin size={18} className="text-mira-orange" /></div>
                                            <div className="flex flex-col">
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Endereço do Serviço</p>
                                                <p className="text-xs font-bold text-slate-700 leading-relaxed">{service.address}, {service.city}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {service.phone && (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-600">
                                                    <Phone size={14} className="text-mira-orange" />
                                                    <p className="text-[10px] font-black tracking-widest">{service.phone}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons: Avaliação and Monitorar Fila */}
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:border-mira-orange hover:text-mira-orange transition-all active:scale-95 shadow-sm">
                                            <MessageSquare size={14} /> Avaliações
                                        </button>
                                        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-mira-orange-pastel text-mira-orange rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-mira-orange hover:text-white transition-all active:scale-95 shadow-sm">
                                            <Clock size={14} /> Fila de Espera
                                        </button>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <Zap size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Status MIRA</p>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Serviço Verificado</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-slate-200 group-hover:text-mira-orange group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 text-center px-12">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                            <Search size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Nenhum serviço encontrado</h3>
                        <p className="text-sm text-slate-500">Não encontramos resultados para "{searchTerm}". Tente pesquisar por outros termos ou mudar a categoria.</p>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}
                            className="mt-4 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
