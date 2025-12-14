import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Store the event globally so it persists
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

// Listen for the event immediately when module loads
if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        globalDeferredPrompt = e as BeforeInstallPromptEvent;
    });
}

const PWAInstallModal: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
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

        // Check if already dismissed this session
        if (sessionStorage.getItem('pwa-modal-dismissed')) {
            return;
        }

        // If already installed, don't show
        if (standalone) {
            return;
        }

        // Listen for beforeinstallprompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            globalDeferredPrompt = e as BeforeInstallPromptEvent;
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show modal immediately when event fires
            setShowModal(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // If we already have the prompt (from global), show modal
        if (globalDeferredPrompt) {
            setDeferredPrompt(globalDeferredPrompt);
            setShowModal(true);
        } else if (iOS) {
            // iOS doesn't fire beforeinstallprompt, show modal with instructions after delay
            setTimeout(() => setShowModal(true), 1500);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowModal(false);
                globalDeferredPrompt = null;
            }
            setDeferredPrompt(null);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        sessionStorage.setItem('pwa-modal-dismissed', 'true');
    };

    // Don't render if already installed or modal is hidden
    if (isStandalone || !showModal) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 slide-in-from-bottom">
            <div className="glass-panel rounded-2xl p-4 max-w-[340px] mx-auto shadow-xl border border-gray-200/50 relative">
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200"
                >
                    <X size={14} />
                </button>

                <div className="flex items-center space-x-3">
                    <img
                        src="/icon-192.png"
                        alt="teralab.app"
                        className="w-12 h-12 rounded-xl shadow-md"
                    />
                    <div className="flex-1 pr-6">
                        <h3 className="font-bold text-primary-900 text-sm">Instalar teralab.app</h3>
                        <p className="text-xs text-gray-500">Acceso rápido y sin conexión</p>
                    </div>
                </div>

                {isIOS ? (
                    // iOS - Show instructions
                    <div className="mt-3">
                        <button
                            onClick={() => {
                                alert('Para instalar:\n1. Toca el botón Compartir (📤)\n2. Selecciona "Agregar a pantalla de inicio"');
                            }}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center space-x-2 transition-all active:scale-95"
                        >
                            <Download size={18} />
                            <span>Instalar App</span>
                        </button>
                        <p className="text-[10px] text-gray-400 text-center mt-2">
                            Compartir (📤) → Agregar a Inicio
                        </p>
                    </div>
                ) : (
                    // Android - Direct install
                    <button
                        onClick={handleInstall}
                        disabled={!deferredPrompt}
                        className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
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
