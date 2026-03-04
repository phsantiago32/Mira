import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

/**
 * SplashScreen
 * - Displays an 8-second video.
 * - Transitions out after completion.
 */

interface SplashScreenProps {
    onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
    const [fadeOut, setFadeOut] = useState(false);
    const [isMuted, setIsMuted] = useState(false); // Áudio ativado por padrão
    const videoRef = useRef<HTMLVideoElement>(null);
    const hasStartedFadeOut = useRef(false);

    const triggerFadeOut = () => {
        if (hasStartedFadeOut.current) return;
        hasStartedFadeOut.current = true;
        setFadeOut(true);
        setTimeout(onFinish, 300); // 300ms para a transição ser bem rápida
    };

    useEffect(() => {
        // Tenta contornar bloqueios de auto-play forçando o play após mount
        if (videoRef.current) {
            videoRef.current.play().catch(e => {
                console.warn("Autoplay bloqueado pelo browser, será feito mute fallback", e);
                // Se o browser proibir autoplay com som, mudamos para mute automaticamente para o video conseguir rodar e não falhar.
                setIsMuted(true);
                videoRef.current?.play();
            });
        }

        // 8 seconds timer for the video duration
        const timer = setTimeout(triggerFadeOut, 8000);

        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div className={`fixed inset-0 z-[2000] bg-black flex items-center justify-center transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className="relative w-full h-[100dvh] bg-black overflow-hidden flex items-center justify-center">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-cover" // object-cover para não ter bordas pretas, adaptativo.
                    onEnded={triggerFadeOut}
                >
                    <source src="/splash_video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                {/* Overlays de estilo para dar ar premium */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none"></div>

                {/* Botão de Toggle Som caso o usuário queira mutar */}
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute bottom-10 right-10 p-4 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-all border border-white/10 z-10"
                >
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
            </div>
        </div>
    );
};
