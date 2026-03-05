import { OFFICIAL_SOURCES } from '../constants';
import { UNIFIED_CATEGORIES } from '../types';
import { supabase } from '../lib/supabase';
import { adminService } from './adminService';

const AI_CACHE: Record<string, any> = {};

export const generateAssistantResponse = async (prompt: string, history: { role: string, parts: { text: string }[] }[] = [], communityContext?: string, language: string = 'PT') => {
  const cacheKey = `chat_${language}_${prompt}_${JSON.stringify(history.slice(-2))}`;
  if (AI_CACHE[cacheKey]) return AI_CACHE[cacheKey];

  const languageNames: Record<string, string> = {
    'PT': 'Português',
    'EN': 'English',
    'ES': 'Español',
    'FR': 'Français'
  };

  try {
    const APP_MODULES_CONTEXT = `
      ESTRUTURA DO APP MIRA (Caminhos para sugerir ao usuário):
      - INÍCIO/HOME: Mural, Sugestões, Alertas.
      - COMUNIDADE: Fórum, Posts, Troca de experiências.
      - VAGAS: Ofertas de emprego e busca.
      - MAPA: Serviços locais (AIMA, SNS, Segurança Social, Finanças).
      - DOCS/DOCUMENTOS: Assistente de preenchimento de documentos e modelos.
      - ESTUDOS/LEARNING: Cursos e guias de integração.
      - PERFIL: Configurações, selos e reputação.
    `;

    const knowledge = await adminService.fetchAIKnowledge();
    const additionalKnowledge = knowledge && knowledge.length > 0 ? JSON.stringify(knowledge) : '';

    try {
      const { data, error } = await supabase.functions.invoke('gemini-assistant', {
        body: {
          action: 'generateAssistantResponse',
          payload: {
            prompt,
            history,
            communityContext: `${communityContext || ''}\n${APP_MODULES_CONTEXT}\nCONHECIMENTO ADICIONAL ADMIN:\n${additionalKnowledge}`,
            language,
            OFFICIAL_SOURCES,
            UNIFIED_CATEGORIES,
            languageNames
          }
        }
      });

      if (error) throw new Error(error.message);
      if (data && data.text) {
        AI_CACHE[cacheKey] = data;
        return data;
      }

      throw new Error("No text returned from Gemini Assistant Edge Function");
    } catch (edgeError) {
      console.error("Gemini Edge Function Error:", edgeError);
      throw edgeError;
    }

  } catch (error) {
    console.error("Gemini Error:", error);
    const errorMsgs: Record<string, string> = {
      'PT': "Olá! O motor Gemini está temporariamente ocupado ou sem chave válida. Por favor, tente novamente em instantes.",
      'EN': "Hello! The Gemini engine is temporarily busy. Please try again in a few moments.",
      'ES': "¡Lo siento, mi sistema tropezó! Como tu amigo MIRA, te pido que vuelvas a preguntar en unos instantes.",
      'FR': "Désolé, mon sistema a trébuché ! En tant que votre ami MIRA, je vous demande de redemander dans quelques instants."
    };
    return { text: errorMsgs[language] || errorMsgs['PT'], category: "Comunidade & Solidariedade" };
  }
};

export const generateSpeech = async (text: string, language: string = 'PT') => {
  const voiceMap: Record<string, string> = {
    'PT': 'Fenrir',
    'EN': 'Puck',
    'ES': 'Charon',
    'FR': 'Kore'
  };

  try {
    const { data, error } = await supabase.functions.invoke('gemini-assistant', {
      body: {
        action: 'generateSpeech',
        payload: { text, language, voiceMap }
      }
    });

    if (error) throw new Error(error.message);
    return data?.audio;

  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

const TRANSLATION_CACHE: Record<string, string> = {};

export const autoTranslateText = async (text: string, targetLanguage: string): Promise<string> => {
  if (!text || !text.trim()) return text;

  const cacheKey = `trans_${targetLanguage}_${text}`;
  if (TRANSLATION_CACHE[cacheKey]) return TRANSLATION_CACHE[cacheKey];

  const langKey = targetLanguage.toUpperCase();
  const languageNames: Record<string, string> = {
    'PT': 'Português de Portugal',
    'EN': 'English',
    'ES': 'Español',
    'FR': 'Français'
  };

  const targetLangName = languageNames[langKey] || langKey;

  try {
    // Attempt 1: Highly reliable public Google Translate API (No API key needed)
    // This solves the issue if Gemini key is missing, rate-limited, or dev server hasn't restarted
    const tl = langKey.toLowerCase();
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);

    if (response.ok) {
      const result = await response.json();
      // Google returns an array of arrays representing sentences:
      // [ [ ["Hola mundo", "Hello world", null, null, 1] ], null, "en", ... ]
      if (result && Array.isArray(result) && Array.isArray(result[0])) {
        const translatedText = result[0].map((sentenceInfo: any) => sentenceInfo[0]).join('');
        if (translatedText) return translatedText;
      }
    }
  } catch (error) {
    console.error("Google Translate fallback failed:", error);
  }

  // Final fallback: Use Supabase Edge Function (may fail if function isn't deployed)
  try {
    const { data, error } = await supabase.functions.invoke('gemini-assistant', {
      body: {
        action: 'autoTranslateText',
        payload: { text, targetLanguage: langKey, languageNames }
      }
    });

    if (error) throw new Error(error.message);
    if (data?.translatedText) {
      TRANSLATION_CACHE[cacheKey] = data.translatedText;
      return data.translatedText;
    }
    return data?.translatedText || text;
  } catch (error) {
    console.error("AutoTranslate Final Fallback Error:", error);
    return text; // Return original text if everything fails
  }
};

export const generateAdvancedReport = async (logs: any[]) => {
  const logsSummary = JSON.stringify(logs);

  try {
    const { data, error } = await supabase.functions.invoke('gemini-assistant', {
      body: {
        action: 'generateAdvancedReport',
        payload: { logsSummary }
      }
    });

    if (error) throw new Error(error.message);
    return data?.text;
  } catch (error) {
    return "Erro ao gerar relatório avançado.";
  }
};

export const searchOfficialDocumentInfo = async (documentName: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-assistant', {
      body: {
        action: 'searchOfficialDocumentInfo',
        payload: { documentName }
      }
    });

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    console.error("AI Document Search Error:", error);
    return null;
  }
};
