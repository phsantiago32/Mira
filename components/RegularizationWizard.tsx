// src/components/RegularizationWizard.tsx
import React, { useState, useMemo } from "react";
import {
    ChevronRight, ArrowLeft, CheckCircle2, FileText, Info,
    Landmark, AlertCircle, Star, HelpCircle, Volume2, UserX, UserCheck, Briefcase, GraduationCap, Users
} from "lucide-react";
import { t } from "../utils/translations";
import { audioService } from "../services/audioService";
import { templates } from "../utils/documentsDatabase";
import { TranslatedText } from "./TranslatedText";

interface WizardProps {
    language: string;
    onSelectTemplate: (templateId: string) => void;
    onGoToDocs: () => void;
}

type SituationId = "legal" | "irregular" | "contract" | "student" | "family";
type OriginId = "cplp" | "eu" | "other";
type PurposeId = "art88" | "art89" | "art90a" | "art122" | "humanitarian";

const OFFICIAL_LINKS = {
    AIMA: "https://aima.gov.pt",
    GOV_PT_RESIDENCE: "https://www.gov.pt/pt/servicos/centros-nacionais-de-apoio-a-integracao-de-migrantes-cnaim-",
    DGES: "https://www.dges.gov.pt",
    SNS: "https://www.sns.gov.pt"
};

const TEMPLATE_META: Record<string, string> = {
    aima_ar_temp: "aima_ar_temp",
    aima_renewal: "aima_renewal",
    crue_req: "crue_req",
    nif_req: "nif_req",
    ss_niss: "ss_niss",
    aima_dec_sustento: "aima_dec_sustento",
    aima_dec_alojamento: "aima_dec_alojamento",
    aima_dec_responsabilidade: "aima_dec_responsabilidade",
    certidao_civil_req: "certidao_civil_req",
    work_contract_template: "work_contract_template",
    nomad_income_proof: "nomad_income_proof",
    aima_deferimento_tacito: "aima_deferimento_tacito",
    aima_audiencia_previa: "aima_audiencia_previa",
    promessa_trabalho_art88: "promessa_trabalho_art88",
    sef_declaracao_entrada: "sef_declaracao_entrada"
};

export const RegularizationWizard: React.FC<WizardProps> = ({ language, onSelectTemplate, onGoToDocs }) => {
    const [step, setStep] = useState<number>(1);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleAnswer = (key: string, value: string) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
        audioService.playClick();
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(prev => prev - 1);
            audioService.playClick();
        }
    };

    const resetWizard = () => {
        setStep(1);
        setAnswers({});
        audioService.playClick();
    };

    const getChecklist = useMemo(() => {
        const sit = answers.situation as SituationId | undefined;
        const origin = answers.origin as OriginId | undefined;
        const purpose = answers.purpose as PurposeId | undefined;

        const result = {
            title: t("wiz_fallback_title", language),
            desc: t("wiz_fallback_desc", language),
            steps: [
                t("wiz_fallback_step1", language),
                t("wiz_fallback_step2", language),
                t("wiz_fallback_step3", language)
            ],
            docs: ["nif_req", "ss_niss"],
            needsConsularVisa: false,
            needsAIMAAppointment: true,
            infoNote: ""
        };

        if (origin === "eu") {
            result.title = t("wiz_eu_title", language);
            result.desc = t("wiz_eu_desc", language);
            result.steps = [t("wiz_eu_step1", language), t("wiz_eu_step2", language), t("wiz_eu_step3", language)];
            result.docs = ["crue_req", "nif_req"];
            result.needsAIMAAppointment = false;
        } else if (purpose === "art88") {
            result.title = t("wiz_work_title", language);
            result.desc = t("wiz_work_desc", language);
            result.steps = [t("wiz_work_step1", language), t("wiz_work_step2", language), t("wiz_work_step3", language)];
            result.docs = ["promessa_trabalho_art88", "ss_niss", "sef_declaracao_entrada"];
            result.needsConsularVisa = (sit === "irregular");
        } else if (purpose === "art89") {
            result.title = t("wiz_work_title", language);
            result.desc = t("wiz_work_desc", language);
            result.steps = [t("wiz_work_step1", language), t("wiz_work_step2", language), t("wiz_work_step3", language)];
            result.docs = ["nif_req", "ss_niss"];
            result.needsConsularVisa = (sit === "irregular");
        } else if (sit === "irregular") {
            result.title = t("wiz_fallback_title", language);
            result.desc = t("wiz_fallback_desc", language);
            result.steps = [t("wiz_fallback_step1", language), t("wiz_fallback_step2", language), t("wiz_fallback_step3", language)];
            result.docs = ["nif_req", "ss_niss"];
            result.needsConsularVisa = true;
        } else if (purpose === "art90a") {
            result.title = t("wiz_nomad_title", language);
            result.desc = t("wiz_nomad_desc", language);
            result.steps = [t("wiz_nomad_step1", language), t("wiz_nomad_step2", language), t("wiz_nomad_step3", language)];
            result.docs = ["nomad_income_proof", "nif_req"];
        } else if (purpose === "art122" || sit === "family") {
            result.title = t("wiz_family_title", language);
            result.desc = t("wiz_family_desc", language);
            result.steps = [t("wiz_family_step1", language), t("wiz_family_step2", language), t("wiz_family_step3", language)];
            result.docs = ["aima_dec_responsabilidade", "aima_dec_alojamento", "certidao_civil_req"];
        } else if (purpose === "humanitarian") {
            result.title = t("wiz_fallback_title", language); // Or specific humanitarian keys if added
            result.desc = "Regime de asilo e proteção especial.";
            result.steps = ["Dirigir-se ao CPR ou balcão de Asilo da AIMA", "Pedir NISS e apoio social"];
            result.docs = ["ss_niss"];
        }

        // Tactical additions
        if (sit === "contract" || sit === "student") {
            if (!result.docs.includes("aima_deferimento_tacito")) {
                result.docs.push("aima_deferimento_tacito");
            }
        }

        if (!result.docs.includes("aima_audiencia_previa")) {
            result.docs.push("aima_audiencia_previa");
        }

        return result;
    }, [answers, language]);

    const getTemplateName = (id: string) => {
        const key = TEMPLATE_META[id] || id;
        return t(key, language);
    };

    const renderStep1 = () => (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                    {t("wizard_step0_q", language)}
                </h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                    {t("wizard_step0_h", language)}
                </p>
            </div>
            <div className="grid gap-3">
                {[
                    { id: 'legal', label: t("wiz_sit_legal", language), icon: <UserCheck className="text-green-500" /> },
                    { id: 'irregular', label: t("wiz_sit_irregular", language), icon: <UserX className="text-red-500" /> },
                    { id: 'contract', label: t("wiz_sit_contract", language), icon: <Briefcase className="text-blue-500" /> },
                    { id: 'student', label: t("wiz_sit_student", language), icon: <GraduationCap className="text-mira-orange" /> },
                    { id: 'family', label: t("wiz_sit_family", language), icon: <Users className="text-pink-500" /> }
                ].map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => handleAnswer('situation', opt.id)}
                        className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-mira-orange hover:bg-white transition-all text-left group"
                    >
                        <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">{opt.icon}</div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <button onClick={handleBack} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-mira-orange transition-colors">
                <ArrowLeft size={14} /> {t('back', language) || 'Voltar'}
            </button>
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
                        className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-mira-orange hover:bg-white transition-all text-left group"
                    >
                        <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">{opt.icon}</div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <button onClick={handleBack} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-mira-orange transition-colors">
                <ArrowLeft size={14} /> {t('back', language) || 'Voltar'}
            </button>
            <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                    {t("wizard_step3_q", language)}
                </h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                    {t("wizard_step3_h", language)}
                </p>
            </div>
            <div className="grid gap-3">
                {[
                    { id: 'art88', label: t("wiz_purp_art88", language), icon: <CheckCircle2 className="text-green-500" /> },
                    { id: 'art89', label: t("wiz_purp_art89", language), icon: <CheckCircle2 className="text-blue-500" /> },
                    { id: 'art90a', label: t("wiz_purp_art90a", language), icon: <CheckCircle2 className="text-purple-500" /> },
                    { id: 'art122', label: t("wiz_purp_art122", language), icon: <CheckCircle2 className="text-pink-500" /> },
                    { id: 'humanitarian', label: t("wiz_purp_humanitarian", language), icon: <HelpCircle className="text-slate-400" /> }
                ].map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => handleAnswer('purpose', opt.id)}
                        className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-mira-orange hover:bg-white transition-all text-left group"
                    >
                        <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">{opt.icon}</div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

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
                        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-[1.5rem]">
                            <p className="text-[11px] text-white font-bold leading-relaxed flex items-start gap-3">
                                <Info className="text-mira-orange mt-0.5 shrink-0" size={16} />
                                {checklist.infoNote}
                            </p>
                        </div>
                    )}
                    {checklist.needsConsularVisa && (
                        <div className="mt-4 p-4 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-[1.5rem] flex gap-3 items-start">
                            <AlertCircle className="mt-0.5 shrink-0" size={16} />
                            <span className="text-[11px] font-bold leading-relaxed">
                                {t('wizard_consular_visa_alert', language)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
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
                                            {getTemplateName(docId)}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-mira-blue transition-colors shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={resetWizard}
                    className="w-full py-5 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-mira-orange hover:text-mira-orange transition-all"
                >
                    {t('wizard_reset', language)}
                </button>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-8 pb-32">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderResult()}
            </div>
            {/* Footer note */}
            <div className="p-4 bg-white border-t text-[11px] text-slate-500 flex flex-col gap-3">
                <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-100">
                    <p className="text-[9px] font-bold leading-relaxed text-center italic">
                        {t('general_disclaimer_note', language)}
                    </p>
                </div>
                <div>
                    <p>
                        <strong>{t('wizard_footer_note_label', language)}</strong> {t('wizard_footer_note_text', language)}
                    </p>
                </div>
            </div>
        </div>
    );
};
