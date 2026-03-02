
export const audioService = {
    /**
     * Speak text in a specific language using Web Speech API
     * @param text The text to read
     * @param lang Language code ('PT', 'EN', 'ES', 'FR')
     */
    speak: (text: string, lang: string) => {
        if (!('speechSynthesis' in window)) {
            console.warn("MIRA: Áudio não suportado neste navegador.");
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Map MIRA languages to standard locales
        const locales: { [key: string]: string } = {
            'PT': 'pt-PT',
            'EN': 'en-GB',
            'ES': 'es-ES',
            'FR': 'fr-FR'
        };

        utterance.lang = locales[lang] || 'pt-PT';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Optional: Select better voices if available
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Prioritize "Premium" or "Google" voices if they match the language
            const preferredVoice = voices.find(v =>
                v.lang.startsWith(utterance.lang) &&
                (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural'))
            );
            if (preferredVoice) utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
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
