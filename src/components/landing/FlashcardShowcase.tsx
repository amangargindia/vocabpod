"use client";

import { useState } from "react";
import { liveToDemoWord, FALLBACK_DEMO_WORDS } from "./demo-data";
import { useSalesConfig, type SalesConfig } from "./useSalesConfig";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";
import { useSwipe } from "@/hooks/useSwipe";

interface Props {
  initialData?: SalesConfig | null;
}

export default function FlashcardShowcase({ initialData }: Props) {
  const { language } = useLandingLanguage();
  const { words: liveWords, isLoading } = useSalesConfig(initialData ?? undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const words = liveWords.length > 0 ? liveWords.map(liveToDemoWord) : FALLBACK_DEMO_WORDS;
  const word = words[Math.min(currentIndex, words.length - 1)];

  const next = () => { setIsFlipped(false); setCurrentIndex((p) => (p + 1) % words.length); };
  const prev = () => { setIsFlipped(false); setCurrentIndex((p) => (p - 1 + words.length) % words.length); };
  const swipe = useSwipe(next, prev);

  return (
    <section className="py-24 px-6 bg-absolute-black relative overflow-hidden">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="text-center mb-16 animate-[fadeIn_0.6s_ease_both]">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-4 py-1 inline-block">
            ACTIVE RECALL
          </span>
          <h2 className="text-5xl md:text-7xl font-black text-light-gray tracking-tight mt-6 max-w-4xl mx-auto">
            Interactive Flashcards
          </h2>
          <p className="text-muted-ash mt-4 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            {language === "hi"
              ? "Answer dekhne se pehle khud ko test karein. Hamare flashcards words tab dikhate hain jab aap unhe bhoolne wale hote hain (SRS technique)."
              : "Test yourself before looking at the answer. Powered by Spaced Repetition (SRS) to show words right before you forget them."}
          </p>
        </div>

        {isLoading ? (
          <div className="w-8 h-8 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />
        ) : (
          <div className="w-full max-w-md">
            {/* Card with swipe */}
            <div
              {...swipe}
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full aspect-[3/4] relative cursor-pointer touch-pan-y"
              style={{ perspective: "1000px" }}
            >
              <div
                className="w-full h-full relative transition-transform duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 bg-card-gray border border-terracotta/20 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl hover:shadow-[0_0_30px_rgba(224,75,53,0.15)] transition-shadow"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="absolute top-6 right-6 text-xs font-bold text-muted-ash tracking-widest uppercase">
                    FRONT
                  </span>
                  <h3 className="text-4xl font-black text-light-gray uppercase tracking-widest">
                    {word.word}
                  </h3>
                  <p className="text-terracotta mt-4 uppercase tracking-widest text-sm font-bold opacity-60">
                    {language === "hi" ? "Flip karne ke liye tap karein" : "Tap to flip"}
                  </p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 bg-deep-canvas border border-terracotta/40 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <span className="absolute top-6 right-6 text-xs font-bold text-muted-ash tracking-widest uppercase">
                    BACK
                  </span>
                  <div className="w-full h-full flex flex-col overflow-y-auto hide-scrollbar items-center text-center justify-center gap-3">
                    <h3 className="text-2xl font-black text-light-gray uppercase mb-1">{word.word}</h3>
                    <p className="text-terracotta text-xs mb-2 font-mono">{word.phonetic}</p>
                    <p className="text-light-gray text-base leading-relaxed mb-4">{word.definition}</p>
                    <div className="bg-terracotta/10 p-4 rounded-xl w-full border-l-2 border-terracotta">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta mb-1 block">
                        USE CASE
                      </span>
                      <p className="text-xs text-light-gray">
                        {language === "hi" && (word as any).realLifeUseCaseHinglish
                          ? (word as any).realLifeUseCaseHinglish
                          : word.realLifeUseCase}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={prev}
                className="w-12 h-12 rounded-full bg-card-gray border border-white/5 flex items-center justify-center text-light-gray hover:bg-white/10 hover:border-terracotta/30 transition-all active:scale-90"
              >
                <ArrowLeft size={20} />
              </button>
              <span className="text-sm font-bold text-muted-ash tracking-widest">
                {currentIndex + 1} / {words.length}
              </span>
              <button
                onClick={next}
                className="w-12 h-12 rounded-full bg-card-gray border border-white/5 flex items-center justify-center text-light-gray hover:bg-white/10 hover:border-terracotta/30 transition-all active:scale-90"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
