"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";

const LEVEL_META: Record<number, { label: string; color: string; border: string; bg: string; desc: string }> = {
  1: {
    label: "Foundation",
    color: "text-terracotta",
    border: "border-terracotta/20",
    bg: "bg-dark-blush",
    desc: "High-frequency, everyday words that build your core vocabulary.",
  },
  2: {
    label: "Nuance",
    color: "text-terracotta",
    border: "border-terracotta/20",
    bg: "bg-dark-blush",
    desc: "Words that elevate professional and academic writing.",
  },
  3: {
    label: "Mastery",
    color: "text-terracotta",
    border: "border-terracotta/20",
    bg: "bg-dark-blush",
    desc: "Highly specific, complex vocabulary for advanced expression.",
  },
};

function CategoryCard({ name, words, onClick }: { name: string; words: any[]; onClick: () => void }) {
  const levelCounts = [1, 2, 3].map(l => words.filter(w => (w.level ?? 1) === l).length);

  return (
    <button
      onClick={onClick}
      className="group text-left bg-card-gray border border-white/5 rounded-2xl p-5 md:p-6 hover:border-terracotta/30 hover:shadow-[0_0_30px_rgba(224,75,53,0.07)] transition-all duration-300 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="w-8 h-8 rounded-lg bg-dark-blush border border-terracotta/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#E04B35" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M4 6h16M4 10h16M4 14h10" />
          </svg>
        </div>
        <span className="text-[10px] font-bold text-muted-ash uppercase tracking-widest">{words.length} words</span>
      </div>

      <div>
        <h3 className="text-xl font-black text-light-gray tracking-tight group-hover:text-terracotta transition-colors capitalize">
          {name}
        </h3>
        <div className="flex items-center space-x-3 mt-3">
          {[1, 2, 3].map((l, i) => levelCounts[i] > 0 && (
            <span key={l} className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${LEVEL_META[l].color} ${LEVEL_META[l].border} ${LEVEL_META[l].bg}`}>
              L{l}: {levelCounts[i]}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center text-xs font-bold uppercase tracking-widest text-muted-ash group-hover:text-terracotta transition-colors">
        Explore &rarr;
      </div>
    </button>
  );
}

function WordList({ words, isPremium, onClose, category }: { words: any[]; isPremium: boolean; onClose: () => void; category: string }) {
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const filtered = levelFilter ? words.filter(w => (w.level ?? 1) === levelFilter) : words;

  return (
    <div className="fixed inset-0 z-50 bg-absolute-black/90 backdrop-blur-md flex items-start justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-2xl mt-10 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-light-gray capitalize">{category}</h2>
            <p className="text-sm text-muted-ash">{words.length} words in this journey</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-card-gray border border-white/10 flex items-center justify-center text-muted-ash hover:text-light-gray transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Level filter */}
        <div className="flex items-center space-x-2">
          {[null, 1, 2, 3].map(l => (
            <button
              key={String(l)}
              onClick={() => setLevelFilter(l)}
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-colors ${
                levelFilter === l
                  ? "bg-dark-blush border-terracotta/30 text-terracotta"
                  : "border-white/10 text-muted-ash hover:text-light-gray"
              }`}
            >
              {l === null ? "All" : `L${l} - ${LEVEL_META[l].label}`}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(w => {
            const level = w.level ?? 1;
            const meta = LEVEL_META[level];
            const accessible = isPremium || w.is_free_preview;
            return (
              <Link
                key={w.id}
                href={`/lesson/${w.word}`}
                className="flex items-center justify-between p-5 bg-card-gray border border-white/5 rounded-2xl hover:border-terracotta/30 transition-all group"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-lg uppercase tracking-tight group-hover:text-terracotta transition-colors">{w.word}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${meta.color} ${meta.border} ${meta.bg}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-ash truncate max-w-sm">{w.definition}</p>
                </div>
                {!accessible && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.5" className="w-4 h-4 shrink-0 ml-4">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function JourneyPage() {
  const [allWords, setAllWords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [levelView, setLevelView] = useState<number | null>(null);
  const { isPremium, isLoadingAuth } = useAuth();

  useEffect(() => {
    async function load() {
      // Fetch all words with level + category, bypassing cache
      const res = await fetch(`/api/words?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setAllWords(data.words || []);
      setIsLoading(false);
    }
    if (!isLoadingAuth) {
      load();
    }
  }, [isLoadingAuth]);

  // Group by category
  const byCategory: Record<string, any[]> = {};
  const uncategorized: any[] = [];
  for (const w of allWords) {
    if (w.category) {
      if (!byCategory[w.category]) byCategory[w.category] = [];
      byCategory[w.category].push(w);
    } else {
      uncategorized.push(w);
    }
  }

  const categoryNames = Object.keys(byCategory).sort();
  const selectedWords = selectedCategory
    ? (selectedCategory === "__uncategorized__" ? uncategorized : byCategory[selectedCategory] || [])
    : [];

  // Words filtered by level for level view
  const levelWords = levelView ? allWords.filter(w => (w.level ?? 1) === levelView) : [];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-absolute-black text-light-gray font-sans">
<div className="flex-1 min-w-0 pb-[70px] md:pb-0">
        <header className="sticky top-0 z-30 backdrop-blur-md bg-absolute-black/80 border-b border-white/5 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex flex-1 justify-start md:justify-center">
            <Logo className="w-32 md:w-40 h-10 md:h-14" />
          </div>
          <div className="flex-1 flex justify-end">
            <span className="text-[10px] md:text-xs text-muted-ash">{allWords.length} words</span>
          </div>
        </header>

        <main className="px-4 pt-4 pb-8 md:px-10 md:py-10 max-w-5xl mx-auto space-y-12">

          {/* Level paths */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-ash">Browse by Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {[1, 2, 3].map(l => {
                const meta = LEVEL_META[l];
                const count = allWords.filter(w => (w.level ?? 1) === l).length;
                return (
                  <button
                    key={l}
                    onClick={() => setLevelView(l)}
                    className={`group text-left p-5 md:p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${meta.bg} ${meta.border} hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]`}
                  >
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${meta.color}`}>Level {l}</div>
                    <div className="text-xl font-black text-light-gray mb-1">{meta.label}</div>
                    <div className="text-xs text-muted-ash mb-3 leading-relaxed">{meta.desc}</div>
                    <div className={`text-[10px] font-bold ${meta.color}`}>{count} words &rarr;</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Category journeys */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-ash">Browse by Theme</h2>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-card-gray rounded-3xl" />)}
              </div>
            ) : categoryNames.length === 0 && uncategorized.length === 0 ? (
              <p className="text-muted-ash py-8">No words added yet. Add some from the admin portal.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {categoryNames.map(cat => (
                  <CategoryCard
                    key={cat}
                    name={cat}
                    words={byCategory[cat]}
                    onClick={() => setSelectedCategory(cat)}
                  />
                ))}
                {uncategorized.length > 0 && (
                  <CategoryCard
                    name="Uncategorized"
                    words={uncategorized}
                    onClick={() => setSelectedCategory("__uncategorized__")}
                  />
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Category word list modal */}
      {selectedCategory && (
        <WordList
          words={selectedWords}
          isPremium={isPremium}
          category={selectedCategory === "__uncategorized__" ? "Uncategorized" : selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}

      {/* Level word list modal */}
      {levelView && (
        <WordList
          words={levelWords}
          isPremium={isPremium}
          category={`Level ${levelView} - ${LEVEL_META[levelView].label}`}
          onClose={() => setLevelView(null)}
        />
      )}
    </div>
  );
}
