import { OFFICIAL_SOURCES } from '../constants';
import { UNIFIED_CATEGORIES } from '../types';
import { supabase } from '../lib/supabase';

export const generateAssistantResponse = async (prompt: string, history: { role: string, parts: { text: string }[] }[] = [], communityContext?: string, language: string = 'PT') => {
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

    const { data: knowledge } = await supabase.from('chat_knowledge').select('*');
    const additionalKnowledge = knowledge ? JSON.stringify(knowledge) : '';

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
    return data;

  } catch (error) {
    console.error("Gemini Error:", error);
    const errorMsgs: Record<string, string> = {
      'PT': "Desculpe, meu sistema deu um tropeço! Como seu amigo MIRA, peço que pergunte de novo, estou aqui por você.",
      'EN': "Sorry, my system stumbled! As your friend MIRA, I ask you to ask again, I'm here for you.",
      'ES': "¡Lo siento, mi sistema tropezó! Como tu amigo MIRA, te pido que vuelvas a preguntar, estou aquí para ti.",
      'FR': "Désolé, mon système a trébuché ! En tant que votre ami MIRA, je vous demande de redemander, je suis là pour vous."
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

export const autoTranslateText = async (text: string, targetLanguage: string): Promise<string> => {
  if (!text || !text.trim()) return text;

  const langKey = targetLanguage.toUpperCase();
  const languageNames: Record<string, string> = {
    'PT': 'Português de Portugal',
    'EN': 'English',
    'ES': 'Español',
    'FR': 'Français'
  };

  const targetLangName = languageNames[langKey] || langKey;

  try {
    // Attempt 1: Direct Gemini REST API (if key is loaded in Vite environment)
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (apiKey) {
      const prompt = `Translate the following text to ${targetLangName}. Return ONLY the translated text, no explanations, no quotes, no extra text:\n\n${text}`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
          })
        }
      );
      if (response.ok) {
        const result = await response.json();
        const translated = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translated) return translated;
      }
    }
  } catch (error) {
    console.warn("Gemini translation failed, falling back to Google Translate:", error);
  }

  try {
    // Attempt 2: Highly reliable public Google Translate API (No API key needed)
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
    return data?.text || text;
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
