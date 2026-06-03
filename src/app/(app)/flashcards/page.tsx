"use client";

import { useEffect, useState } from "react";
import { useVocabProgress } from "@/hooks/useVocabProgress";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import Link from "next/link";
import { getTodayIST, toISTDateString } from "@/lib/dateUtils";

interface Flashcard {
  id: string;
  word: string;
  phonetic: string;
  type: string;
  definition: string;
  narrative: string;
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoadingAuth } = useAuth();
  const { stats, getWordProgress, isLoaded } = useVocabProgress(user?.id, !isLoadingAuth);

  const shuffleCards = (array: Flashcard[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/words");
      const data = await res.json();
      
      const completedWords = (data.words || []).filter((w: any) => getWordProgress(w.word)?.is_completed);
      
      const today = getTodayIST();
      const newWordsCompletedToday = Object.values(stats.progressList).filter((p: any) =>
        p.first_completed_at && toISTDateString(p.first_completed_at) === today
      ).length;
      
      const remainingQuota = Math.max(0, 5 - newWordsCompletedToday);
      const uncompletedWords = (data.words || []).filter((w: any) => !getWordProgress(w.word)?.is_completed);
      const shuffledUncompleted = shuffleCards(uncompletedWords);
      const quotaWords = shuffledUncompleted.slice(0, remainingQuota);
      
      const queue = [...completedWords, ...quotaWords];
      const shuffled = shuffleCards(queue);
      
      setCards(shuffled);
      setIsLoading(false);
    }
    if (!isLoadingAuth && isLoaded) {
      load();
    }
  }, [isLoadingAuth, isLoaded]);

  const current = cards[index];
  const total = cards.length;

  const next = () => { setFlipped(false); setTimeout(() => setIndex(i => Math.min(i + 1, total)), 150); };
  const prev = () => { setFlipped(false); setTimeout(() => setIndex(i => Math.max(i - 1, 0)), 150); };

  return (
    <div className="flex min-h-screen bg-absolute-black text-light-gray font-sans">
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 backdrop-blur-md bg-absolute-black/80 border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <Link href="/">
              <Logo className="w-24 md:w-32 h-8 md:h-10" />
            </Link>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <h1 className="text-sm md:text-base font-black uppercase tracking-widest text-light-gray">Flashcards</h1>
            <div className="flex items-center space-x-1.5 mt-0.5 opacity-70">
              <div className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
              <p className="text-[8px] md:text-[10px] text-muted-ash uppercase tracking-widest">Active Playlist</p>
            </div>
          </div>
          <div className="flex-1 flex justify-end">
            {total > 0 && index < total && (
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
          ) : index === total ? (
            <div className="text-center space-y-6 max-w-sm mx-auto px-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10 text-emerald-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-light-gray uppercase tracking-tight">Flashcards Complete!</h2>
                <p className="text-muted-ash text-sm">You've reviewed all your available words.</p>
              </div>
              <Link href="/autoplay" className="block w-full bg-terracotta text-light-gray font-bold py-4 rounded-xl hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all uppercase tracking-widest text-sm">
                Go to Autoplay
              </Link>
              <button onClick={() => setIndex(0)} className="block w-full text-muted-ash hover:text-light-gray text-xs font-bold uppercase tracking-widest transition-colors mt-4">
                Review Again
              </button>
            </div>
          ) : (
            <div className="w-full max-w-md space-y-8">
              <div className="flex items-center justify-center space-x-1.5 flex-wrap gap-y-1">
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

              <div
                onClick={() => setFlipped(f => !f)}
                className="cursor-pointer select-none"
                style={{ perspective: "1000px" }}
              >
                <div
                  className="relative w-full transition-transform duration-500 grid"
                  style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                >
                  <div
                    className="col-start-1 row-start-1 w-full h-full max-w-full overflow-hidden min-w-0 bg-card-gray border border-white/5 rounded-3xl p-6 md:p-10 flex flex-col justify-center items-center text-center space-y-5 shadow-2xl min-h-[300px]"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  >
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-light-gray uppercase break-words w-full">{current?.word}</h2>
                    <p className="text-sm text-muted-ash break-words w-full">{current?.phonetic}</p>
                    <p className="text-xs text-muted-ash/60 uppercase tracking-widest font-bold mt-6">Tap to reveal</p>
                  </div>

                  <div
                    className="col-start-1 row-start-1 w-full h-full max-w-full overflow-hidden min-w-0 bg-dark-blush border border-terracotta/20 rounded-3xl p-6 md:p-10 flex flex-col justify-center items-center text-center space-y-5 shadow-2xl min-h-[300px]"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <span className="text-[10px] font-black text-terracotta uppercase tracking-widest">{current?.type}</span>
                    <p className="text-lg md:text-xl font-bold text-light-gray leading-relaxed break-words w-full">{current?.definition}</p>
                  </div>
                </div>
              </div>

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
                  className="w-12 h-12 rounded-full bg-card-gray border border-white/10 flex items-center justify-center text-muted-ash hover:text-light-gray hover:border-white/30 transition-all"
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
