import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, AlertTriangle, Home } from 'lucide-react';
import { MIRA_LOGO } from '../constants';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State;
    public props: Props;

    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-['Plus_Jakarta_Sans']">
                    <div className="absolute inset-0 bg-mira-orange/10 blur-[120px] rounded-full pointer-events-none"></div>

                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-mira-orange blur-2xl opacity-20 animate-pulse"></div>
                        <div className="w-24 h-24 relative">{MIRA_LOGO}</div>
                    </div>

                    <div className="max-w-md space-y-6 relative z-10">
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">O MIRA tropeçou...</h1>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            Até os melhores assistentes precisam de um fôlego. Ocorreu um erro técnico inesperado no motor da aplicação.
                        </p>

                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
                            <AlertTriangle size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-left">Erro de Runtime Detetado</span>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-4 bg-mira-orange text-white rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-xl shadow-mira-orange/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <RefreshCcw size={18} /> Reiniciar Aplicação
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full py-4 bg-white/5 text-slate-400 rounded-2xl font-black uppercase text-[12px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                            >
                                <Home size={18} /> Voltar ao Início
                            </button>
                        </div>
                    </div>

                    <p className="fixed bottom-10 text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">MIRA Safe-Mode v4.5</p>
                </div>
            );
        }

        return this.props.children;
    }
}
