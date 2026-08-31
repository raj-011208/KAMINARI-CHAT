import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Monitor, X, CheckCircle2, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#12121a] border border-cyan-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,243,255,0.25)] relative overflow-hidden">
        {/* Glow background accent */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(0,243,255,0.4)] bg-[#0d0d12] mb-3">
            <img src="/kaminari-logo.jpg" alt="Kaminari Logo" className="w-full h-full object-cover" />
          </div>
          <h3 className="text-xl font-display font-black text-white tracking-wide">
            INSTALL KAMINARI APP
          </h3>
          <p className="text-xs font-mono text-cyan-400/80 mt-1">
            Fast • Offline Capable • Native App Experience
          </p>
        </div>

        {/* Content depending on install state */}
        {isInstalled ? (
          <div className="flex flex-col items-center text-center py-4 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl p-4">
            <CheckCircle2 className="w-12 h-12 text-cyan-400 mb-2 animate-pulse" />
            <span className="text-sm font-bold text-white font-display">Kaminari App Installed!</span>
            <p className="text-xs font-mono text-slate-400 mt-1">
              You can now launch Kaminari Chat directly from your home screen or desktop application menu.
            </p>
          </div>
        ) : isIOS ? (
          <div className="space-y-3 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-mono text-slate-300">
            <div className="text-cyan-400 font-bold font-display text-sm mb-1">How to Install on iOS (iPhone / iPad):</div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-950/60 rounded-xl border border-cyan-500/40 text-cyan-400 shrink-0">
                <Share className="w-4 h-4" />
              </div>
              <span>1. Tap the <strong>Share</strong> button in Safari browser bar.</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-950/60 rounded-xl border border-purple-500/40 text-purple-400 shrink-0">
                <PlusSquare className="w-4 h-4" />
              </div>
              <span>2. Scroll down and select <strong>'Add to Home Screen'</strong>.</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-950/60 rounded-xl border border-emerald-500/40 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>3. Tap <strong>'Add'</strong> to install Kaminari App to your device.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <Smartphone className="w-6 h-6 text-cyan-400 mb-1" />
                <span className="text-xs font-bold text-white font-display">Mobile Phone</span>
                <span className="text-[10px] font-mono text-slate-400">Android & iOS</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <Monitor className="w-6 h-6 text-purple-400 mb-1" />
                <span className="text-xs font-bold text-white font-display">Desktop App</span>
                <span className="text-[10px] font-mono text-slate-400">Windows, Mac & Linux</span>
              </div>
            </div>

            {deferredPrompt ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#00f3ff] via-cyan-400 to-[#9d00ff] text-black font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_25px_rgba(0,243,255,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                DOWNLOAD & INSTALL APP NOW
              </button>
            ) : (
              <div className="text-center p-3 bg-black/30 border border-white/10 rounded-2xl">
                <p className="text-xs font-mono text-slate-300">
                  To install, click your browser menu (⋮ or ⚙) and select <strong className="text-cyan-400">"Install Kaminari Chat"</strong> or <strong className="text-cyan-400">"Save / Add to Home Screen"</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="text-xs font-mono text-slate-400 hover:text-white underline cursor-pointer"
          >
            Close & Continue on Web
          </button>
        </div>
      </div>
    </div>
  );
};
