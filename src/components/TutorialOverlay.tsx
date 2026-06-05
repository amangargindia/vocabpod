"use client";

import React, { useEffect, useState, useCallback } from "react";

const TUTORIAL_KEY = "vocabpod_tutorial_seen";

interface TutorialStep {
  id: string;
  title: string;
  message: string;
  highlight?: string; // CSS selector to spotlight
  targetId?: string; // element ID to spotlight
  position: "top" | "bottom" | "center";
  stickmanPose: "pointing" | "waving" | "reading" | "thinking" | "dancing";
  tapTarget?: string; // text describing what to tap
}

const STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome",
    message:
      "Main hoon aapka VocabPod guide, ek chhota sa stickman! Main aapko poori app ke baare mein bataunga. Chalte hain!",
    position: "center",
    stickmanPose: "waving",
    tapTarget: "Next →",
  },
  {
    id: "dashboard-tabs",
    title: "Yahan hai aapka daily plan",
    message:
      "'Words for Today' tab mein woh words hain jo aaj seekhne hain. 'Done for Now' mein woh words hain jo aap seekh chuke hain.",
    position: "top",
    stickmanPose: "pointing",
    targetId: "tour-tabs",
    tapTarget: "Next →",
  },
  {
    id: "daily-quota",
    title: "5 Words Roz!",
    message:
      "VocabPod mein roz sirf 5 naye words hain. Research kehti hai ki 5 words roz consistently karna kaafi zyada effective hai!",
    position: "top",
    stickmanPose: "pointing",
    targetId: "tour-daily-progress",
    tapTarget: "Next →",
  },
  {
    id: "new-words",
    title: "Naye Words",
    message:
      "Yeh hain aaj ke naye words. Har word ek poori lesson ke saath aata hai: meaning, story, mnemonic image, real-life usage, aur quiz.",
    position: "bottom",
    stickmanPose: "reading",
    targetId: "tour-new-words",
    tapTarget: "Next →",
  },
  {
    id: "review-words",
    title: "Review Words",
    message:
      "Yeh woh words hain jo aapne pehle seekhe the, lekin ab review ke liye due hain. Spaced Repetition system memory ko pakka karta hai!",
    position: "bottom",
    stickmanPose: "thinking",
    targetId: "tour-review-words",
    tapTarget: "Next →",
  },
  {
    id: "lesson-flow",
    title: "Lesson Kaise Kaam Karta Hai?",
    message:
      "Har lesson mein 7 cards hain: Word, Meaning, Story, Mnemonic Image, Real-Life Usage, Quiz, Complete! Quiz pass karein, toh word aapke review schedule mein add ho jaata hai.",
    position: "center",
    stickmanPose: "reading",
    tapTarget: "Next →",
  },
  {
    id: "spaced-repetition",
    title: "Memory Science!",
    message:
      "Jab aap quiz sahi karein, word agle review ke liye door bhej diya jaata hai. Galat karein toh kal wapas aata hai. Yeh hai Spaced Repetition!",
    position: "center",
    stickmanPose: "dancing",
    tapTarget: "Next →",
  },
  {
    id: "profile",
    title: "Aapka Profile",
    message:
      "Profile mein apna naam set karein. Tutorial dubara dekhna ho toh Profile mein 'Tutorial Dubara Dekho' button dabayein. Ab shuru karte hain, pehla word kholein!",
    position: "center",
    stickmanPose: "dancing",
    tapTarget: "Chalo shuru karte hain!",
  },
];

// Stickman SVG poses
function TutorialStickman({ pose }: { pose: TutorialStep["stickmanPose"] }) {
  const bodies: Record<TutorialStep["stickmanPose"], React.ReactNode> = {
    waving: (
      <>
        <path d="M50 40 L50 75" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 45 L30 65 M50 45 L70 20 L80 25" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 75 L35 100 M50 75 L65 100" strokeWidth="4" strokeLinecap="round" />
      </>
    ),
    pointing: (
      <>
        <path d="M50 40 L50 75" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 45 L30 65 M50 45 L85 40" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 75 L35 100 M50 75 L65 100" strokeWidth="4" strokeLinecap="round" />
      </>
    ),
    reading: (
      <>
        <path d="M50 40 L50 75" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 45 L35 55 M50 45 L65 55" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 75 L35 100 M50 75 L65 100" strokeWidth="4" strokeLinecap="round" />
        <rect x="25" y="55" width="50" height="12" rx="2" strokeWidth="2" fill="currentColor" opacity="0.3" />
        <line x1="25" y1="61" x2="75" y2="61" strokeWidth="1" />
      </>
    ),
    thinking: (
      <>
        <path d="M50 40 L50 75" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 45 L35 55 L45 25" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 45 L70 65" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 75 L35 100 M50 75 L65 100" strokeWidth="4" strokeLinecap="round" />
        <circle cx="62" cy="12" r="3" fill="#E04B35" opacity="0.8" />
        <circle cx="70" cy="7" r="2" fill="#E04B35" opacity="0.6" />
        <circle cx="76" cy="3" r="1.5" fill="#E04B35" opacity="0.4" />
      </>
    ),
    dancing: (
      <>
        <path d="M50 40 L55 70" strokeWidth="4" strokeLinecap="round" />
        <path d="M52 45 L30 25 M52 45 L80 60" strokeWidth="4" strokeLinecap="round" />
        <path d="M55 70 L35 90 L20 80 M55 70 L75 90 L70 100" strokeWidth="4" strokeLinecap="round" />
        <path d="M20 30 Q30 25 25 35" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.4" />
        <path d="M78 50 Q85 45 82 55" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.4" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 100 120"
      className="w-20 h-24 drop-shadow-xl"
      stroke="#E04B35"
      fill="none"
      style={{ filter: "drop-shadow(0 0 8px rgba(224,75,53,0.4))" }}
    >
      {/* Glow halo */}
      <circle cx="50" cy="20" r="18" fill="rgba(224,75,53,0.08)" />
      {/* Head */}
      <circle cx="50" cy="20" r="12" fill="#E04B35" stroke="none" />
      {/* Eyes */}
      <path d="M44 17 Q47 14 50 17" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M50 17 Q53 14 56 17" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M44 22 Q50 28 56 22" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Body & limbs */}
      {bodies[pose]}
      {/* Shadow */}
      <ellipse cx="48" cy="110" rx="16" ry="3" fill="rgba(224,75,53,0.12)" />
    </svg>
  );
}

interface TutorialOverlayProps {
  onComplete?: () => void;
}

export function useTutorial() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(TUTORIAL_KEY);
    if (!seen) setShouldShow(true);
  }, []);

  const resetTutorial = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TUTORIAL_KEY);
    }
  }, []);

  return { shouldShow, resetTutorial };
}

export default function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  
  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  useEffect(() => {
    // Small delay so page is settled before showing
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const updateRect = () => {
      if (step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    };
    updateRect();
    
    // Check periodically in case element renders late
    const interval = setInterval(updateRect, 250);
    window.addEventListener("resize", updateRect);
    
    // Disable scroll to prevent spotlight detachment
    document.body.style.overflow = "hidden";
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateRect);
      document.body.style.overflow = "";
    };
  }, [step]);

  const advance = useCallback(() => {
    if (animating) return;
    if (isLast) {
      // Mark done
      localStorage.setItem(TUTORIAL_KEY, "1");
      setVisible(false);
      setTimeout(() => onComplete?.(), 400);
      return;
    }
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep((s) => s + 1);
      setAnimating(false);
    }, 250);
  }, [animating, isLast, onComplete]);

  const skip = useCallback(() => {
    localStorage.setItem(TUTORIAL_KEY, "1");
    setVisible(false);
    setTimeout(() => onComplete?.(), 400);
  }, [onComplete]);

  if (!visible) return null;

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      onClick={(e) => e.stopPropagation()} // Block clicks to background
    >
      {/* Background with spotlight */}
      {targetRect ? (
        <>
          <div className="fixed inset-0 bg-absolute-black/85 pointer-events-none transition-opacity duration-300" 
               style={{ clipPath: `polygon(0% 0%, 0% 100%, ${targetRect.left - 12}px 100%, ${targetRect.left - 12}px ${targetRect.top - 12}px, ${targetRect.right + 12}px ${targetRect.top - 12}px, ${targetRect.right + 12}px ${targetRect.bottom + 12}px, ${targetRect.left - 12}px ${targetRect.bottom + 12}px, ${targetRect.left - 12}px 100%, 100% 100%, 100% 0%)` }} />
          {/* Subtle highlight ring around the hole */}
          <div className="fixed border-2 border-terracotta/50 rounded-2xl pointer-events-none transition-all duration-300"
               style={{ top: targetRect.top - 12, left: targetRect.left - 12, width: targetRect.width + 24, height: targetRect.height + 24, boxShadow: "0 0 30px rgba(224,75,53,0.3)" }} />
        </>
      ) : (
        <div className="fixed inset-0 bg-absolute-black/85 transition-opacity duration-300 pointer-events-none backdrop-blur-sm" />
      )}
      {/* Step dots progress */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === currentStep ? "bg-terracotta w-5" : i < currentStep ? "bg-terracotta/50 w-2" : "bg-white/15 w-2"
            }`}
          />
        ))}
      </div>

      {/* Skip button */}
      <button
        onClick={skip}
        className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-muted-ash hover:text-light-gray transition-colors px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
      >
        Skip
      </button>

      {/* Main card */}
      <div
        className="w-full max-w-sm mx-4 mb-8"
        style={{
          transform: animating ? "translateY(20px)" : "translateY(0)",
          opacity: animating ? 0 : 1,
          transition: "all 0.25s ease",
        }}
      >
        <div className="bg-[#1A0F0E] border border-terracotta/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(224,75,53,0.25)]">
          {/* Top glow strip */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-terracotta to-transparent" />

          <div className="p-5 space-y-4">
            {/* Stickman + bubble */}
            <div className="flex items-end gap-4">
              <div className="shrink-0 pb-1">
                <TutorialStickman pose={step.stickmanPose} />
              </div>

              <div className="flex-1 relative">
                {/* Bubble tail */}
                <div className="absolute bottom-4 -left-2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[8px] border-t-transparent border-b-transparent border-r-white/10" />
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 space-y-2 text-center">
                  <p className="text-[10px] font-black text-terracotta uppercase tracking-widest mb-1">TUTORIAL</p>
                  {step.title === "Welcome" ? (
                    <p className="text-xl font-black text-white relative inline-block drop-shadow-[0_0_10px_#E04B35]">
                      <span className="absolute -top-3 -left-4 text-xl animate-pulse">✨</span>
                      {step.title}
                      <span className="absolute -bottom-2 -right-4 text-xl animate-pulse delay-75">✨</span>
                    </p>
                  ) : (
                    <p className="text-base font-black text-white">{step.title}</p>
                  )}
                  <p className="text-sm text-light-gray/90 leading-relaxed font-medium">{step.message}</p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-terracotta rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* CTA button */}
            <button
              onClick={advance}
              className="w-full py-3.5 bg-terracotta text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:shadow-[0_0_20px_rgba(224,75,53,0.5)] transition-all active:scale-95 mt-2"
            >
              {isLast ? "Chalo shuru karte hain!" : step.tapTarget || "Got it! Aage badho →"}
            </button>

            <p className="text-center text-[10px] text-muted-ash/50">
              Step {currentStep + 1} of {STEPS.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
