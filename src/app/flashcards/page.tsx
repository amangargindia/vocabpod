"use client";

import { useEffect, useState } from "react";
import { useVocabProgress } from "@/hooks/useVocabProgress";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import Link from "next/link";

interface Flashcard {
  word: string;
  phonetic: string;
  type: string;
  definition: string;
  narrative: string;
  level: number;
}

const LEVEL_LABEL: Record<number, string> = { 1: "Foundation", 2: "Nuance", 3: "Mastery" };
// All levels use the terracotta theme color
const LEVEL_COLOR: Record<number, string> = {
  1: "text-terracotta border-terracotta/30 bg-terracotta/8",
  2: "text-terracotta border-terracotta/30 bg-terracotta/8",
  3: "text-terracotta border-terracotta/30 bg-terracotta/8",
};



export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoadingAuth } = useAuth();
  const { getWordProgress, isLoaded } = useVocabProgress(user?.id, !isLoadingAuth);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/words");
      const data = await res.json();
      // Only show completed words in flashcard review
      const learned = (data.words || []).filter((w: any) => getWordProgress(w.word)?.is_completed);
      // Randomize flashcards
      setCards(learned.sort(() => Math.random() - 0.5));
      setIsLoading(false);
    }
    if (!isLoadingAuth && isLoaded) {
      load();
    }
  }, [isLoadingAuth, isLoaded]);

  const current = cards[index];
  const total = cards.length;

  const next = () => { setFlipped(false); setTimeout(() => setIndex(i => Math.min(i + 1, total - 1)), 150); };
  const prev = () => { setFlipped(false); setTimeout(() => setIndex(i => Math.max(i - 1, 0)), 150); };

  return (
    <div className="flex min-h-screen bg-absolute-black text-light-gray font-sans">
<div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 backdrop-blur-md bg-absolute-black/80 border-b border-white/5 px-6 py-4 flex items-center justify-between">
          {/* Left — Logo */}
          <div className="flex-1">
            <Link href="/">
              <Logo className="w-24 md:w-32 h-8 md:h-10" />
            </Link>
          </div>

          {/* Center — Title + subtitle */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <h1 className="text-sm md:text-base font-black uppercase tracking-widest text-light-gray">Flashcards</h1>
            <div className="flex items-center space-x-1.5 mt-0.5 opacity-70">
              <div className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
              <p className="text-[8px] md:text-[10px] text-muted-ash uppercase tracking-widest">Learned Words Only</p>
            </div>
          </div>

          {/* Right — card counter */}
          <div className="flex-1 flex justify-end">
            {total > 0 && (
              <span className="text-xs text-muted-ash font-bold">{index + 1} / {total}</span>
            )}
          </div>
        </header>

        <main className="px-6 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">

          {isLoading ? (
            <div className="w-full max-w-md h-72 bg-card-gray rounded-3xl animate-pulse" />
          ) : total === 0 ? (
            <div className="text-center space-y-4 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-card-gray border border-white/10 flex items-center justify-center mx-auto">
                <svg viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.5" className="w-8 h-8">
                  <rect x="2" y="4" width="20" height="14" rx="2" />
                  <path d="M8 4v14" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-light-gray">No cards yet</h2>
              <p className="text-sm text-muted-ash">Complete some word lessons first. Your learned words will appear here for review.</p>
            </div>
          ) : (
            <div className="w-full max-w-md space-y-8">

              {/* Progress dots */}
              <div className="flex items-center justify-center space-x-1.5">
                {cards.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setFlipped(false); setIndex(i); }}
                    className={`rounded-full transition-all ${
                      i === index ? "w-5 h-2 bg-terracotta" : "w-2 h-2 bg-white/10 hover:bg-white/20"
                    }`}
                  />
                ))}
              </div>

              {/* Card */}
              <div
                onClick={() => setFlipped(f => !f)}
                className="cursor-pointer select-none"
                style={{ perspective: "1000px" }}
              >
                <div
                  className="relative w-full transition-transform duration-500"
                  style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                >
                  {/* Front */}
                  <div
                    className="w-full bg-card-gray border border-white/5 rounded-3xl p-10 text-center space-y-5 shadow-2xl"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  >
                    <div className="space-y-1">
                      {current && (
                        <span className={`text-[10px] font-black uppercase tracking-widest border rounded-full px-3 py-0.5 ${LEVEL_COLOR[current.level ?? 1]}`}>
                          {LEVEL_LABEL[current.level ?? 1]}
                        </span>
                      )}
                    </div>
                    <h2 className="text-5xl font-black tracking-tight text-light-gray uppercase">{current?.word}</h2>
                    <p className="text-sm text-muted-ash">{current?.phonetic}</p>
                    <p className="text-xs text-muted-ash/60 uppercase tracking-widest font-bold mt-6">Tap to reveal</p>
                  </div>

                  {/* Back */}
                  <div
                    className="absolute inset-0 w-full bg-dark-blush border border-terracotta/20 rounded-3xl p-10 text-center space-y-5 shadow-2xl"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <span className="text-[10px] font-black text-terracotta uppercase tracking-widest">{current?.type}</span>
                    <p className="text-xl font-bold text-light-gray leading-relaxed">{current?.definition}</p>
                    {current?.narrative && (
                      <p className="text-sm text-muted-ash italic leading-relaxed border-t border-white/5 pt-4">
                        {current.narrative.slice(0, 120)}{current.narrative.length > 120 ? "..." : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center space-x-5">
                <button
                  onClick={prev}
                  disabled={index === 0}
                  className="w-12 h-12 rounded-full bg-card-gray border border-white/10 flex items-center justify-center text-muted-ash hover:text-light-gray hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                <button
                  onClick={() => setFlipped(f => !f)}
                  className="px-6 py-3 bg-dark-blush border border-terracotta/30 text-terracotta text-xs font-bold uppercase tracking-widest rounded-full hover:bg-terracotta hover:text-light-gray transition-all"
                >
                  {flipped ? "Show Word" : "Show Answer"}
                </button>

                <button
                  onClick={next}
                  disabled={index === total - 1}
                  className="w-12 h-12 rounded-full bg-card-gray border border-white/10 flex items-center justify-center text-muted-ash hover:text-light-gray hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>


            </div>
          )}
        </main>
      </div>
    </div>
  );
}
