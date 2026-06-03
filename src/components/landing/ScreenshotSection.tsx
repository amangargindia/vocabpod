"use client";

import { useState } from "react";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";
import { useSalesConfig, type SalesConfig } from "./useSalesConfig";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useSwipe } from "@/hooks/useSwipe";

interface Props {
  initialData?: SalesConfig | null;
}

const FALLBACK_SCREENSHOTS = [
  {
    url: "",
    title: "Daily Review Dashboard",
    titleHi: "Daily Review Dashboard",
    subtitle: "Spaced repetition schedule tailored to your memory.",
    subtitleHi: "Aapki memory ke hisaab se tayar kiya gaya spaced repetition schedule.",
  },
  {
    url: "",
    title: "In-Depth Word Analysis",
    titleHi: "In-Depth Word Analysis",
    subtitle: "Etymology, mnemonics, and real-world audio examples.",
    subtitleHi: "Etymology, mnemonics, aur real-world audio examples.",
  },
  {
    url: "",
    title: "Progress Tracking",
    titleHi: "Progress Tracking",
    subtitle: "See exactly how many words you've mastered.",
    subtitleHi: "Exactly kitne words aapne master kiye hain.",
  },
];

export default function ScreenshotSection({ initialData }: Props) {
  const { language } = useLandingLanguage();
  const { config, isLoading } = useSalesConfig(initialData ?? undefined);
  const [currentIndex, setCurrentIndex] = useState(0);

  const rawShots = config.screenshots && config.screenshots.length > 0
    ? config.screenshots.map((s) => ({ url: s.url, title: s.title, titleHi: s.title, subtitle: s.subtitle, subtitleHi: s.subtitle }))
    : FALLBACK_SCREENSHOTS;

  const next = () => setCurrentIndex((p) => (p + 1) % rawShots.length);
  const prev = () => setCurrentIndex((p) => (p - 1 + rawShots.length) % rawShots.length);
  const swipe = useSwipe(next, prev);

  const shot = rawShots[currentIndex];

  return (
    <section className="py-24 px-6 bg-deep-canvas border-y border-white/5 overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <div className="text-center mb-16 animate-[fadeIn_0.6s_ease_both]">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-4 py-1 inline-block">
            INSIDE VOCABPOD
          </span>
          <h2 className="text-5xl md:text-7xl font-black text-light-gray tracking-tight mt-6 max-w-4xl mx-auto">
            {language === "hi" ? "Fluency ke liye banaya gaya system" : "A system built for fluency"}
          </h2>
        </div>

        {isLoading ? (
          <div className="w-8 h-8 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Single card carousel with swipe */}
            <div
              {...swipe}
              className="w-full max-w-xs touch-pan-y animate-[scaleIn_0.35s_ease_both]"
            >
              <div className="flex flex-col items-center group">
                {/* Image — no fixed aspect ratio, fills naturally */}
                <div className="w-full overflow-hidden rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] group-hover:shadow-[0_8px_50px_rgba(224,75,53,0.18)] transition-shadow duration-300 relative">
                  {shot.url ? (
                    <img
                      src={shot.url}
                      alt={language === "hi" ? shot.titleHi : shot.title}
                      className="w-full h-auto block group-hover:scale-[1.015] transition-transform duration-300 origin-center"
                    />
                  ) : (
                    <div className="w-full aspect-[9/19] bg-card-gray border border-white/10 rounded-3xl flex items-center justify-center relative">
                      <span className="text-muted-ash text-[10px] font-bold tracking-widest uppercase opacity-40 text-center px-6">
                        [ Screenshot {currentIndex + 1} ]
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-tr from-terracotta/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="mt-5 text-center px-2">
                  <h4 className="text-base font-bold text-light-gray mb-1">
                    {language === "hi" ? shot.titleHi : shot.title}
                  </h4>
                  <p className="text-xs text-muted-ash leading-relaxed">
                    {language === "hi" ? shot.subtitleHi : shot.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6 mt-8">
              <button
                onClick={prev}
                className="w-12 h-12 rounded-full bg-card-gray border border-white/5 flex items-center justify-center text-light-gray hover:bg-white/10 hover:border-terracotta/30 transition-all active:scale-90"
              >
                <ArrowLeft size={20} />
              </button>
              <span className="text-sm font-bold text-muted-ash tracking-widest font-mono">
                {currentIndex + 1} / {rawShots.length}
              </span>
              <button
                onClick={next}
                className="w-12 h-12 rounded-full bg-card-gray border border-white/5 flex items-center justify-center text-light-gray hover:bg-white/10 hover:border-terracotta/30 transition-all active:scale-90"
              >
                <ArrowRight size={20} />
              </button>
            </div>

            {/* Dot indicators */}
            <div className="flex gap-2 mt-4">
              {rawShots.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "bg-terracotta scale-125" : "bg-white/20"}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
