"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { getWordLesson, WordLesson, getUser, signOut } from "@/lib/supabase";
import { useVocabProgress } from "@/hooks/useVocabProgress";

// Raw SVG for the Animated Logo (Dark Mode Variant)
const Logo = () => (
  <svg viewBox="0 0 350 120" className="w-40 h-14" xmlns="http://www.w3.org/2000/svg">
    <g stroke="#E04B35" strokeWidth="2.5" strokeLinecap="round">
      <path d="M 50 40 L 40 30" strokeDasharray="20" strokeDashoffset="20">
        <animate attributeName="stroke-dashoffset" values="20; 20; 20; -20; -20" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M 60 35 L 60 20" strokeDasharray="20" strokeDashoffset="20">
        <animate attributeName="stroke-dashoffset" values="20; 20; 20; -20; -20" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M 70 40 L 80 30" strokeDasharray="20" strokeDashoffset="20">
        <animate attributeName="stroke-dashoffset" values="20; 20; 20; -20; -20" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" />
      </path>
    </g>
    <path d="M 16 35 L 60 102 L 104 35" fill="none" stroke="#F5F5F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
      <animate attributeName="d" values="M 16 35 L 60 102 L 104 35; M 16 35 L 60 102 L 104 35; M 4 55 L 60 110 L 116 55; M 16 35 L 60 102 L 104 35; M 16 35 L 60 102 L 104 35" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.5 1; 0.42 0 1 1; 0 0 0.58 1; 1 0 1 1"/>
    </path>
    <path d="M 24 35 L 60 92 L 96 35" fill="none" stroke="#F5F5F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
      <animate attributeName="d" values="M 24 35 L 60 92 L 96 35; M 24 35 L 60 92 L 96 35; M 10 50 L 60 100 L 110 50; M 24 35 L 60 92 L 96 35; M 24 35 L 60 92 L 96 35" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.5 1; 0.42 0 1 1; 0 0 0.58 1; 1 0 1 1"/>
    </path>
    <path d="M 34 35 L 60 80 L 86 35" fill="none" stroke="#F5F5F7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
      <animate attributeName="d" values="M 34 35 L 60 80 L 86 35; M 34 35 L 60 80 L 86 35; M 16 45 L 60 90 L 104 45; M 34 35 L 60 80 L 86 35; M 34 35 L 60 80 L 86 35" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.5 1; 0.42 0 1 1; 0 0 0.58 1; 1 0 1 1"/>
    </path>
    <circle cx="60" cy="48" r="10" fill="#E04B35">
      <animate attributeName="cy" values="48; 20; 65; 48; 48" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0 0 0.58 1; 0.42 0 1 1; 0 0 0.58 1; 1 0 1 1"/>
    </circle>
    <text x="125" y="74" fill="#F5F5F7" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="36" letterSpacing="-1">VocabPod</text>
  </svg>
);

// Recursive JSONB SVG Element Renderer
interface SVGNode {
  tag: string;
  props: Record<string, any>;
  children?: SVGNode[];
}

const DynamicSVGNode = ({ node }: { node: SVGNode }) => {
  const Tag = node.tag as any;
  
  // Clean up any React runtime warning properties if necessary
  const sanitizedProps = { ...node.props };
  
  return (
    <Tag {...sanitizedProps}>
      {node.children?.map((child, idx) => (
        <DynamicSVGNode key={idx} node={child} />
      ))}
    </Tag>
  );
};

export default function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const wordSlug = resolvedParams.slug;

  // Page Data State
  const [lesson, setLesson] = useState<WordLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{email?: string} | null>(null);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Quiz State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Fetch word lesson from DB/mock on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [data, currentUser] = await Promise.all([
          getWordLesson(wordSlug),
          getUser()
        ]);
        setLesson(data);
        setUser(currentUser);
      } catch (err: any) {
        setError(err.message || "Failed to load vocabulary lesson.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [wordSlug]);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    window.location.reload();
  };

  // Sync Audio Progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 120);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [lesson]); // Re-attach when lesson (and therefore audio element) changes

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

  const { markWordCompleted } = useVocabProgress();

  const handleQuizSubmit = () => {
    if (selectedOption === null || !lesson) return;
    setQuizSubmitted(true);
    
    const isCorrect = lesson.quiz_questions[0].options[selectedOption].isCorrect;
    markWordCompleted(wordSlug, isCorrect);
    
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

  return (
    <div className="flex flex-col min-h-screen bg-absolute-black text-light-gray select-none">
      <audio ref={audioRef} src={lesson.audio_url} preload="metadata" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-absolute-black/80 border-b border-white/5 px-6 py-4 md:px-12 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center space-x-6">
            <span className="text-xs text-muted-ash hidden md:inline-flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta mr-2 animate-pulse"></span>
              Vertical Slice: Preview Mode
            </span>
            {user ? (
              <div className="group relative">
                <div className="w-10 h-10 rounded-full bg-card-gray border border-white/10 flex items-center justify-center font-bold text-muted-ash cursor-pointer hover:border-white/30 transition-colors uppercase">
                  {user.email ? user.email.charAt(0) : "U"}
                </div>
                <div className="absolute right-0 mt-2 w-32 bg-card-gray border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-terracotta hover:bg-white/5 rounded-xl">
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="text-xs font-semibold px-4 py-2 border border-white/10 rounded-full hover:bg-white/5 transition-all uppercase tracking-wider">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Lesson Narrative & Player */}
        <section className="lg:col-span-7 bg-card-gray border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col space-y-8">
          
          {/* Header Typography */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-dark-blush text-terracotta rounded-full border border-terracotta/20">
                {lesson.type}
              </span>
              <span className="text-xs text-muted-ash font-medium tracking-wider">
                WEEK 1 • LESSON 1
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-light-gray uppercase">
              {lesson.word}
            </h1>
            <p className="text-xl text-muted-ash italic font-sans">{lesson.phonetic}</p>
          </div>

          {/* Premium Audio Player */}
          <div className="bg-deep-canvas p-6 rounded-2xl border border-white/5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-terracotta text-light-gray flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(224,75,53,0.4)]"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 fill-current translate-x-[2px]" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              
              <div className="flex-1 mx-4 space-y-2">
                <input 
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleProgressBarChange}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-terracotta focus:outline-none"
                />
                <div className="flex justify-between text-xs text-muted-ash">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="text-xs font-bold text-terracotta bg-dark-blush border border-terracotta/10 px-3 py-1 rounded-full uppercase tracking-wider">
                1.5x speed
              </div>
            </div>
          </div>

          {/* Mnemonic Narrative */}
          <div className="space-y-6 border-t border-white/5 pt-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-ash">
              The Mnemonic Story
            </h3>
            <p className="text-lg leading-loose text-light-gray/90 font-medium">
              {lesson.definition}
            </p>
            <p className="text-md leading-loose text-muted-ash font-normal">
              {lesson.narrative}
            </p>
          </div>

        </section>

        {/* Right Column: Illustration & Interactive Quiz */}
        <section className="lg:col-span-5 flex flex-col space-y-8">
          
          {/* Mnemonic Spot-Color Illustration */}
          <div className="bg-card-gray border border-white/5 rounded-3xl p-8 shadow-2xl flex items-center justify-center min-h-[300px] overflow-hidden relative">
            <div className="absolute top-4 left-4 text-xs font-semibold text-muted-ash uppercase tracking-wider">
              Visual Mnemonic Anchor
            </div>
            
            {/* Custom Inline SVG dynamically rendering the JSONB vectors */}
            <svg viewBox="0 0 400 300" className="w-full h-auto max-w-sm mx-auto" xmlns="http://www.w3.org/2000/svg">
              {lesson.svg_elements.map((node, index) => (
                <DynamicSVGNode key={index} node={node} />
              ))}
            </svg>
          </div>

          {/* Interactive Quiz Component */}
          <div className="bg-card-gray border border-white/5 rounded-3xl p-8 shadow-2xl flex flex-col space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-ash">
              Active Recall Quiz
            </h3>
            <p className="text-md font-semibold text-light-gray leading-snug">
              {activeQuiz.question}
            </p>

            <div className="flex flex-col space-y-3">
              {activeQuiz.options.map((option, idx) => {
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
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all duration-200 ${optionStyle}`}
                  >
                    {option.text}
                  </button>
                );
              })}
            </div>

            {/* CTA / Reveal State */}
            {!quizSubmitted ? (
              <button
                disabled={selectedOption === null}
                onClick={handleQuizSubmit}
                className={`w-full py-4 rounded-full font-bold text-sm tracking-wide transition-all duration-300 ${
                  selectedOption !== null 
                    ? "bg-terracotta text-light-gray hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] cursor-pointer"
                    : "bg-white/5 text-muted-ash cursor-not-allowed"
                }`}
              >
                SUBMIT ANSWER
              </button>
            ) : (
              <div 
                className={`transition-all duration-500 overflow-hidden transform ${
                  showExplanation ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                } bg-deep-canvas border border-white/5 p-5 rounded-2xl space-y-3`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    activeQuiz.options[selectedOption!].isCorrect
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-terracotta/20 text-terracotta"
                  }`}>
                    {activeQuiz.options[selectedOption!].isCorrect ? "Correct" : "Incorrect"}
                  </span>
                  <span className="text-xs text-muted-ash">QUIZ COMPLETED</span>
                </div>
                <p className="text-sm text-muted-ash leading-relaxed">
                  {activeQuiz.explanation}
                </p>
                <button className="w-full mt-2 py-3 bg-white/5 border border-white/10 rounded-full font-semibold text-xs tracking-wider text-light-gray hover:bg-white/10 transition-all uppercase">
                  Next Word (Locked)
                </button>
              </div>
            )}

          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 px-6 text-center text-xs text-muted-ash">
        <p>© 2026 VocabPod. Handcrafted with Apple-Inspired Minimalism & Cinematic Spot Color.</p>
      </footer>
    </div>
  );
}
