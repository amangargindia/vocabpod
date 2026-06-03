"use client";

import { useState } from "react";
import MnemonicSVG from "@/components/MnemonicSVG";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";
import { useSalesConfig, type SalesConfig } from "./useSalesConfig";
import { liveToDemoWord, FALLBACK_DEMO_WORDS } from "./demo-data";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useSwipe } from "@/hooks/useSwipe";

interface Props {
  initialData?: SalesConfig | null;
}

export default function MnemonicsSection({ initialData }: Props) {
  const { language } = useLandingLanguage();
  const { words: liveWords, isLoading } = useSalesConfig(initialData ?? undefined);
  const [currentIndex, setCurrentIndex] = useState(0);

  const words = liveWords.length > 0 ? liveWords.map(liveToDemoWord) : FALLBACK_DEMO_WORDS;

  const next = () => setCurrentIndex((p) => (p + 1) % words.length);
  const prev = () => setCurrentIndex((p) => (p - 1 + words.length) % words.length);
  const swipe = useSwipe(next, prev);

  const word = words[Math.min(currentIndex, words.length - 1)];

  return (
    <section className="py-24 px-6 bg-deep-canvas border-t border-white/5 relative overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <div className="text-center mb-16 animate-[fadeIn_0.6s_ease_both]">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-4 py-1 inline-block">
            HOW IT WORKS
          </span>
          <h2 className="text-5xl md:text-7xl font-black text-light-gray tracking-tight mt-6 max-w-4xl mx-auto">
            {language === "hi" ? "Visual Mnemonics" : "Visual Mnemonics"}
          </h2>
          <p className="text-muted-ash mt-4 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            {language === "hi"
              ? "Hamara brain text se 3x zyada visuals yaad rakhta hai. Hum visual mnemonics se vocabulary ko aapki memory me fit kar dete hain."
              : "Brains remember images 3x faster than plain text. Our custom-animated visuals hardwire vocabulary into your memory permanently."}
          </p>
        </div>

        {isLoading ? (
          <div className="w-8 h-8 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />
        ) : (
          <div className="w-full max-w-md mx-auto">
            <div {...swipe} className="touch-pan-y">
              {word && (
                <div className="bg-card-gray border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center hover:border-terracotta/30 transition-all relative group animate-[scaleIn_0.35s_ease_both]">
                  <div className="aspect-square mb-6 flex items-center justify-center bg-absolute-black/40 w-full rounded-3xl overflow-hidden p-1">
                    <MnemonicSVG word={word} size={320} />
                  </div>
                  <h4 className="text-2xl font-black text-light-gray mb-2 uppercase select-none">{word.word}</h4>
                  <p className="text-xs text-terracotta mb-4 uppercase tracking-widest font-mono select-none">{word.phonetic}</p>
                  <p className="text-sm text-muted-ash leading-relaxed select-none">
                    {language === "hi" && word.narrativeHinglish ? word.narrativeHinglish : word.narrative}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-8">
              <button
                onClick={prev}
                className="w-12 h-12 rounded-full bg-card-gray border border-white/5 flex items-center justify-center text-light-gray hover:bg-white/10 hover:border-terracotta/30 transition-all active:scale-90"
              >
                <ArrowLeft size={20} />
              </button>
              <span className="text-sm font-bold text-muted-ash tracking-widest font-mono">
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
