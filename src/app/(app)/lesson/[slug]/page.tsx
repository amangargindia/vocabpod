"use client";

import { useState, useRef, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { getWordLesson, WordLesson } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useVocabProgress } from "@/hooks/useVocabProgress";
import { getCachedAudio } from "@/lib/audioCache";
import { type StickmanPose } from "@/components/Stickman";
import dynamic from "next/dynamic";
const Stickman = dynamic(() => import("@/components/Stickman"), { ssr: false });
import Logo from "@/components/Logo";
import { cleanSvgString } from "@/lib/svgUtils";
import { useSwipe } from "@/hooks/useSwipe";

// ─── SVG Node Renderer ─────────────────────────────────────────────────────────

interface SVGNode {
  tag: string;
  props: Record<string, any>;
  children?: SVGNode[];
}

const DynamicSVGNode = ({ node }: { node: SVGNode }) => {
  const Tag = node.tag as any;
  const sanitizedProps = { ...node.props };
  if (typeof sanitizedProps.style === "string") {
    const styleObj: Record<string, string> = {};
    sanitizedProps.style.split(";").forEach((pair: string) => {
      const idx = pair.indexOf(":");
      if (idx !== -1) {
        let key = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        if (key && value) {
          if (!key.startsWith("--")) key = key.replace(/-([a-z])/g, (_: string, g: string) => g.toUpperCase());
          styleObj[key] = value;
        }
      }
    });
    sanitizedProps.style = styleObj;
  }
  if (sanitizedProps.class && !sanitizedProps.className) {
    sanitizedProps.className = sanitizedProps.class;
    delete sanitizedProps.class;
  }
  const finalProps: Record<string, any> = {};
  for (const key of Object.keys(sanitizedProps)) {
    if (key.includes("-") && !key.startsWith("data-") && !key.startsWith("aria-")) {
      finalProps[key.replace(/-([a-z])/g, (_: string, g: string) => g.toUpperCase())] = sanitizedProps[key];
    } else {
      finalProps[key] = sanitizedProps[key];
    }
  }
  return (
    <Tag {...finalProps}>
      {node.children?.map((child, idx) => (
        <DynamicSVGNode key={idx} node={child} />
      ))}
    </Tag>
  );
};

// ─── Floating Stickmen Background ─────────────────────────────────────────────

function FloatingStickmen({ pose }: { pose: StickmanPose }) {
  const [positions, setPositions] = useState<
    { top: string; left: string; scale: number; rotation: number; opacity: number }[]
  >([]);
  useEffect(() => {
    const count = Math.floor(Math.random() * 3) + 4;
    setPositions(
      Array.from({ length: count }).map(() => ({
        top: `${Math.random() * 80 + 10}%`,
        left: `${Math.random() * 80 + 10}%`,
        scale: Math.random() * 0.5 + 0.5,
        rotation: Math.random() * 40 - 20,
        opacity: Math.random() * 0.03 + 0.02,
      }))
    );
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute text-light-gray"
          style={{
            top: pos.top,
            left: pos.left,
            transform: `scale(${pos.scale}) rotate(${pos.rotation}deg)`,
            opacity: pos.opacity,
          }}
        >
          <Stickman pose={pose} className="w-64 h-64" headColor="var(--color-terracotta)" />
        </div>
      ))}
    </div>
  );
}

// ─── Markdown Renderer ─────────────────────────────────────────────────────────

function renderMarkdown(text: string, wordToHighlight?: string): React.ReactNode[] {
  if (!text) return [];
  // Split by bold markers first
  const boldPattern = /(\*\*.*?\*\*)/g;
  const parts = text.split(boldPattern);

  const result: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      result.push(
        <strong key={i} className="text-terracotta font-black">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (wordToHighlight) {
      const wordPattern = new RegExp(`(${wordToHighlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
      const subParts = part.split(wordPattern);
      subParts.forEach((sub, j) => {
        if (sub.toLowerCase() === wordToHighlight.toLowerCase()) {
          result.push(
            <mark key={`${i}-${j}`} className="bg-transparent text-terracotta font-bold not-italic">
              {sub}
            </mark>
          );
        } else {
          result.push(sub);
        }
      });
    } else {
      result.push(part);
    }
  });
  return result;
}

// ─── Confetti Particles ────────────────────────────────────────────────────────

function ConfettiParticles() {
  const particles = Array.from({ length: 18 });
  const colors = ["#E04B35", "#f97316", "#facc15", "#34d399", "#60a5fa", "#c084fc"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      <style>{`
        @keyframes confetti-float {
          0% { transform: translateY(100%) rotate(0deg); opacity: 1; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-120%) rotate(720deg); opacity: 0; }
        }
        @keyframes bounce-bar {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(224, 75, 53, 0.4)); }
          50% { filter: drop-shadow(0 0 10px rgba(224, 75, 53, 0.8)); }
        }
      `}</style>
      {particles.map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: "-10%",
            left: `${(i / particles.length) * 100 + Math.random() * 5}%`,
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            background: colors[i % colors.length],
            animation: `confetti-float ${2 + Math.random() * 2}s ease-out ${Math.random() * 2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Toast Component ───────────────────────────────────────────────────────────

function Toast({
  message,
  type = "info",
  onDismiss,
}: {
  message: string;
  type?: "info" | "success" | "error";
  onDismiss: () => void;
}) {
  const colors = {
    info: "bg-card-gray border-white/10 text-light-gray",
    success: "bg-card-gray border-emerald-500/30 text-emerald-400",
    error: "bg-card-gray border-terracotta/30 text-terracotta",
  };
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 ${colors[type]}`}
    >
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100 transition-opacity text-xs">
        ✕
      </button>
    </div>
  );
}

// ─── Section Badge ─────────────────────────────────────────────────────────────

function SectionBadge({ label }: { label: string }) {
  return (
    <span className="inline-block bg-dark-blush text-terracotta text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-terracotta/20">
      {label}
    </span>
  );
}

// ─── Lock Overlay (inline) ─────────────────────────────────────────────────────

function LockedOverlay({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-absolute-black/60 backdrop-blur-sm rounded-3xl">
      <div className="w-11 h-11 rounded-full bg-dark-blush border border-terracotta/30 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(224,75,53,0.15)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="#E04B35" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
      <h3 className="text-base font-black text-light-gray uppercase tracking-tight mb-1">{label}</h3>
      <p className="text-[10px] text-muted-ash mb-3">Available in Premium</p>
      <Link
        href="/features"
        className="bg-white/10 text-light-gray font-bold px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all"
      >
        Learn More
      </Link>
    </div>
  );
}

// ─── Admin Edit Fields ─────────────────────────────────────────────────────────

function AdminTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-ash">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full bg-deep-canvas border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray resize-y focus:outline-none focus:border-terracotta/50"
      />
    </div>
  );
}

function AdminInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-ash">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-deep-canvas border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:outline-none focus:border-terracotta/50"
      />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TOTAL_CARDS = 7;

export default function LessonPage({ params }: { params: any }) {
  const resolvedParams = params && typeof params.then === "function" ? use(params) : params;
  const wordSlug = resolvedParams?.slug;

  // ── Data State ──────────────────────────────────────────────────────────────
  const [lesson, setLesson] = useState<WordLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isPremium, isLoadingAuth } = useAuth();
  const [nextWordSlug, setNextWordSlug] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<any[]>([]);

  // ── Audio State ──────────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);

  // ── Quiz State ───────────────────────────────────────────────────────────────
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [nextReviewDays, setNextReviewDays] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFirstCompletion, setIsFirstCompletion] = useState(false);
  const [quizPassed, setQuizPassed] = useState<boolean | null>(null);

  const { markWordCompleted, syncWordSRS } = useVocabProgress(user?.id, !isLoadingAuth);

  // ── Text Size State ──────────────────────────────────────────────────────────
  const [textSize, setTextSize] = useState<"sm" | "base" | "lg" | "xl">("base");

  const decreaseTextSize = () => {
    if (textSize === "xl") setTextSize("lg");
    else if (textSize === "lg") setTextSize("base");
    else if (textSize === "base") setTextSize("sm");
  };

  const increaseTextSize = () => {
    if (textSize === "sm") setTextSize("base");
    else if (textSize === "base") setTextSize("lg");
    else if (textSize === "lg") setTextSize("xl");
  };

  // ── Card Navigation State ────────────────────────────────────────────────────
  const [currentCard, setCurrentCard] = useState(0);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedCard, setDisplayedCard] = useState(0);

  // ── Toast State ──────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  // ── Admin State ──────────────────────────────────────────────────────────────
  const isAdmin = !!(
    user?.email &&
    (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim())
      .includes(user.email)
  );
  const [adminEditCard, setAdminEditCard] = useState<number | null>(null);
  const [adminFields, setAdminFields] = useState<Record<string, any>>({});

  // ── Data Fetching ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const [lessonData, res] = await Promise.all([getWordLesson(wordSlug), fetch("/api/words")]);
        if (!lessonData) throw new Error("Word not found.");
        setLesson(lessonData);

        const data = await res.json();
        const allWords = data.words || [];
        const currentIndex = allWords.findIndex(
          (w: any) => w.word.toLowerCase() === lessonData.word.toLowerCase()
        );
        if (currentIndex !== -1 && currentIndex < allWords.length - 1) {
          setNextWordSlug(allWords[currentIndex + 1].word);
        }

        const q = lessonData.quiz_questions[0];
        if (q && q.options) {
          setShuffledOptions([...q.options].sort(() => Math.random() - 0.5));
        }

        if (lessonData?.audio_url && isPremium) {
          getCachedAudio(lessonData.audio_url).then(setAudioSrc);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load vocabulary lesson.");
      } finally {
        setIsLoading(false);
      }
    }
    if (!isLoadingAuth) init();
  }, [wordSlug, isLoadingAuth, isPremium]);

  // ── Swipe Hint ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem("vocabpod_swipe_hint_dismissed");
    if (!dismissed) {
      setShowSwipeHint(true);
      const timer = setTimeout(() => {
        setShowSwipeHint(false);
        localStorage.setItem("vocabpod_swipe_hint_dismissed", "1");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  // ── Audio sync ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) setIsPlaying(true);
  }, [lesson]);

  // ── Navigation Logic ─────────────────────────────────────────────────────────
  const navigateTo = useCallback(
    (dir: "left" | "right") => {
      if (isAnimating) return;
      const next = dir === "left" ? currentCard + 1 : currentCard - 1;
      if (next < 0 || next >= TOTAL_CARDS) return;
      if (next === TOTAL_CARDS - 1 && !quizSubmitted) return; // card 6 needs quiz done — handled in Next btn
      setSlideDir(dir);
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentCard(next);
        setDisplayedCard(next);
        setIsAnimating(false);
        setSlideDir(null);
      }, 300);
    },
    [isAnimating, currentCard, quizSubmitted]
  );

  const goToCard = useCallback(
    (idx: number) => {
      if (isAnimating || idx === currentCard) return;
      const dir = idx > currentCard ? "left" : "right";
      setSlideDir(dir);
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentCard(idx);
        setDisplayedCard(idx);
        setIsAnimating(false);
        setSlideDir(null);
      }, 300);
    },
    [isAnimating, currentCard]
  );

  const canGoNext =
    currentCard < TOTAL_CARDS - 1 && (currentCard !== 5 || quizSubmitted) && (currentCard !== TOTAL_CARDS - 2 || quizSubmitted);
  const canGoPrev = currentCard > 0;

  // ── Swipe Handlers ───────────────────────────────────────────────────────────
  const swipeHandlers = useSwipe(
    () => { if (canGoNext) navigateTo("left"); },
    () => { if (canGoPrev) navigateTo("right"); }
  );

  // ── Audio Controls ───────────────────────────────────────────────────────────
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // ── Quiz Handler ─────────────────────────────────────────────────────────────
  const handleOptionClick = async (idx: number) => {
    if (quizSubmitted || isSubmitting || !lesson) return;
    setSelectedOption(idx);
    setIsSubmitting(true);
    setQuizSubmitted(true);

    const isCorrect = shuffledOptions[idx].isCorrect;
    const score = isCorrect ? 100 : 0;
    setQuizPassed(isCorrect);

    const normalizedSlug = decodeURIComponent(wordSlug).toLowerCase();
    markWordCompleted(normalizedSlug, isCorrect);

    if (user?.id) {
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, wordSlug: normalizedSlug, score }),
        });
        const data = await res.json();
        if (data.xpEarned) setXpEarned(data.xpEarned);
        if (data.nextReviewIn !== undefined) setNextReviewDays(data.nextReviewIn);
        if (data.isFirstCompletion) setIsFirstCompletion(true);
        if (data.nextReviewIn !== undefined) {
          const nextReviewAt = new Date(Date.now() + data.nextReviewIn * 24 * 60 * 60 * 1000).toISOString();
          syncWordSRS(normalizedSlug, nextReviewAt, data.nextReviewIn);
        }
      } catch (e) {
        console.warn("Progress sync failed:", e);
      }
    }

    setIsSubmitting(false);
    setTimeout(() => setShowExplanation(true), 200);
  };

  // ── Admin Save ───────────────────────────────────────────────────────────────
  const handleAdminSave = async () => {
    if (!lesson) return;
    try {
      const res = await fetch("/api/admin/words", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordSlug: lesson.word, ...adminFields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setLesson((prev) => (prev ? { ...prev, ...adminFields } : prev));
      setAdminEditCard(null);
      setAdminFields({});
      setToast({ message: "✅ Changes saved successfully", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      setToast({ message: `❌ ${e.message}`, type: "error" });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const startAdminEdit = (cardIdx: number) => {
    if (!lesson) return;
    setAdminEditCard(cardIdx);
    const q = lesson.quiz_questions?.[0];
    setAdminFields({
      word: lesson.word,
      phonetic: lesson.phonetic,
      type: lesson.type,
      definition: lesson.definition,
      narrative: lesson.narrative,
      custom_svg: lesson.custom_svg || "",
      story: (lesson as any).story || "",
      real_life_usage: (lesson as any).real_life_usage ? JSON.parse(JSON.stringify((lesson as any).real_life_usage)) : [],
      quiz_question: q?.question || "",
      quiz_options: q?.options ? JSON.parse(JSON.stringify(q.options)) : [],
      quiz_explanation: q?.explanation || "",
    });
  };

  // ── Loading / Error States ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-absolute-black text-light-gray items-center justify-center space-y-6">
        <Logo />
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-terracotta animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2.5 h-2.5 rounded-full bg-terracotta animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2.5 h-2.5 rounded-full bg-terracotta animate-bounce" />
        </div>
        <p className="text-xs font-bold tracking-widest text-muted-ash uppercase">Loading Mnemonic Slice...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex flex-col min-h-screen bg-absolute-black text-light-gray items-center justify-center space-y-6 p-6 text-center">
        <Logo />
        <div className="bg-card-gray border border-terracotta/20 p-8 rounded-3xl max-w-md space-y-4">
          <h3 className="text-lg font-bold text-terracotta uppercase">System Error</h3>
          <p className="text-sm text-muted-ash leading-relaxed">{error || "Failed to load database lesson record."}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-terracotta text-light-gray font-bold text-xs rounded-full uppercase tracking-wider hover:shadow-[0_0_15px_rgba(224,75,53,0.3)] transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const activeQuiz = lesson.quiz_questions[0];
  const isAccessible = isPremium || (lesson as any).is_free_preview;
  const PROGRESS_ILLUSION_STEPS = [25, 43, 58, 72, 84, 94, 100];
  const progressPct = PROGRESS_ILLUSION_STEPS[currentCard] || 0;

  const CARD_LABELS = ["Word", "Meaning", "Story", "Mnemonic", "Usage", "Quiz", "Complete"];

  // ── Slide Transform ──────────────────────────────────────────────────────────
  const getSlideStyle = (): React.CSSProperties => {
    if (!isAnimating || !slideDir) return {};
    return {
      transform: slideDir === "left" ? "translateX(-100%)" : "translateX(100%)",
      transition: "transform 300ms ease",
    };
  };

  // ── Card Content Renderers ───────────────────────────────────────────────────

  // Card 0: Word
  const renderCard0 = () => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <SectionBadge label="Word" />
        {isAdmin && (
          <button
            onClick={() => startAdminEdit(0)}
            className="text-muted-ash hover:text-terracotta transition-colors text-base"
            title="Edit"
          >
            ✏️
          </button>
        )}
      </div>

      {adminEditCard === 0 ? (
        <div className="space-y-4">
          <AdminInput label="Word" value={adminFields.word || ""} onChange={(v) => setAdminFields((p) => ({ ...p, word: v }))} />
          <AdminInput label="Phonetic" value={adminFields.phonetic || ""} onChange={(v) => setAdminFields((p) => ({ ...p, phonetic: v }))} />
          <AdminInput label="Type" value={adminFields.type || ""} onChange={(v) => setAdminFields((p) => ({ ...p, type: v }))} />
          <div className="flex gap-3">
            <button onClick={handleAdminSave} className="flex-1 py-2.5 bg-terracotta rounded-xl text-sm font-bold text-white">Save</button>
            <button onClick={() => setAdminEditCard(null)} className="flex-1 py-2.5 bg-white/5 rounded-xl text-sm font-bold text-light-gray">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center space-y-3">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 bg-dark-blush text-terracotta rounded-full border border-terracotta/20">
              {lesson.type}
            </span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-light-gray uppercase">
              {lesson.word}
            </h1>
            <p className="text-xl md:text-2xl text-muted-ash italic font-sans">{lesson.phonetic}</p>
          </div>

          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-ash bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <span>🎧</span>
              {isPremium ? "Audio narration loaded below" : "Audio narration available below"}
            </span>
          </div>
        </>
      )}
    </div>
  );

  // Card 1: Meaning
  const renderCard1 = () => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <SectionBadge label="Meaning" />
        {isAdmin && (
          <button onClick={() => startAdminEdit(1)} className="text-muted-ash hover:text-terracotta transition-colors text-base" title="Edit">
            ✏️
          </button>
        )}
      </div>

      {adminEditCard === 1 ? (
        <div className="space-y-4">
          <AdminTextarea label="Definition" value={adminFields.definition || ""} onChange={(v) => setAdminFields((p) => ({ ...p, definition: v }))} />
          <div className="flex gap-3">
            <button onClick={handleAdminSave} className="flex-1 py-2.5 bg-terracotta rounded-xl text-sm font-bold text-white">Save</button>
            <button onClick={() => setAdminEditCard(null)} className="flex-1 py-2.5 bg-white/5 rounded-xl text-sm font-bold text-light-gray">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="text-center pt-4 pb-2">
          <p className={`leading-relaxed md:leading-snug text-light-gray/90 font-medium ${textSize === 'sm' ? 'text-lg md:text-xl' : textSize === 'base' ? 'text-2xl md:text-3xl' : textSize === 'lg' ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'}`}>
            {renderMarkdown(lesson.definition)}
          </p>
        </div>
      )}
    </div>
  );

  // Card 2: Story
  const renderCard2 = () => {
    const isLocked = !isPremium;
    return (
      <div className="space-y-6 relative">
        <div className="flex items-start justify-between">
          <SectionBadge label="Story" />
          {isAdmin && !isLocked && (
            <button onClick={() => startAdminEdit(2)} className="text-muted-ash hover:text-terracotta transition-colors text-base" title="Edit">
              ✏️
            </button>
          )}
        </div>

        {isLocked ? (
          <div className="relative min-h-[200px] overflow-hidden rounded-2xl">
            <div className="pointer-events-none blur-md opacity-20 saturate-0 space-y-4 p-4">
              <p className="text-base text-muted-ash">Story content is hidden for free users. Upgrade to read the full reinforcement story with your word highlighted in context.</p>
            </div>
            <LockedOverlay label="Story Reinforcement" />
          </div>
        ) : adminEditCard === 2 ? (
          <div className="space-y-4">
            <AdminTextarea label="Story" value={adminFields.story || ""} onChange={(v) => setAdminFields((p) => ({ ...p, story: v }))} />
            <div className="flex gap-3">
              <button onClick={handleAdminSave} className="flex-1 py-2.5 bg-terracotta rounded-xl text-sm font-bold text-white">Save</button>
              <button onClick={() => setAdminEditCard(null)} className="flex-1 py-2.5 bg-white/5 rounded-xl text-sm font-bold text-light-gray">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {lesson.stickman_id && (
              <div className="shrink-0 mx-auto md:mx-0 bg-deep-canvas p-4 rounded-2xl border border-white/5">
                <Stickman pose={lesson.stickman_id as StickmanPose} className="w-20 h-20 md:w-24 md:h-24 drop-shadow-xl" headColor="var(--color-terracotta)" />
              </div>
            )}
            <p className={`flex-1 leading-relaxed md:leading-loose text-muted-ash ${textSize === 'sm' ? 'text-sm' : textSize === 'base' ? 'text-base md:text-lg' : textSize === 'lg' ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'}`}>
              {(lesson as any).story
                ? renderMarkdown((lesson as any).story, lesson.word)
                : "No story provided."}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Card 3: Mnemonic
  const renderCard3 = () => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <SectionBadge label="Mnemonic" />
        {isAdmin && (
          <button onClick={() => startAdminEdit(3)} className="text-muted-ash hover:text-terracotta transition-colors text-base" title="Edit">
            ✏️
          </button>
        )}
      </div>

      {adminEditCard === 3 ? (
        <div className="space-y-4">
          <AdminTextarea label="Mnemonic SVG Code" value={adminFields.custom_svg || ""} onChange={(v) => setAdminFields((p) => ({ ...p, custom_svg: v }))} />
          <AdminTextarea label="Narrative" value={adminFields.narrative || ""} onChange={(v) => setAdminFields((p) => ({ ...p, narrative: v }))} />
          <div className="flex gap-3">
            <button onClick={handleAdminSave} className="flex-1 py-2.5 bg-terracotta rounded-xl text-sm font-bold text-white">Save</button>
            <button onClick={() => setAdminEditCard(null)} className="flex-1 py-2.5 bg-white/5 rounded-xl text-sm font-bold text-light-gray">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6">
          <style>{`.svg-anim-smooth svg * { transition: all 0.3s ease-in-out; }`}</style>
          <div className="w-full aspect-square shrink-0 rounded-2xl flex items-center justify-center relative bg-deep-canvas overflow-hidden">
            {lesson.custom_image_url ? (
              <img src={lesson.custom_image_url} alt="Mnemonic" className="w-full h-full object-contain p-4 drop-shadow-xl" />
            ) : lesson.custom_svg ? (
              <div
                className="w-full h-full p-4 flex items-center justify-center text-light-gray svg-anim-smooth [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: cleanSvgString(lesson.custom_svg) }}
              />
            ) : lesson.svg_elements && lesson.svg_elements.length > 0 ? (
              <svg viewBox="0 0 400 300" className="w-full h-full p-4 svg-anim-smooth" xmlns="http://www.w3.org/2000/svg">
                {lesson.svg_elements.map((node, index) => (
                  <DynamicSVGNode key={index} node={node} />
                ))}
              </svg>
            ) : (
              <p className="text-xs text-muted-ash p-4 text-center">No visual anchor provided.</p>
            )}
          </div>
          <div className="w-full text-center space-y-3">
            <p className={`leading-relaxed text-light-gray/90 font-normal ${textSize === 'sm' ? 'text-xs' : textSize === 'base' ? 'text-sm md:text-base' : textSize === 'lg' ? 'text-base md:text-lg' : 'text-lg md:text-xl'}`}>
              {lesson.narrative ? renderMarkdown(lesson.narrative) : "No narrative provided."}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Card 4: Real-Life Usage
  const renderCard4 = () => {
    const isLocked = !isPremium;
    const usages: any[] = (lesson as any).real_life_usage || [];
    return (
      <div className="space-y-6 relative">
        <div className="flex items-start justify-between">
          <SectionBadge label="Real-Life Usage" />
          {isAdmin && !isLocked && (
            <button onClick={() => startAdminEdit(4)} className="text-muted-ash hover:text-terracotta transition-colors text-base" title="Edit">
              ✏️
            </button>
          )}
        </div>

        {isLocked ? (
          <div className="relative min-h-[200px] overflow-hidden rounded-2xl">
            <div className="pointer-events-none blur-md opacity-20 saturate-0 space-y-4 p-4">
              <p className="text-base text-muted-ash">Real-life usage examples are hidden for free users. Upgrade to see the word in professional, academic, and everyday contexts.</p>
            </div>
            <LockedOverlay label="Real Life Usage" />
          </div>
        ) : adminEditCard === 4 ? (
          <div className="space-y-4">
            {(adminFields.real_life_usage || []).map((u: any, idx: number) => (
              <div key={idx} className="space-y-2 bg-deep-canvas p-3 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-ash uppercase">Item {idx + 1}</span>
                  <button
                    onClick={() => {
                      const arr = [...adminFields.real_life_usage];
                      arr.splice(idx, 1);
                      setAdminFields((p) => ({ ...p, real_life_usage: arr }));
                    }}
                    className="text-terracotta text-xs"
                  >
                    × Remove
                  </button>
                </div>
                <AdminInput
                  label="Context"
                  value={u.context}
                  onChange={(v) => {
                    const arr = [...adminFields.real_life_usage];
                    arr[idx] = { ...arr[idx], context: v };
                    setAdminFields((p) => ({ ...p, real_life_usage: arr }));
                  }}
                />
                <AdminTextarea
                  label="Example"
                  value={u.example}
                  onChange={(v) => {
                    const arr = [...adminFields.real_life_usage];
                    arr[idx] = { ...arr[idx], example: v };
                    setAdminFields((p) => ({ ...p, real_life_usage: arr }));
                  }}
                />
              </div>
            ))}
            <button
              onClick={() => setAdminFields((p) => ({ ...p, real_life_usage: [...(p.real_life_usage || []), { context: "", example: "" }] }))}
              className="w-full py-2 bg-white/5 rounded-xl text-xs font-bold text-muted-ash hover:text-light-gray transition-colors"
            >
              + Add Usage
            </button>
            <div className="flex gap-3">
              <button onClick={handleAdminSave} className="flex-1 py-2.5 bg-terracotta rounded-xl text-sm font-bold text-white">Save</button>
              <button onClick={() => setAdminEditCard(null)} className="flex-1 py-2.5 bg-white/5 rounded-xl text-sm font-bold text-light-gray">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {usages.length > 0 ? (
              usages.map((usage: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <h4 className="text-[10px] font-bold text-muted-ash uppercase tracking-wider bg-deep-canvas inline-block px-3 py-1 rounded-lg border border-white/5">
                    {usage.context}
                  </h4>
                  <p className={`leading-relaxed text-light-gray/90 mt-2 pl-3 border-l-2 border-terracotta/30 ${textSize === 'sm' ? 'text-xs' : textSize === 'base' ? 'text-sm md:text-base' : textSize === 'lg' ? 'text-base md:text-lg' : 'text-lg md:text-xl'}`}>
                    {renderMarkdown(usage.example, lesson.word)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-ash">No real life usage scenarios provided.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Card 5: Quiz
  const renderCard5 = () => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <SectionBadge label="Quiz" />
        {isAdmin && (
          <button onClick={() => startAdminEdit(5)} className="text-muted-ash hover:text-terracotta transition-colors text-base" title="Edit">
            ✏️
          </button>
        )}
      </div>

      {adminEditCard === 5 ? (
        <div className="space-y-4">
          <AdminTextarea
            label="Question"
            value={adminFields.quiz_question || ""}
            onChange={(v) => setAdminFields((p) => ({ ...p, quiz_question: v }))}
          />
          {(adminFields.quiz_options || []).map((opt: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3 bg-deep-canvas p-3 rounded-xl border border-white/5">
              <input
                type="radio"
                name="correct"
                checked={opt.isCorrect}
                onChange={() => {
                  const arr = adminFields.quiz_options.map((o: any, i: number) => ({ ...o, isCorrect: i === idx }));
                  setAdminFields((p) => ({ ...p, quiz_options: arr }));
                }}
                className="accent-terracotta"
              />
              <input
                value={opt.text}
                onChange={(e) => {
                  const arr = [...adminFields.quiz_options];
                  arr[idx] = { ...arr[idx], text: e.target.value };
                  setAdminFields((p) => ({ ...p, quiz_options: arr }));
                }}
                className="flex-1 bg-transparent border-b border-white/10 text-sm text-light-gray focus:outline-none focus:border-terracotta/50 py-1"
              />
            </div>
          ))}
          <AdminTextarea
            label="Explanation"
            value={adminFields.quiz_explanation || ""}
            onChange={(v) => setAdminFields((p) => ({ ...p, quiz_explanation: v }))}
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                const updatedLesson = {
                  ...lesson,
                  quiz_questions: [{
                    question: adminFields.quiz_question,
                    options: adminFields.quiz_options,
                    explanation: adminFields.quiz_explanation,
                  }],
                };
                setAdminFields((p) => ({ ...p, quiz_questions: updatedLesson.quiz_questions }));
                handleAdminSave();
              }}
              className="flex-1 py-2.5 bg-terracotta rounded-xl text-sm font-bold text-white"
            >
              Save
            </button>
            <button onClick={() => setAdminEditCard(null)} className="flex-1 py-2.5 bg-white/5 rounded-xl text-sm font-bold text-light-gray">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-muted-ash">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5 shrink-0">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
            <span className="text-[10px] uppercase tracking-wider font-bold">✅ Quiz marks this word complete for SRS review</span>
          </div>

          <p className={`font-semibold text-light-gray leading-snug ${textSize === 'sm' ? 'text-base' : textSize === 'base' ? 'text-lg md:text-xl' : textSize === 'lg' ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}>
            {renderMarkdown(activeQuiz.question)}
          </p>

          <div className="flex flex-col space-y-3">
            {shuffledOptions.map((option, idx) => {
              const isSelected = selectedOption === idx;
              let optionStyle = "border-white/5 bg-deep-canvas text-light-gray hover:bg-white/5";
              if (isSelected) {
                if (quizSubmitted) {
                  optionStyle = option.isCorrect
                    ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"
                    : "border-terracotta/30 bg-dark-blush text-terracotta";
                } else {
                  optionStyle = "border-terracotta/50 bg-dark-blush text-terracotta";
                }
              } else if (quizSubmitted && option.isCorrect) {
                optionStyle = "border-emerald-500/20 bg-emerald-950/10 text-emerald-400/80";
              }

              return (
                <button
                  key={idx}
                  disabled={quizSubmitted}
                  onClick={() => handleOptionClick(idx)}
                  className={`w-full text-left p-4 rounded-2xl border font-medium transition-all duration-200 ${optionStyle} ${textSize === 'sm' ? 'text-xs' : textSize === 'base' ? 'text-sm md:text-base' : textSize === 'lg' ? 'text-base md:text-lg' : 'text-lg md:text-xl'}`}
                >
                  {renderMarkdown(option.text)}
                </button>
              );
            })}
          </div>

          {quizSubmitted && (
            <div
              className={`transition-all duration-500 overflow-hidden transform ${
                showExplanation ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
              } bg-deep-canvas border border-white/5 p-5 rounded-2xl space-y-4`}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md ${
                      shuffledOptions[selectedOption!]?.isCorrect
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-terracotta/20 text-terracotta"
                    }`}
                  >
                    {shuffledOptions[selectedOption!]?.isCorrect ? "Correct" : "Incorrect"}
                  </span>
                  <span className="text-xs text-muted-ash uppercase tracking-wider font-semibold">
                    {isFirstCompletion ? "New word learned!" : quizPassed ? "Great review" : "Keep practicing"}
                  </span>
                </div>
                {xpEarned > 0 && (
                  <span className="text-xs font-black text-amber-400 bg-amber-950/30 border border-amber-500/20 px-3 py-1 rounded-full animate-pulse">
                    +{xpEarned} XP
                  </span>
                )}
              </div>
              <p className={`leading-relaxed text-muted-ash ${textSize === 'sm' ? 'text-sm' : textSize === 'base' ? 'text-base' : textSize === 'lg' ? 'text-lg' : 'text-xl'}`}>
                {renderMarkdown(activeQuiz.explanation)}
              </p>
              {nextReviewDays !== null && (
                <div className="flex items-center gap-3 text-xs text-muted-ash border-t border-white/5 pt-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-terracotta shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <span>
                    {quizPassed
                      ? nextReviewDays === 1 ? "Next review: tomorrow." : `Next review: in ${nextReviewDays} days.`
                      : nextReviewDays === 1 ? "You'll see this word again tomorrow." : `You'll see this word again in ${nextReviewDays} days.`}
                  </span>
                </div>
              )}
              <p className="text-[10px] text-muted-ash/60 text-center">Swipe right or tap Next to see your results →</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Card 6: Completion
  const renderCard6 = () => (
    <div className="relative space-y-8 text-center overflow-hidden">
      <ConfettiParticles />
      <div className="relative z-10 space-y-6">
        <SectionBadge label="Complete! 🎉" />

        <div className="flex justify-center">
          <div className="bg-deep-canvas p-6 rounded-3xl border border-terracotta/20 shadow-[0_0_40px_rgba(224,75,53,0.15)] animate-pulse">
            <Stickman pose="jumping" className="w-24 h-24 md:w-32 md:h-32" headColor="var(--color-terracotta)" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-black text-light-gray uppercase tracking-tight">
            Word Mastered!
          </h2>
          <p className="text-muted-ash text-sm md:text-base">
            You&apos;ve completed the lesson for{" "}
            <span className="text-terracotta font-bold">{lesson.word}</span>
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {xpEarned > 0 && (
            <div className="bg-amber-950/30 border border-amber-500/20 px-4 py-2 rounded-2xl">
              <p className="text-[10px] text-amber-400/70 uppercase tracking-widest font-bold">XP Earned</p>
              <p className="text-2xl font-black text-amber-400">+{xpEarned}</p>
            </div>
          )}
          {nextReviewDays !== null && (
            <div className="bg-deep-canvas border border-white/10 px-4 py-2 rounded-2xl">
              <p className="text-[10px] text-muted-ash uppercase tracking-widest font-bold">Next Review</p>
              <p className="text-2xl font-black text-light-gray">{nextReviewDays === 1 ? "Tomorrow" : `${nextReviewDays}d`}</p>
            </div>
          )}
          <div className="bg-deep-canvas border border-emerald-500/20 px-4 py-2 rounded-2xl">
            <p className="text-[10px] text-emerald-400/70 uppercase tracking-widest font-bold">Status</p>
            <p className="text-2xl font-black text-emerald-400">{quizPassed ? "✓ Learned" : "Reviewed"}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm uppercase tracking-widest text-light-gray hover:bg-white/10 transition-all text-center"
          >
            ← Back to Dashboard
          </Link>
          {nextWordSlug && (
            <Link
              href={`/lesson/${nextWordSlug}`}
              className="flex-1 py-4 bg-terracotta rounded-2xl font-bold text-sm uppercase tracking-widest text-white hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all text-center"
            >
              Next Word →
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  const cardRenderers = [renderCard0, renderCard1, renderCard2, renderCard3, renderCard4, renderCard5, renderCard6];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      {...swipeHandlers}
      className="flex flex-col h-screen bg-absolute-black text-light-gray select-none relative overflow-hidden"
    >
      <FloatingStickmen pose="standing" />

      <audio
        ref={audioRef}
        src={audioSrc || lesson.audio_url || undefined}
        preload="metadata"
        autoPlay
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 120)}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-absolute-black/95 backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-3 flex items-center justify-between shadow-lg">
        <Link href="/" className="shrink-0">
          <Logo className="w-28 md:w-32 h-8 md:h-10" />
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-ash hover:text-light-gray transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </Link>
      </nav>

      {/* Main Viewport Container */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Persistent/Sticky Top Progress Bar */}
        <div className="w-full bg-absolute-black/95 border-b border-white/5 py-3 shrink-0 z-30">
          <div className="max-w-2xl mx-auto px-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-ash">
              <span>
                Step {currentCard + 1} of {TOTAL_CARDS} &nbsp;·&nbsp;{" "}
                <span className="text-light-gray">{lesson.word}</span>
              </span>
              
              {/* Utility Toolbar: Text Sizing + Help Tooltip */}
              <div className="relative flex items-center gap-1.5 border border-white/5 bg-white/5 rounded-full px-2.5 py-1 shrink-0">
                <button
                  onClick={decreaseTextSize}
                  className="hover:text-light-gray text-muted-ash transition-colors p-0.5"
                  title="Smaller text"
                  aria-label="Decrease text size"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5" />
                  </svg>
                </button>
                <span className="text-white/10 text-[10px]">|</span>
                <button
                  onClick={increaseTextSize}
                  className="hover:text-light-gray text-muted-ash transition-colors p-0.5"
                  title="Larger text"
                  aria-label="Increase text size"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7-7.5H5" />
                  </svg>
                </button>
                <span className="text-white/10 text-[10px]">|</span>
                <button
                  onClick={() => setShowSwipeHint((prev) => !prev)}
                  className={`hover:text-light-gray transition-colors p-0.5 ${showSwipeHint ? "text-terracotta" : "text-muted-ash"}`}
                  title="Help & gestures"
                  aria-label="Show help"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m0 4h.01" />
                  </svg>
                </button>

                {/* Floating Tooltip Bubble */}
                {showSwipeHint && (
                  <div className="absolute right-0 top-8 z-50 bg-card-gray border border-white/10 text-light-gray px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold w-52 text-center animate-in fade-in slide-in-from-top-2 duration-200 normal-case">
                    <div className="absolute top-[-5px] right-3.5 w-2.5 h-2.5 bg-card-gray border-t border-l border-white/10 rotate-45" />
                    <div className="flex flex-col gap-2">
                      <span className="text-left leading-normal font-medium text-light-gray">💡 Quick Tips:</span>
                      <ul className="text-left space-y-1 list-disc pl-3 text-muted-ash text-[10px] leading-normal font-normal">
                        <li>Swipe anywhere on screen to navigate cards.</li>
                        <li>Click + / - to resize page text.</li>
                        <li>Narration audio is persistent at the bottom.</li>
                      </ul>
                      <button
                        onClick={() => {
                          setShowSwipeHint(false);
                          localStorage.setItem("vocabpod_swipe_hint_dismissed", "1");
                        }}
                        className="mt-1 w-full py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-muted-ash hover:text-white uppercase tracking-wider"
                      >
                        Got it
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress Bar Track */}
            <div className="bg-white/5 rounded-full h-2.5 overflow-hidden relative border border-white/5 shadow-inner">
              <div
                className="bg-gradient-to-r from-terracotta to-[#f97316] rounded-full h-full transition-all duration-700 relative"
                style={{
                  width: `${progressPct}%`,
                  animation: "pulse-glow 2s infinite ease-in-out"
                }}
              >
                {/* Fast sweeping shimmer line */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  style={{
                    animation: "sweep 1.8s infinite linear"
                  }}
                />
              </div>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {CARD_LABELS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (i <= currentCard || i === currentCard + 1) {
                      goToCard(i);
                    }
                  }}
                  title={label}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === currentCard
                      ? "bg-terracotta w-6"
                      : i < currentCard
                      ? "bg-terracotta/40 w-3 hover:bg-terracotta/60"
                      : "bg-white/10 w-3"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Card Area */}
        <div className="flex-1 overflow-y-auto py-6 md:py-8 flex flex-col justify-center">
          <div className="w-full max-w-2xl mx-auto px-4 relative flex items-center min-h-[300px]">
            {/* Left Floating Arrow Button */}
            <button
              onClick={() => navigateTo("right")}
              disabled={!canGoPrev}
              className={`absolute left-2 md:left-[-60px] z-30 w-11 h-11 rounded-full border flex items-center justify-center transition-all bg-card-gray/90 backdrop-blur-sm shadow-xl ${
                canGoPrev
                  ? "border-white/10 text-light-gray hover:border-terracotta/50 hover:bg-white/5 hover:scale-105"
                  : "border-white/5 text-muted-ash/20 cursor-not-allowed opacity-30"
              }`}
              aria-label="Previous card"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Card Content Container */}
            <div className="flex-1 overflow-hidden relative">
              <div
                className="bg-card-gray border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden relative"
                style={getSlideStyle()}
              >
                {cardRenderers[currentCard]?.()}
              </div>
            </div>

            {/* Right Floating Arrow Button */}
            <button
              onClick={() => navigateTo("left")}
              disabled={!canGoNext}
              className={`absolute right-2 md:right-[-60px] z-30 w-11 h-11 rounded-full border flex items-center justify-center transition-all shadow-xl ${
                canGoNext
                  ? "bg-terracotta border-terracotta text-white hover:scale-105 hover:shadow-[0_0_15px_rgba(224,75,53,0.4)]"
                  : "bg-white/5 border-white/5 text-muted-ash/20 cursor-not-allowed opacity-30"
              }`}
              aria-label="Next card"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Persistent Bottom Control Bar */}
        <div className="w-full bg-absolute-black/95 border-t border-white/5 py-4 pb-6 shrink-0 z-30 shadow-2xl">
          <div className="max-w-2xl mx-auto px-4 space-y-3.5">
            {/* Persistent Audio Player */}
            <div className="bg-card-gray/90 backdrop-blur-md border border-white/5 shadow-lg rounded-2xl p-3.5 flex items-center justify-between gap-4 relative overflow-hidden transition-all duration-300">
              {!isPremium ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎧</span>
                    <span className="text-xs text-muted-ash font-medium">Narration is a Premium feature</span>
                  </div>
                  <Link
                    href="/upgrade"
                    className="bg-terracotta hover:bg-terracotta/90 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all"
                  >
                    Unlock
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 shrink-0 rounded-full bg-terracotta text-white flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(224,75,53,0.4)]"
                    title={isPlaying ? "Pause narration" : "Play narration"}
                  >
                    {isPlaying ? (
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 fill-current translate-x-[1px]" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleProgressBarChange}
                      className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-terracotta focus:outline-none"
                    />
                    <span className="text-[10px] text-muted-ash shrink-0 font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  {/* Audio Visualizer Waves */}
                  <div className="flex items-end gap-[3px] h-4 w-6 shrink-0 justify-center">
                    <span className={`w-[2px] bg-terracotta rounded-full transition-all duration-300 ${isPlaying ? "animate-[bounce-bar_1.2s_infinite_ease-in-out_0.1s]" : ""}`} style={{ height: isPlaying ? undefined : "4px" }} />
                    <span className={`w-[2px] bg-terracotta rounded-full transition-all duration-300 ${isPlaying ? "animate-[bounce-bar_1.2s_infinite_ease-in-out_0.3s]" : ""}`} style={{ height: isPlaying ? undefined : "8px" }} />
                    <span className={`w-[2px] bg-terracotta rounded-full transition-all duration-300 ${isPlaying ? "animate-[bounce-bar_1.2s_infinite_ease-in-out_0.5s]" : ""}`} style={{ height: isPlaying ? undefined : "6px" }} />
                    <span className={`w-[2px] bg-terracotta rounded-full transition-all duration-300 ${isPlaying ? "animate-[bounce-bar_1.2s_infinite_ease-in-out_0.2s]" : ""}`} style={{ height: isPlaying ? undefined : "10px" }} />
                  </div>
                </>
              )}
            </div>

            {/* Nav Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTo("right")}
                disabled={!canGoPrev}
                className={`flex-1 min-h-[48px] py-4 rounded-2xl border text-sm font-bold uppercase tracking-widest transition-all ${
                  canGoPrev
                    ? "bg-card-gray border-white/10 text-light-gray hover:border-terracotta/50"
                    : "bg-white/5 border-white/5 text-muted-ash/30 cursor-not-allowed"
                }`}
              >
                ← Previous
              </button>
              <button
                onClick={() => navigateTo("left")}
                disabled={!canGoNext}
                className={`flex-1 min-h-[48px] py-4 rounded-2xl border text-sm font-bold uppercase tracking-widest transition-all ${
                  canGoNext
                    ? "bg-terracotta border-terracotta text-white hover:shadow-[0_0_20px_rgba(224,75,53,0.4)]"
                    : "bg-white/5 border-white/5 text-muted-ash/30 cursor-not-allowed"
                }`}
              >
                {currentCard === TOTAL_CARDS - 1 ? "Done ✓" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
