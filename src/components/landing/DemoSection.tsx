"use client";

import { useState, useEffect, useRef } from "react";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";
import MnemonicSVG from "@/components/MnemonicSVG";
import {
  demoWords,
  FALLBACK_DEMO_WORDS,
  liveToDemoWord,
  type DemoWord,
} from "./demo-data";
import type { SalesConfig } from "./useSalesConfig";
import { useSalesConfig } from "./useSalesConfig";
import { useSwipe } from "@/hooks/useSwipe";
import {
  Lock,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  X as XIcon,
  Volume2,
} from "lucide-react";
import Link from "next/link";

interface Props {
  initialData?: SalesConfig | null;
}

export default function DemoSection({ initialData }: Props) {
  const [isDemoUnlocked, setIsDemoUnlocked] = useState(false);
  const [currentStage, setCurrentStage] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const { language } = useLandingLanguage();
  const { words: liveWords } = useSalesConfig(initialData ?? undefined);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [xpFloating, setXpFloating] = useState(false);

  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  // Intersection — we use it only to pause audio on scroll away
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const isPlayingRef = useRef(false);

  // Fixed bar visibility
  const demoBottomRef = useRef<HTMLDivElement>(null);
  const [showFixedBar, setShowFixedBar] = useState(false);

  const displayWords: DemoWord[] =
    liveWords.length > 0
      ? liveWords.map(liveToDemoWord)
      : demoWords.length > 0
      ? demoWords
      : FALLBACK_DEMO_WORDS;

  const word = displayWords[Math.min(currentWordIndex, displayWords.length - 1)];

  /* ── Unlock from localStorage ── */
  useEffect(() => {
    if (localStorage.getItem("vocabpod_demo_unlocked")) setIsDemoUnlocked(true);
  }, []);

  /* ── Audio setup ── */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsAudioPlaying(false);
    isPlayingRef.current = false;
    setAudioProgress(0);
    setAudioCurrentTime(0);
    setAudioDuration(0);

    if (!word?.audio_url) return;

    const audio = new Audio(word.audio_url);
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioCurrentTime(audio.currentTime);
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onDuration = () => {
      if (!isNaN(audio.duration)) setAudioDuration(audio.duration);
    };
    const onEnded = () => {
      setIsAudioPlaying(false);
      isPlayingRef.current = false;
      setAudioProgress(0);
      setAudioCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.audio_url]);

  /* ── IntersectionObserver for autoplay + pause on scroll ── */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          // Autoplay when section scrolls into view
          const audio = audioRef.current;
          if (audio && !isPlayingRef.current) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
            setIsAudioPlaying(true);
            isPlayingRef.current = true;
          }
        } else {
          // Pause when section leaves viewport
          const audio = audioRef.current;
          if (audio && isPlayingRef.current) {
            audio.pause();
            setIsAudioPlaying(false);
            isPlayingRef.current = false;
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ── Show fixed bottom nav bar while demo content is on screen ── */
  useEffect(() => {
    const sentinel = demoBottomRef.current;
    if (!sentinel) return;

    // Show bar when sentinel (bottom of section) is NOT in view
    const obs = new IntersectionObserver(
      ([entry]) => {
        // If the bottom of demo is not visible, AND top part is visible → show bar
        setShowFixedBar(!entry.isIntersecting && inView);
      },
      { threshold: 0 }
    );

    obs.observe(sentinel);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  // Simpler: just show bar when inView AND stage < 5
  const shouldShowBar = inView && currentStage < 5;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
      isPlayingRef.current = false;
    } else {
      audio.play().catch(() => {});
      setIsAudioPlaying(true);
      isPlayingRef.current = true;
    }
  };

  const seekAudio = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
    setAudioProgress(pct * 100);
  };

  const fmtTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const handleNextClick = () => {
    if (!isDemoUnlocked && currentStage === 0) {
      setShowEmailModal(true);
      return;
    }
    advanceStage();
  };

  const advanceStage = () => {
    if (currentStage < 5) setCurrentStage((p) => (p + 1) as 1 | 2 | 3 | 4 | 5);
  };

  const goBack = () => {
    if (currentStage > 0) {
      setCurrentStage((p) => (p - 1) as 0 | 1 | 2 | 3 | 4);
      setSelectedAnswer(null);
      setXpFloating(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSubmitting(true);
    setEmailError("");
    if (!/^\S+@\S+\.\S+$/.test(emailInput)) {
      setEmailError("Please enter a valid email address.");
      setEmailSubmitting(false);
      return;
    }
    try {
      await fetch("/api/landing/collect-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });
    } catch {}
    localStorage.setItem("vocabpod_demo_unlocked", emailInput);
    setIsDemoUnlocked(true);
    setShowEmailModal(false);
    setEmailSubmitting(false);
    advanceStage();
  };

  const handleAnswerSelect = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    if (idx === word.quiz.correctIndex) setXpFloating(true);
  };

  const handleNextWord = () => {
    setCurrentWordIndex((p) => (p + 1) % displayWords.length);
    setCurrentStage(0);
    setSelectedAnswer(null);
    setXpFloating(false);
  };

  const bold = (text: string, cls = "font-black text-terracotta") =>
    text.split(/(\*\*.*?\*\*)/g).map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <span key={i} className={cls}>
          {p.slice(2, -2)}
        </span>
      ) : (
        <span key={i}>{p}</span>
      )
    );

  const stageLabels = ["WORD", "STORY", "MNEMONIC", "USAGE", "QUIZ", "RESULT"];
  const hasAudio = !!word?.audio_url;

  // Swipe on content card to go to next/prev stage
  const swipeHandlers = useSwipe(
    () => handleNextClick(),
    () => goBack()
  );

  return (
    <>
      <section
        ref={sectionRef}
        id="demo"
        className="py-6 md:py-24 px-4 md:px-6 bg-absolute-black relative min-h-[100dvh] flex flex-col justify-center"
      >
        <div className="max-w-4xl mx-auto w-full flex flex-col items-center gap-5">
          {/* Header */}
          <div className="text-center shrink-0 animate-[fadeIn_0.6s_ease_both]">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-3 py-1 inline-block">
              HOW IT WORKS
            </span>
            <h2 className="text-2xl md:text-5xl font-black text-light-gray tracking-tight mt-3 md:mt-6">
              Experience a word. Right now.
            </h2>
          </div>

          {/* ── Sticky step progress bar ── */}
          <div className="sticky top-20 z-40 bg-absolute-black py-3 w-full shrink-0 select-none animate-[fadeIn_0.4s_ease_both]">
            <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -z-10" />
            <div className="flex justify-between items-center">
              {stageLabels.map((label, idx) => {
                const completed = idx < currentStage;
                const current = idx === currentStage;
                const locked = !isDemoUnlocked && idx > 0;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 bg-absolute-black px-1">
                    <div
                      className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold transition-all duration-300 ${
                        current
                          ? "bg-absolute-black border-2 border-terracotta text-terracotta shadow-[0_0_16px_rgba(224,75,53,0.6)]"
                          : completed
                          ? "bg-terracotta text-absolute-black scale-95"
                          : "bg-card-gray border border-white/10 text-muted-ash"
                      }`}
                    >
                      {completed ? <Check size={11} /> : locked ? <Lock size={10} /> : idx + 1}
                    </div>
                    <span
                      className={`text-[7px] md:text-[10px] font-bold uppercase tracking-wider hidden sm:block transition-colors ${
                        current || completed ? "text-light-gray" : "text-muted-ash"
                      }`}
                    >
                      {locked ? "LOCKED" : label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Content card ── */}
          <div
            {...swipeHandlers}
            className="w-full bg-card-gray border border-white/5 rounded-2xl md:rounded-3xl p-6 md:p-12 relative flex flex-col justify-center min-h-[360px] touch-pan-y"
          >
            {/* STAGE 0: WORD */}
            {currentStage === 0 && (
              <div className="flex flex-col items-center text-center animate-[scaleIn_0.35s_ease_both] py-6 px-4">
                <span className="text-terracotta text-sm font-bold uppercase tracking-widest border border-terracotta/20 rounded-full px-4 py-1.5 mb-4 inline-block">
                  {word.type}
                </span>
                <h3 className="text-5xl md:text-8xl font-black uppercase text-light-gray tracking-tight leading-none font-outfit select-none">
                  {word.word}
                </h3>
                <p className="text-sm md:text-lg text-muted-ash mt-3 font-mono">{word.phonetic}</p>
                <p className="text-xl md:text-3xl leading-relaxed max-w-3xl font-lora italic px-4 text-light-gray mt-6">
                  &ldquo;{word.definition}&rdquo;
                </p>
                <button
                  onClick={handleNextClick}
                  className="mt-10 bg-light-gray text-absolute-black hover:bg-white px-10 py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-2 group hover:scale-105 active:scale-95"
                >
                  Next: Story <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* STAGE 1: STORY */}
            {currentStage === 1 && (
              <div className="flex flex-col items-center text-center animate-[scaleIn_0.35s_ease_both] py-6 px-4">
                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-light-gray mb-6 font-outfit">
                  Story Reinforcement
                </h3>
                <p className="text-lg md:text-2xl leading-relaxed max-w-3xl font-lora text-light-gray">
                  {bold(language === "hi" && word.storyHinglish ? word.storyHinglish : word.story)}
                </p>
                <button
                  onClick={advanceStage}
                  className="mt-10 bg-terracotta text-white px-10 py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-terracotta/80 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                >
                  Next <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* STAGE 2: MNEMONIC */}
            {currentStage === 2 && (
              <div className="flex flex-col items-center text-center animate-[scaleIn_0.35s_ease_both] py-6 px-4">
                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-light-gray mb-6 font-outfit">
                  Visual Mnemonic
                </h3>
                <div className="aspect-square max-w-[200px] md:max-w-[280px] mb-6 flex items-center justify-center bg-absolute-black/40 w-full rounded-3xl border border-white/5 p-1 overflow-hidden">
                  <MnemonicSVG word={word} size={280} />
                </div>
                <p className="text-lg md:text-2xl text-light-gray max-w-3xl leading-relaxed mb-4 font-lora">
                  {bold(language === "hi" && word.narrativeHinglish ? word.narrativeHinglish : word.narrative)}
                </p>
                <p className="text-xs text-muted-ash opacity-60 mb-8">
                  Brains remember pictures 3× better than text alone.
                </p>
                <button
                  onClick={advanceStage}
                  className="bg-terracotta text-white px-10 py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-terracotta/80 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                >
                  Next: Usage <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* STAGE 3: USAGE */}
            {currentStage === 3 && (
              <div className="flex flex-col items-center text-center animate-[scaleIn_0.35s_ease_both] py-8 px-4">
                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-light-gray mb-8 font-outfit">
                  Real Life Usage
                </h3>
                <p className="text-xl md:text-3xl text-light-gray max-w-3xl leading-relaxed mb-8 italic font-lora">
                  &ldquo;
                  {bold(
                    language === "hi" && word.realLifeUseCaseHinglish
                      ? word.realLifeUseCaseHinglish
                      : word.realLifeUseCase
                  )}
                  &rdquo;
                </p>
                <p className="text-sm text-muted-ash max-w-lg leading-relaxed opacity-70 mb-10">
                  Usage examples help you speak advanced words naturally.
                </p>
                <button
                  onClick={advanceStage}
                  className="bg-terracotta text-white px-10 py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-terracotta/80 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                >
                  Take Quiz <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* STAGE 4: QUIZ */}
            {currentStage === 4 && (
              <div className="flex flex-col animate-[scaleIn_0.35s_ease_both] w-full max-w-2xl mx-auto relative py-4 px-2">
                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-light-gray mb-6 text-center font-outfit">
                  Active Recall Quiz
                </h3>
                <p className="text-lg md:text-2xl font-bold text-light-gray mb-8 text-center leading-relaxed font-outfit px-2">
                  {word.quiz.question}
                </p>
                <div className="space-y-3 max-w-xl w-full mx-auto">
                  {word.quiz.options.map((option, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === word.quiz.correctIndex;
                    const showResult = selectedAnswer !== null;
                    let cls = "bg-absolute-black border-white/5 hover:border-terracotta/30 text-light-gray";
                    if (showResult) {
                      if (isCorrect) cls = "bg-emerald-950/40 border-emerald-500/50 text-emerald-400";
                      else if (isSelected) cls = "bg-terracotta/10 border-terracotta/50 text-terracotta";
                      else cls = "bg-absolute-black/50 border-white/5 text-muted-ash opacity-50";
                    }
                    return (
                      <button
                        key={idx}
                        disabled={showResult}
                        onClick={() => handleAnswerSelect(idx)}
                        className={`w-full p-4 rounded-xl border text-left text-base md:text-lg font-medium transition-all flex justify-between items-center active:scale-[0.99] ${cls}`}
                      >
                        <span>{option}</span>
                        {showResult && isCorrect && <Check size={16} className="text-emerald-400 shrink-0" />}
                        {showResult && isSelected && !isCorrect && <X size={16} className="text-terracotta shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {selectedAnswer !== null && (
                  <div className="mt-8 p-6 bg-terracotta/5 border border-terracotta/10 rounded-xl animate-[slideUp_0.3s_ease_both] max-w-xl w-full mx-auto">
                    <p className="text-sm md:text-base text-light-gray leading-relaxed font-lora">
                      {word.quiz.explanation}
                    </p>
                    <div className="mt-5 flex justify-end">
                      <button
                        onClick={advanceStage}
                        className="bg-terracotta text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-terracotta/80 transition-colors flex items-center gap-2"
                      >
                        See Results <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
                {xpFloating && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl md:text-4xl font-black text-terracotta drop-shadow-[0_0_20px_rgba(224,75,53,0.8)] pointer-events-none animate-[floatUp_1.5s_ease-out_forwards] font-outfit">
                    +{word.xp} XP
                  </div>
                )}
              </div>
            )}

            {/* STAGE 5: RESULT */}
            {currentStage === 5 && (
              <div className="flex flex-col items-center text-center animate-[scaleIn_0.35s_ease_both] py-6 px-4">
                <h3 className="text-2xl md:text-4xl font-black text-light-gray mb-4 font-outfit">
                  You just learned a word using science! 🧠
                </h3>
                <p className="text-sm md:text-base text-muted-ash mb-10">
                  Here&apos;s how we&apos;ll ensure you never forget it:
                </p>
                <div className="flex items-center gap-2 mb-12 overflow-x-auto w-full max-w-3xl pb-2 hide-scrollbar justify-start md:justify-center px-4 shrink-0">
                  {["Learn", "2d", "4d", "7d", "14d", "30d", "PERMANENT"].map((step, idx, arr) => (
                    <div key={idx} className="flex items-center shrink-0">
                      <div
                        className={`px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest ${
                          idx === arr.length - 1
                            ? "bg-terracotta text-white shadow-[0_0_20px_rgba(224,75,53,0.5)]"
                            : "bg-dark-blush border border-terracotta/30 text-terracotta"
                        }`}
                      >
                        {step}
                      </div>
                      {idx < arr.length - 1 && <div className="w-6 md:w-10 h-px bg-terracotta/30 mx-1" />}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-center">
                  <a
                    href="/checkout"
                    className="w-full sm:w-auto bg-terracotta text-light-gray px-10 py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest hover:shadow-[0_0_30px_rgba(224,75,53,0.5)] hover:-translate-y-0.5 transition-all text-center font-outfit"
                  >
                    Subscribe for Daily Words
                  </a>
                  <button
                    onClick={handleNextWord}
                    className="w-full sm:w-auto border border-white/20 text-light-gray px-10 py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest hover:border-white/40 transition-all flex items-center justify-center gap-2 font-outfit"
                  >
                    <RefreshCw size={14} /> Try Another Word
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom sentinel — used to detect when section ends */}
          <div ref={demoBottomRef} className="h-px w-full" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FIXED BOTTOM BAR — visible when demo is in view & stage < 5
          Sits ABOVE the public layout's bottom CTA bar (z-50, h≈72px)
          Stack: [bottom:0] CTA  →  [bottom:72px] this bar
      ═══════════════════════════════════════════════════════════════════ */}
      {shouldShowBar && (
        <div className="fixed bottom-[72px] left-0 w-full z-[55] animate-[slideUp_0.25s_ease_both] md:hidden">
          {/* Back / Next row */}
          <div className="bg-absolute-black/95 backdrop-blur-md border-t border-white/10 px-4 py-2 flex items-center gap-3">
            <button
              disabled={currentStage === 0}
              onClick={goBack}
              className="flex items-center gap-1.5 bg-card-gray border border-white/10 text-light-gray font-bold py-2.5 px-4 rounded-full text-[11px] uppercase tracking-widest disabled:opacity-30 disabled:pointer-events-none hover:border-white/30 transition-all active:scale-95"
            >
              <ArrowLeft size={14} /> Back
            </button>

            <span className="flex-1 text-center text-[10px] font-black tracking-widest text-muted-ash uppercase">
              Step {currentStage + 1} of 5
            </span>

            <button
              onClick={handleNextClick}
              className="flex items-center gap-1.5 bg-terracotta text-white font-bold py-2.5 px-4 rounded-full text-[11px] uppercase tracking-widest hover:bg-terracotta/90 shadow-[0_0_16px_rgba(224,75,53,0.4)] transition-all active:scale-95"
            >
              Next <ArrowRight size={14} />
            </button>
          </div>

          {/* Audio player row — only when audio exists */}
          {hasAudio && (
            <div className="bg-absolute-black/98 backdrop-blur-md border-t border-terracotta/20 px-4 py-2.5 flex items-center gap-3">
              <button
                onClick={togglePlay}
                aria-label={isAudioPlaying ? "Pause" : "Play audio"}
                className="w-10 h-10 rounded-full bg-terracotta text-white flex items-center justify-center hover:bg-terracotta/90 active:scale-90 transition-all shrink-0 shadow-[0_0_12px_rgba(224,75,53,0.5)]"
              >
                {isAudioPlaying ? (
                  <span className="flex gap-0.5 items-center">
                    <span className="w-1 h-4 bg-white rounded-full" />
                    <span className="w-1 h-4 bg-white rounded-full" />
                  </span>
                ) : (
                  <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-terracotta flex items-center gap-1">
                    <Volume2 size={10} /> AUDIO
                  </span>
                  <span className="text-[9px] font-mono text-muted-ash tabular-nums">
                    {fmtTime(audioCurrentTime)} / {fmtTime(audioDuration)}
                  </span>
                </div>
                <div
                  className="w-full h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer"
                  onClick={seekAudio}
                >
                  <div
                    className="h-full bg-terracotta rounded-full"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Same bar for desktop — positioned differently */}
      {shouldShowBar && (
        <div className="fixed bottom-0 left-0 w-full z-[55] animate-[slideUp_0.25s_ease_both] hidden md:block">
          <div className="bg-absolute-black/95 backdrop-blur-md border-t border-white/10 px-8 py-3 flex items-center gap-6 max-w-4xl mx-auto">
            <button
              disabled={currentStage === 0}
              onClick={goBack}
              className="flex items-center gap-2 bg-card-gray border border-white/10 text-light-gray font-bold py-2.5 px-5 rounded-full text-xs uppercase tracking-widest disabled:opacity-30 disabled:pointer-events-none hover:border-white/30 transition-all active:scale-95"
            >
              <ArrowLeft size={15} /> Back
            </button>

            {hasAudio && (
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={togglePlay}
                  aria-label={isAudioPlaying ? "Pause" : "Play audio"}
                  className="w-10 h-10 rounded-full bg-terracotta text-white flex items-center justify-center hover:bg-terracotta/90 active:scale-90 transition-all shrink-0 shadow-[0_0_12px_rgba(224,75,53,0.4)]"
                >
                  {isAudioPlaying ? (
                    <span className="flex gap-0.5 items-center">
                      <span className="w-1 h-4 bg-white rounded-full" />
                      <span className="w-1 h-4 bg-white rounded-full" />
                    </span>
                  ) : (
                    <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-terracotta flex items-center gap-1">
                      <Volume2 size={10} /> AUDIO
                    </span>
                    <span className="text-[9px] font-mono text-muted-ash tabular-nums">
                      {fmtTime(audioCurrentTime)} / {fmtTime(audioDuration)}
                    </span>
                  </div>
                  <div
                    className="w-full h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer"
                    onClick={seekAudio}
                  >
                    <div className="h-full bg-terracotta rounded-full" style={{ width: `${audioProgress}%` }} />
                  </div>
                </div>
              </div>
            )}

            {!hasAudio && (
              <span className="flex-1 text-center text-xs font-black tracking-widest text-muted-ash uppercase">
                Step {currentStage + 1} of 5
              </span>
            )}

            <button
              onClick={handleNextClick}
              className="flex items-center gap-2 bg-terracotta text-white font-bold py-2.5 px-5 rounded-full text-xs uppercase tracking-widest hover:bg-terracotta/90 shadow-[0_0_16px_rgba(224,75,53,0.4)] transition-all active:scale-95"
            >
              Next <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Email gate modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[100] bg-absolute-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]">
          <div className="bg-card-gray border border-terracotta/20 rounded-3xl p-6 md:p-8 max-w-sm w-full relative shadow-2xl animate-[scaleIn_0.3s_ease]">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-4 right-4 text-muted-ash hover:text-light-gray transition-colors"
            >
              <XIcon size={20} />
            </button>
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-light-gray mb-1 mt-2">
              Unlock the Full Demo
            </h3>
            <p className="text-xs md:text-sm text-muted-ash mb-6 leading-relaxed">
              See how VocabPod encodes words permanently. Enter your email to unlock.
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-absolute-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-terracotta/50 transition-colors text-light-gray"
                />
                {emailError && <p className="text-terracotta text-xs mt-2">{emailError}</p>}
              </div>
              <button
                type="submit"
                disabled={emailSubmitting}
                className="w-full bg-terracotta text-light-gray font-bold text-sm tracking-widest uppercase py-3 rounded-xl hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all disabled:opacity-50"
              >
                {emailSubmitting ? "Unlocking..." : "Unlock Demo →"}
              </button>
              <p className="text-center text-[10px] text-muted-ash uppercase tracking-widest pt-2">
                No spam. No credit card required.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
