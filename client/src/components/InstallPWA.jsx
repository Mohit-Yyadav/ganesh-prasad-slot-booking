import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Download,
  X,
  Share,
  PlusSquare,
  CheckCircle2,
  Compass,
  ArrowDown,
  Sparkles,
} from "lucide-react";

// Safe Mobile Device Detection (Smartphones / Tablets only)
function checkIsMobile() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const ua = (navigator.userAgent || navigator.vendor || window.opera || "").toLowerCase();

  // Mobile User Agents (Android, iPhone, iPod, iPad, Windows Phone, etc.)
  const isMobileUA =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(ua);

  // Modern iPadOS 13+ detection (reports as MacIntel with touch support)
  const isIPadOS =
    (navigator.platform === "MacIntel" || /macintosh/i.test(ua)) &&
    navigator.maxTouchPoints > 1;

  // Touch screen with small/tablet viewport check
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isMobileViewport = window.innerWidth <= 820;

  return isMobileUA || isIPadOS || (isTouchDevice && isMobileViewport);
}

// iOS Device Detection (iPhone, iPod, iPad)
function checkIsIOS() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const ua = (navigator.userAgent || "").toLowerCase();
  const isAppleHandheld = /iphone|ipod|ipad/i.test(ua);
  const isIPadOS =
    (navigator.platform === "MacIntel" || /macintosh/i.test(ua)) &&
    navigator.maxTouchPoints > 1;

  return (isAppleHandheld || isIPadOS) && !window.MSStream;
}

// Check if running on Safari on iOS
function checkIsIOSSafari() {
  const ua = (navigator.userAgent || "").toLowerCase();
  return (
    /safari/.test(ua) &&
    !/crios|fxios|edgios|opt|opr|instagram|fbav|whatsapp|musical_ly|tiktok|line/i.test(
      ua
    )
  );
}

// Check if already launched in standalone (PWA) mode
function checkIsStandalone() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://")
  );
}

export default function InstallPWA() {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const mobile = checkIsMobile();
    const standalone = checkIsStandalone();
    const ios = checkIsIOS();
    const safari = checkIsIOSSafari();

    setIsMobile(mobile);
    setIsStandalone(standalone);
    setIsIOS(ios);
    setIsSafari(safari);

    // If on Desktop / Laptop, or already installed, NEVER show the prompt
    if (!mobile || standalone) {
      return;
    }

    // Capture Android / Chromium beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show on Home page after a short smooth delay
      if (
        sessionStorage.getItem("pwa_install_dismissed") !== "true" &&
        location.pathname === "/"
      ) {
        setTimeout(() => setVisible(true), 1500);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // For iOS devices (Safari never fires beforeinstallprompt)
    if (ios && !standalone) {
      if (
        sessionStorage.getItem("pwa_install_dismissed") !== "true" &&
        location.pathname === "/"
      ) {
        const timer = setTimeout(() => setVisible(true), 1800);
        return () => {
          clearTimeout(timer);
          window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        };
      }
    }

    // Listen for manual trigger (e.g. clicked from mobile navigation menu)
    const handleOpenManual = () => {
      if (ios) {
        setShowIOSGuide(true);
      } else if (deferredPrompt) {
        handleInstallClick();
      } else {
        setVisible(true);
      }
    };

    window.addEventListener("open-pwa-install", handleOpenManual);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("open-pwa-install", handleOpenManual);
    };
  }, [location.pathname, deferredPrompt]);

  // Handle native install click (Android / Chromium)
  async function handleInstallClick() {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // If deferredPrompt is not yet available, show helpful modal
      setShowIOSGuide(true);
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error("Install prompt error:", err);
    }
  }

  function handleDismiss() {
    setVisible(false);
    sessionStorage.setItem("pwa_install_dismissed", "true");
  }

  // Strictly Mobile-only: Never render on Desktop / Laptop, or inside standalone mode
  if (!isMobile || isStandalone) {
    return null;
  }

  // Only show floating banner on Home page ("/") unless explicitly opened
  const isHomePage = location.pathname === "/";

  return (
    <>
      {/* ── Mobile Floating Install Banner (Hidden on Desktop) ──────── */}
      {visible && isHomePage && (
        <div
          className="fixed bottom-3 left-3 right-3 z-50 md:hidden animate-slideUp"
          role="dialog"
          aria-label="Install App"
        >
          <div className="relative overflow-hidden rounded-2xl border border-amber-400/50 bg-gradient-to-r from-[#20050c]/95 via-[#340b15]/95 to-[#1c040a]/95 p-3.5 shadow-[0_12px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(229,193,88,0.3)] backdrop-blur-xl">
            {/* Subtle Divine Glow */}
            <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />

            <div className="flex items-start gap-3">
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
                    Mobile App
                  </span>
                  <span className="text-[10px] text-amber-200/60 font-mono">
                    · {isIOS ? "iOS / iPhone" : "Android"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white tracking-wide truncate">
                  Shree Ganesh Prasad Seva
                </h3>
                <p className="text-xs text-amber-100/70 mt-0.5 leading-snug">
                  {isIOS
                    ? "Add to your iPhone Home Screen for easy 1-tap booking"
                    : "Fast slot booking, live status & offline access"}
                </p>

                {/* Action Buttons */}
                <div className="mt-2.5 flex items-center gap-2">
                  {isIOS ? (
                    <button
                      type="button"
                      onClick={() => setShowIOSGuide(true)}
                      className="flex items-center gap-1.5 rounded-xl btn-gold-3d !py-1.5 !px-3.5 !text-xs font-bold shadow-md active:scale-95 transition"
                    >
                      <PlusSquare size={14} />
                      <span>Add to Home Screen</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="flex items-center gap-1.5 rounded-xl btn-gold-3d !py-1.5 !px-3.5 !text-xs font-bold shadow-md active:scale-95 transition"
                    >
                      <Download size={14} />
                      <span>Install / Add to Home</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-xs text-amber-200/60 hover:text-amber-200 px-2 py-1 transition"
                  >
                    Later
                  </button>
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="text-amber-200/60 hover:text-white rounded-lg p-1 transition flex-shrink-0"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── iOS Step-by-Step Installation Modal / Bottom Sheet ────── */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-amber-400/40 bg-gradient-to-b from-[#24060e] via-[#1a0409] to-[#0c0205] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(229,193,88,0.25)] text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Indicator for mobile sheet */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-400/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl p-0.5 bg-gradient-to-tr from-amber-400 to-orange-500 shadow-md flex items-center justify-center">
                  <img
                    src="/ganesh-3d.png"
                    alt="Ganesh Ji"
                    className="h-full w-full object-contain rounded-xl"
                  />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-amber-200">
                    {isIOS ? "Add to iPhone / iPad" : "Install Ganesh App"}
                  </h3>
                  <p className="text-xs text-amber-100/60">
                    Codes for Tomorrow · Prasad Seva
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="rounded-full bg-white/10 p-1.5 text-amber-200/80 hover:bg-white/20 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="mt-4 space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300">
                  <Share size={18} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white text-[13px] flex items-center gap-1.5">
                    1. Tap Share Button
                  </p>
                  <p className="text-amber-100/75 mt-0.5">
                    Safari ke neeche menu bar me{" "}
                    <span className="inline-flex items-center font-bold text-sky-300 gap-1 bg-sky-950/60 px-1 rounded">
                      <Share size={12} /> Share
                    </span>{" "}
                    button par tap karein.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300">
                  <PlusSquare size={18} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white text-[13px] flex items-center gap-1.5">
                    2. Select "Add to Home Screen"
                  </p>
                  <p className="text-amber-100/75 mt-0.5">
                    Menu me thoda niche scroll karein aur{" "}
                    <span className="inline-flex items-center font-bold text-amber-300 gap-1 bg-amber-950/60 px-1 rounded">
                      <PlusSquare size={12} /> Add to Home Screen
                    </span>{" "}
                    option chunein.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  <CheckCircle2 size={18} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white text-[13px] flex items-center gap-1.5">
                    3. Tap "Add"
                  </p>
                  <p className="text-amber-100/75 mt-0.5">
                    Top-right corner me{" "}
                    <strong className="text-emerald-300 font-bold">"Add"</strong>{" "}
                    dabayein. Shree Ganesh App aapki Home Screen par save ho
                    jayega!
                  </p>
                </div>
              </div>

              {/* Non-Safari Warning (WhatsApp / Chrome iOS / etc.) */}
              {!isSafari && isIOS && (
                <div className="flex items-start gap-2.5 rounded-xl bg-orange-950/50 border border-orange-500/40 p-3 text-xs text-orange-200">
                  <Compass size={18} className="flex-shrink-0 text-orange-400 mt-0.5" />
                  <p>
                    <strong>Zaroori Note:</strong> Agar aap WhatsApp, Instagram ya
                    Chrome me hain, to pehle is page ko <strong>Safari</strong>{" "}
                    me open karein (Right-top 3 dots ya Safari icon tap karein).
                  </p>
                </div>
              )}
            </div>

            {/* Pointer to Safari bottom bar */}
            {isIOS && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-amber-300 animate-bounce">
                <ArrowDown size={14} />
                <span>Safari toolbar neeche dekhein (Share button ⎋)</span>
                <ArrowDown size={14} />
              </div>
            )}

            {/* Close Button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl btn-gold-3d !py-2.5 font-bold text-sm shadow-md"
              >
                Samajh Gaya (Got it)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
