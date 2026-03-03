import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { autoTranslateText } from '../services/geminiService';

// Global translation cache so translations are reused across renders
const translationCache: Record<string, string> = {};

interface TranslatedTextProps {
    text: string;
    language: string;
    className?: string;
    /** When true, translates to target language. When false, shows original text */
    shouldTranslate?: boolean;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({ text, language, className, shouldTranslate = true }) => {
    const [translatedText, setTranslatedText] = useState<string>(text);
    const [isTranslating, setIsTranslating] = useState(false);
    const prevShouldTranslate = useRef(false);

    useEffect(() => {
        // Only translate when explicitly asked
        if (!shouldTranslate) {
            setTranslatedText(text); // show original
            return;
        }

        const langKey = language?.toUpperCase?.() || 'PT';
        const cacheKey = `${text}_${langKey}`;
        if (translationCache[cacheKey]) {
            setTranslatedText(translationCache[cacheKey]);
            return;
        }

        let isMounted = true;
        setIsTranslating(true);
        autoTranslateText(text, langKey).then(res => {
            if (!isMounted) return;
            if (res && res.trim() && res !== text) {
                translationCache[cacheKey] = res;
                setTranslatedText(res);
            } else {
                setTranslatedText(text); // fallback to original if translation fails or same
            }
            setIsTranslating(false);
        }).catch(() => {
            if (!isMounted) return;
            setTranslatedText(text);
            setIsTranslating(false);
        });

        return () => { isMounted = false; };
    }, [text, language, shouldTranslate]);

    return (
        <span className={className}>
            {translatedText}
            {isTranslating && <Loader2 size={12} className="inline animate-spin ml-1 opacity-50" />}
        </span>
    );
};
