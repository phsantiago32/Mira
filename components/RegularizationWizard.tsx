
// src/components/RegularizationWizard.tsx
import React, { useState, useMemo } from "react";
import {
    ChevronRight, ArrowLeft, CheckCircle2, FileText, Info,
    Landmark, AlertCircle, BookOpen, Star, HelpCircle, Volume2
} from "lucide-react";
import { t } from "../utils/translations";
import { audioService } from "../services/audioService";
import { templates } from "../utils/documentsDatabase";
import { TranslatedText } from "./TranslatedText";

/**
 * RegularizationWizard
 * - Atualizado em 2026: inclui direções corretas (AIMA, CRUE, vistos consulares, D.Nomad, Reagrupamento, Trabalho, Estudo)
 * - Saídas:
 *    - checklist.steps (texto)
 *    - checklist.docs (IDs de template)
 *    - flags (needsConsularVisa, needsAIMAAppointment)
 *
 * IMPORTANTE: os IDs dos templates devem existir em ../utils/documentsDatabase
 */

interface WizardProps {
    language: string;
    onSelectTemplate: (templateId: string) => void;
    onGoToDocs: () => void;
}

type OriginId = "cplp" | "eu" | "other";
type PurposeId = "work" | "family" | "study" | "nomad" | "other";

const OFFICIAL_LINKS = {
    AIMA: "https://aima.gov.pt",
    GOV_PT_RESIDENCE: "https://www.gov.pt/pt/servicos/centros-nacionais-de-apoio-a-integracao-de-migrantes-cnaim-",
    DGES: "https://www.dges.gov.pt",
    SNS: "https://www.sns.gov.pt"
};

// Mapeamento de templates (IDs devem bater com documentsDatabase)
// Ajusta esses IDs conforme teu banco de templates
const TEMPLATE_META: Record<string, string> = {
    aima_ar_temp: "Autorização de Residência - Pedido Inicial (AIMA)",
    aima_renewal: "Pedido de Renovação de AR (AIMA)",
    crue_req: "Registo de Cidadão UE (CRUE) - Formulário Câmara",
    nif_req: "Pedido de NIF (Finanças)",
    ss_niss: "Pedido de NISS (Segurança Social)",
    aima_dec_sustento: "Declaração de Sustento (AIMA)",
    aima_dec_alojamento: "Declaração de Alojamento (Proprietário)",
    aima_dec_responsabilidade: "Declaração de Responsabilidade (Reagrupamento)",
    certidao_civil_req: "Requerimento de Certidão Civil (IRN)",
    work_contract_template: "Modelo de Contrato/Proposta de Emprego",
    nomad_income_proof: "Comprovativo de Rendimentos / Declaração"
};

export const RegularizationWizard: React.FC<WizardProps> = ({ language, onSelectTemplate, onGoToDocs }) => {
    const [step, setStep] = useState<number>(1);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [noteAccepted, setNoteAccepted] = useState<boolean>(false);

    const handleAnswer = (key: string, value: string) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
        setStep(prev => Math.min(prev + 1, 3));
    };

    const resetWizard = () => {
        setStep(1);
        setAnswers({});
        setNoteAccepted(false);
    };

    // lógica para gerar checklist - mais detalhada e com flags
    const getChecklist = useMemo(() => {
        const origin = answers.origin as OriginId | undefined;
        const purpose = answers.purpose as PurposeId | undefined;

        const result = {
            title: t('wiz_fallback_title', language),
            desc: t('wiz_fallback_desc', language),
            steps: [
                t('wiz_fallback_step1', language),
                t('wiz_fallback_step2', language),
                t('wiz_fallback_step3', language)
            ],
            docs: ["nif_req", "ss_niss", "aima_ar_temp"],
            needsConsularVisa: false,
            needsAIMAAppointment: true,
            infoNote: t('wiz_fallback_info', language)
        };

        if (origin === "eu") {
            result.title = t('wiz_eu_title', language);
            result.desc = t('wiz_eu_desc', language);
            result.steps = [
                t('wiz_eu_step1', language),
                t('wiz_eu_step2', language),
                t('wiz_eu_step3', language)
            ];
            result.docs = ["crue_req", "nif_req", "aima_dec_alojamento"];
            result.needsConsularVisa = false;
            result.needsAIMAAppointment = false;
            result.infoNote = t('wiz_eu_info', language);
            return result;
        }

        if (origin === "cplp") {
            result.title = t('wiz_cplp_title', language);
            result.desc = t('wiz_cplp_desc', language);
            result.steps = [
                t('wiz_cplp_step1', language),
                t('wiz_cplp_step2', language),
                t('wiz_cplp_step3', language)
            ];
            result.docs = ["nif_req", "ss_niss", "aima_dec_alojamento", "aima_dec_sustento"];
            result.needsConsularVisa = true;
            result.needsAIMAAppointment = true;
            result.infoNote = t('wiz_cplp_info', language);
            return result;
        }

        if (purpose === "work") {
            result.title = t('wiz_work_title', language);
            result.desc = t('wiz_work_desc', language);
            result.steps = [
                t('wiz_work_step1', language),
                t('wiz_work_step2', language),
                t('wiz_work_step3', language)
            ];
            result.docs = ["work_contract_template", "ss_niss", "nif_req", "aima_ar_temp"];
            result.needsConsularVisa = answers['enteredWithVisa'] === 'no' ? false : true;
            result.needsAIMAAppointment = true;
            result.infoNote = t('wiz_work_info', language);
            return result;
        }

        if (purpose === "family") {
            result.title = t('wiz_family_title', language);
            result.desc = t('wiz_family_desc', language);
            result.steps = [
                t('wiz_family_step1', language),
                t('wiz_family_step2', language),
                t('wiz_family_step3', language)
            ];
            result.docs = ["aima_dec_responsabilidade", "aima_dec_alojamento", "certidao_civil_req"];
            result.needsConsularVisa = true;
            result.needsAIMAAppointment = true;
            result.infoNote = t('wiz_family_info', language);
            return result;
        }

        if (purpose === "study") {
            result.title = t('wiz_study_title', language);
            result.desc = t('wiz_study_desc', language);
            result.steps = [
                t('wiz_study_step1', language),
                t('wiz_study_step2', language),
                t('wiz_study_step3', language)
            ];
            result.docs = ["nif_req", "aima_dec_sustento", "certidao_civil_req"];
            result.needsConsularVisa = true;
            result.needsAIMAAppointment = true;
            result.infoNote = t('wiz_study_info', language);
            return result;
        }

        if (purpose === "nomad") {
            result.title = t('wiz_nomad_title', language);
            result.desc = t('wiz_nomad_desc', language);
            result.steps = [
                t('wiz_nomad_step1', language),
                t('wiz_nomad_step2', language),
                t('wiz_nomad_step3', language)
            ];
            result.docs = ["nomad_income_proof", "nif_req", "aima_ar_temp"];
            result.needsConsularVisa = true;
            result.needsAIMAAppointment = true;
            result.infoNote = t('wiz_nomad_info', language);
            return result;
        }

        return result;
    }, [answers, language]);

    // Helper: obter nome do template
    const getTemplateName = (id: string) => {
        if (TEMPLATE_META[id]) return TEMPLATE_META[id];
        const found = templates.find((t: any) => t.id === id);
        return found ? found.title : id;
    };

    // Render Step 1 (Origin)
    const renderStep1 = () => (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{t('wizard_step1_q', language)}</h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{t('wizard_step1_h', language)}</p>
            </div>
            <div className="grid gap-3">
                {[
                    { id: 'cplp', label: t('wizard_step1_cplp', language), icon: <Landmark className="text-mira-orange" /> },
                    { id: 'eu', label: t('wizard_step1_eu', language), icon: <Landmark className="text-blue-500" /> },
                    { id: 'other', label: t('wizard_step1_other', language), icon: <Landmark className="text-slate-400" /> }
                ].map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => handleAnswer('origin', opt.id)}
                        aria-label={opt.label}
                        className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-mira-orange hover:bg-white transition-all text-left group"
                    >
                        <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">{opt.icon}</div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    // Render Step 2 (Purpose)
    const renderStep2 = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-mira-orange transition-colors">
                <ArrowLeft size={14} /> {t('back', language) || 'Voltar'}
            </button>
            <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{t('wizard_step2_q', language)}</h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{t('wizard_step2_h', language)}</p>
            </div>
            <div className="grid gap-3">
                {[
                    { id: 'work', label: t('wizard_step2_work', language), icon: <CheckCircle2 className="text-green-500" /> },
                    { id: 'family', label: t('wizard_step2_family', language), icon: <CheckCircle2 className="text-pink-500" /> },
                    { id: 'study', label: t('wizard_step2_study', language), icon: <CheckCircle2 className="text-mira-blue" /> },
                    { id: 'nomad', label: t('wizard_step2_nomad', language), icon: <CheckCircle2 className="text-purple-500" /> },
                    { id: 'other', label: t('wizard_step2_other', language), icon: <HelpCircle className="text-slate-400" /> }
                ].map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => handleAnswer('purpose', opt.id)}
                        aria-label={opt.label}
                        className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-mira-orange hover:bg-white transition-all text-left group"
                    >
                        <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">{opt.icon}</div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    // Render Step 3 (Result & Checklist)
    const renderResult = () => {
        const checklist = getChecklist;
        return (
            <div className="space-y-8 animate-in zoom-in duration-500">
                <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-mira-orange/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <Star className="text-mira-orange mb-4" size={32} fill="currentColor" />
                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none mb-4">{t('wizard_plan_title', language)}</h2>
                    <div className="inline-block px-4 py-2 bg-white/10 rounded-xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">{checklist.title}</p>
                    </div>
                    <p className="mt-6 text-[11px] text-slate-300 font-bold uppercase leading-relaxed">{checklist.desc}</p>
                    {checklist.infoNote && (
                        <p className="mt-3 text-[10px] text-slate-300">
                            <Info className="inline mr-2" /> {checklist.infoNote}
                        </p>
                    )}
                    {checklist.needsConsularVisa && (
                        <div className="mt-3 p-3 bg-yellow-50 text-yellow-800 rounded-xl flex gap-3 items-center">
                            <AlertCircle /> <span className="text-xs font-bold">{t('wizard_consular_visa_alert', language)}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-6" aria-live="polite">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-mira-orange pl-3">{t('wizard_mandatory_steps_title', language)}</h3>
                    <div className="grid gap-3">
                        {checklist.steps.map((s, i) => (
                            <div key={i} className="flex gap-4 items-start p-5 bg-slate-50 rounded-3xl border border-slate-100/50 group">
                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-mira-orange shadow-sm shrink-0 border border-slate-100">{i + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight leading-normal">
                                            {s}
                                        </p>
                                        <button
                                            onClick={() => audioService.speak(s, language)}
                                            className="p-2 bg-white text-slate-300 rounded-xl hover:text-mira-orange hover:shadow-sm transition-all active:scale-90"
                                            title={t('listen_instruction', language)}
                                        >
                                            <Volume2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-mira-blue pl-3">{t('wizard_recommended_templates_title', language)}</h3>
                    <div className="grid gap-3">
                        {checklist.docs.map(docId => (
                            <button
                                key={docId}
                                onClick={() => onSelectTemplate(docId)}
                                className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[2.5rem] hover:border-mira-blue hover:shadow-lg transition-all shadow-sm group text-left"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="p-3 bg-blue-50 text-mira-blue rounded-2xl group-hover:bg-mira-blue group-hover:text-white transition-colors shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t('wizard_view_fill_template', language)}</span>
                                        <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-tight truncate leading-tight group-hover:text-mira-blue transition-colors">
                                            <TranslatedText text={getTemplateName(docId)} language={language} />
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-mira-blue transition-colors shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    {/* Botões remover conforme pedido do usuário */}
                </div>

                <button
                    onClick={resetWizard}
                    className="w-full py-5 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-mira-orange hover:text-mira-orange transition-all"
                >
                    {t('wizard_reset', language) || 'Refazer Diagnóstico'}
                </button>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-8 pb-32">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderResult()}
            </div>
            {/* Footer note: short official guidance + links */}
            <div className="p-4 bg-white border-t text-[11px] text-slate-500">
                <p>
                    <strong>{t('wizard_footer_note_label', language) || 'Nota:'}</strong> {t('wizard_footer_note_text', language)}
                </p>
                <p className="mt-2">
                    <a href={OFFICIAL_LINKS.AIMA} target="_blank" rel="noreferrer" className="text-mira-blue underline">{t('link_aima_info', language)}</a> · <a href={OFFICIAL_LINKS.GOV_PT_RESIDENCE} target="_blank" rel="noreferrer" className="text-mira-blue underline">{t('link_gov_residence', language)}</a>
                </p>
            </div>
        </div>
    );
};
