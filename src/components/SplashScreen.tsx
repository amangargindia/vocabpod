"use client";

import { useState, useEffect } from "react";
import Logo from "./Logo";

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    const seen = sessionStorage.getItem("vocabpod_splash_seen");
    if (seen) {
      setShow(false);
      return;
    }

    // Show splash for 2.5 seconds
    const timer = setTimeout(() => {
      setFade(true); // start fading out
      setTimeout(() => {
        setShow(false);
        sessionStorage.setItem("vocabpod_splash_seen", "1");
      }, 500); // fade duration
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-absolute-black flex flex-col items-center justify-center transition-opacity duration-500 ${
        fade ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Animated logo */}
      <div className="scale-150 mb-8 drop-shadow-[0_0_30px_rgba(224,75,53,0.3)]">
        <Logo className="w-32 h-32" hideText={true} />
      </div>
      
      {/* App name */}
      <div className="absolute bottom-20 flex flex-col items-center space-y-3">
        <h1 className="text-3xl font-black text-white tracking-tight">VocabPod</h1>
        <div className="flex gap-1.5 mt-2">
          <div className="w-2 h-2 rounded-full bg-terracotta animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-terracotta animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-terracotta animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
