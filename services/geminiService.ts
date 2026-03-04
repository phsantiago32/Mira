import { OFFICIAL_SOURCES } from '../constants';
import { UNIFIED_CATEGORIES } from '../types';
import { supabase } from '../lib/supabase';
import { adminService } from './adminService';

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
      if (data && data.text) return data;
    } catch (edgeError) {
      console.warn("Edge function failed, attempting direct REST fallback...", edgeError);

      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (apiKey) {
        const contextString = `${communityContext || ''}\n${APP_MODULES_CONTEXT}\nCONHECIMENTO ADICIONAL ADMIN:\n${additionalKnowledge}\n\nYou are MIRA, a friendly, welcoming, and integrating assistant... Answer in ${languageNames[language] || language}.\n\n`;

        let contents = [];
        if (history && history.length > 0) {
          // Copy history and ensure alternating roles
          contents = history.map(msg => ({
            role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
            parts: msg.parts
          }));
          // Inject context into the very first user message
          if (contents[0].role === 'user') {
            contents[0].parts[0].text = contextString + contents[0].parts[0].text;
          }
          contents.push({ role: 'user', parts: [{ text: prompt }] });
        } else {
          contents = [{ role: 'user', parts: [{ text: contextString + "User: " + prompt }] }];
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: contents,
              generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
            })
          }
        );

        if (response.ok) {
          const result = await response.json();
          const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (generatedText) {
            return { text: generatedText, category: "Comunidade & Solidariedade" };
          }
        } else {
          const errBody = await response.text();
          console.error("Gemini REST Return Error 400/500/404:", errBody);

          // DEMO/DEV FALLBACK: Se houver erro de chave, retornar mock de demonstração.
          if (response.status === 400 || response.status === 403 || response.status === 404) {
            return {
              text: "Olá! Como este é um ambiente de testes sem uma Chave API válida do Google configurada, esta é uma resposta simulada do MIRA.\n\nVi a sua mensagem: '" + prompt + "'.\n" + (additionalKnowledge ? "\nDe acordo com o Saber IA oficial:\n" + additionalKnowledge + "\n\n" : "") + "\nSim, é verdade! A MIRA possui parcerias oficiais para facilitar a integração, e eu funciono como o seu assistente inteligente e acolhedor 24h por dia.",
              category: "Demonstração Offline"
            };
          }
        }
      }
      throw new Error("Both Edge Function and REST Fallback failed");
    }

  } catch (error) {
    console.error("Gemini Error:", error);
    const errorMsgs: Record<string, string> = {
      'PT': "Olá! O motor Gemini está temporariamente sem chave de API, mas se estivesse a 100%, iria dizer-lhe isto: O MIRA é um assistente incrível, focado em ajudá-lo na sua integração, com as leis atuais!",
      'EN': "Hello! The Gemini engine is temporarily without an API key, but if it were 100%, it would tell you this: MIRA is an amazing assistant, focused on helping you with your integration!",
      'ES': "¡Lo siento, mi sistema tropezó! Como tu amigo MIRA, te pido que vuelvas a preguntar, estou aquí para ti.",
      'FR': "Désolé, mon sistema a trébuché ! En tant que votre ami MIRA, je vous demande de redemander, je suis là pour vous."
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
