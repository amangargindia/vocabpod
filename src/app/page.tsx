"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { getWordFeed } from "@/lib/supabase";
import { useVocabProgress } from "@/hooks/useVocabProgress";
import { useAuth } from "@/contexts/AuthContext";
import { getTodayIST, toISTDateString } from "@/lib/dateUtils";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import BugReportModal from "@/components/BugReportModal";

const LEVEL_LABELS: Record<number, string> = {
  1: "Foundation",
  2: "Nuance",
  3: "Mastery",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "text-terracotta bg-dark-blush border-terracotta/20",
  2: "text-terracotta bg-dark-blush border-terracotta/20",
  3: "text-terracotta bg-dark-blush border-terracotta/20",
};

export default function Dashboard() {
  const [feed, setFeed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const infoMenuRef = useRef<HTMLDivElement>(null);
  const { stats, isLoaded, getWordProgress } = useVocabProgress();
  const { user, isPremium, isLoadingAuth } = useAuth();

  useEffect(() => {
    async function loadData() {
      try {
        const words = await getWordFeed();
        setFeed(words || []);

        // Check if premium user needs to enter phone
        if (isPremium && user?.id && !isLoadingAuth) {
          try {
            const profileRes = await fetch(`/api/profile?userId=${user.id}`);
            const profileData = await profileRes.json();
            if (profileData.profile && !profileData.profile.phone) {
              setShowPhoneModal(true);
            }
          } catch (e) {}
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    if (!isLoadingAuth) {
      loadData();
    }
  }, [isLoadingAuth, isPremium, user?.id]);

  const handleSavePhone = async () => {
    if (!user?.id || !phoneInput.trim()) return;
    setPhoneSaving(true);
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, phone: phoneInput.trim() }),
      });
      setShowPhoneModal(false);
    } catch (e) {}
    setPhoneSaving(false);
  };

  const [disabledLevels, setDisabledLevels] = useState<number[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("vocabpod_disabled_levels");
    if (saved) {
      try {
        setDisabledLevels(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // IST-aware today — resets at 12:00 AM IST (midnight India time)
  const today = getTodayIST();

  // New-word cap: count words completed for the FIRST time in IST today
  // Uses first_completed_at (UTC) converted to IST date for accurate comparison
  const newWordsCompletedToday = isLoaded
    ? stats.progressList.filter(p =>
        p.first_completed_at && toISTDateString(p.first_completed_at) === today
      ).length
    : 0;

  // Words due for SRS review today — next_review_at (UTC) mapped to IST date
  const srsReviewDueSlugs = new Set(
    stats.progressList
      .filter(p => p.is_completed && p.next_review_at && toISTDateString(p.next_review_at) <= today)
      .map(p => p.word_slug)
  );

  // Filter feed by disabled levels
  let baseFeed = feed;
  if (disabledLevels.length > 0) {
    baseFeed = feed.filter(w => !disabledLevels.includes(w.level ?? 1));
  }

  // SRS-aware daily words:
  // Priority 1: completed words due for SRS review today
  // Priority 2: new unseen words (up to 5-word cap)
  let dailyWords: any[] = [];
  if (baseFeed.length > 0) {
    // Words already reviewed in IST today (don't re-surface)
    const reviewedTodaySlugs = new Set(
      stats.progressList
        .filter(p => p.last_reviewed_at && toISTDateString(p.last_reviewed_at) === today)
        .map(p => p.word_slug)
    );

    // SRS due words (skip if already reviewed today)
    const srsWords = baseFeed.filter(
      w => srsReviewDueSlugs.has(w.word.toLowerCase()) && !reviewedTodaySlugs.has(w.word.toLowerCase())
    );

    // New (unseen or incomplete) words
    const newWords = baseFeed.filter(
      w => !getWordProgress(w.word)?.is_completed && !reviewedTodaySlugs.has(w.word.toLowerCase())
    );

    // Deterministic shuffle of new words by date+userId seed
    if (user?.id && newWords.length > 0) {
      const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const seedString = `${user.id}-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      let h = 0;
      for (let i = 0; i < seedString.length; i++) h = Math.imul(31, h) + seedString.charCodeAt(i) | 0;
      const seed = Math.abs(h);
      const rng = (s: number) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };
      newWords.sort((a, b) => rng(a.word.charCodeAt(0) + seed) - rng(b.word.charCodeAt(0) + seed));
    }

    // Combine: SRS reviews first, then new words (capped at 2 daily new words if no SRS due)
    const newWordsToShow = newWordsCompletedToday >= 5 ? [] : newWords.slice(0, Math.max(0, 2 - srsWords.length));
    dailyWords = [...srsWords.slice(0, 2), ...newWordsToShow].slice(0, 2);
  }

  const filteredFeed = levelFilter
    ? baseFeed.filter(w => (w.level ?? 1) === levelFilter)
    : baseFeed;

  const incompleteFeed = filteredFeed.filter(w => !getWordProgress(w.word)?.is_completed);
  const completedFeed = filteredFeed
    .filter(w => getWordProgress(w.word)?.is_completed)
    .sort((a, b) => {
      // Sort: due for review first, then by next_review_at ascending
      const aDue = srsReviewDueSlugs.has(a.word) ? 0 : 1;
      const bDue = srsReviewDueSlugs.has(b.word) ? 0 : 1;
      if (aDue !== bDue) return aDue - bDue;
      const aDate = getWordProgress(a.word)?.next_review_at ?? "9999";
      const bDate = getWordProgress(b.word)?.next_review_at ?? "9999";
      return aDate.localeCompare(bDate);
    });


  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-absolute-black text-light-gray font-sans selection:bg-terracotta/20 selection:text-terracotta">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
<div className="flex-1 flex flex-col min-w-0 pb-[70px] md:pb-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 backdrop-blur-md bg-absolute-black/80 border-b border-white/5 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex flex-1 justify-start md:justify-center items-center gap-2 relative">
            <Link href="/">
              <Logo className="w-32 md:w-40 h-10 md:h-14" />
            </Link>
            {/* Mail icon — dropdown for About / Contact / Bug Report */}
            <div className="relative" ref={infoMenuRef}>
              <button
                onClick={() => setShowInfoMenu(p => !p)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-muted-ash hover:text-light-gray hover:border-white/20 transition-colors"
                aria-label="Info menu"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </button>
              {showInfoMenu && (
                <div className="absolute left-0 top-full mt-2 w-44 bg-card-gray border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-[fadeIn_0.15s_ease]">
                  <Link
                    href="/about"
                    onClick={() => setShowInfoMenu(false)}
                    className="flex items-center space-x-2.5 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-ash hover:text-light-gray hover:bg-white/5 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                    </svg>
                    <span>About</span>
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setShowInfoMenu(false)}
                    className="flex items-center space-x-2.5 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-ash hover:text-terracotta hover:bg-white/5 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <span>Contact</span>
                  </Link>
                  <div className="border-t border-white/5 my-1" />
                  <div className="px-4 py-2">
                    <BugReportModal userId={user?.id} />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 flex justify-end items-center space-x-3">
            {isPremium && (
              <Link href="/features" className="hover:-translate-y-0.5 transition-transform">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                </svg>
              </Link>
            )}
            <Link href="/profile" className="w-8 h-8 rounded-full bg-card-gray border border-white/10 flex items-center justify-center text-xs font-bold text-muted-ash uppercase hover:text-light-gray hover:border-terracotta/50 transition-colors">
              {user?.email?.charAt(0) ?? "?"}
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 pt-4 pb-8 md:px-10 md:py-10 max-w-5xl w-full mx-auto space-y-6 md:space-y-10">

          {/* Daily CTA */}
          {dailyWords.length > 0 && (
            <section className="bg-dark-blush border border-terracotta/20 rounded-3xl p-6 md:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-[0_0_40px_rgba(224,75,53,0.07)]">
              <div className="space-y-2 md:space-y-1 w-full">
                <div className="flex items-center space-x-3 mb-1 group/streak relative cursor-help">
                  <span className="text-xs font-bold uppercase tracking-widest text-terracotta">Today's Words</span>
                  <div className="flex items-center space-x-1.5 text-terracotta bg-terracotta/10 px-3 py-1 rounded-full border border-terracotta/20 hover:bg-terracotta/20 transition-colors">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 drop-shadow-[0_0_8px_rgba(224,75,53,0.5)]">
                      <path d="M17.5 10c0 4.142-3.358 7.5-7.5 7.5A7.502 7.502 0 012.83 12c.983.82 2.215 1.25 3.42 1.05 1.48-.25 2.5-1.5 2.5-2.5 0-1.25-1-2-2.5-2 1-3 3-4.5 4.5-6.5C12.5 4.5 12 7 13.5 8c1 1.5 4 0 4 2z" />
                    </svg>
                    <span className="text-sm font-black">{isLoaded ? stats.currentStreak : "-"}</span>
                  </div>
                  {/* Streak Popover */}
                  <div className="absolute top-full left-0 mt-2 w-48 bg-card-gray border border-terracotta/20 rounded-xl p-3 shadow-2xl opacity-0 group-hover/streak:opacity-100 pointer-events-none transition-opacity z-50">
                    <p className="text-[10px] text-muted-ash leading-relaxed">
                      Your streak increases when you complete a new word's quiz!
                    </p>
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-light-gray tracking-tight leading-tight">
                  {dailyWords.map(w => w.word).join(" & ")}
                </h2>
                <p className="text-sm text-muted-ash">50+ words a month, 2 minutes a day.</p>
              </div>
              <Link
                href={`/lesson/${dailyWords[0]?.word}`}
                className="w-full md:w-auto text-center shrink-0 bg-terracotta text-light-gray font-bold px-6 py-4 md:py-3 rounded-full text-sm uppercase tracking-widest hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] hover:-translate-y-0.5 transition-all"
              >
                Start Daily Word
              </Link>
            </section>
          )}


          {/* 5 New Words Limit — Motivational Section */}
          {newWordsCompletedToday >= 5 && srsReviewDueSlugs.size === 0 && (
            <section className="bg-card-gray border border-white/8 rounded-3xl overflow-hidden shadow-2xl">
              {/* Top header bar */}
              <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">5 of 5 done</p>
                    <p className="text-lg font-black text-light-gray leading-tight">Today's words complete!</p>
                  </div>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-xs text-muted-ash uppercase tracking-widest">New words</p>
                  <p className="text-xs font-bold text-terracotta">Tomorrow</p>
                </div>
              </div>

              {/* SVG Comparison Section */}
              <div className="px-6 md:px-8 pb-2">
                <p className="text-sm font-semibold text-light-gray mb-1">Why 5 words a day beats doing it all at once</p>
                <p className="text-xs text-muted-ash leading-relaxed mb-5">5 words × 30 days = 150 words. That&apos;s the entire foundation vocabulary. Cramming 50 in one day leads to forgetting 80% within a week.</p>

                {/* SVG Comparison Chart */}
                <div className="grid grid-cols-2 gap-3 md:gap-5 mb-5">
                  {/* Consistent learner */}
                  <div className="bg-absolute-black/60 rounded-2xl p-4 border border-emerald-500/15">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-3">Consistent — You ✓</p>
                    <svg viewBox="0 0 160 80" className="w-full h-16 md:h-20">
                      {/* Grid lines */}
                      {[20, 40, 60, 80].map(y => (
                        <line key={y} x1="0" y1={y} x2="160" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      ))}
                      {/* Steadily rising bars — 6 bars, each taller */}
                      {[
                        { x: 4, h: 12, d: "D1-5" },
                        { x: 28, h: 24, d: "D6-10" },
                        { x: 52, h: 36, d: "D11-15" },
                        { x: 76, h: 50, d: "D16-20" },
                        { x: 100, h: 62, d: "D21-25" },
                        { x: 124, h: 76, d: "D26-30" },
                      ].map(({ x, h, d }) => (
                        <g key={x}>
                          <rect x={x} y={80 - h} width="18" height={h} rx="3" fill="#10b981" fillOpacity="0.75" />
                          <rect x={x} y={80 - h} width="18" height="3" rx="1.5" fill="#34d399" fillOpacity="0.9" />
                        </g>
                      ))}
                      {/* Trend line */}
                      <polyline
                        points="13,69 37,57 61,45 85,31 109,19 133,5"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        strokeOpacity="0.6"
                      />
                    </svg>
                    <p className="text-[10px] text-emerald-400/80 mt-2 font-medium">150 words mastered</p>
                  </div>

                  {/* Crammer */}
                  <div className="bg-absolute-black/60 rounded-2xl p-4 border border-terracotta/15">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-terracotta mb-3">All at once — Crammer ✗</p>
                    <svg viewBox="0 0 160 80" className="w-full h-16 md:h-20">
                      {/* Grid lines */}
                      {[20, 40, 60, 80].map(y => (
                        <line key={y} x1="0" y1={y} x2="160" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      ))}
                      {/* Big spike then nothing */}
                      <rect x="4" y="4" width="18" height="76" rx="3" fill="#e04b35" fillOpacity="0.75" />
                      <rect x="4" y="4" width="18" height="3" rx="1.5" fill="#ff6b4a" fillOpacity="0.9" />
                      {[28, 52, 76, 100, 124].map(x => (
                        <g key={x}>
                          <rect x={x} y={72} width="18" height="8" rx="3" fill="#e04b35" fillOpacity="0.2" />
                        </g>
                      ))}
                      {/* Retention drop line */}
                      <polyline
                        points="13,5 37,38 61,56 85,67 109,72 133,75"
                        fill="none"
                        stroke="#e04b35"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        strokeOpacity="0.6"
                      />
                    </svg>
                    <p className="text-[10px] text-terracotta/80 mt-2 font-medium">~20 words retained</p>
                  </div>
                </div>

                {/* Memory retention curve */}
                <div className="bg-absolute-black/40 rounded-2xl p-4 border border-white/5 mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-ash mb-3">Memory retention over 30 days</p>
                  <svg viewBox="0 0 320 70" className="w-full h-12 md:h-16">
                    {/* Grid */}
                    {[17, 35, 52, 70].map(y => (
                      <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    ))}
                    {/* Spaced repetition curve — stays high */}
                    <path
                      d="M 0 5 C 40 5, 80 8, 120 10 C 160 12, 200 11, 240 9 C 270 8, 295 7, 320 6"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2"
                    />
                    <text x="322" y="10" fontSize="7" fill="#34d399" fontWeight="bold">SRS</text>
                    {/* Cramming curve — drops fast */}
                    <path
                      d="M 0 5 C 20 8, 40 20, 60 36 C 80 50, 110 58, 160 62 C 200 65, 260 66, 320 67"
                      fill="none"
                      stroke="#e04b35"
                      strokeWidth="2"
                    />
                    <text x="322" y="68" fontSize="7" fill="#e04b35" fontWeight="bold">Cram</text>
                    {/* Day markers */}
                    {["Day 1", "Day 7", "Day 14", "Day 30"].map((label, i) => {
                      const x = [0, 75, 150, 310][i];
                      return (
                        <text key={label} x={x} y={70} fontSize="6" fill="rgba(255,255,255,0.3)" textAnchor={i === 3 ? "end" : "start"}>{label}</text>
                      );
                    })}
                  </svg>
                </div>

                {/* Insight pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    { icon: "🧠", text: "Spaced review = 3× retention" },
                    { icon: "⚡", text: "2 min/day is all it takes" },
                    { icon: "📅", text: "New words drop tomorrow" },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center space-x-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
                      <span className="text-sm">{icon}</span>
                      <span className="text-[10px] font-semibold text-muted-ash">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="px-6 md:px-8 pb-6 md:pb-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/flashcards"
                  className="flex-1 flex items-center justify-center space-x-2 bg-terracotta/15 border border-terracotta/30 text-terracotta font-bold px-5 py-3.5 rounded-2xl text-sm uppercase tracking-wider hover:bg-terracotta/25 hover:border-terracotta/50 transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <rect x="2" y="4" width="20" height="16" rx="3" />
                    <path d="M12 4v16M2 12h20" strokeOpacity="0.5" />
                  </svg>
                  <span>Flashcards</span>
                </Link>
                <Link
                  href="/autoplay"
                  className="flex-1 flex items-center justify-center space-x-2 bg-white/5 border border-white/10 text-light-gray font-bold px-5 py-3.5 rounded-2xl text-sm uppercase tracking-wider hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-muted-ash">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Autoplay</span>
                </Link>
              </div>
            </section>
          )}

          {/* Premium CTA for Free Users */}
          {isLoaded && !isPremium && (
             <section className="bg-gradient-to-br from-terracotta/20 to-transparent border border-terracotta/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
               <div className="relative z-10 space-y-2 w-full">
                 <h3 className="text-xl md:text-2xl font-black text-light-gray tracking-tight">Unlock Your Full Potential</h3>
                 <p className="text-sm text-muted-ash max-w-lg leading-relaxed">Get full access to all words, visual mnemonics, automated reviews, real-life usage scenarios, and premium audio.</p>
               </div>
               <Link href="/features" className="relative z-10 w-full md:w-auto shrink-0 bg-terracotta text-light-gray font-bold px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] hover:-translate-y-0.5 transition-all text-center">
                 Upgrade to Premium
               </Link>
             </section>
          )}

          {/* Lesson feed */}
          <section className="flex flex-col space-y-4 md:space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
              <h2 className="text-lg font-bold text-light-gray tracking-tight">All Words</h2>

              {/* Level filter */}
              <div className="flex items-center space-x-2 overflow-x-auto hide-scrollbar pb-1">
                <button
                  onClick={() => setLevelFilter(null)}
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
                    !levelFilter ? "bg-dark-blush border-terracotta/30 text-terracotta" : "border-white/10 text-muted-ash hover:text-light-gray"
                  }`}
                >
                  All
                </button>
                {[1, 2, 3].map(l => (
                  <button
                    key={l}
                    onClick={() => setLevelFilter(levelFilter === l ? null : l)}
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
                      levelFilter === l ? "bg-dark-blush border-terracotta/30 text-terracotta" : "border-white/10 text-muted-ash hover:text-light-gray"
                    }`}
                  >
                    L{l}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-card-gray rounded-2xl w-full" />
                ))}
              </div>
            ) : filteredFeed.length === 0 ? (
              <div className="py-12 text-center text-muted-ash font-medium">
                No lessons available at this level yet.
              </div>
            ) : (
              <>
                {/* Incomplete Words Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {incompleteFeed.map((word) => {
                    const level = word.level ?? 1;
                    const isFreePreview = word.is_free_preview;
                    const isAccessible = isPremium || isFreePreview;
                    const isLockedByLimit = newWordsCompletedToday >= 5;

                    return (
                      <div
                        key={word.id}
                        className={`group flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all duration-300 min-w-0 ${
                          isLockedByLimit
                            ? "bg-card-gray border-white/5 opacity-50 cursor-not-allowed"
                            : isAccessible
                            ? "bg-card-gray border-white/5 hover:border-terracotta/50 hover:shadow-[0_0_30px_rgba(224,75,53,0.1)] cursor-pointer"
                            : "bg-card-gray border-white/5 hover:border-white/10 cursor-pointer"
                        }`}
                        onClick={() => {
                          if (!isLockedByLimit) {
                            window.location.href = `/lesson/${word.word}`;
                          }
                        }}
                      >
                        <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
                          {/* Status icon */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${
                            isAccessible
                              ? "bg-dark-blush border-terracotta/30 text-terracotta"
                              : "bg-card-gray border-white/10 text-muted-ash"
                          }`}>
                            {isAccessible ? (
                              <svg className="w-4 h-4 translate-x-[2px]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" />
                              </svg>
                            )}
                          </div>

                          <div className="flex flex-col min-w-0 overflow-hidden">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold tracking-tight uppercase group-hover:text-terracotta transition-colors truncate">
                                {word.word}
                              </span>
                              <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0 ${LEVEL_COLORS[level]}`}>
                                {LEVEL_LABELS[level]}
                              </span>
                            </div>
                            <span className="text-xs text-muted-ash mt-0.5 truncate w-full block">
                              {word.definition}
                            </span>
                          </div>
                        </div>

                        <div className="hidden xl:flex items-center ml-2 shrink-0">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-ash group-hover:text-light-gray transition-colors">
                            {isLockedByLimit ? "Limit Reached" : isAccessible ? "Start" : "Locked"} &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Lock Card for more words */}
                  <div className="group flex flex-col justify-center items-center p-6 rounded-2xl border border-white/5 bg-gradient-to-b from-card-gray to-transparent text-center h-full min-h-[100px]">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-ash mb-3">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-light-gray uppercase tracking-widest">More words</h3>
                    <p className="text-[10px] text-muted-ash mt-1 uppercase tracking-widest">Added every week</p>
                  </div>
                </div>

                {/* Completed Words Section */}
                {completedFeed.length > 0 && (
                  <div className="pt-8 md:pt-10 space-y-4 md:space-y-5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <h2 className="text-lg font-bold text-muted-ash tracking-tight">Completed</h2>
                      {srsReviewDueSlugs.size > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta bg-terracotta/10 border border-terracotta/20 px-2.5 py-1 rounded-full">
                          {srsReviewDueSlugs.size} due for review
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {completedFeed.map((word) => {
                        const level = word.level ?? 1;
                        const progress = getWordProgress(word.word);
                        const isDue = srsReviewDueSlugs.has(word.word.toLowerCase());
                        const nextReview = progress?.next_review_at;
                        let reviewHint = "";
                        if (nextReview && !isDue) {
                          const daysLeft = Math.ceil(
                            (new Date(nextReview).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                          );
                          reviewHint = daysLeft <= 1 ? "Tomorrow" : `In ${daysLeft} days`;
                        }
                        return (
                          <Link
                            key={word.id}
                            href={`/lesson/${word.word}`}
                            className={`group flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all duration-300 min-w-0 ${
                              isDue
                                ? "bg-dark-blush border-terracotta/40 hover:border-terracotta/60 hover:shadow-[0_0_20px_rgba(224,75,53,0.15)]"
                                : "border-terracotta/20 bg-dark-blush hover:border-terracotta/40"
                            }`}
                          >
                            <div className="flex items-center space-x-3 md:space-x-4 min-w-0 opacity-80 group-hover:opacity-100 transition-opacity">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${
                                isDue
                                  ? "bg-terracotta/20 border-terracotta/50 text-terracotta"
                                  : "bg-terracotta border-terracotta/50 text-light-gray"
                              }`}>
                                {isDue ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>

                              <div className="flex flex-col min-w-0 overflow-hidden">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg font-bold tracking-tight uppercase text-light-gray truncate">
                                    {word.word}
                                  </span>
                                  <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0 ${LEVEL_COLORS[level]}`}>
                                    {LEVEL_LABELS[level]}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-ash mt-0.5 truncate w-full block">
                                  {isDue ? "Due for review" : reviewHint ? `Next: ${reviewHint}` : word.definition}
                                </span>
                              </div>
                            </div>
                            <div className="hidden xl:flex items-center ml-2 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                isDue ? "text-terracotta" : "text-muted-ash"
                              }`}>
                                {isDue ? "Review" : "Revisit"} &rarr;
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </main>
        <Footer />
      </div>

      {/* Phone Collection Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-absolute-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-card-gray border border-terracotta/20 rounded-3xl p-8 max-w-sm w-full relative shadow-2xl space-y-6">
            <button 
              onClick={() => setShowPhoneModal(false)}
              className="absolute top-4 right-4 text-muted-ash hover:text-light-gray font-bold text-lg"
            >
              ✕
            </button>
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-black text-light-gray uppercase tracking-tight">Join the Pod</h2>
              <p className="text-muted-ash text-sm leading-relaxed">
                As a premium member, you get access to our exclusive WhatsApp community. Enter your number to receive the invite link.
              </p>
            </div>
            <div className="space-y-4">
              <input 
                type="tel" 
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-deep-canvas border border-white/10 rounded-xl px-4 py-4 text-center text-lg focus:outline-none focus:border-terracotta/50 text-light-gray placeholder:text-muted-ash/40"
              />
              <button 
                onClick={handleSavePhone}
                disabled={phoneSaving}
                className="w-full bg-terracotta text-light-gray font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all uppercase tracking-wider text-sm disabled:opacity-50"
              >
                {phoneSaving ? "Saving..." : "Save Number"}
              </button>
            </div>
            <p className="text-[10px] text-muted-ash text-center opacity-60">You can also add this later in your Profile.</p>
          </div>
        </div>
      )}
    </div>
  );
}
