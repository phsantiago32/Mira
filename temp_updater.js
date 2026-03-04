const fs = require('fs');

const file = 'c:/Users/AmandaAbreu/mira/utils/translations.ts';
let content = fs.readFileSync(file, 'utf8');

const updates = {
    pt: {
        wiz_fallback_title: "Vias de Exceção (Fim Manifestação Interesse)",
        wiz_fallback_desc: "Atenção: A Manifestação de Interesse foi extinta. A legalização sem visto prévio é agora muito restrita.",
        wiz_fallback_step1: "Para trabalho legal agora é obrigatório Visto Consular válido (trabalho ou CPLP).",
        wiz_fallback_step2: "Exceções possíveis: Reagrupamento Familiar ou Casos Humanitários e de força maior (Art. 122).",
        wiz_fallback_step3: "Recomendamos consultar o CNAIM ou um advogado especializado para análise de exceção."
    },
    en: {
        wiz_fallback_title: "Exceptional Visas (End of Manifestation of Interest)",
        wiz_fallback_desc: "Warning: The Manifestation of Interest procedure was abolished. Legalization without a prior visa is now strictly limited.",
        wiz_fallback_step1: "For legal work, a valid Consular Visa (work or CPLP) is now mandatory.",
        wiz_fallback_step2: "Possible exceptions: Family Reunification or Humanitarian/force majeure cases (Art. 122).",
        wiz_fallback_step3: "We strongly recommend consulting CNAIM or a specialized lawyer to analyze exceptional cases."
    },
    es: {
        wiz_fallback_title: "Vías de Excepción (Fin Manifestación Interés)",
        wiz_fallback_desc: "Atención: La Manifestación de Interés fue abolida. La legalización sin visa previa ahora es muy restringida.",
        wiz_fallback_step1: "Para trabajo legal ahora es obligatorio un Visado Consular válido (trabajo o CPLP).",
        wiz_fallback_step2: "Excepciones posibles: Reagrupación Familiar o Casos Humanitarios y fuerza mayor (Art. 122).",
        wiz_fallback_step3: "Recomendamos consultar al CNAIM o a un abogado especializado para análisis de excepción."
    },
    fr: {
        wiz_fallback_title: "Voies d'Exception (Fin Manifestation d'Intérêt)",
        wiz_fallback_desc: "Attention: La Manifestation d'Intérêt a été abolie. La légalisation sans visa préalable est très restreinte.",
        wiz_fallback_step1: "Pour le travail légal, un Visa Consulaire valide (travail ou CPLP) est obligatoire.",
        wiz_fallback_step2: "Exceptions possibles: Regroupement Familial ou Cas Humanitaires (Art. 122).",
        wiz_fallback_step3: "Nous recommandons de consulter le CNAIM ou un avocat spécialisé pour analyser l'exception."
    }
};

let i = 0;
for (const [lang, translations] of Object.entries(updates)) {
    for (const [key, value] of Object.entries(translations)) {
        // Escaping regex specific things, replacing value
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`${escapedKey}:\\s*["'][^"']*["']`, 'g');
        content = content.replace(regex, `${key}: "${value}"`);
    }
}

fs.writeFileSync(file, content);
console.log('Translations updated.');
