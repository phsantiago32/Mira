import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, FastForward } from 'lucide-react';

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
        <div className={`fixed inset-0 z-[2000] bg-black flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className="relative w-full h-[100dvh] bg-black overflow-hidden flex flex-col items-center justify-center">

                {/* 
                  * SINGLE PERFECT VIDEO CONTAINER: 
                  * `object-cover` garante que preenche todo o ecrã sem deixar margens pretas.
                  * Filtros de remasterização mantidos.
                */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    // Cinematic upscaling filters: crispness, contrast, and color pop
                    className="absolute inset-0 w-full h-[100dvh] object-cover filter saturate-[1.2] contrast-[1.1] brightness-[1.05]"
                    onEnded={triggerFadeOut}
                >
                    <source src="/splash_video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                {/* Efeito sutil de brilho azul ciano no fundo para remeter à tecnologia (Atrás/Mixado) */}
                <div className="absolute inset-0 bg-gradient-to-t from-mira-blue/10 via-transparent to-transparent pointer-events-none mix-blend-color z-10"></div>

                {/* Botões de Áudio e Pular Intro */}
                {/* Botão de Pular Intro */}
                <button
                    onClick={triggerFadeOut}
                    className="absolute bottom-8 right-20 sm:bottom-12 sm:right-20 p-3.5 sm:p-4 bg-white/10 backdrop-blur-xl text-white rounded-full hover:bg-white/20 transition-all border border-white/20 z-30 shadow-2xl active:scale-95"
                    aria-label="Pular intro"
                >
                    <FastForward size={20} className="sm:w-6 sm:h-6" />
                </button>
                {/* Botão de Toggle Som */}
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute bottom-8 right-6 sm:bottom-12 sm:right-12 p-3.5 sm:p-4 bg-white/10 backdrop-blur-xl text-white rounded-full hover:bg-white/20 transition-all border border-white/20 z-30 shadow-2xl active:scale-95"
                >
                    {isMuted ? <VolumeX size={20} className="sm:w-6 sm:h-6" /> : <Volume2 size={20} className="sm:w-6 sm:h-6" />}
                </button>
            </div>
        </div>
    );
};
