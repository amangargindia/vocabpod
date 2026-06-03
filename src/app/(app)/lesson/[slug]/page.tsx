"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { getWordLesson, WordLesson } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useVocabProgress } from "@/hooks/useVocabProgress";
import Overlay from "@/components/Overlay";
import { getCachedAudio } from "@/lib/audioCache";
import { type StickmanPose } from "@/components/Stickman";
import dynamic from "next/dynamic";
const Stickman = dynamic(() => import("@/components/Stickman"), { ssr: false });
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import { cleanSvgString } from "@/lib/svgUtils";

// Recursive JSONB SVG Element Renderer
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
    sanitizedProps.style.split(";").forEach((pair) => {
      const idx = pair.indexOf(":");
      if (idx !== -1) {
        let key = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        if (key && value) {
          if (!key.startsWith("--")) {
            key = key.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
          }
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
  
  // Convert SVG properties from kebab-case to camelCase for React
  const finalProps: Record<string, any> = {};
  for (const key of Object.keys(sanitizedProps)) {
    if (key.includes('-') && !key.startsWith('data-') && !key.startsWith('aria-')) {
      const camelKey = key.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      finalProps[camelKey] = sanitizedProps[key];
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
}



function FloatingStickmen({ pose }: { pose: StickmanPose }) {
  const [positions, setPositions] = useState<{ top: string; left: string; scale: number; rotation: number; opacity: number }[]>([]);

  useEffect(() => {
    const count = Math.floor(Math.random() * 3) + 4; // 4 to 6 stickmen
    const newPositions = Array.from({ length: count }).map(() => ({
      top: `${Math.random() * 80 + 10}%`,
      left: `${Math.random() * 80 + 10}%`,
      scale: Math.random() * 0.5 + 0.5,
      rotation: Math.random() * 40 - 20,
      opacity: Math.random() * 0.03 + 0.02,
    }));
    setPositions(newPositions);
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

export default function LessonPage({ params }: { params: any }) {
  // Safe resolution for Next.js 15/16 parameter changes
  const resolvedParams = params && typeof params.then === "function"
    ? use(params)
    : params;
  const wordSlug = resolvedParams?.slug;

  // Page Data State
  const [lesson, setLesson] = useState<WordLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isPremium, isLoadingAuth } = useAuth();
  const [nextWordSlug, setNextWordSlug] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<any[]>([]);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);

  // Quiz State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [nextReviewDays, setNextReviewDays] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFirstCompletion, setIsFirstCompletion] = useState(false);
  const [quizPassed, setQuizPassed] = useState<boolean | null>(null);
  const [activeSection, setActiveSection] = useState<string>("word");

  const { markWordCompleted, syncWordSRS } = useVocabProgress(user?.id, !isLoadingAuth);

  // Scroll spy active section observer
  useEffect(() => {
    if (!lesson) return;

    const sections = ["word", "mnemonic", "story", "usage", "quiz"];
    const observerOptions = {
      root: null,
      rootMargin: "-30% 0px -50% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [lesson]);

  // Fetch word lesson from DB/mock on mount
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const [lessonData, res] = await Promise.all([
          getWordLesson(wordSlug),
          fetch("/api/words")
        ]);
        
        if (!lessonData) throw new Error("Word not found.");
        setLesson(lessonData);

        // Find next word
        const data = await res.json();
        const allWords = data.words || [];
        const currentIndex = allWords.findIndex((w: any) => w.word.toLowerCase() === lessonData.word.toLowerCase());
        if (currentIndex !== -1 && currentIndex < allWords.length - 1) {
          setNextWordSlug(allWords[currentIndex + 1].word);
        }

        // Initialize quiz
        const q = lessonData.quiz_questions[0];
        if (q && q.options) {
          setShuffledOptions([...q.options].sort(() => Math.random() - 0.5));
        }
        
        // Cache audio on load
        if (lessonData?.audio_url && isPremium) {
          getCachedAudio(lessonData.audio_url).then(setAudioSrc);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load vocabulary lesson.");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (!isLoadingAuth) {
      init();
    }
  }, [wordSlug, isLoadingAuth, isPremium]);

  // Sync Audio Progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) setIsPlaying(true);

  }, [lesson]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        console.log("Audio play blocked by browser, simulating playing state...");
      });
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
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleOptionClick = async (idx: number) => {
    if (quizSubmitted || isSubmitting || !lesson) return;
    setSelectedOption(idx);
    setIsSubmitting(true);
    setQuizSubmitted(true);
    
    const isCorrect = shuffledOptions[idx].isCorrect;
    const score = isCorrect ? 100 : 0;
    setQuizPassed(isCorrect);
    
    // Normalize word slug for consistent database and state matching
    const normalizedSlug = decodeURIComponent(wordSlug).toLowerCase();
    
    markWordCompleted(normalizedSlug, isCorrect);
    
    if (user?.id) {
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            wordSlug: normalizedSlug,
            score,
          }),
        });
        const data = await res.json();
        if (data.xpEarned) setXpEarned(data.xpEarned);
        if (data.nextReviewIn !== undefined) setNextReviewDays(data.nextReviewIn);
        if (data.isFirstCompletion) setIsFirstCompletion(true);
        // Sync SRS state into the local hook so home page updates instantly
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

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-absolute-black text-light-gray items-center justify-center space-y-6">
        <Logo />
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-terracotta animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-terracotta animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-terracotta animate-bounce"></div>
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-absolute-black text-light-gray select-none relative">
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

      <div className="flex-1 min-w-0 relative z-10 pb-[70px] md:pb-0">
        {/* Sticky Section Navbar */}
        <nav className="sticky top-0 z-40 bg-absolute-black/95 backdrop-blur-md border-b border-white/5 px-0 py-3 md:px-8 flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-4 shadow-lg">
          <Link href="/" className="shrink-0 px-4 md:px-0">
            <Logo className="w-28 md:w-32 h-8 md:h-10" />
          </Link>
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar w-full md:w-auto justify-start md:justify-center px-4 md:px-0 py-1">
            {[
              { id: "word", label: "Word" },
              { id: "mnemonic", label: "Mnemonic" },
              { id: "story", label: "Story" },
              { id: "usage", label: "Usage" },
              { id: "quiz", label: "Quiz" }
            ].map((tab) => {
              const isActive = activeSection === tab.id;
              return (
                <a
                  key={tab.id}
                  href={`#${tab.id}`}
                  onClick={() => setActiveSection(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 ${
                    isActive
                      ? "bg-terracotta/10 border border-terracotta/25 text-terracotta hover:bg-terracotta/20"
                      : "bg-white/5 border border-white/10 text-muted-ash hover:bg-terracotta/10 hover:text-terracotta hover:border-terracotta/25"
                  }`}
                >
                  {tab.label}
                </a>
              );
            })}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 md:px-6 md:py-12 space-y-8 md:space-y-12 overflow-x-hidden">
          
          {/* 1. Word Header & Audio */}
          <section id="word" className="bg-card-gray border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col space-y-6 scroll-mt-24">
            <div className="space-y-4 text-center">
              <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 bg-dark-blush text-terracotta rounded-full border border-terracotta/20">
                {lesson.type}
              </span>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-light-gray uppercase">
                {lesson.word}
              </h1>
              <p className="text-xl md:text-2xl text-muted-ash italic font-sans">{lesson.phonetic}</p>
            </div>
            
            {/* Meaning */}
            <div className="text-center pt-4">
              <p className="text-xl md:text-3xl leading-relaxed md:leading-snug text-light-gray/90 font-medium">
                {lesson.definition}
              </p>
            </div>

            {/* Premium Audio Player */}
            <div className="bg-deep-canvas p-4 md:p-6 rounded-2xl border border-white/5 flex flex-col space-y-4 relative overflow-hidden mt-6 max-w-sm mx-auto w-full">
              {!isPremium && (
                <div className="absolute inset-0 z-10 bg-absolute-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                  <span className="text-[10px] md:text-xs font-bold text-terracotta bg-dark-blush px-3 py-1 rounded-full uppercase tracking-widest mb-2 border border-terracotta/20">
                    Premium Feature
                  </span>
                  <Link href="/upgrade" className="text-xs font-semibold text-light-gray hover:text-white transition-colors">
                    Upgrade to unlock
                  </Link>
                </div>
              )}
              <div className="flex items-center justify-between space-x-4">
                <button 
                  onClick={togglePlay}
                  className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full bg-terracotta text-light-gray flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(224,75,53,0.4)]"
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 md:w-5 md:h-5 fill-current translate-x-[2px]" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                
                <div className="flex-1 space-y-1 md:space-y-2">
                  <input 
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleProgressBarChange}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-terracotta focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-muted-ash">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Mnemonic Anchor & Explanation */}
          <Overlay isLocked={!isAccessible} wordSlug={wordSlug} lockedText="Visual Mnemonic">
            <section id="mnemonic" className="bg-card-gray border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col space-y-6 scroll-mt-24">
              <div className="flex items-center space-x-3 border-b border-white/5 pb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="#E04B35" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5 shrink-0">
                  <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
                </svg>
                <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-terracotta">Visual Mnemonic</h3>
              </div>
              <div className="flex flex-col items-center space-y-6">
                <style>{`
                  .svg-anim-smooth svg * {
                     transition: all 0.3s ease-in-out;
                  }
                `}</style>
                <div className="w-full aspect-square shrink-0 rounded-2xl flex items-center justify-center relative bg-deep-canvas overflow-hidden">
                  {lesson.custom_image_url ? (
                    <img src={lesson.custom_image_url} alt="Mnemonic" className="w-full h-full object-contain p-4 drop-shadow-xl" />
                  ) : lesson.custom_svg ? (
                    <div 
                      className="w-full h-full p-4 flex items-center justify-center text-light-gray svg-mnemonic-container svg-anim-smooth [&>svg]:w-full [&>svg]:h-full"
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
                  <p className="text-sm md:text-base leading-relaxed text-light-gray/90 font-normal">
                    {lesson.narrative ? lesson.narrative.split(/(\*\*.*?\*\*)/g).map((part: string, index: number) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        const boldText = part.slice(2, -2);
                        return <strong key={index} className="text-terracotta font-black px-1 rounded">{boldText}</strong>;
                      }
                      return part;
                    }) : "No narrative provided."}
                  </p>
                </div>
              </div>
            </section>
          </Overlay>

          {/* 3. Story Section with Stickman */}
          <Overlay isLocked={!isPremium} wordSlug={wordSlug} lockedText="Story Reinforcement">
            <section id="story" className="bg-card-gray border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col space-y-6 scroll-mt-24">
              <div className="flex items-center space-x-3 border-b border-white/5 pb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="#E04B35" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5 shrink-0">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-terracotta">Story Reinforcement</h3>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {lesson.stickman_id && (
                  <div className="shrink-0 mx-auto md:mx-0 bg-deep-canvas p-4 rounded-2xl border border-white/5">
                    <Stickman pose={lesson.stickman_id as StickmanPose} className="w-20 h-20 md:w-24 md:h-24 drop-shadow-xl" headColor="var(--color-terracotta)" />
                  </div>
                )}
                <p className="flex-1 text-base md:text-lg leading-relaxed md:leading-loose text-muted-ash">
                  {(lesson as any).story ? (lesson as any).story.split(/(\*\*.*?\*\*)/g).map((part: string, index: number) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={index} className="font-bold text-terracotta">{part.slice(2, -2)}</strong>;
                    }
                    return part.split(new RegExp(`(${lesson.word})`, "gi")).map((subPart: string, subIndex: number) =>
                      subPart.toLowerCase() === lesson.word.toLowerCase()
                        ? <mark key={`${index}-${subIndex}`} className="bg-transparent text-terracotta font-bold not-italic">{subPart}</mark>
                        : subPart
                    );
                  }) : "No story provided."}
                </p>
              </div>
            </section>
          </Overlay>

          {/* 4. Real Life Usage Section */}
          <Overlay isLocked={!isPremium} wordSlug={wordSlug} lockedText="Real Life Usage">
            <section id="usage" className="bg-card-gray border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col space-y-6 scroll-mt-24">
              <div className="flex items-center space-x-3 border-b border-white/5 pb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="#E04B35" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5 shrink-0">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
                </svg>
                <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-terracotta">Real Life Scenarios</h3>
              </div>
              <div className="space-y-6 md:space-y-8 pt-2">
                {(lesson as any).real_life_usage && (lesson as any).real_life_usage.length > 0 ? (
                  (lesson as any).real_life_usage.map((usage: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="text-[10px] md:text-xs font-bold text-muted-ash uppercase tracking-wider bg-deep-canvas inline-block px-3 py-1 rounded-lg border border-white/5">{usage.context}</h4>
                      <p className="text-sm md:text-base leading-relaxed text-light-gray/90 mt-2 pl-1 border-l-2 border-terracotta/30">
                        {usage.example.split(/(\*\*.*?\*\*)/g).map((part: string, index: number) => {
                          if (part.startsWith("**") && part.endsWith("**")) {
                            return <strong key={index} className="text-terracotta font-bold">{part.slice(2, -2)}</strong>;
                          }
                          return part.split(new RegExp(`(${lesson.word})`, "gi")).map((subPart: string, subIndex: number) =>
                            subPart.toLowerCase() === lesson.word.toLowerCase()
                              ? <mark key={`${index}-${subIndex}`} className="bg-transparent text-terracotta font-bold not-italic">{subPart}</mark>
                              : subPart
                          );
                        })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm md:text-base text-muted-ash">No real life usage scenarios provided.</p>
                )}
              </div>
            </section>
          </Overlay>

          {/* 5. Interactive Quiz Component */}
          <Overlay isLocked={!isAccessible} wordSlug={wordSlug} lockedText="Active Recall Quiz">
            <section id="quiz" className="bg-card-gray border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col space-y-8 scroll-mt-24">
              <div className="flex items-center space-x-3 border-b border-white/5 pb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="#E04B35" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5 shrink-0">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-terracotta">Active Recall Quiz</h3>
                  <div className="flex items-center space-x-1.5 text-muted-ash">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                    </svg>
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wider font-bold">Word marked complete on quiz attempt</span>
                  </div>
                </div>
              </div>
              <p className="text-lg md:text-xl font-semibold text-light-gray leading-snug">
                {activeQuiz.question}
              </p>

              <div className="flex flex-col space-y-4">
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
                      className={`w-full text-left p-5 rounded-2xl border text-sm md:text-base font-medium transition-all duration-200 ${optionStyle}`}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>

              {quizSubmitted && (
                <div 
                  className={`transition-all duration-500 overflow-hidden transform ${
                    showExplanation ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                  } bg-deep-canvas border border-white/5 p-6 md:p-8 rounded-3xl space-y-6 mt-4`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center space-x-3">
                      <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md ${
                        shuffledOptions[selectedOption!]?.isCorrect
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-terracotta/20 text-terracotta"
                      }`}>
                        {shuffledOptions[selectedOption!]?.isCorrect ? "Correct" : "Incorrect"}
                      </span>
                      <span className="text-xs text-muted-ash uppercase tracking-wider font-semibold">
                        {isFirstCompletion
                          ? "New word learned!"
                          : quizPassed
                          ? "Great review"
                          : "Keep practicing"}
                      </span>
                    </div>
                    {xpEarned > 0 && (
                      <span className="text-xs font-black text-amber-400 bg-amber-950/30 border border-amber-500/20 px-3 py-1 rounded-full animate-pulse">
                        +{xpEarned} XP
                      </span>
                    )}
                  </div>
                  <p className="text-base md:text-lg text-muted-ash leading-relaxed">
                    {activeQuiz.explanation}
                  </p>
                  {nextReviewDays !== null && (
                    <div className="flex items-center space-x-3 text-xs md:text-sm text-muted-ash border-t border-white/5 pt-4">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-terracotta shrink-0">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      <span>
                        {quizPassed
                          ? nextReviewDays === 1
                            ? "Next review: tomorrow."
                            : `Next review: in ${nextReviewDays} days.`
                          : nextReviewDays === 1
                            ? "You'll see this word again tomorrow."
                            : `You'll see this word again in ${nextReviewDays} days.`}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row gap-4 w-full mt-4">
                    <Link href="/" className="flex-1 block py-4 bg-white/5 border border-white/10 rounded-full font-bold text-xs md:text-sm tracking-wider text-light-gray hover:bg-white/10 transition-all uppercase text-center">
                      Home
                    </Link>
                    {nextWordSlug && (
                      <Link href={`/lesson/${nextWordSlug}`} className="flex-1 block py-4 bg-terracotta border border-terracotta rounded-full font-bold text-xs md:text-sm tracking-wider text-light-gray hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all uppercase text-center">
                        Next Word
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </section>
          </Overlay>

        </main>

        {/* Footer */}
      <Footer />
      </div>
    </div>
  );
}
