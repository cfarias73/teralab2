import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallModal: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        const standalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(iOS);

        // Listen for beforeinstallprompt (Android/Desktop Chrome)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Show modal after short delay if not installed
        const timer = setTimeout(() => {
            if (!standalone) {
                setShowModal(true);
            }
        }, 1500);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            clearTimeout(timer);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            // Android/Chrome - trigger native install
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowModal(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        // Don't show again this session
        sessionStorage.setItem('pwa-modal-dismissed', 'true');
    };

    // Don't show if already dismissed this session
    useEffect(() => {
        if (sessionStorage.getItem('pwa-modal-dismissed')) {
            setShowModal(false);
        }
    }, []);

    // Don't render if already installed or modal is hidden
    if (isStandalone || !showModal) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 slide-in-from-bottom">
            <div className="glass-panel rounded-2xl p-4 max-w-[340px] mx-auto shadow-xl border border-gray-200/50">
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200"
                >
                    <X size={14} />
                </button>

                <div className="flex items-center space-x-3">
                    <img
                        src="/logo.png"
                        alt="teralab.app"
                        className="w-12 h-12 rounded-xl shadow-md"
                    />
                    <div className="flex-1 pr-6">
                        <h3 className="font-bold text-primary-900 text-sm">Instalar teralab.app</h3>
                        <p className="text-xs text-gray-500">Acceso rápido y sin conexión</p>
                    </div>
                </div>

                {isIOS ? (
                    // iOS Instructions
                    <div className="mt-3 bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-600 mb-2">Para instalar en iPhone/iPad:</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-700">
                            <div className="flex items-center space-x-1">
                                <span className="font-medium">1.</span>
                                <Share size={14} className="text-primary-600" />
                                <span>Compartir</span>
                            </div>
                            <span className="text-gray-400">→</span>
                            <div className="flex items-center space-x-1">
                                <span className="font-medium">2.</span>
                                <PlusSquare size={14} className="text-primary-600" />
                                <span>Agregar a Inicio</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Android/Chrome - Direct Install Button
                    <button
                        onClick={handleInstall}
                        className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center space-x-2 transition-all active:scale-95"
                    >
                        <Download size={18} />
                        <span>Instalar App</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default PWAInstallModal;
