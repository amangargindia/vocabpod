"use client";

import React, { useEffect, useState, useCallback } from "react";

const TUTORIAL_KEY = "vocabpod_tutorial_seen";

interface TutorialStep {
  id: string;
  title: string;
  message: string;
  highlight?: string; // CSS selector to spotlight
  position: "top" | "bottom" | "center";
  stickmanPose: "pointing" | "waving" | "reading" | "thinking" | "dancing";
  tapTarget?: string; // text describing what to tap
}

const STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Namaste!",
    message:
      "Main hoon aapka VocabPod guide — ek chhota sa stickman! Main aapko poori app ke baare mein bataunga. Chalte hain!",
    position: "center",
    stickmanPose: "waving",
  },
  {
    id: "dashboard-tabs",
    title: "Yahan hai aapka daily plan",
    message:
      "'Words for Today' tab mein woh words hain jo aaj seekhne hain — 5 naye words aur jo review ke liye due hain. 'Done for Now' mein woh words hain jo aap seekh chuke hain.",
    position: "top",
    stickmanPose: "pointing",
    tapTarget: "Neeche 'Got it!' button dabayein",
  },
  {
    id: "new-words",
    title: "Naye Words",
    message:
      "Yeh hain aaj ke naye words. Har word ek poori lesson ke saath aata hai — meaning, story, mnemonic image, real-life usage, aur quiz. Ek word par tap karein aur poora lesson dekhein!",
    position: "bottom",
    stickmanPose: "reading",
    tapTarget: "Kisi bhi word card par tap karein",
  },
  {
    id: "review-words",
    title: "Review Words",
    message:
      "Yeh woh words hain jo aapne pehle seekhe the, lekin ab review ke liye aa gaye hain. Spaced Repetition system — yaani sahi waqt par dobarana padhna — memory ko pakka karta hai!",
    position: "bottom",
    stickmanPose: "thinking",
    tapTarget: "'Got it!' dabayein aur aage badhein",
  },
  {
    id: "daily-quota",
    title: "5 Words Roz!",
    message:
      "VocabPod mein roz sirf 5 naye words hain — zyada nahi, kam nahi. Research kehti hai ki 5 words roz consistently karna, 50 words ek din mein padhne se kaafi zyada effective hai!",
    position: "top",
    stickmanPose: "pointing",
    tapTarget: "'Got it!' dabayein",
  },
  {
    id: "lesson-flow",
    title: "Lesson Kaise Kaam Karta Hai?",
    message:
      "Har lesson mein 7 cards hain: Word → Meaning → Story → Mnemonic Image → Real-Life Usage → Quiz → Complete! Quiz pass karein, toh word aapke review schedule mein add ho jaata hai.",
    position: "center",
    stickmanPose: "reading",
    tapTarget: "'Got it!' dabayein",
  },
  {
    id: "spaced-repetition",
    title: "Memory Science!",
    message:
      "Jab aap quiz sahi karein, word agle review ke liye door bhej diya jaata hai. Galat karein toh kal wapas aata hai. Yeh hai Spaced Repetition — duniya ki best memory technique!",
    position: "center",
    stickmanPose: "dancing",
    tapTarget: "'Got it!' dabayein",
  },
  {
    id: "autoplay",
    title: "Autoplay Mode",
    message:
      "Autoplay mein sab words ki audio sunai deti hai — walk karte hue, drive karte hue, ya so ne se pehle. Premium feature hai, lekin kaafi powerful hai passive learning ke liye!",
    position: "center",
    stickmanPose: "waving",
    tapTarget: "'Got it!' dabayein",
  },
  {
    id: "flashcards",
    title: "Flashcards",
    message:
      "Flashcards mein sab words ki quick revision hoti hai — flip karke meaning dekhein. Active recall practice ke liye perfect hai!",
    position: "center",
    stickmanPose: "pointing",
    tapTarget: "'Got it!' dabayein",
  },
  {
    id: "profile",
    title: "Aapka Profile",
    message:
      "Profile mein apna naam set karein, leaderboard mein dikhne ke liye. Tutorial dubara dekhna ho toh Profile → 'Tutorial Dubara Dekho' button dabayein. Ab shuru karte hain — pehla word kholein!",
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
  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  useEffect(() => {
    // Small delay so page is settled before showing
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

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
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.stopPropagation()}
    >
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
                  <p className="text-base font-black text-white">{step.title}</p>
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
