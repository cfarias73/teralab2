import React from 'react';

interface SplashScreenProps {
    message?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ message = "Cargando experiencia..." }) => {
    return (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
            {/* Mobile Container - matches app width */}
            <div className="w-full h-full max-w-[380px] bg-gradient-to-b from-primary-900 via-primary-800 to-primary-950 flex flex-col items-center justify-center relative sm:rounded-xl sm:h-[95vh] sm:shadow-2xl">

                {/* Logo Container */}
                <div className="relative mb-8 animate-in zoom-in duration-700">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-primary-400/20 rounded-3xl blur-2xl scale-110"></div>

                    {/* Logo Box with 3D Effect */}
                    <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 p-6 rounded-3xl shadow-2xl border border-primary-400/30">
                        <div className="bg-gradient-to-br from-primary-700 to-primary-900 p-4 rounded-2xl shadow-inner">
                            <img
                                src="/logo.png"
                                alt="TeraLab Logo"
                                className="w-20 h-20 object-contain drop-shadow-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* Brand Name */}
                <h1 className="text-4xl font-bold text-white tracking-tight mb-2 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
                    TERALAB
                </h1>

                {/* Badge */}
                <div className="flex items-center space-x-1.5 mb-12 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300">
                    <span className="text-primary-300 text-sm font-semibold tracking-widest uppercase">AI</span>
                    <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse delay-75"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse delay-150"></div>
                    </div>
                </div>

                {/* Loading Spinner */}
                <div className="mb-4 animate-in fade-in duration-500 delay-500">
                    <div className="w-10 h-10 border-[3px] border-primary-700 border-t-primary-400 rounded-full animate-spin"></div>
                </div>

                {/* Loading Text */}
                <p className="text-primary-400 text-xs font-medium tracking-[0.2em] uppercase animate-in fade-in duration-500 delay-500">
                    {message}
                </p>

                {/* Footer */}
                <div className="absolute bottom-8 animate-in fade-in duration-500 delay-700">
                    <p className="text-primary-600 text-xs font-medium">
                        Powered by <span className="text-primary-400">TeraLab AI</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
