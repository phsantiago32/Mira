import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { Shield, Lock, CheckCircle2, Mail, Key, Eye, EyeOff, AlertCircle, Info, Sparkles, Globe, ChevronDown, ArrowLeft, Users } from 'lucide-react';
import { t } from '../utils/translations';
import { MIRA_LOGO } from '../constants';
import { authService } from '../services/authService';

interface AuthScreenProps {
    onLogin: (user: User) => void;
    language: string;
    setLanguage: (lang: string) => void;
}

const RANDOM_ADJECTIVES = ['Explorador', 'Valente', 'Resiliente', 'Curioso', 'Brilhante', 'Atento', 'Livre', 'Paciente'];
const RANDOM_NOUNS = ['Fênix', 'Águia', 'Golfinho', 'Leão', 'Estrela', 'Horizonte', 'Vento', 'Maré'];

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, language, setLanguage }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        try {
            if (isForgotPassword) {
                // Placeholder: Aqui implementaremos o 'Reset Password' real
                setIsForgotPassword(false);
                setIsLoading(false);
                return;
            }

            let authData: any = null;
            let authError: any = null;

            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: password
                });
                authData = data;
                authError = error;
            } else {
                // Check denylist before signup
                const { data: isDenied } = await supabase
                    .from('denied_emails')
                    .select('email')
                    .eq('email', email.trim())
                    .single();

                if (isDenied) {
                    setErrorMsg('Este email foi bloqueado por violar os termos da comunidade.');
                    setIsLoading(false);
                    return;
                }

                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: email.trim(),
                    password: password,
                    options: {
                        data: { name: `Usuário ${Math.floor(Math.random() * 1000)} ` }
                    }
                });
                authData = signUpData;
                authError = signUpError;

                if (!authError && !authData?.session) {
                    setErrorMsg('Conta criada! Faça login com a sua senha.');
                    setIsLogin(true);
                    setIsLoading(false);
                    return;
                }
            }

            if (authError) {
                setErrorMsg(authError.message);
                setIsLoading(false);
                return;
            }

            if (authData?.session) {
                const profile = await authService.fetchProfileWithRetry(authData.session.user.id);

                if (profile) {
                    if (profile.is_blocked) {
                        await supabase.auth.signOut();
                        setErrorMsg('A sua conta foi suspensa por um moderador.');
                        setIsLoading(false);
                        return;
                    }

                    // Sync email if missing (for existing users after migration)
                    if (!profile.email && authData.session.user.email) {
                        supabase.from('profiles')
                            .update({ email: authData.session.user.email })
                            .eq('id', profile.id)
                            .then(() => console.log('Email sincronizado no perfil existente'));
                    }

                    const loggedUser = authService.mapProfileToUser(profile, authData.session.user);
                    console.log('MIRA: User logged in, calling onLogin...', loggedUser.name);
                    onLogin(loggedUser);
                } else {
                    console.log('MIRA: No profile found, creating fallback...');
                    const fallbackUser = await authService.createFallbackProfile(
                        authData.session.user.id,
                        authData.session.user.email || '',
                        authData.session.user.user_metadata?.name
                    );
                    console.log('MIRA: Fallback created, calling onLogin...', fallbackUser.name);
                    onLogin(fallbackUser);
                }
            }
        } catch (err: any) {
            console.error('MIRA Auth Critical Error:', err);
            setErrorMsg('Erro de ligação ao servidor. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderForm = () => {
        if (isForgotPassword) {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <button type="button" onClick={() => setIsForgotPassword(false)} className="p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <h3 className="font-black text-slate-800 uppercase tracking-tighter">Esqueceu a senha?</h3>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                        <div className="p-2 bg-mira-blue text-white rounded-xl"><Key size={20} /></div>
                        <p className="text-[11px] text-blue-800 font-bold leading-relaxed uppercase">Sem problemas! Iremos enviar-lhe um link para redefinir a sua senha.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input
                                type="email"
                                placeholder={t('auth_email_placeholder', language)}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-mira-blue focus:ring-4 focus:ring-mira-blue-pastel transition-all outline-none"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => { setIsForgotPassword(false); alert('Email de recuperação enviado!'); }}
                            disabled={!email || isLoading}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'A PROCESSAR...' : 'Enviar Link de Recuperação'}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-mira-blue transition-colors" size={20} />
                            <input
                                type="email"
                                placeholder={t('auth_email_placeholder', language)}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-14 pr-4 py-5 bg-white/10 border-2 border-white/10 rounded-[1.5rem] text-sm font-bold text-white placeholder:text-white/40 focus:border-mira-blue focus:bg-white/20 transition-all outline-none shadow-sm backdrop-blur-md"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-mira-orange transition-colors" size={20} />
                            <input
                                type={showPass ? "text" : "password"}
                                placeholder={t('auth_pass_placeholder', language)}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-14 pr-12 py-5 bg-white/10 border-2 border-white/10 rounded-[1.5rem] text-sm font-bold text-white placeholder:text-white/40 focus:border-mira-orange focus:bg-white/20 transition-all outline-none shadow-sm backdrop-blur-md"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {isLogin && (
                            <div className="flex justify-end pt-2">
                                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] font-black uppercase tracking-widest text-mira-orange hover:text-white transition-colors">
                                    {t('auth_forgot_pass', language)}
                                </button>
                            </div>
                        )}
                    </div>

                    {errorMsg && (
                        <div className="text-red-500 text-[11px] text-center font-bold px-4 py-3 bg-red-50/90 border border-red-100 rounded-xl leading-snug">
                            {errorMsg}
                        </div>
                    )}

                    <button type="submit" disabled={isLoading || !email || !password} className="w-full py-5 bg-mira-orange hover:bg-[#f97316] text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[12px] shadow-[0_15px_30px_rgba(249,115,22,0.3)] hover:shadow-[0_20px_40px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center gap-2">
                        {isLoading ? <span className="animate-pulse">A CONECTAR...</span> : (isLogin ? 'ENTRAR AGORA' : 'CRIAR CONTA MIRA')}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0A162B] via-[#003B75] to-[#0A162B] relative overflow-hidden font-['Plus_Jakarta_Sans']">
            <style>
                {`
@keyframes flash-mira {
    0%, 100% { opacity: 0.3; transform: scale(0.9); }
    50% { opacity: 1; transform: scale(1.1); filter: brightness(1.2); }
}
@keyframes glow-line {
    0%, 100% { filter: brightness(1) drop-shadow(0 0 2px rgba(255, 255, 255, 0.5)); }
    50% { filter: brightness(1.5) drop-shadow(0 0 10px rgba(249, 115, 22, 1)); }
}
@keyframes float-orb {
    0%, 100% { transform: translate(0, 0); }
    33% { transform: translate(30px, -50px); }
    66% { transform: translate(-20px, 20px); }
}
.dot-flash-1 { animation: flash-mira 2s infinite ease-in-out; }
.dot-flash-2 { animation: flash-mira 2s infinite ease-in-out 0.4s; }
.dot-flash-3 { animation: flash-mira 2s infinite ease-in-out 0.8s; }
.dot-flash-4 { animation: flash-mira 2s infinite ease-in-out 1.2s; }
.glow-line-animated { animation: glow-line 3s infinite ease-in-out; }
.orb-animation { animation: float-orb 15s infinite ease-in-out; }
`}
            </style>

            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-mira-orange/20 rounded-full blur-[120px] orb-animation"></div>
                <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-mira-blue-light/10 rounded-full blur-[100px] orb-animation" style={{ animationDelay: '-5s' }}></div>
                <div className="absolute bottom-[-15%] middle w-[700px] h-[700px] bg-mira-blue/20 rounded-full blur-[150px] orb-animation" style={{ animationDelay: '-10s' }}></div>
            </div>

            {/* Language Selector Dropdown - Moved to far Right and distanced from logo */}
            <div className="absolute top-6 right-2 z-50">
                <div className="relative">
                    <button
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        className="bg-mira-orange text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all border border-white/20"
                    >
                        <div className="bg-white/20 p-1 rounded-lg">
                            <Globe size={16} />
                        </div>
                        {language}
                        <ChevronDown size={14} className={`transition-transform duration-300 ${showLangMenu ? 'rotate-180' : ''}`} />
                    </button>
                    {showLangMenu && (
                        <div className="absolute top-full right-0 mt-3 w-40 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in slide-in-from-top-2">
                            {['PT', 'EN', 'ES', 'FR'].map(l => (
                                <button
                                    key={l}
                                    onClick={() => { setLanguage(l); setShowLangMenu(false); }}
                                    className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === l ? 'bg-mira-orange text-white shadow-lg shadow-orange-500/30' : 'text-slate-600 hover:bg-mira-orange/10 hover:text-mira-orange'}`}
                                >
                                    {l === 'PT' ? 'Português' : l === 'EN' ? 'English' : l === 'ES' ? 'Español' : 'Français'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full max-w-md z-10 flex flex-col items-center">
                {/* Bloco de Logo Isolado */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="inline-flex w-24 h-24 bg-mira-dark-blue/40 backdrop-blur-3xl rounded-[2.5rem] mb-6 p-4 items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 rounded-[2.5rem] group-hover:opacity-100 transition-opacity duration-1000"></div>
                        <div className="w-full h-full text-mira-blue-light relative z-10 filter drop-shadow-[0_0_15px_rgba(0,229,255,0.7)]">
                            {MIRA_LOGO}
                        </div>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-md leading-none">MIRA</h1>
                    <p className="text-white/90 text-[9px] font-bold mt-4 max-w-[280px] mx-auto leading-relaxed uppercase tracking-[0.2em]">{t('auth_slogan', language)}</p>
                </div>

                <div className="bg-white/5 backdrop-blur-[60px] w-full p-10 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden border border-white/10">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-mira-orange via-mira-blue-light to-mira-blue glow-line-animated"></div>
                    <form onSubmit={handleAuth}>
                        {renderForm()}
                    </form>
                </div>

                {/* Link de Registro Separado */}
                {!isForgotPassword && (
                    <div className="text-center mt-10 mb-8 animate-in fade-in duration-1000">
                        <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-black text-white/80 hover:text-white transition-colors uppercase tracking-[0.2em] drop-shadow-sm">
                            {isLogin ? 'Ainda não tens conta?' : 'Já fazes parte da rede?'} <span className="text-white underline decoration-white/40 underline-offset-8 decoration-2">{isLogin ? 'Regista-te aqui' : 'Entra aqui'}</span>
                        </button>
                    </div>
                )}

                {/* MIRA Lights moved here */}
                <div className="flex items-center gap-2.5 justify-center mb-10">
                    <div className="w-2 h-2 rounded-full bg-mira-orange dot-flash-1 shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                    <div className="w-2 h-2 rounded-full bg-mira-blue-light dot-flash-2 shadow-[0_0_10px_rgba(0,229,255,0.8)]"></div>
                    <div className="w-2 h-2 rounded-full bg-mira-blue dot-flash-3 shadow-[0_0_10px_rgba(0,123,255,0.8)]"></div>
                    <div className="w-2 h-2 rounded-full bg-mira-orange-pastel dot-flash-4 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                </div>
            </div>

            <p className="text-[7px] font-black text-white/20 uppercase tracking-[0.5em]">MIRA © 2026 AMANDA SILVA ABREU</p>
        </div>
    );
};
