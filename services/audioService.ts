export const audioService = {
    /**
     * Get available voices
     */
    getVoices: () => {
        if (!('speechSynthesis' in window)) return [];
        return window.speechSynthesis.getVoices();
    },

    /**
     * Speak text in a specific language using Web Speech API
     * @param text The text to read
     * @param lang Language code ('PT', 'EN', 'ES', 'FR')
     * @param voiceURI (Optional) Specific voice URL/ID to use
     */
    speak: (text: string, lang: string, voiceURI?: string, onStart?: () => void, onEnd?: () => void) => {
        if (!('speechSynthesis' in window)) {
            console.warn("MIRA: Áudio não suportado neste navegador.");
            if (onEnd) onEnd();
            return;
        }

        // Cancel running speech to avoid overlaps
        window.speechSynthesis.cancel();

        // Use timeout to bypass a browser bug where cancel() fires a rogue onend
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);

            const locales: { [key: string]: string } = {
                'PT': 'pt-PT',
                'EN': 'en-US',
                'ES': 'es-ES',
                'FR': 'fr-FR'
            };

            let targetLocale = locales[lang] || 'pt-PT';
            utterance.lang = targetLocale;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            utterance.onstart = () => { if (onStart) onStart(); };
            utterance.onend = () => { if (onEnd) onEnd(); };
            utterance.onerror = () => { if (onEnd) onEnd(); };

            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                let preferredVoice;

                // If the user manually selected a specific voice
                if (voiceURI) {
                    preferredVoice = voices.find(v => v.voiceURI === voiceURI);
                }

                if (!preferredVoice) {
                    const maleKeywords = ['antonio', 'antónio', 'dinis', 'julio', 'júlio', 'rafael', 'miguel', 'rui', 'masculino', 'male', 'man'];

                    // First try to find a natural/online voice for the target locale, preferably male
                    preferredVoice = voices.find(v => {
                        if (!v.lang.startsWith(targetLocale.split('-')[0])) return false;
                        const isPremium = v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Premium') || v.name.includes('Google') || v.name.includes('Microsoft');
                        const isMale = maleKeywords.some(kw => v.name.toLowerCase().includes(kw));
                        return isPremium && isMale;
                    });

                    // If no premium male, try any male
                    if (!preferredVoice) {
                        preferredVoice = voices.find(v =>
                            v.lang.startsWith(targetLocale.split('-')[0]) &&
                            maleKeywords.some(kw => v.name.toLowerCase().includes(kw))
                        );
                    }

                    // Fallback to premium voices even if not strictly male
                    if (!preferredVoice) {
                        preferredVoice = voices.find(v =>
                            v.lang.startsWith(targetLocale.split('-')[0]) &&
                            (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Premium') || v.name.includes('Google') || v.name.includes('Microsoft'))
                        );
                    }

                    // If PT and no good PT voice, fallback to pt-BR which often has better default voices
                    if (!preferredVoice && lang === 'PT') {
                        preferredVoice = voices.find(v => v.lang === 'pt-BR' && (v.name.includes('Google') || v.name.includes('Microsoft')));
                    }

                    // Ultimate fallback to anything in that language
                    if (!preferredVoice) {
                        preferredVoice = voices.find(v => v.lang.startsWith(targetLocale.split('-')[0]));
                    }
                }

                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                    utterance.lang = preferredVoice.lang; // Match the exact locale of the voice
                }
            }

            window.speechSynthesis.speak(utterance);
        }, 50); // 50ms buffer prevents cancel() from wiping out the onend state
    },

    /**
     * Stop all current speech
     */
    stop: () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }
};
