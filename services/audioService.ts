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
                const maleKeywords = ['antonio', 'lido', 'denis', 'rafael', 'miguel', 'rui', 'paul', 'henri', 'andrew', 'brian', 'guy', 'masculino', 'male', 'man'];

                // Enforce premium male, young friendly voice
                preferredVoice = voices.find(v => {
                    if (!v.lang.startsWith(targetLocale.split('-')[0])) return false;
                    const isPremium = v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Premium') || v.name.includes('Google') || v.name.includes('Microsoft');
                    const isMale = maleKeywords.some(kw => v.name.toLowerCase().includes(kw));
                    return isPremium && isMale;
                });

                // Ultimate fallback strictly to the locale
                if (!preferredVoice) {
                    preferredVoice = voices.find(v => v.lang.startsWith(targetLocale.split('-')[0]) && maleKeywords.some(kw => v.name.toLowerCase().includes(kw)));
                }

                if (!preferredVoice) {
                    preferredVoice = voices.find(v => v.lang.startsWith(targetLocale.split('-')[0]));
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
    },

    /**
     * Play a synthetic click sound using Web Audio API
     */
    playClick: () => {
        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gain = context.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

            oscillator.connect(gain);
            gain.connect(context.destination);

            oscillator.start();
            oscillator.stop(context.currentTime + 0.1);

            // Clean up
            setTimeout(() => context.close(), 200);
        } catch (e) {
            // Silently fail if audio context is blocked
        }
    }
};
