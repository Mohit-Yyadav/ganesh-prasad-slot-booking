import React, { useEffect, useState } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if already installed / running in standalone mode
    const inStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsStandalone(inStandalone);

    if (inStandalone) return;

    // Check if user already dismissed in this session
    if (sessionStorage.getItem("pwa_install_dismissed") === "true") {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // For Android / Chrome / Chromium browsers
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait 1.5s after page load to smoothly show the banner
      setTimeout(() => setVisible(true), 1500);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // On iOS Safari, show after 2.5s if not standalone
    if (isIosDevice && !inStandalone) {
      setTimeout(() => setVisible(true), 2500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setVisible(false);
    sessionStorage.setItem("pwa_install_dismissed", "true");
  }

  if (isStandalone || !visible) return null;

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slideUp">
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/50 bg-gradient-to-r from-[#20050c]/95 via-[#340b15]/95 to-[#1c040a]/95 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(229,193,88,0.25)] backdrop-blur-xl">
        {/* Subtle Ambient Light */}
        <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3.5">
          {/* Ganesh Ji Sacred App Icon */}
          <div className="relative h-12 w-12 flex-shrink-0 rounded-2xl p-0.5 bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-200 shadow-md">
            <img
              src="/ganesh-3d.png"
              alt="Ganesh App Icon"
              className="h-full w-full object-contain rounded-2xl"
            />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Install Mobile App
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide truncate">
              Shree Ganesh Prasad Seva
            </h3>
            <p className="text-xs text-amber-100/70 mt-0.5 leading-snug">
              {isIOS
                ? "Add to your Home Screen for full app experience"
                : "Fast slot booking, live updates & offline access"}
            </p>

            {/* iOS Safari Instruction */}
            {isIOS ? (
              <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] text-amber-200">
                <span>Tap</span>
                <Share size={13} className="text-amber-400" />
                <span>then</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <PlusSquare size={13} /> Add to Home Screen
                </span>
              </div>
            ) : (
              /* Android / Desktop Install Button */
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 rounded-xl btn-gold-3d !py-1.5 !px-3.5 !text-xs font-bold shadow-md active:scale-95 transition"
                >
                  <Download size={14} />
                  <span>Install / Add to Home</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-xs text-amber-200/60 hover:text-amber-200 px-2 py-1 transition"
                >
                  Later
                </button>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-amber-200/60 hover:text-white rounded-lg p-1 transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
