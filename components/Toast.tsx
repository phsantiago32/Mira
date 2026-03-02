import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            removeToast(id);
        }, 4000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-3 w-full max-w-xs px-4">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
                                toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' :
                                    toast.type === 'warning' ? 'bg-amber-500/90 border-amber-400 text-white' :
                                        'bg-mira-blue/90 border-mira-blue-light text-white'
                            }`}
                    >
                        {toast.type === 'success' && <CheckCircle size={20} />}
                        {toast.type === 'error' && <XCircle size={20} />}
                        {toast.type === 'warning' && <AlertTriangle size={20} />}
                        {toast.type === 'info' && <Info size={20} />}
                        <p className="flex-1 text-xs font-black uppercase tracking-tight leading-tight">{toast.message}</p>
                        <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
