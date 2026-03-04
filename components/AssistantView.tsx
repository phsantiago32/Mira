
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Sparkles, AlertCircle, Bot, Volume2, VolumeX, Play, RotateCcw, Loader2, Square } from 'lucide-react';
import { generateAssistantResponse } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { Message } from '../types';
import { analytics } from '../services/analyticsService';
import { t } from '../utils/translations';

// Audio Helpers for raw PCM data from Gemini TTS
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface AssistantViewProps {
  language: string;
}

const AssistantView: React.FC<AssistantViewProps> = ({ language }) => {
  const [messages, setMessages] = useState<(Message & { category?: string, audioBase64?: string })[]>([]);

  useEffect(() => {
    const welcomeMsgs: Record<string, string> = {
      'PT': 'Olá! Sou o MIRA, seu amigo e assistente. Estou aqui para caminhar ao seu lado em Portugal em 2026. Como posso tornar sua jornada mais leve hoje?',
      'EN': 'Hello! I am MIRA, your friend and assistant. I am here to walk by your side in Portugal in 2026. How can I make your journey lighter today?',
      'ES': '¡Hola! Soy MIRA, tu amigo y asistente. Estoy aquí para caminar a tu lado en Portugal en 2026. ¿Cómo puedo hacer tu jornada más ligera hoy?',
      'FR': 'Bonjour ! Je suis MIRA, votre ami et assistant. Je suis ici pour marcher à vos côtés au Portugal en 2026. Comment puis-je rendre votre voyage plus léger aujourd\'hui ?'
    };

    setMessages([
      {
        id: '1',
        role: 'assistant',
        text: welcomeMsgs[language] || welcomeMsgs['PT'],
        timestamp: new Date(),
        category: 'Comunidade & Solidariedade'
      }
    ]);
  }, [language]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  useEffect(() => {
    const loadVoices = () => {
      const voices = audioService.getVoices();
      // Only show PT-BR and PT-PT voices as requested
      const ptVoices = voices.filter(v => v.lang.startsWith('pt'));
      setAvailableVoices(ptVoices);
    };
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      const langMap: Record<string, string> = {
        'PT': 'pt-PT',
        'EN': 'en-US',
        'ES': 'es-ES',
        'FR': 'fr-FR'
      };
      recognitionRef.current.lang = langMap[language] || 'pt-PT';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        alert("O seu navegador não suporta reconhecimento de voz.");
        return;
      }
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start recognition", err);
      }
    }
  };

  const stopAudio = () => {
    audioService.stop();
    setIsPlaying(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    // Gemini requires the conversation history to start with 'user'.
    // The very first message in our state is the bot's welcome message, which causes a 400 error.
    // So we slice(1) to remove that initial 'model' message if the first message is from the assistant.
    let validMessagesForHistory = messages;
    if (messages.length > 0 && messages[0].role === 'assistant') {
      validMessagesForHistory = messages.slice(1);
    }
    const history = validMessagesForHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));

    const result = await generateAssistantResponse(currentInput, history, undefined, language);
    analytics.track('ai_query', userMsg.id, result.category, { query: currentInput });

    // Removed automatic audio playback as requested by user. Audio is now strictly manual via play button.

    const botMsg = { id: (Date.now() + 1).toString(), role: 'assistant' as const, text: result.text, category: result.category, audioBase64: undefined, timestamp: new Date() };
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleAudioAction = (msg: (Message & { audioBase64?: string })) => {
    if (!voiceEnabled) {
      alert("Ative o som no topo do ecrã primeiro (ícone principal de volume).");
      return;
    }

    if (isPlaying === msg.id) {
      stopAudio();
    } else {
      stopAudio(); // Stop any other message that's currently playing
      audioService.speak(
        msg.text,
        language,
        selectedVoice || undefined,
        () => setIsPlaying(msg.id),
        () => setIsPlaying(null)
      );
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-white shadow-sm font-['Plus_Jakarta_Sans'] pb-16 sm:pb-0 overflow-hidden relative">
      {/* Background Gradient Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-mira-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[50vw] h-[50vw] bg-mira-orange/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Premium Header */}
      <div className="bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 px-6 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 z-20 shrink-0 shadow-lg">
        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-mira-orange via-mira-yellow to-mira-blue rounded-2xl blur-md opacity-50 animate-pulse"></div>
              <div className="bg-slate-900 p-3.5 rounded-2xl relative border border-white/10 shadow-inner group">
                <Bot size={28} className="text-white group-hover:scale-110 transition-transform" />
                <div className="absolute top-3 left-3 w-1.5 h-1.5 bg-mira-blue rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,1)]"></div>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="font-black text-xl uppercase tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                {language === 'PT' ? 'MIRA ASSISTANT' :
                  language === 'EN' ? 'MIRA ASSISTANT' :
                    language === 'ES' ? 'MIRA ASSISTANT' : 'ASSISTANT MIRA'}
              </h2>
              <p className="text-[9px] font-black text-mira-orange uppercase tracking-[0.2em] mt-1 shadow-mira-orange/20 drop-shadow-md">
                {language === 'PT' ? 'INTELIGÊNCIA OFICIAL 2026' :
                  language === 'EN' ? 'OFFICIAL INTELLIGENCE 2026' :
                    language === 'ES' ? 'INTELIGENCIA OFICIAL 2026' : 'INTELLIGENCE OFFICIELLE 2026'}
              </p>
            </div>
          </div>

          <div className="sm:hidden flex items-center">
            <button onClick={() => { stopAudio(); setVoiceEnabled(!voiceEnabled); }} className={`p-3 rounded-2xl transition-all shadow-lg ${voiceEnabled ? 'bg-mira-orange text-white border border-mira-orange/50 shadow-mira-orange/20' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}>
              {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>

        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3">
          <div className="flex-1 sm:flex-none relative group w-full sm:min-w-[200px]">
            <Bot size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-mira-orange transition-colors" />
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full bg-slate-900/80 text-white text-[10px] uppercase font-black pl-10 pr-8 py-3.5 rounded-2xl border border-white/10 outline-none cursor-pointer appearance-none transition-all focus:bg-slate-900 focus:border-mira-orange focus:ring-2 focus:ring-mira-orange/20 relative z-10 shadow-inner truncate"
              title="Escolher Voz MIRA"
            >
              <option value="">VOZ AUTOMÁTICA (RECOMENDADO)</option>
              {availableVoices.map(v => (
                <option key={v.voiceURI} value={v.voiceURI}>{v.name.replace('Microsoft ', '').replace('Google ', 'G ')} ({v.lang})</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-[5px] border-transparent border-t-slate-500 group-focus-within:border-t-mira-orange transform translate-y-1"></div>
          </div>
          <button onClick={() => { stopAudio(); setVoiceEnabled(!voiceEnabled); }} className={`hidden sm:flex items-center justify-center p-3.5 rounded-2xl transition-all shadow-lg ${voiceEnabled ? 'bg-mira-orange text-white border border-mira-orange/50 shadow-mira-orange/20 hover:bg-mira-orange-dark' : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-white'}`}>
            {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8 sm:p-8 space-y-6 no-scrollbar relative z-10">

        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex flex-col w-full relative z-10 animate-in slide-in-from-bottom-2 fade-in duration-300 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] sm:max-w-[80%] rounded-3xl px-6 py-5 shadow-xl relative ${msg.role === 'user'
              ? 'bg-gradient-to-br from-mira-orange to-[#cc461b] text-white rounded-br-md ml-auto border border-mira-orange/50 shadow-mira-orange/10'
              : 'bg-slate-900/90 backdrop-blur-md text-slate-100 rounded-bl-md border border-white/10 shadow-black/50'}
              `}>
              {msg.role === 'assistant' && msg.category && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-mira-blue shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-mira-blue drop-shadow-sm">{msg.category}</span>
                </div>
              )}
              <p className={`text-[13px] sm:text-[14px] leading-loose whitespace-pre-wrap ${msg.role === 'user' ? 'font-medium' : 'font-medium text-slate-200'} drop-shadow-sm`}>
                {msg.text}
              </p>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                <span className={`text-[9px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-white/60' : 'text-slate-500'}`}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                {msg.role === 'assistant' && (
                  <button onClick={() => handleAudioAction(msg)} className={`p-3 rounded-2xl transition-all backdrop-blur-sm shadow-lg ${isPlaying === msg.id ? 'text-white bg-mira-blue border border-mira-blue scale-110 shadow-mira-blue/30' : 'text-slate-400 bg-white/5 hover:text-white hover:bg-white/10 border border-white/5 active:scale-95'}`}>
                    {isPlaying === msg.id ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start relative z-10 w-full animate-in fade-in duration-300">
            <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl px-6 py-5 rounded-bl-md flex items-center gap-4 border border-white/10 shadow-xl max-w-[80%]">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">MIRA A PROCESSAR...</span>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-mira-blue rounded-full animate-bounce shadow-[0_0_5px_rgba(59,130,246,0.8)]" />
                <div className="w-1.5 h-1.5 bg-mira-orange rounded-full animate-bounce shadow-[0_0_5px_rgba(249,115,22,0.8)] [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-mira-yellow rounded-full animate-bounce shadow-[0_0_5px_rgba(234,179,8,0.8)] [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6 pb-[5.5rem] sm:pb-6 bg-slate-950/90 backdrop-blur-2xl border-t border-white/5 z-20 shrink-0">
        <div className="flex flex-col gap-3 max-w-4xl mx-auto">
          <div className="flex gap-2 items-end bg-slate-900/80 border border-white/10 rounded-[2rem] p-2 pl-6 focus-within:ring-2 focus-within:ring-mira-blue/30 focus-within:border-mira-blue/50 focus-within:bg-slate-900 transition-all shadow-2xl relative">
            <textarea
              placeholder={
                language === 'PT' ? 'Fale com o MIRA (Texto ou Voz)...' :
                  language === 'EN' ? 'Talk to MIRA (Text or Voice)...' :
                    language === 'ES' ? 'Habla con MIRA (Texto o Voz)...' :
                      'Parlez à MIRA (Texte ou Voix)...'
              }
              className="flex-1 bg-transparent py-4 my-auto outline-none text-[15px] sm:text-base font-medium text-white placeholder:text-slate-400 resize-none min-h-[50px] max-h-[120px]"
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <div className="flex items-center gap-2 shrink-0 pb-1">
              <button
                onClick={toggleListening}
                className={`p-4 transition-all rounded-[1.5rem] shadow-lg flex items-center justify-center ${isListening
                  ? 'text-white bg-red-600 border border-red-500 animate-pulse shadow-red-500/40'
                  : 'text-slate-400 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10'
                  }`}
              >
                <Mic size={20} />
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-4 bg-gradient-to-r from-mira-blue to-blue-600 text-white rounded-[1.5rem] disabled:opacity-30 disabled:from-slate-800 disabled:to-slate-800 transition-all shadow-lg shadow-mira-blue/20 hover:shadow-mira-blue/40 active:scale-95 flex items-center justify-center"
              >
                <Send size={20} className="translate-x-[1px] translate-y-[-1px]" />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 opacity-100 px-2 mt-2">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-white/20">
              <AlertCircle size={10} className="text-mira-orange" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">
                {language === 'PT' ? 'MIRA BASEIA-SE EM FONTES OFICIAIS PORTUGUESAS 2026' :
                  language === 'EN' ? 'MIRA IS BASED ON OFFICIAL PORTUGUESE 2026 SOURCES' :
                    language === 'ES' ? 'MIRA SE BASA EN FUENTES OFICIALES PORTUGUESAS DE 2026' :
                      'MIRA EST BASÉ SUR DES SOURCES OFFICIELLES PORTUGAISES DE 2026'}
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-medium text-slate-200 text-center leading-relaxed">
              {t('chat_legal_warning', language)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantView;
