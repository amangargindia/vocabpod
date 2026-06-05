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
import RestoreSubscription from "@/components/RestoreSubscription";
import TutorialOverlay, { useTutorial } from "@/components/TutorialOverlay";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a word string to Title Case (e.g. "ABERRATION" → "Aberration") */
function toTitleCase(str: string) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ── Icons ─────────────────────────────────────────────────────────────────────

/** Sparkle/star icon for new words */
function NewWordIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

/** Refresh/cycle icon for review words */
function ReviewWordIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4v6h6" />
      <path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  );
}

// ── Stickman completion overlay ───────────────────────────────────────────────

function DoneStickman({ onAutoplay, onFlashcards, onDoneTab }: {
  onAutoplay: () => void;
  onFlashcards: () => void;
  onDoneTab: () => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-row items-center px-3 py-4 gap-3" style={{ backdropFilter: "blur(1px)" }}>
      {/* Stickman */}
      <div className="shrink-0 flex items-end justify-center">
        <svg viewBox="0 0 90 160" className="w-32 h-44 drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sparkles */}
          <path d="M15 30 Q18 30 18 27 Q18 30 21 30 Q18 30 18 33 Q18 30 15 30 Z" fill="#FFD700" opacity="0.8" />
          <path d="M75 40 Q77 40 77 38 Q77 40 79 40 Q77 40 77 42 Q77 40 75 40 Z" fill="#FFD700" opacity="0.9" />
          <path d="M25 60 Q26 60 26 59 Q26 60 27 60 Q26 60 26 61 Q26 60 25 60 Z" fill="#FFD700" opacity="0.6" />
          <path d="M68 80 Q70 80 70 78 Q70 80 72 80 Q70 80 70 82 Q70 80 68 80 Z" fill="#FFD700" opacity="0.7" />
          {/* Glow halo */}
          <circle cx="45" cy="24" r="22" fill="rgba(224,75,53,0.12)" />
          {/* Head */}
          <circle cx="45" cy="24" r="15" fill="#E04B35" />
          {/* Ears */}
          <ellipse cx="30" cy="24" rx="3" ry="4" fill="#C93E2A" />
          <ellipse cx="60" cy="24" rx="3" ry="4" fill="#C93E2A" />
          {/* Cheeks */}
          <ellipse cx="35" cy="28" rx="4.5" ry="3" fill="rgba(255,255,255,0.25)" />
          <ellipse cx="55" cy="28" rx="4.5" ry="3" fill="rgba(255,255,255,0.25)" />
          {/* Eyes — happy crescents */}
          <path d="M37 21 Q40 18 43 21" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M47 21 Q50 18 53 21" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Smile */}
          <path d="M40 28 Q45 35 50 28" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {/* Body */}
          <path d="M45 39 L45 88" stroke="#E04B35" strokeWidth="4.5" strokeLinecap="round" />
          {/* Left arm */}
          <path d="M45 54 Q32 65 28 78" stroke="#E04B35" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {/* Right arm — raised */}
          <path d="M45 54 Q58 42 64 28" stroke="#E04B35" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {/* Sign */}
          <rect x="58" y="10" width="28" height="20" rx="4" fill="#1c0a07" stroke="#E04B35" strokeWidth="2" />
          <text x="72" y="22" textAnchor="middle" fill="#E04B35" fontSize="8" fontWeight="bold" fontFamily="system-ui,sans-serif">5/day</text>
          {/* Legs */}
          <path d="M45 88 Q41 107 40 128" stroke="#E04B35" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M40 128 Q37 133 33 132" stroke="#E04B35" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M45 88 Q49 107 50 128" stroke="#E04B35" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M50 128 Q53 133 57 132" stroke="#E04B35" strokeWidth="3.5" strokeLinecap="round" />
          {/* Shadow */}
          <ellipse cx="45" cy="136" rx="18" ry="3.5" fill="rgba(224,75,53,0.15)" />
        </svg>
      </div>

      {/* Speech bubble + buttons */}
      <div className="flex-1 flex flex-col items-start text-left gap-3 min-w-0">
        <div className="bg-absolute-black/75 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl w-full relative">
          <div className="absolute top-5 -left-2 w-0 h-0 border-t-[7px] border-b-[7px] border-r-[8px] border-t-transparent border-b-transparent border-r-absolute-black/75" />
          <p className="text-xs font-medium text-light-gray leading-relaxed">
            Har din 5 words consistently karne se best results aate hai. Ye words kar lo, fir har din 5 words khulte
            jayenge — aur practice ke liye Autoplay aur Flashcards try karo!
          </p>
        </div>

        <div className="flex flex-col space-y-2 w-full">
          <button
            onClick={onAutoplay}
            className="w-full bg-terracotta text-white text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(224,75,53,0.4)] transition-all text-center"
          >
            Autoplay
          </button>
          <button
            onClick={onFlashcards}
            className="w-full bg-white/8 text-light-gray text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl border border-white/10 hover:bg-white/15 transition-all text-center"
          >
            Flashcards
          </button>
          <button
            onClick={onDoneTab}
            className="text-[10px] font-bold text-muted-ash uppercase tracking-widest hover:text-light-gray transition-colors text-center"
          >
            Done words →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [feed, setFeed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"new" | "done">("new");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const infoMenuRef = useRef<HTMLDivElement>(null);
  const { user, isPremium, isLoadingAuth } = useAuth();
  const { stats, isLoaded, getWordProgress } = useVocabProgress(user?.id, !isLoadingAuth);
  const { shouldShow } = useTutorial();

  useEffect(() => {
    if (shouldShow && !isLoadingAuth) {
      const t = setTimeout(() => setShowTutorial(true), 800);
      return () => clearTimeout(t);
    }
  }, [shouldShow, isLoadingAuth]);

  useEffect(() => {
    async function loadData() {
      try {
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem("vocabpod_feed_cache");
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed)) setFeed(parsed);
            } catch (e) {}
          }
        }

        const words = await getWordFeed();
        setFeed(words || []);

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
    if (!isLoadingAuth) loadData();
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

  const today = getTodayIST();

  const newWordsCompletedToday = isLoaded
    ? Object.values(stats.progressList).filter(
        (p) => p.first_completed_at && toISTDateString(p.first_completed_at) === today
      ).length
    : 0;

  const srsReviewDueSlugs = new Set(
    Object.values(stats.progressList)
      .filter((p) => p.is_completed && p.next_review_at && toISTDateString(p.next_review_at) <= today)
      .map((p) => p.word_slug.toLowerCase())
  );

  // Words reviewed today (so we don't show them again)
  const reviewedTodaySlugs = new Set(
    Object.values(stats.progressList)
      .filter((p) => p.last_reviewed_at && toISTDateString(p.last_reviewed_at) === today)
      .map((p) => p.word_slug.toLowerCase())
  );

  // SRS review words due today (not yet reviewed today)
  const srsWords = feed.filter(
    (w) => srsReviewDueSlugs.has(w.word.toLowerCase()) && !reviewedTodaySlugs.has(w.word.toLowerCase())
  );

  // New (never completed) words
  const newWords = feed.filter(
    (w) => !getWordProgress(w.word)?.is_completed && !reviewedTodaySlugs.has(w.word.toLowerCase())
  );

  // Deterministic daily shuffle for new words
  if (user?.id && newWords.length > 0) {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const seedString = `${user.id}-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let h = 0;
    for (let i = 0; i < seedString.length; i++) h = (Math.imul(31, h) + seedString.charCodeAt(i)) | 0;
    const seed = Math.abs(h);
    const rng = (s: number) => {
      let x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };
    newWords.sort((a, b) => rng(a.word.charCodeAt(0) + seed) - rng(b.word.charCodeAt(0) + seed));
  }

  const availableQuota = Math.max(0, 5 - newWordsCompletedToday);
  const availableNewWords = newWords.slice(0, availableQuota);
  const lockedNewWords = newWords.slice(availableQuota);

  // All completed words, sorted by due date
  const completedFeed = feed
    .filter((w) => getWordProgress(w.word)?.is_completed)
    .sort((a, b) => {
      const aDue = srsReviewDueSlugs.has(a.word.toLowerCase()) ? 0 : 1;
      const bDue = srsReviewDueSlugs.has(b.word.toLowerCase()) ? 0 : 1;
      if (aDue !== bDue) return aDue - bDue;
      const aDate = getWordProgress(a.word)?.next_review_at ?? "9999";
      const bDate = getWordProgress(b.word)?.next_review_at ?? "9999";
      return aDate.localeCompare(bDate);
    });

  // All daily new words exhausted + review words done
  const dailyNewWordsDone = newWordsCompletedToday >= 5;
  const reviewWordsDone = srsWords.length === 0;
  const allDailyDone = dailyNewWordsDone && reviewWordsDone;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-absolute-black text-light-gray font-sans selection:bg-terracotta/20 selection:text-terracotta">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Tutorial overlay */}
      {showTutorial && <TutorialOverlay onComplete={() => setShowTutorial(false)} />}

      <div className="flex-1 flex flex-col min-w-0 pb-[70px] md:pb-0">
        <header className="sticky top-0 z-30 backdrop-blur-md bg-absolute-black/80 border-b border-white/5 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex flex-1 justify-start items-center gap-2 relative">
            <div className="md:hidden relative" ref={infoMenuRef}>
              <button
                onClick={() => setShowInfoMenu((p) => !p)}
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
          <div className="flex-1 flex justify-center items-center shrink-0">
            <Link href="/">
              <Logo className="w-32 h-10 md:w-36 md:h-12" />
            </Link>
          </div>
          <div className="flex-1 flex justify-end items-center space-x-3">
            {isPremium && (
              <Link href="/features" className="hover:-translate-y-0.5 transition-transform">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                </svg>
              </Link>
            )}
            <Link id="tour-profile" href="/profile" className="w-8 h-8 rounded-full bg-card-gray border border-white/10 flex items-center justify-center text-xs font-bold text-muted-ash uppercase hover:text-light-gray hover:border-terracotta/50 transition-colors">
              {user?.email?.charAt(0) ?? "?"}
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 pt-4 pb-8 md:px-10 md:py-10 max-w-5xl w-full mx-auto space-y-6 md:space-y-10">

          {/* Words for the Day Progress Bar */}
          {isLoaded && (
            <section id="tour-daily-progress" className="bg-card-gray border border-white/5 rounded-3xl p-5 md:p-6 shadow-xl space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-terracotta/10 border border-terracotta/20 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-terracotta">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-light-gray">Words for the Day</h3>
                    <p className="text-[10px] text-muted-ash font-bold uppercase tracking-wider">Learn 5 new words today</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-light-gray tabular-nums">{newWordsCompletedToday}</span>
                  <span className="text-xs font-bold text-muted-ash"> / 5 done</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                  <div
                    className="h-full bg-terracotta rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(224,75,53,0.4)]"
                    style={{ width: `${Math.min(100, Math.round((newWordsCompletedToday / 5) * 100))}%` }}
                  />
                </div>
                {newWordsCompletedToday >= 5 ? (
                  <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Goal achieved! Amazing job!</p>
                ) : (
                  <p className="text-[9px] text-muted-ash/70 font-bold uppercase tracking-wider">
                    {5 - newWordsCompletedToday} more new words to reach your goal
                  </p>
                )}
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
              <div className="flex flex-col gap-3 relative z-10 w-full md:w-auto shrink-0">
                <Link href="/features" className="w-full bg-terracotta text-light-gray font-bold px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] hover:-translate-y-0.5 transition-all text-center">
                  Upgrade to Premium
                </Link>
                <RestoreSubscription compact={true} />
              </div>
            </section>
          )}

          {/* Lesson feed with Tabs */}
          <section className="flex flex-col space-y-4 md:space-y-5">
            <div id="tour-tabs" className="flex border-b border-white/5 sticky top-[64px] md:top-[80px] z-20 bg-absolute-black/95 backdrop-blur-xl -mx-4 px-4 md:-mx-10 md:px-10">
              <button
                onClick={() => setActiveTab("new")}
                className={`flex-1 py-3 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === "new" ? "text-terracotta border-b-2 border-terracotta" : "text-muted-ash hover:text-light-gray"}`}
              >
                Words for Today
              </button>
              <button
                onClick={() => setActiveTab("done")}
                className={`flex-1 py-3 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === "done" ? "text-terracotta border-b-2 border-terracotta" : "text-muted-ash hover:text-light-gray"}`}
              >
                Done for Now
              </button>
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-card-gray rounded-2xl w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* ── Words for Today tab ─────────────────────────── */}
                {activeTab === "new" && (
                  <>
                    {/* When all daily work is done: show blurred background with prominent stickman */}
                    {allDailyDone ? (
                      <div id="tour-new-words" className="rounded-3xl overflow-hidden border border-white/5 relative min-h-[280px]">
                        {/* Blurred word list background — gives illusion of words in background */}
                        <div className="grid grid-cols-1 gap-2 blur-[4px] opacity-30 pointer-events-none select-none">
                          {[
                            { word: "Aberration", def: "A departure from what is normal" },
                            { word: "Capricious", def: "Given to sudden changes of mood" },
                            { word: "Ephemeral", def: "Lasting for a very short time" },
                            { word: "Gregarious", def: "Fond of company; sociable" },
                            { word: "Tenacious", def: "Holding firmly to a purpose" },
                          ].map(({ word, def }, idx) => (
                            <div key={idx} className="flex items-center space-x-3 p-4 bg-card-gray border border-white/8 h-[72px]">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center border shrink-0 bg-dark-blush border-terracotta/20 text-terracotta">
                                <NewWordIcon />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-base font-bold tracking-tight text-light-gray">{word}</span>
                                <span className="text-xs text-muted-ash truncate mt-0.5">{def}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Prominent stickman overlay */}
                        <DoneStickman
                          onAutoplay={() => window.location.href = "/autoplay"}
                          onFlashcards={() => window.location.href = "/flashcards"}
                          onDoneTab={() => setActiveTab("done")}
                        />
                      </div>
                    ) : (
                      <>
                        {/* ── New words today ── */}
                        {availableNewWords.length > 0 && (
                          <div id="tour-new-words" className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-terracotta/15 border border-terracotta/25 flex items-center justify-center text-terracotta">
                                <NewWordIcon />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-ash">New words for today</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                              {availableNewWords.map((word) => {
                                const isFreePreview = word.is_free_preview;
                                const isAccessible = isPremium || isFreePreview;
                                return (
                                  <Link
                                    key={word.id}
                                    href={isAccessible ? `/lesson/${word.word}` : "#"}
                                    className={`group flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all duration-300 min-w-0 ${
                                      isAccessible
                                        ? "bg-card-gray border-white/5 hover:border-terracotta/50 hover:shadow-[0_0_30px_rgba(224,75,53,0.1)] cursor-pointer"
                                        : "bg-card-gray border-white/5 hover:border-white/10 cursor-pointer"
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${
                                        isAccessible
                                          ? "bg-dark-blush border-terracotta/30 text-terracotta"
                                          : "bg-card-gray border-white/10 text-muted-ash"
                                      }`}>
                                        {isAccessible ? <NewWordIcon /> : (
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                            <rect x="3" y="11" width="18" height="11" rx="2" />
                                            <path d="M7 11V7a5 5 0 0110 0v4" />
                                          </svg>
                                        )}
                                      </div>
                                      <div className="flex flex-col min-w-0 overflow-hidden">
                                        <span className="text-lg font-bold tracking-tight group-hover:text-terracotta transition-colors truncate">
                                          {toTitleCase(word.word)}
                                        </span>
                                        <span className="text-xs text-muted-ash mt-0.5 truncate w-full block">
                                          {word.definition}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="hidden xl:flex items-center ml-2 shrink-0">
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-ash group-hover:text-light-gray transition-colors">
                                        {isAccessible ? "Start" : "Locked"} &rarr;
                                      </span>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* ── Due for Review subsection ── */}
                        <div id="tour-review-words" className="space-y-3 mt-4">
                          {srsWords.length > 0 ? (
                            <>
                              {/* Info card */}
                              <div className="bg-card-gray/60 border border-white/8 rounded-2xl px-4 py-3 flex items-start gap-3">
                                <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                  <ReviewWordIcon />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/80 mb-0.5">Due for Review</p>
                                  <p className="text-xs text-muted-ash leading-relaxed">
                                    Ye words revise karne ke liye hain, taaki aap unhe ache se yaad rakho. Spaced repetition aapki memory ko pakka banata hai!
                                  </p>
                                </div>
                              </div>

                              {/* Section label */}
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                                  <ReviewWordIcon />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-ash">Due for review</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                {srsWords.map((word) => (
                                  <Link
                                    key={word.id}
                                    href={`/lesson/${word.word}`}
                                    className="group flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all duration-300 min-w-0 bg-dark-blush border-amber-500/20 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                                  >
                                    <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
                                      <div className="w-10 h-10 rounded-full flex items-center justify-center border shrink-0 bg-amber-500/10 border-amber-500/30 text-amber-400">
                                        <ReviewWordIcon />
                                      </div>
                                      <div className="flex flex-col min-w-0 overflow-hidden">
                                        <span className="text-lg font-bold tracking-tight group-hover:text-amber-400 transition-colors truncate">
                                          {toTitleCase(word.word)}
                                        </span>
                                        <span className="text-xs text-muted-ash mt-0.5 truncate w-full block">
                                          {word.definition}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="hidden xl:flex items-center ml-2 shrink-0">
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/60 group-hover:text-amber-400 transition-colors">
                                        Review &rarr;
                                      </span>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="bg-card-gray border border-white/5 rounded-2xl px-5 py-6 flex flex-col items-center justify-center text-center space-y-3">
                              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 opacity-80">
                                <ReviewWordIcon />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-light-gray">No reviews pending</p>
                                <p className="text-xs text-muted-ash mt-1">Complete your new words and they'll appear here tomorrow.</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* When new words done but review still pending */}
                        {availableNewWords.length === 0 && srsWords.length > 0 && (
                          <div id="tour-new-words" className="py-6 flex flex-col items-center justify-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-emerald-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                              </svg>
                            </div>
                            <div className="text-center space-y-1">
                              <h3 className="text-base font-black text-light-gray">Naye words ho gaye!</h3>
                            </div>
                          </div>
                        )}

                        {/* Locked new words blur section */}
                        {lockedNewWords.length > 0 && (
                          <div className="mt-4 rounded-3xl overflow-hidden border border-white/5 relative">
                            {/* Blurred word list */}
                            <div className="grid grid-cols-1 gap-2 blur-[3px] opacity-40 pointer-events-none select-none">
                              {[
                                { word: "Aberration", def: "A departure from what is normal" },
                                { word: "Capricious", def: "Given to sudden changes of mood" },
                                { word: "Ephemeral", def: "Lasting for a very short time" },
                                { word: "Gregarious", def: "Fond of company; sociable" },
                              ].map(({ word, def }, idx) => (
                                <div key={idx} className="flex items-center space-x-3 p-4 bg-card-gray border border-white/8 h-[72px]">
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center border shrink-0 bg-dark-blush border-terracotta/20 text-terracotta">
                                    <NewWordIcon />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-base font-bold tracking-tight text-light-gray">{word}</span>
                                    <span className="text-xs text-muted-ash truncate mt-0.5">{def}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Stickman overlay */}
                            <div className="absolute inset-0 flex flex-row items-center px-3 py-4 gap-3" style={{ backdropFilter: "blur(1px)" }}>
                              <div className="shrink-0 flex items-end justify-center">
                                <svg viewBox="0 0 90 160" className="w-32 h-44 drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M15 30 Q18 30 18 27 Q18 30 21 30 Q18 30 18 33 Q18 30 15 30 Z" fill="#FFD700" opacity="0.8" />
                                  <path d="M75 40 Q77 40 77 38 Q77 40 79 40 Q77 40 77 42 Q77 40 75 40 Z" fill="#FFD700" opacity="0.9" />
                                  <circle cx="45" cy="24" r="22" fill="rgba(224,75,53,0.12)" />
                                  <circle cx="45" cy="24" r="15" fill="#E04B35" />
                                  <ellipse cx="30" cy="24" rx="3" ry="4" fill="#C93E2A" />
                                  <ellipse cx="60" cy="24" rx="3" ry="4" fill="#C93E2A" />
                                  <ellipse cx="35" cy="28" rx="4.5" ry="3" fill="rgba(255,255,255,0.25)" />
                                  <ellipse cx="55" cy="28" rx="4.5" ry="3" fill="rgba(255,255,255,0.25)" />
                                  <path d="M37 21 Q40 18 43 21" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                                  <path d="M47 21 Q50 18 53 21" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                                  <path d="M40 28 Q45 35 50 28" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                                  <path d="M45 39 L45 88" stroke="#E04B35" strokeWidth="4.5" strokeLinecap="round" />
                                  <path d="M45 54 Q32 65 28 78" stroke="#E04B35" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M45 54 Q58 42 64 28" stroke="#E04B35" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                  <rect x="58" y="10" width="28" height="20" rx="4" fill="#1c0a07" stroke="#E04B35" strokeWidth="2" />
                                  <text x="72" y="22" textAnchor="middle" fill="#E04B35" fontSize="8" fontWeight="bold" fontFamily="system-ui,sans-serif">5/day</text>
                                  <path d="M45 88 Q41 107 40 128" stroke="#E04B35" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M40 128 Q37 133 33 132" stroke="#E04B35" strokeWidth="3.5" strokeLinecap="round" />
                                  <path d="M45 88 Q49 107 50 128" stroke="#E04B35" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M50 128 Q53 133 57 132" stroke="#E04B35" strokeWidth="3.5" strokeLinecap="round" />
                                  <ellipse cx="45" cy="136" rx="18" ry="3.5" fill="rgba(224,75,53,0.15)" />
                                </svg>
                              </div>

                              <div className="flex-1 flex flex-col items-start text-left gap-3 min-w-0">
                                <div className="bg-absolute-black/75 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl w-full relative">
                                  <div className="absolute top-5 -left-2 w-0 h-0 border-t-[7px] border-b-[7px] border-r-[8px] border-t-transparent border-b-transparent border-r-absolute-black/75" />
                                  <p className="text-xs font-medium text-light-gray leading-relaxed">
                                    Har din 5 words consistently karne se best results aate hai. Ye words kar lo, fir har din 5 words khulte jayenge — aur practice ke liye Autoplay aur Flashcards try karo!
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* ── Done for Now tab ────────────────────────────── */}
                {activeTab === "done" && (
                  <>
                    {completedFeed.length === 0 ? (
                      <div className="py-12 text-center text-muted-ash font-medium">
                        No words completed yet. Start learning new words!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        {completedFeed.map((word) => {
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
                                  : "border-white/5 bg-card-gray hover:border-white/20"
                              }`}
                            >
                              <div className="flex items-center space-x-3 md:space-x-4 min-w-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${
                                  isDue
                                    ? "bg-terracotta/20 border-terracotta/50 text-terracotta"
                                    : "bg-absolute-black border-white/10 text-muted-ash"
                                }`}>
                                  {isDue ? <ReviewWordIcon /> : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0 overflow-hidden">
                                  <span className="text-lg font-bold tracking-tight text-light-gray truncate">
                                    {toTitleCase(word.word)}
                                  </span>
                                  <span className="text-xs text-muted-ash mt-0.5 truncate w-full block">
                                    {isDue ? "Due for review" : reviewHint ? `Resurfaces ${reviewHint.toLowerCase()}` : word.definition}
                                  </span>
                                </div>
                              </div>
                              <div className="hidden xl:flex items-center ml-2 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDue ? "text-terracotta" : "text-muted-ash group-hover:text-light-gray"}`}>
                                  {isDue ? "Review" : "Revisit"} &rarr;
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        </main>
        <Footer />
      </div>

      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-absolute-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-card-gray border border-terracotta/20 rounded-3xl p-8 max-w-sm w-full relative shadow-2xl space-y-6">
            <button onClick={() => setShowPhoneModal(false)} className="absolute top-4 right-4 text-muted-ash hover:text-light-gray font-bold text-lg">✕</button>
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-black text-light-gray uppercase tracking-tight">Join the Pod</h2>
              <p className="text-muted-ash text-sm leading-relaxed">As a premium member, you get access to our exclusive WhatsApp community. Enter your number to receive the invite link.</p>
            </div>
            <div className="space-y-4">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
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
