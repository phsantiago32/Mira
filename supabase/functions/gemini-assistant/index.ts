import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI, Type, Modality } from "npm:@google/genai@1.41.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { action, payload } = await req.json();
        const apiKey = Deno.env.get("GEMINI_API_KEY");

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set in environment.");
        }

        const ai = new GoogleGenAI({ apiKey });

        if (action === "generateAssistantResponse") {
            const { prompt, history, communityContext, language, OFFICIAL_SOURCES, UNIFIED_CATEGORIES, languageNames } = payload;
            const sourcesText = OFFICIAL_SOURCES.map((s: any) => `${s.name} (${s.category}): ${s.url}`).join('\n');
            const categoriesList = UNIFIED_CATEGORIES.join(', ');

            const response = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: [
                    ...(history || []),
                    { role: "user", parts: [{ text: prompt }] }
                ],
                config: {
                    systemInstruction: `Você é o MIRA (Migrants' Intelligent Rights Assistant), o guia oficial e o melhor amigo de quem imigra para Portugal em 2026.
          Você atua como um conselheiro brilhante, extremamente perspicaz, acolhedor e altamente inteligente.
          
          Sua principal obrigação é compreender a real intenção e dor do usuário por trás da pergunta, mesmo se ela for uma pergunta muito curta, confusa, ou conter erros ortográficos. 
          
          Você deve responder OBRIGATORIAMENTE, FLUIDAMENTE e de FORMA NATIVA no idioma: ${languageNames[language] || 'Português'}. Aja como um falante nativo deste idioma.

          SUA POSTURA E ALGORITMO MENTAL:
          1. COMPREENSÃO PROFUNDA: Quando o usuário faz uma pergunta simples como "como peço o NIF?" ou "saúde", não responda de forma genérica. Interprete o que ele precisa e forneça o passo a passo prático de como resolver o problema dele em Portugal, listando documentos necessários, prazos (se aplicável) e links ou referências a órgãos oficiais.
          2. AÇÃO PRÁTICA IMEDIATA: Vá direto ao ponto. Em vez de textões longos, use "bullet points" para facilitar a leitura. Se a pergunta for um "olá", devolva com uma saudação incrivelmente calorosa e proativa oferecendo áreas onde você pode ajudar (Vistos, Trabalho, Documentos, Saúde, Comunidade, etc.).
          3. INTELIGÊNCIA INTERNACIONAL: Em inglês, francês ou espanhol, traduza perfeitamente as burocracias portuguesas (ex: "NIF - Número de Identificação Fiscal (Tax Identification Number)", "Segurança Social (Social Security)"), não apenas traduza a palavra "Segurança Social", mas explique o seu contexto se for a primeira vez.
          4. INTEGRAÇÃO AO MIRA: Lembre sempre o usuário de que você tem outros "Módulos MIRA" (Mural de Empregos, Gerador de Documentos/Minutas, Mapa de Serviços Locais) que ele pode explorar a qualquer momento no Menu Principal. 
          5. FONTES: Ao dar instruções sobre vistos, regularização, saúde ou escola, fundamente as informações com menções diretas a FONTES OFICIAIS (AIMA, AT, SS, SNS, Portal das Matrículas, IEFP), mas de forma amigável, nunca burocrática.
          6. REGRAS GERAIS E TOM: Seja encorajador. Mostre que o caminho da migração não é fácil, mas que a pessoa não está sozinha. "Ao seu lado" deve ser a sua vibe.
          7. PESQUISA WEB (GROUNDING): Utilize imediatamente os seus conhecimentos de ponta sobre leis migratórias portuguesas. Se for um caso específico de mudança de lei, ative ferramentas de pesquisa para ver a data e regra exata.
          
          Você PRECISA também classificar a conversa numa destas opções obrigatórias para organizar a nossa base de dados: ${categoriesList}.

          Contexto Adicional da Comunidade (Se aplicável): ${communityContext || 'Sem alertas da comunidade neste momento.'}
          
          Fontes de consulta oficiais base:
          ${sourcesText}`,
                    tools: [{ googleSearch: {} }],
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING, description: "A resposta ultra-inteligente, compassiva e formatada com bullet-points se necessário, respondendo diretamente ao problema do imigrante no idioma designado." },
                            category: { type: Type.STRING, enum: [...UNIFIED_CATEGORIES], description: "A categoria predominante em que a dúvida encaixa mais perfeitamente." }
                        },
                        required: ["text", "category"]
                    },
                    temperature: 0.6,
                },
            });
            return new Response(JSON.stringify(JSON.parse(response.text)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (action === "generateSpeech") {
            const { text, language, voiceMap } = payload;
            const response = await ai.models.generateContent({
                model: "gemini-1.5-flash", // TTS using standard flash model or appropriate multimodal model
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: voiceMap[language] || 'Fenrir' },
                        },
                    },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            return new Response(JSON.stringify({ audio: base64Audio }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (action === "autoTranslateText") {
            const { text, targetLanguage, languageNames } = payload;
            const response = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: `Detect the original language of the following text. If it is already exactly written natively in ${languageNames[targetLanguage] || 'Português'}, return exactly the same text without any changes. Otherwise, precisely translate it to ${languageNames[targetLanguage]} preserving formatting, emojis, hashtags and tone. Return ONLY the translated or original text, without any conversational fill or quotes:\n\n${text}`
            });
            return new Response(JSON.stringify({ text: response.text.trim() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (action === "generateAdvancedReport") {
            const { logsSummary } = payload;
            const response = await ai.models.generateContent({
                model: "gemini-1.5-pro",
                contents: `Gere um relatório estratégico de padrões migratórios. Dados: ${logsSummary}`,
                config: {
                    systemInstruction: "Você é um Cientista de Dados Sênior especializado em Migração Europeia. Relatórios devem ser concisos, profissionais e baseados em dados.",
                }
            });
            return new Response(JSON.stringify({ text: response.text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (action === "searchOfficialDocumentInfo") {
            const { documentName } = payload;
            const response = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: `Procure informações sobre o documento "${documentName}" para 2026 em Portugal. Retorne os campos necessários para uma minuta.`,

                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            authority: { type: Type.STRING },
                            description: { type: Type.STRING },
                            fields: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        label: { type: Type.STRING },
                                        placeholder: { type: Type.STRING },
                                        type: { type: Type.STRING }
                                    },
                                    required: ["id", "label", "placeholder", "type"]
                                }
                            }
                        },
                        required: ["title", "authority", "description", "fields"]
                    }
                }
            });
            return new Response(JSON.stringify(JSON.parse(response.text)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        throw new Error(`Unknown action: ${action}`);
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});
