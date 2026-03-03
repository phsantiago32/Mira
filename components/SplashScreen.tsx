import React, { useEffect, useState } from 'react';

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

    useEffect(() => {
        // 8 seconds timer for the video duration
        const timer = setTimeout(() => {
            setFadeOut(true);
            // Extra 500ms for the CSS fade-out transition
            setTimeout(onFinish, 800);
        }, 8000);

        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div className={`fixed inset-0 z-[2000] bg-black flex items-center justify-center transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className="relative w-full h-[100dvh] bg-black overflow-hidden flex items-center justify-center">
                <video
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover sm:object-contain"
                    onEnded={() => setFadeOut(true)}
                >
                    <source src="/splash_video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                {/* Optional Overlay to make it feel more premium */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
};
