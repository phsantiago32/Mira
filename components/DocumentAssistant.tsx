
import React, { useState, useMemo } from 'react';
import {
    DocumentTask, DocumentTemplate, ChatSession, GeneratedDocument, CATEGORIES, UNIFIED_CATEGORIES, UnifiedCategory, ViewType
} from '../types';
import {
    CheckCircle2, FileText, ChevronRight, ArrowLeft, Loader2,
    Search, X, Download, FileSignature,
    RefreshCcw, Lightbulb, Filter, ChevronDown, PenTool, Info, Landmark, Scale, Briefcase, Bot
} from 'lucide-react';
import { generateOfficialPDF } from '../utils/pdfGenerator';
import { analytics } from '../services/analyticsService';
import { t } from '../utils/translations';
import { supabase } from '../lib/supabase';
import { templates, serviceGuides } from '../utils/documentsDatabase';
import { RegularizationWizard } from './RegularizationWizard';
import { useToast } from './Toast';

interface DocumentAssistantProps {
    tasks: DocumentTask[];
    chatSessions: ChatSession[];
    drafts: any[];
    setDrafts: (drafts: any[]) => void;
    history: GeneratedDocument[];
    addToHistory: (doc: GeneratedDocument) => void;
    onOpenSession: (sessionId: string) => void;
    onToggleTask: (id: string) => void;
    onEarnPoints: (points: number, badgeId?: string) => void;
    onViewChange: (view: ViewType) => void;
    language: string;
}

export const DocumentAssistant: React.FC<DocumentAssistantProps> = ({
    tasks, chatSessions, drafts, setDrafts, history, addToHistory,
    onOpenSession, onToggleTask, onEarnPoints, onViewChange, language
}) => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'docs' | 'wizard'>('docs');
    const [activeScreen, setActiveScreen] = useState<'gallery' | 'form' | 'success' | 'guide_view'>('gallery');
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [selectedGuide, setSelectedGuide] = useState<any | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedFile, setGeneratedFile] = useState<any | null>(null);
    const [searchFilter, setSearchFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
    const [entityFilter, setEntityFilter] = useState<string>('Todos');

    const availableEntities = useMemo(() => {
        const all = templates.map(t => t.authority);
        return Array.from(new Set(all)).filter(Boolean).sort();
    }, []);

    const availableCategories = useMemo(() => {
        const all = templates.map(t => t.category);
        return Array.from(new Set(all)).filter(Boolean).sort();
    }, []);

    const filteredItems = useMemo(() => {
        const list = templates; // Only templates now in the gallery search
        const term = searchFilter.toLowerCase();
        return list.filter((item: any) => {
            const matchesSearch = item.title.toLowerCase().includes(term);
            const matchesCategory = categoryFilter === 'Todos' || item.category === categoryFilter;
            const matchesEntity = entityFilter === 'Todos' || item.authority === entityFilter;
            return matchesSearch && matchesCategory && matchesEntity;
        });
    }, [searchFilter, categoryFilter, entityFilter]);

    const generatePDF = async () => {
        if (!selectedTemplate) return;
        setIsGenerating(true);

        // Phase 3.2: Async Job UX - Notify user that processing is happening
        showToast("O MIRA está a preparar o teu documento... Podes continuar a navegar se quiseres!", "info");

        try {
            const pdfResult = await generateOfficialPDF(selectedTemplate.title, formData);

            // Tenta obter o usuário atual para upload no Supabase e Notificação
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) {
                    const userId = session.user.id;
                    const fileExt = pdfResult.filename.split('.').pop() || 'pdf';
                    const fileId = Math.random().toString(36).substring(2, 10);
                    const filePath = `${userId}/doc_${fileId}.${fileExt}`;

                    // Upload real para o Supabase Storage (Assíncrono, não bloqueia UI)
                    supabase.storage
                        .from('documents')
                        .upload(filePath, pdfResult.blob, {
                            contentType: 'application/pdf',
                            cacheControl: '3600',
                            upsert: false
                        }).then(({ data: uploadData, error: uploadError }) => {
                            if (!uploadError && uploadData) {
                                const { data: { publicUrl: storageUrl } } = supabase.storage
                                    .from('documents')
                                    .getPublicUrl(filePath);

                                // Salva histórico no banco de dados real
                                supabase.from('user_documents').insert([{
                                    user_id: userId,
                                    title: selectedTemplate.title,
                                    form_data: formData,
                                    file_url: storageUrl,
                                    is_draft: false
                                }]).then();

                                // Notify user persistently
                                supabase.from('notifications').insert([{
                                    user_id: userId,
                                    type: 'docs',
                                    title: 'Documento Pronto! 📄',
                                    message: `O seu documento "${selectedTemplate.title}" foi gerado e guardado na sua nuvem MIRA.`,
                                    link: '/documentos'
                                }]).then();
                            } else {
                                console.error("Erro ao fazer upload para Storage:", uploadError);
                            }
                        });
                }
            });

            setGeneratedFile({
                save: (filename: string) => {
                    const finalName = filename.toLowerCase().endsWith('.pdf') ? filename : filename + '.pdf';
                    console.log("Forcing robust PDF download:", finalName);

                    try {
                        const link = document.createElement('a');
                        link.href = pdfResult.pdfUrl;
                        link.download = finalName;
                        link.target = '_blank'; // Prevenção para alguns browsers Mobile
                        document.body.appendChild(link);
                        link.click();

                        // Pequeno delay antes de remover o link da DOM
                        setTimeout(() => {
                            if (document.body.contains(link)) {
                                document.body.removeChild(link);
                            }
                        }, 100);
                    } catch (e) {
                        console.error("Link download failed, falling back to jspdf save", e);
                        pdfResult.doc.save(finalName);
                    }
                },
                filename: pdfResult.filename,
                isSync: true
            });

            // Adicionalmente salva no histórico local, caso usado por outros componentes
            addToHistory({
                id: Math.random().toString(36).substr(2, 9),
                title: selectedTemplate.title,
                category: selectedTemplate.category,
                date: new Date().toISOString(),
                fileUrl: pdfResult.pdfUrl
            });

            onEarnPoints(50);
            showToast("Documento gerado com sucesso!", "success");
            setActiveScreen('success');
        } catch (error: any) {
            console.error("Erro na geração de documento:", error);
            alert(`Erro ao gerar o documento: ${error?.message || 'Tente novamente'}.`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Função auxiliar para download ultra-robusto
    const handleDownload = () => {
        if (!generatedFile || !generatedFile.save) {
            alert('Ficheiro não encontrado. Por favor, gere o documento novamente.');
            return;
        }

        const filename = generatedFile.filename || 'documento_mira.pdf';
        generatedFile.save(filename);
    };

    return (
        <div className="h-full bg-white overflow-hidden flex flex-col no-scrollbar">
            {activeScreen === 'gallery' && (
                <div className="flex-1 overflow-y-auto no-scrollbar pb-32">

                    {/* SCROLLABLE TOP HEADER FOR BETTER MOBILE VIEWING */}
                    <div className="bg-white p-6 space-y-6 border-b border-slate-100 mb-6">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{t('docs_title', language)}</h2>
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                            {[{ id: 'guides', label: t('docs_tab_reg', language) }, { id: 'docs', label: t('docs_tab_docs', language) }].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>{tab.label}</button>
                            ))}
                        </div>

                        {activeTab === 'docs' && (
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="text" placeholder={t('docs_search_placeholder', language)} value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-mira-orange-pastel transition-all" />
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <select
                                            value={entityFilter}
                                            onChange={e => setEntityFilter(e.target.value)}
                                            className="w-full pl-4 pr-10 py-3 bg-slate-100 border-none rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-mira-orange-pastel"
                                        >
                                            <option value="Todos">{t('docs_all_entities', language) || "Todas as Entidades"}</option>
                                            {availableEntities.map(e => <option key={e} value={e}>{e}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                    <div className="relative flex-1">
                                        <select
                                            value={categoryFilter}
                                            onChange={e => setCategoryFilter(e.target.value)}
                                            className="w-full pl-4 pr-10 py-3 bg-slate-100 border-none rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-mira-orange-pastel"
                                        >
                                            <option value="Todos">{t('docs_categories', language) || "Categorias"}</option>
                                            {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <p className="text-[11px] text-center font-bold text-slate-500 mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed shadow-sm">
                                    Selecione um documento da lista abaixo, preencha os seus dados de forma rápida e baixe o formulário em <strong className="text-mira-orange">PDF preenchido e pronto a entregar</strong>.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                        {activeTab === 'docs' ? (
                            <div className="p-6 space-y-5">
                                {filteredItems.length > 0 ? filteredItems.map((item: any) => (
                                    <div key={item.id} onClick={() => { setSelectedTemplate(item); setFormData({}); setActiveScreen('form'); }} className="bg-white p-7 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-100/20 hover:border-mira-orange transition-all group cursor-pointer active:scale-[0.98] flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${item.category === CATEGORIES.IMMIGRATION ? 'bg-mira-blue' : 'bg-indigo-500'} text-white`}>
                                                    {item.category}
                                                </span>
                                                <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-md bg-slate-100 text-slate-400">
                                                    {item.authority || 'MIRA'}
                                                </span>
                                            </div>
                                            <div className={`p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-mira-orange-pastel group-hover:text-mira-orange transition-colors`}>
                                                <FileText size={20} />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-black text-slate-900 text-xl uppercase tracking-tight leading-tight group-hover:text-mira-orange transition-colors">
                                                {item.title}
                                            </h3>
                                            <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-2 leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Scale size={12} className="text-slate-300" />
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        {t(`complexity_${(item.complexity || 'Easy').toLowerCase()}`, language)}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-300 group-hover:text-mira-orange group-hover:translate-x-1 transition-all" size={20} />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                                        <FileText size={64} className="mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest">Nenhum documento encontrado</p>
                                    </div>
                                )}
                                <div className="mt-8 p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                                    <p className="text-[10px] text-red-800/70 font-bold leading-relaxed text-center italic">
                                        {t('general_disclaimer_note', language)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <RegularizationWizard
                                language={language}
                                onSelectTemplate={(id) => {
                                    const template = templates.find(t => t.id === id);
                                    if (template) {
                                        setSelectedTemplate(template);
                                        setFormData({});
                                        setActiveScreen('form');
                                    }
                                }}
                                onGoToDocs={() => setActiveTab('docs')}
                            />
                        )}
                    </div>
                </div>
            )}

            {activeScreen === 'form' && (
                <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 relative">
                    <div className="p-5 border-b flex items-center justify-between bg-white z-10">
                        <button onClick={() => setActiveScreen('gallery')} className="p-3 bg-slate-50 rounded-2xl shrink-0"><ArrowLeft size={20} /></button>
                        {/* Título com quebra de linha permitida e removido truncate */}
                        <h2 className="font-black text-sm uppercase tracking-tighter text-slate-800 text-center px-4 leading-tight break-words flex-1">
                            {selectedTemplate?.title}
                        </h2>
                        <div className="w-10 shrink-0"></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 no-scrollbar pb-10">
                        {selectedTemplate?.explanation && (
                            <div className="bg-mira-orange-pastel/30 p-5 md:p-7 rounded-[2rem] md:rounded-[2.5rem] border border-mira-orange/20 animate-in fade-in slide-in-from-top-4 duration-700">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-mira-orange text-white rounded-xl shadow-lg shadow-orange-100">
                                        <Info size={16} />
                                    </div>
                                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{t('doc_explanation_title', language)}</h4>
                                </div>
                                <p className="text-xs text-slate-700 font-black leading-relaxed">
                                    {(() => {
                                        const expl = t(selectedTemplate.explanation, language);
                                        return expl === selectedTemplate.explanation && expl.startsWith('expl_')
                                            ? selectedTemplate.description
                                            : expl;
                                    })()}
                                </p>
                            </div>
                        )}

                        <div className="bg-indigo-900 text-white p-5 md:p-6 rounded-[2rem] flex flex-col gap-4 shadow-xl">
                            <div className="flex items-start gap-4">
                                <FileSignature className="text-mira-yellow shrink-0 mt-1" size={24} />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">{t('doc_purpose', language)}</p>
                                    <p className="text-[11px] font-bold uppercase leading-relaxed">{selectedTemplate?.purpose || 'Documentação Oficial'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 border-t border-white/10 pt-4">
                                <Landmark className="text-mira-orange shrink-0 mt-1" size={24} />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">{t('doc_location', language)}</p>
                                    <p className="text-[11px] font-bold uppercase leading-relaxed">{selectedTemplate?.location || 'Balcão de Atendimento'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-5">
                            {selectedTemplate?.fields.map(f => (
                                <div key={f.id} className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        {t(`field_${f.id}`, language) !== `field_${f.id}` ? t(`field_${f.id}`, language) : f.label}
                                    </label>
                                    <input
                                        type={f.type}
                                        placeholder={t(`place_${f.id}`, language) !== `place_${f.id}` ? t(`place_${f.id}`, language) : f.placeholder}
                                        value={formData[f.id] || ''}
                                        onChange={e => setFormData({ ...formData, [f.id]: e.target.value })}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-mira-orange transition-all shadow-inner"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 pb-24 md:pb-6 space-y-6">
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                <p className="text-[9px] text-slate-500 font-bold leading-relaxed text-justify uppercase tracking-widest">
                                    As informações apresentadas nesta aplicação têm caráter informativo e educativo. O MIRA não presta consultoria jurídica individual. Para aconselhamento personalizado, consulte a AIMA, o CNAIM ou um advogado especializado.
                                </p>
                            </div>
                            <button onClick={generatePDF} disabled={isGenerating} className="w-full bg-slate-900 text-white py-5 md:py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Download size={24} strokeWidth={3} />}
                                {isGenerating ? t('docs_loading_pdf', language) : t('docs_generate_btn', language)}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {
                activeScreen === 'success' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-in">
                        <div className="w-24 h-24 bg-mira-green text-white rounded-full flex items-center justify-center mb-8 shadow-2xl animate-bounce"><CheckCircle2 size={56} /></div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{t('docs_ready', language)}</h2>
                        <p className="text-sm text-slate-500 font-bold mb-10 max-w-xs leading-relaxed uppercase">O seu documento oficial foi formatado respeitando as normas da AIMA.</p>
                        <div className="w-full max-w-xs space-y-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleDownload();
                                }}
                                className="w-full bg-slate-900 text-white py-5 rounded-[2.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl"
                            >
                                <Download size={20} /> {t('docs_download', language)}
                            </button>
                            <button onClick={() => setActiveScreen('gallery')} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">{t('docs_back', language)}</button>
                        </div>
                    </div>
                )
            }

            {
                activeScreen === 'guide_view' && selectedGuide && (
                    <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 bg-white">
                        <div className="p-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                            <button onClick={() => setActiveScreen('gallery')} className="p-3 bg-slate-50 rounded-2xl shrink-0"><ArrowLeft size={20} /></button>
                            <h2 className="font-black text-sm uppercase tracking-tighter text-slate-800 text-center px-4 leading-tight break-words flex-1">
                                {selectedGuide.title}
                            </h2>
                            <div className="w-10 shrink-0"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar pb-32">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-mira-blue text-white text-[8px] font-black uppercase tracking-widest rounded-md">{selectedGuide.category}</span>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-md">{selectedGuide.authority}</span>
                                </div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">{selectedGuide.explanation}</p>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-mira-orange pl-3">Documentos Necessários</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {selectedGuide.steps.map((step: any, idx: number) => (
                                        <div key={idx} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex gap-4 items-start">
                                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-mira-orange shadow-sm shrink-0 font-black text-xs">{idx + 1}</div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{step.docName}</p>
                                                <p className="text-[10px] text-slate-500 font-medium mt-1">{step.whereToGet}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedGuide.faq && (
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-mira-blue pl-3">Perguntas Frequentes</h3>
                                    <div className="space-y-4">
                                        {selectedGuide.faq.map((item: any, idx: number) => (
                                            <div key={idx} className="p-6 bg-blue-50/50 rounded-[2.5rem] border border-blue-100">
                                                <p className="text-[11px] font-black text-blue-900 uppercase tracking-tight mb-2">P: {item.q}</p>
                                                <p className="text-[11px] text-blue-700 font-medium leading-relaxed">R: {item.a}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-8 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[3rem] text-white space-y-4 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 bg-mira-orange rounded-2xl flex items-center justify-center shadow-lg"><Bot size={24} /></div>
                                    <p className="text-xs font-black uppercase tracking-widest">Ainda tem dúvidas?</p>
                                </div>
                                <p className="text-[11px] text-slate-300 font-medium leading-relaxed relative z-10">
                                    A burocracia pode ser complexa, mas o MIRA está aqui para ajudar a responder todas as suas dúvidas em tempo real.
                                </p>
                                <button
                                    onClick={() => onViewChange(ViewType.ASSISTANT)}
                                    className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all relative z-10"
                                >
                                    Falar com o MIRA agora
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
