
// src/components/RegularizationWizard.tsx
import React, { useState, useMemo } from "react";
import {
    ChevronRight, ArrowLeft, CheckCircle2, FileText, Info,
    Landmark, AlertCircle, BookOpen, Star, HelpCircle
} from "lucide-react";
import { t } from "../utils/translations";
import { templates } from "../utils/documentsDatabase";

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
        // default fallback
        const result = {
            title: "Regularização em Portugal",
            desc: "Siga os passos e preencha os modelos recomendados no MIRA.",
            steps: [] as string[],
            docs: [] as string[],
            needsConsularVisa: false,
            needsAIMAAppointment: false,
            infoNote: ""
        };

        // EU/EEE/SWISS (CRUE)
        if (origin === "eu") {
            result.title = "Certificado de Registo (CRUE) — Cidadãos UE/EEE/Suíça";
            result.desc = "Se permanecer mais de 90 dias, registe-se na Câmara Municipal (CRUE).";
            result.steps = [
                "Verificar documentação pessoal (passaporte/BI).",
                "Obter comprovativo de morada (renda, declaração do senhorio ou fatura).",
                "Solicitar CRUE na Câmara Municipal (agendamento possível)."
            ];
            result.docs = ["crue_req", "nif_req", "aima_dec_alojamento"];
            result.needsConsularVisa = false;
            result.needsAIMAAppointment = false;
            result.infoNote = `EU citizens: register at municipality after 90 days. See official guidance: ${OFFICIAL_LINKS.GOV_PT_RESIDENCE}`;
            return result;
        }

        // CPLP (procedimentos específicos)
        if (origin === "cplp") {
            result.title = "Autorização CPLP (procedimento AIMA)";
            result.desc = "Cidadãos CPLP seguem vias específicas; muitos casos exigem visto consular e agendamento na AIMA.";
            result.steps = [
                "Confirmar necessidade de visto consular no Consulado português no país de origem.",
                "Preparar documentação: passaporte, certificado criminal, comprovativo de meios, fotos, comprovativo de alojamento.",
                "Agendar atendimento na AIMA / CNAIM para entrega e formalização do pedido."
            ];
            result.docs = ["nif_req", "ss_niss", "aima_dec_alojamento", "aima_dec_sustento"];
            result.needsConsularVisa = true;
            result.needsAIMAAppointment = true;
            result.infoNote = `CPLP route often requires visa + AIMA in-person appointment. Verify specific list at AIMA portal: ${OFFICIAL_LINKS.AIMA}`;
            return result;
        }

        // Other (non-EU, non-CPLP) - branch by purpose
        if (purpose === "work") {
            result.title = "Regularização via Trabalho (Autorização de Residência)";
            result.desc = "Muitas autorizações baseadas em oferta/trabalho exigem contrato e visto consular (se aplicável).";
            result.steps = [
                "Obter promessa ou contrato de trabalho (ou oferta formal).",
                "Solicitar visto consular de trabalho no Consulado português (se ainda fora do país).",
                "Inscrever-se na Segurança Social (NISS) e obter NIF; agendar atendimento AIMA para pedido de AR."
            ];
            result.docs = ["work_contract_template", "ss_niss", "nif_req", "aima_ar_temp"];
            // if user is already in country without visa, must check irregularity rules
            result.needsConsularVisa = answers['enteredWithVisa'] === 'no' ? false : true;
            result.needsAIMAAppointment = true;
            result.infoNote = `Work permits often require a job offer and sometimes a consular visa. AIMA requires complete documentation at presentation.`;
            return result;
        }

        if (purpose === "family") {
            result.title = "Reagrupamento Familiar / Family Reunification";
            result.desc = "Processo com prova de laços, condições de alojamento e sustentabilidade. Regras de prazo podem variar.";
            result.steps = [
                "Reunir certidões de parentesco/estado civil legalizadas e traduzidas.",
                "Preparar declaração de responsabilidade e comprovativos de alojamento e meios.",
                "Submeter pedido no AIMA (ou consulado, se aplicável); possíveis prazos de residência exigidos."
            ];
            result.docs = ["aima_dec_responsabilidade", "aima_dec_alojamento", "certidao_civil_req"];
            result.needsConsularVisa = true;
            result.needsAIMAAppointment = true;
            result.infoNote = `Family reunification rules changed recently in Portugal — check latest AIMA guidance before applying.`;
            return result;
        }

        if (purpose === "study") {
            result.title = "Autorização de Residência para Estudo";
            result.desc = "Matrícula em estabelecimento de ensino, seguro de saúde e comprovativo de meios são essenciais.";
            result.steps = [
                "Confirmar inscrição/matrícula na instituição de ensino (carta de aceitação).",
                "Garantir seguro de saúde e comprovativos de meios financeiros.",
                "Pedir visto de estudante no consulado (se fora do país) e agendar AIMA para formalizar a AR."
            ];
            result.docs = ["nif_req", "aima_dec_sustento", "certidao_civil_req"];
            result.needsConsularVisa = true;
            result.needsAIMAAppointment = true;
            result.infoNote = `Student visas require enrollment letter + proof of means; check DGES for recognition of qualifications.`;
            return result;
        }

        if (purpose === "nomad") {
            result.title = "Residência por Rendimentos / Digital Nomad";
            result.desc = "Regimes para trabalhadores remotos exigem prova de rendimento mínimo (variável por ano).";
            result.steps = [
                "Comprovar rendimentos regulares (extratos, contratos, faturas).",
                "Solicitar visto específico do regime (D8/Digital Nomad ou outro aplicável).",
                "Após entrada, agendar AIMA para formalização do título de residência."
            ];
            result.docs = ["nomad_income_proof", "nif_req", "aima_ar_temp"];
            result.needsConsularVisa = true;
            result.needsAIMAAppointment = true;
            result.infoNote = `Digital nomad regimes typically require income proof (approx. €3.6k/month in 2026). Verify exact thresholds and documentary requirements.`;
            return result;
        }

        // fallback generic
        result.title = "Caminho Padrão para Autorização de Residência";
        result.desc = "Opção padrão: confirmar situação, preparar comprovativos de meios e agendar AIMA.";
        result.steps = [
            "Reunir documentos pessoais (passaporte, fotos, comprovativo de morada).",
            "Obter NIF e NISS conforme necessário.",
            "Agendar atendimento na AIMA / CNAIM para submissão."
        ];
        result.docs = ["nif_req", "ss_niss", "aima_ar_temp"];
        result.needsConsularVisa = false;
        result.needsAIMAAppointment = true;
        result.infoNote = `AIMA exige documentação completa no momento de apresentação; use o MIRA para preencher os modelos oficiais antes de agendar.`;
        return result;
    }, [answers]);

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
                    { id: 'cplp', label: 'CPLP (Brasil, Angola, Cabo Verde, etc)', icon: <Landmark className="text-mira-orange" /> },
                    { id: 'eu', label: 'União Europeia / EEE / Suíça', icon: <Landmark className="text-blue-500" /> },
                    { id: 'other', label: 'Resto do Mundo (visto consular / AR)', icon: <Landmark className="text-slate-400" /> }
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
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">2. {t('wizard_step2_q', language) || 'Qual o seu objetivo em Portugal?'}</h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{t('wizard_step2_h', language) || 'O motivo da estada dita os documentos necessários.'}</p>
            </div>
            <div className="grid gap-3">
                {[
                    { id: 'work', label: 'Trabalho (Subordinado ou Recibos)', icon: <CheckCircle2 className="text-green-500" /> },
                    { id: 'family', label: 'Reagrupamento Familiar', icon: <CheckCircle2 className="text-pink-500" /> },
                    { id: 'study', label: 'Estudo ou Investigação', icon: <CheckCircle2 className="text-mira-blue" /> },
                    { id: 'nomad', label: 'Nómada Digital / Rendimentos Próprios', icon: <CheckCircle2 className="text-purple-500" /> },
                    { id: 'other', label: 'Outro / Regularização Geral', icon: <HelpCircle className="text-slate-400" /> }
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
                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none mb-4">Plano MIRA</h2>
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
                            <AlertCircle /> <span className="text-xs font-bold">Attention: This route often requires a consular visa before travel — check AIMA/Consulate guidance.</span>
                        </div>
                    )}
                </div>

                <div className="space-y-6" aria-live="polite">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-mira-orange pl-3">Passos Obrigatórios</h3>
                    <div className="grid gap-3">
                        {checklist.steps.map((s, i) => (
                            <div key={i} className="flex gap-4 items-start p-5 bg-slate-50 rounded-3xl border border-slate-100/50">
                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-mira-orange shadow-sm shrink-0 border border-slate-100">{i + 1}</div>
                                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight leading-normal">{s}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-mira-blue pl-3">Minutas Recomendadas</h3>
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
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Ver Modelo e Preencher</span>
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

                <div className="flex gap-3">
                    <button
                        onClick={() => setNoteAccepted(true)}
                        className="flex-1 py-4 rounded-2xl bg-mira-orange text-white font-black uppercase text-[11px]"
                    >
                        {t('wizard_continue', language) || 'Continuar'}
                    </button>
                    <button
                        onClick={onGoToDocs}
                        className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-black uppercase text-[11px]"
                    >
                        {t('open_documents', language) || 'Abrir Documentos'}
                    </button>
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
                    <strong>Nota:</strong> {`As regras podem mudar. Consulte sempre os órgãos oficiais (AIMA / Câmara / Segurança Social).`}
                </p>
                <p className="mt-2">
                    <a href={OFFICIAL_LINKS.AIMA} target="_blank" rel="noreferrer" className="text-mira-blue underline">AIMA — Informações Oficiais</a> · <a href={OFFICIAL_LINKS.GOV_PT_RESIDENCE} target="_blank" rel="noreferrer" className="text-mira-blue underline">Gov.pt — Residência</a>
                </p>
            </div>
        </div>
    );
};
