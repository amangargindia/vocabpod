"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ─── PWAManager ───────────────────────────────────────────────────────────────

export default function PWAManager() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installOutcome, setInstallOutcome] = useState<"idle" | "accepted" | "dismissed">("idle");

  // ── Detect environment ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  // ── Capture Android/Chrome install prompt ────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      // Show our custom banner immediately
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // ── Show iOS install guide if not in standalone ──────────────────────────────
  useEffect(() => {
    if (isIOS && !isStandalone) {
      // Small delay so page is settled
      const t = setTimeout(() => setShowInstallBanner(true), 1500);
      return () => clearTimeout(t);
    }
  }, [isIOS, isStandalone]);

  // ── Also show Android banner after app is loaded if prompt was captured ──────
  useEffect(() => {
    if (!isIOS && !isStandalone && deferredPrompt.current) {
      const t = setTimeout(() => setShowInstallBanner(true), 1500);
      return () => clearTimeout(t);
    }
  }, [isIOS, isStandalone]);


  // ── Install handlers ─────────────────────────────────────────────────────────
  const handleInstall = async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      setInstallOutcome(outcome);
      deferredPrompt.current = null;
      if (outcome === "dismissed") {
        setShowInstallBanner(false);
      } else {
        setTimeout(() => setShowInstallBanner(false), 1800);
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
  };

  // ── Don't render if already installed or dismissed ───────────────────────────
  if (isStandalone || !showInstallBanner) return null;

  // ── iOS Guide Banner (Centered Modal) ─────────────────────────────────────────
  if (isIOS) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-sm bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-200">
          {/* Close */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-muted-ash hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div className="flex items-start gap-4 pr-6">
            {/* Icon */}
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-terracotta/10 border border-terracotta/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                <rect x="5" y="2" width="14" height="20" rx="2" stroke="#E04B35" strokeWidth="1.8" />
                <path d="M9 22h6" stroke="#E04B35" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="18" r="1" fill="#E04B35" />
              </svg>
            </div>

            <div className="space-y-1 mt-1">
              <p className="text-base font-bold text-light-gray leading-snug">Add VocabPod to Home Screen</p>
              <p className="text-xs text-muted-ash leading-relaxed">
                Get the full app experience — no browser bar, faster loading.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="mt-5 space-y-2 bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="flex items-center gap-3 text-xs text-muted-ash">
              <span className="shrink-0 w-5 h-5 rounded-full bg-terracotta/20 text-terracotta text-[10px] font-black flex items-center justify-center">1</span>
              <span>Tap the <strong className="text-light-gray">Share</strong> button at the bottom of Safari</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="#E04B35" strokeWidth="2" className="w-4 h-4 shrink-0 ml-auto">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m6.632 8.026A3 3 0 1115 17v-1.025m1.316-6.017A3 3 0 1015 9V7.975M9 12h6" />
              </svg>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-ash">
              <span className="shrink-0 w-5 h-5 rounded-full bg-terracotta/20 text-terracotta text-[10px] font-black flex items-center justify-center">2</span>
              <span>Scroll down and tap <strong className="text-light-gray">"Add to Home Screen"</strong></span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-ash">
              <span className="shrink-0 w-5 h-5 rounded-full bg-terracotta/20 text-terracotta text-[10px] font-black flex items-center justify-center">3</span>
              <span>Tap <strong className="text-light-gray">Add</strong> done!</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Android / Desktop Install Banner (Centered Modal) ────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {installOutcome === "accepted" ? (
        // Success state
        <div className="bg-[#1A1A1A] border border-terracotta/30 rounded-2xl px-6 py-5 flex items-center gap-4 shadow-[0_8px_40px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-200">
          <div className="w-10 h-10 rounded-full bg-terracotta/20 flex items-center justify-center text-terracotta text-xl">
            ✓
          </div>
          <p className="text-base font-semibold text-light-gray">
            App installed!<br/><span className="text-sm font-normal text-muted-ash">Open it from your home screen.</span>
          </p>
        </div>
      ) : (
        <div className="relative w-full max-w-sm bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Terracotta glow strip at top */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-terracotta to-transparent opacity-80" />

          <div className="p-5">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-muted-ash hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <div className="flex items-center gap-4 pr-8">
              {/* App icon preview */}
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-absolute-black border border-white/10 flex items-center justify-center shadow-inner">
                <svg viewBox="0 0 48 48" className="w-10 h-10">
                  <rect width="48" height="48" rx="10" fill="#0A0A0A" />
                  <polyline points="6,16 24,38 42,16" fill="none" stroke="#F5F5F7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                  <polyline points="10,16 24,33 38,16" fill="none" stroke="#F5F5F7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="24" cy="22" r="6" fill="#E04B35" />
                  <line x1="18" y1="15" x2="15" y2="11" stroke="#E04B35" strokeWidth="2" strokeLinecap="round" />
                  <line x1="24" y1="13" x2="24" y2="8" stroke="#E04B35" strokeWidth="2" strokeLinecap="round" />
                  <line x1="30" y1="15" x2="33" y2="11" stroke="#E04B35" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <div>
                <p className="text-base font-bold text-light-gray">Install VocabPod</p>
                <p className="text-xs text-muted-ash mt-1">Add to home screen for the best experience</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDismiss}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-muted-ash hover:text-light-gray hover:bg-white/10 transition-colors tracking-wide"
              >
                Not Now
              </button>
              <button
                onClick={handleInstall}
                className="flex-[1.5] py-3 rounded-xl bg-terracotta text-white text-sm font-black tracking-widest hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all active:scale-95"
              >
                Install App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
