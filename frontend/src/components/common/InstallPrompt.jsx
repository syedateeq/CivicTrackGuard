import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import usePWAInstall from '../../hooks/usePWAInstall';

/**
 * Floating toast-style install prompt.
 * Appears automatically when the browser fires beforeinstallprompt.
 * The Navbar also has a permanent install button — this is the secondary nudge.
 */
const InstallPrompt = () => {
  const { isInstallable, handleInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-80 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass rounded-2xl p-4 shadow-2xl border border-primary-500/30 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center shrink-0">
          <Download size={20} className="text-primary-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white mb-1">Install App</h3>
          <p className="text-xs text-slate-300 mb-3">
            Add CivicTrackGuard to your home screen for a better experience.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 py-1.5 px-3 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;

