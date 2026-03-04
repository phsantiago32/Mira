
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Sparkles, AlertCircle, Bot, Volume2, VolumeX, Play, RotateCcw, Loader2, Square } from 'lucide-react';
import { generateAssistantResponse } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { Message } from '../types';
import { analytics } from '../services/analyticsService';
import { t } from '../utils/translations';
import { supabase } from '../lib/supabase';

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
      // Show ALL system voices as requested by user now
      setAvailableVoices(voices);
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
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'PT' ? 'pt-PT' :
        language === 'EN' ? 'en-US' :
          language === 'ES' ? 'es-ES' : 'fr-FR';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
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

    let validMessagesForHistory = messages;
    if (messages.length > 0 && messages[0].role === 'assistant') {
      validMessagesForHistory = messages.slice(1);
    }
    const history = validMessagesForHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));

    try {
      const result = await generateAssistantResponse(currentInput, history, undefined, language);

      // Get the correct user UUID for analytics instead of the message ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        analytics.track('ai_query', userId, result.category, { query: currentInput });
      }

      const botMsg = { id: (Date.now() + 1).toString(), role: 'assistant' as const, text: result.text, category: result.category, audioBase64: undefined, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = { id: Date.now().toString(), role: 'assistant' as const, text: "Dificuldade técnica na conexão MIRA. Verifique sua chave API do Google.", timestamp: new Date() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioAction = (msg: (Message & { audioBase64?: string })) => {
    if (!voiceEnabled) {
      alert("Ative o som no topo do ecrã primeiro (ícone principal de volume).");
      return;
    }

    if (isPlaying === msg.id) {
      stopAudio();
    } else {
      stopAudio();
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
    <div className="flex flex-col h-full bg-slate-950 text-white shadow-sm font-['Plus_Jakarta_Sans'] overflow-hidden relative rounded-xl md:rounded-3xl border border-white/5">
      <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-mira-orange/20 rounded-full blur-[120px] pointer-events-none opacity-40"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-mira-blue/20 rounded-full blur-[100px] pointer-events-none opacity-30"></div>
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

      <div className="bg-slate-950/40 backdrop-blur-3xl border-b border-white/10 px-3 py-2 sm:px-6 sm:py-4 flex items-center justify-between z-20 shrink-0 shadow-xl sticky top-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-mira-orange rounded-lg blur opacity-30 animate-pulse"></div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-2 rounded-lg relative border border-white/10 shadow-lg group ring-1 ring-white/5 flex-none">
              <Bot size={18} className="text-mira-orange group-hover:scale-110 transition-transform duration-500" />
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="font-black text-lg uppercase tracking-tighter leading-none text-white drop-shadow-md">
              MIRA CHAT
            </h2>
            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles size={6} className="text-mira-blue animate-pulse flex-none" />
              <p className="text-[8px] font-black text-mira-blue uppercase tracking-[0.2em] drop-shadow-sm truncate pr-2 max-w-[120px] sm:max-w-none">
                INTELIGÊNCIA 2026
              </p>
            </div>
          </div>
        </div>

        <button onClick={() => { stopAudio(); setVoiceEnabled(!voiceEnabled); }} className={`p-2 rounded-lg transition-all flex-none ${voiceEnabled ? 'bg-mira-orange/10 text-mira-orange border border-mira-orange/20' : 'bg-slate-800 border border-slate-700 text-slate-500 opacity-60'}`}>
          {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:p-10 space-y-6 no-scrollbar relative z-10 w-full max-w-full">
        <div className="flex flex-col items-center justify-center py-4 space-y-3 opacity-50">
          <div className="w-16 h-16 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
            <Bot size={32} className="text-mira-orange" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Início da Conversa Privada</p>
        </div>

        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex flex-col w-full relative z-10 animate-in slide-in-from-bottom-4 fade-in duration-500 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className={`text-[9px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-mira-orange' : 'text-mira-blue'}`}>
                {msg.role === 'user' ? 'Tu' : 'MIRA'}
              </span>
              <div className={`w-1 h-1 rounded-full ${msg.role === 'user' ? 'bg-mira-orange' : 'bg-mira-blue'}`} />
              <span className="text-[9px] font-bold text-white/30 tracking-tighter">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className={`max-w-[92%] sm:max-w-[85%] rounded-2xl sm:rounded-[2rem] px-5 py-4 sm:px-7 sm:py-6 shadow-2xl relative group transition-all hover:scale-[1.01] ${msg.role === 'user'
              ? 'bg-gradient-to-br from-mira-orange via-[#f97316] to-[#e44e00] text-white rounded-tr-sm sm:rounded-tr-none border border-white/30 shadow-mira-orange/20'
              : 'bg-slate-900/80 backdrop-blur-xl text-slate-50 rounded-tl-sm sm:rounded-tl-none border border-white/10 shadow-black/60'}
              `}>
              {msg.role === 'assistant' && msg.category && (
                <div className="flex items-center gap-2 mb-4 bg-mira-blue/10 w-fit px-3 py-1.5 rounded-full border border-mira-blue/20">
                  <Sparkles size={11} className="text-mira-blue" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-mira-blue">{msg.category}</span>
                </div>
              )}
              <p className={`text-[15px] sm:text-[16px] leading-[1.7] whitespace-pre-wrap font-medium ${msg.role === 'user' ? 'text-white' : 'text-slate-100'} drop-shadow-sm`}>
                {msg.text}
              </p>

              {msg.role === 'assistant' && (
                <div className="flex items-center justify-end mt-5 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleAudioAction(msg)}
                    className={`flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-2xl transition-all shadow-xl font-black text-[10px] uppercase tracking-widest ${isPlaying === msg.id ? 'text-white bg-mira-blue ring-4 ring-mira-blue/20 scale-105' : 'text-slate-400 bg-white/5 hover:text-white hover:bg-white/10 border border-white/5 hover:scale-105 active:scale-95'}`}
                  >
                    {isPlaying === msg.id ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    {isPlaying === msg.id ? 'Parar Voz' : 'Ouvir Resposta'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col items-start relative z-10 w-full animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-mira-blue">MIRA</span>
              <div className="w-1 h-1 rounded-full bg-mira-blue animate-pulse" />
            </div>
            <div className="bg-slate-900/60 backdrop-blur-3xl rounded-2xl sm:rounded-[2rem] rounded-tl-sm sm:rounded-tl-none px-5 py-4 sm:px-8 sm:py-6 flex items-center gap-5 border border-white/5 shadow-2xl max-w-[92%] sm:max-w-[85%]">
              <div className="flex gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-mira-orange rounded-full animate-bounce shadow-mira-orange/50" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-mira-yellow rounded-full animate-bounce shadow-mira-yellow/50 [animation-delay:0.2s]" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-mira-blue rounded-full animate-bounce shadow-mira-blue/50 [animation-delay:0.4s]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white animate-pulse">A Pensar...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 bg-slate-950/80 backdrop-blur-3xl border-t border-white/10 z-20 shrink-0 relative w-full pt-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-900 border border-white/10 rounded-full flex items-center gap-2 shadow-2xl z-30">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[8px] font-black text-white/60 uppercase tracking-widest whitespace-nowrap">IA Sincronizada 2026</span>
        </div>

        <div className="flex flex-col gap-4 max-w-4xl mx-auto items-center mt-2">
          <div className="w-full flex gap-1.5 sm:gap-2 items-end bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-[2rem] p-1.5 pl-4 sm:p-2 sm:pl-5 focus-within:ring-4 focus-within:ring-mira-orange/20 focus-within:border-mira-orange/40 transition-all shadow-2xl group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-mira-orange to-mira-blue opacity-30"></div>
            <textarea
              placeholder={
                language === 'PT' ? 'Fale com o MIRA (Texto ou Voz)...' :
                  language === 'EN' ? 'Talk to MIRA (Text or Voice)...' :
                    language === 'ES' ? 'Habla con MIRA (Texto o Voz)...' :
                      'Parlez à MIRA (Texte ou Voix)...'
              }
              className="flex-1 bg-transparent py-4 my-auto outline-none text-[15px] sm:text-lg font-medium text-white placeholder:text-slate-500 resize-none min-h-[44px] max-h-[120px] no-scrollbar w-full"
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

            <div className="flex items-center gap-2 shrink-0 pb-1 pr-1">
              <button
                onClick={toggleListening}
                className={`p-3 sm:p-4 transition-all rounded-xl sm:rounded-full shadow-2xl flex items-center justify-center border ${isListening
                  ? 'text-white bg-red-600 border-red-500 animate-pulse ring-4 ring-red-500/20'
                  : 'text-slate-400 bg-white/5 border-white/10 hover:text-white hover:bg-mira-orange hover:border-mira-orange active:scale-95'
                  }`}
              >
                <Mic size={20} />
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-3 sm:p-4 bg-gradient-to-br from-mira-blue to-blue-700 text-white rounded-xl sm:rounded-full disabled:opacity-20 disabled:grayscale transition-all shadow-2xl shadow-mira-blue/30 hover:shadow-mira-blue/50 active:scale-95 flex items-center justify-center border border-white/10"
              >
                <Send size={20} className="translate-x-[2px] translate-y-[-1px]" />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex items-center justify-center w-full px-4">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 leading-relaxed drop-shadow-sm text-center">
                {t('chat_legal_warning', language)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantView;
