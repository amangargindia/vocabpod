"use client";

import { useEffect, useRef, useState } from "react";
import { getCachedAudio, prefetchAudio } from "@/lib/audioCache";
import { useAuth } from "@/contexts/AuthContext";
import Overlay from "@/components/Overlay";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useVocabProgress } from "@/hooks/useVocabProgress";
import { getTodayIST, toISTDateString } from "@/lib/dateUtils";
import { cleanSvgString } from "@/lib/svgUtils";

interface SVGNode {
  tag: string;
  props: Record<string, any>;
  children?: SVGNode[];
}

const DynamicSVGNode = ({ node }: { node: SVGNode }) => {
  const Tag = node.tag as any;
  
  const sanitizedProps: Record<string, any> = {};
  for (const key in node.props) {
    if (key === "class") {
      sanitizedProps["className"] = node.props[key];
    } else if (key.includes("-") && !key.startsWith("data-") && !key.startsWith("aria-")) {
      const camelKey = key.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      sanitizedProps[camelKey] = node.props[key];
    } else {
      sanitizedProps[key] = node.props[key];
    }
  }

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

  return (
    <Tag {...sanitizedProps}>
      {node.children?.map((child, idx) => (
        <DynamicSVGNode key={idx} node={child} />
      ))}
    </Tag>
  );
};

function AudioProgressBar({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement | null> }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);

    // Initial sync
    setCurrentTime(audio.currentTime);
    setDuration(audio.duration || 0);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
  }, [audioRef]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (duration <= 0) return null;

  return (
    <div className="space-y-1">
      <input
        type="range"
        min={0}
        max={duration}
        value={currentTime}
        onChange={e => {
          const t = Number(e.target.value);
          if (audioRef.current) audioRef.current.currentTime = t;
          setCurrentTime(t);
        }}
        className="w-full accent-terracotta cursor-pointer h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-terracotta [&::-webkit-slider-thumb]:rounded-full"
      />
      <div className="flex items-center justify-between text-[9px] text-muted-ash font-bold px-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

interface AutoplayWord {
  id: string;
  word: string;
  definition: string;
  narrative: string;
  audio_url: string;
  custom_image_url?: string;
  custom_svg?: string;
  svg_elements?: any[];
}

export default function AutoplayPage() {
  const [words, setWords] = useState<AutoplayWord[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioSrc, setAudioSrc] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isPremium, isLoadingAuth, user } = useAuth();
  const { stats, isLoaded: isProgressLoaded, getWordProgress } = useVocabProgress(user?.id, !isLoadingAuth);

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Robust Fisher-Yates shuffle
  const shuffleWords = (array: AutoplayWord[]) => {
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
      
      // Filter out words without audio urls
      const eligible = (data.words || []).filter((w: any) => w.audio_url);
      
      // 1. Get words already completed by the user ("done by user")
      const completedWords = eligible.filter((w: any) => getWordProgress(w.word)?.is_completed);
      
      // 2. Get daily new words quota limit (up to 5 new words completed today)
      const today = getTodayIST();
      const newWordsCompletedToday = Object.values(stats.progressList).filter((p: any) =>
        p.first_completed_at && toISTDateString(p.first_completed_at) === today
      ).length;
      
      const remainingQuota = Math.max(0, 5 - newWordsCompletedToday);
      
      const uncompletedWords = eligible.filter((w: any) => !getWordProgress(w.word)?.is_completed);
      const shuffledUncompleted = shuffleWords(uncompletedWords);
      const quotaWords = shuffledUncompleted.slice(0, remainingQuota);
      
      // 3. Combine: all done words + remaining daily quota words
      const queue = [...completedWords, ...quotaWords];
      
      // Shuffle combined list to create an active learning playlist
      const shuffledQueue = shuffleWords(queue);
      
      setWords(shuffledQueue);
      setIsLoading(false);
    }
    if (!isLoadingAuth && isProgressLoaded) {
      load();
    }
  }, [isLoadingAuth, isProgressLoaded]);

  // Load audio when index changes
  useEffect(() => {
    if (!isPremium) return;
    
    const w = words[index];
    if (!w?.audio_url) return;

    setAudioSrc("");

    getCachedAudio(w.audio_url).then(src => {
      setAudioSrc(src);
    });

    // Pre-fetch next word
    const next = words[index + 1];
    if (next?.audio_url) prefetchAudio(next.audio_url);
  }, [index, words, isPremium]);

const playDing = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1); // C#6
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch(e) {}
};

  // Auto-advance when audio ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (index < words.length) {
        playDing();
        setIsTransitioning(true);
        setTimeout(() => {
          setIndex(i => i + 1);
          setIsTransitioning(false);
        }, 800);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [index, words]);

  // Auto-play when src changes
  useEffect(() => {
    if (audioSrc && isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [audioSrc]);

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



  const current = words[index];

  const content = (
    <div className="flex-1 flex flex-col items-center justify-center px-0 py-2 md:py-6 overflow-hidden min-h-0 w-full">
      <audio ref={audioRef} src={audioSrc || undefined} preload="auto" autoPlay />

      {isLoading ? (
        <div className="flex-1 w-full max-w-md mx-auto flex items-center justify-center">
          <div className="animate-pulse space-y-8 w-full">
            <div className="aspect-square bg-white/5 rounded-3xl w-full max-w-[300px] mx-auto border border-white/10" />
            <div className="space-y-4">
              <div className="h-10 bg-white/5 rounded-full w-3/4 mx-auto" />
              <div className="h-4 bg-white/5 rounded-full w-1/2 mx-auto" />
            </div>
          </div>
        </div>
      ) : words.length === 0 ? (
        <div className="text-center space-y-4">
          <p className="font-black text-xl text-light-gray">No audio words yet</p>
          <p className="text-sm text-muted-ash">Add Level 1 or 2 words with audio in the admin portal.</p>
        </div>
      ) : index === words.length ? (
        <div className="text-center space-y-6 max-w-sm mx-auto px-4">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10 text-emerald-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-light-gray uppercase tracking-tight">Autoplay Complete!</h2>
            <p className="text-muted-ash text-sm">You've listened to all your available words.</p>
          </div>
          <Link href="/flashcards" className="block w-full bg-terracotta text-light-gray font-bold py-4 rounded-xl hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all uppercase tracking-widest text-sm">
            Go to Flashcards
          </Link>
          <button onClick={() => setIndex(0)} className="block w-full text-muted-ash hover:text-light-gray text-xs font-bold uppercase tracking-widest transition-colors mt-4">
            Listen Again
          </button>
        </div>
      ) : current ? (
        <div className={`autoplay-card w-full h-full flex flex-col justify-between overflow-hidden text-center transition-all duration-700 ease-in-out transform ${isTransitioning ? 'opacity-0 scale-95 translate-x-10' : 'opacity-100 scale-100 translate-x-0'}`}>
          
          {/* Word display (Top) */}
          <div className="space-y-1 shrink-0 pt-2 z-10 relative px-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-terracotta border border-terracotta/30 bg-dark-blush px-3 py-1 rounded-full inline-block">
              {index + 1} / {words.length}
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-light-gray uppercase mt-1 leading-none">
              {current.word}
            </h1>
            <p className="text-sm md:text-base text-muted-ash leading-snug line-clamp-2">{current.definition}</p>
          </div>

          {/* Mnemonic Image (Middle, taking maximum 1:1 space, stretched to width) */}
          <div className="flex-1 min-h-0 flex items-center justify-center w-full relative my-2 px-0 md:px-4">
            <div className="relative aspect-square max-h-full w-full max-w-lg bg-deep-canvas/40 flex items-center justify-center overflow-hidden mx-auto">
              <style>{`
                .svg-anim-smooth svg * {
                   transition: all 0.3s ease-in-out;
                }
              `}</style>
              {current.custom_image_url ? (
                <img src={current.custom_image_url} alt="Mnemonic" className="w-full h-full object-contain" />
              ) : current.custom_svg ? (
                <div 
                  className="w-full h-full flex items-center justify-center text-light-gray svg-mnemonic-container svg-anim-smooth [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: cleanSvgString(current.custom_svg) }}
                />
              ) : current.svg_elements && current.svg_elements.length > 0 ? (
                <svg viewBox="0 0 400 300" className="w-full h-full svg-anim-smooth" xmlns="http://www.w3.org/2000/svg">
                  {current.svg_elements.map((node, idx) => (
                    <DynamicSVGNode key={idx} node={node} />
                  ))}
                </svg>
              ) : (
                <p className="text-xs text-muted-ash text-center uppercase tracking-widest font-black opacity-50">No Image</p>
              )}
            </div>
          </div>

          {/* Bottom section (Controls, Wave, Progress) */}
          <div className="shrink-0 w-full bg-absolute-black/80 backdrop-blur-md pt-2 pb-4 px-6 mx-auto z-20 border-t border-white/5">
            <div className="max-w-md mx-auto space-y-3">
              {/* Controls and subtle wave in one row */}
              <div className="flex items-center justify-between">
                
                {/* Previous Button */}
                <button
                  onClick={() => { setIsPlaying(false); setIndex(i => Math.max(i - 1, 0)); }}
                  disabled={index === 0}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-light-gray disabled:opacity-30 transition-all hover:bg-white/5"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                  </svg>
                </button>

                {/* Subtle Wave Animation */}
                <div className="flex items-center justify-center space-x-1 h-6 px-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-terracotta/40 transition-all duration-300"
                      style={{
                        height: isPlaying ? "8px" : "3px",
                        animationDelay: `${i * 90}ms`,
                        animation: isPlaying ? `waveBar 1s ease-in-out infinite alternate` : "none",
                      }}
                    />
                  ))}
                </div>

                {/* Play Button */}
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-terracotta flex items-center justify-center text-light-gray shadow-lg shadow-terracotta/20 hover:scale-105 transition-all"
                >
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Subtle Wave Animation (right side) */}
                <div className="flex items-center justify-center space-x-1 h-6 px-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-terracotta/40 transition-all duration-300"
                      style={{
                        height: isPlaying ? "8px" : "3px",
                        animationDelay: `${(i + 8) * 90}ms`,
                        animation: isPlaying ? `waveBar 1s ease-in-out infinite alternate` : "none",
                      }}
                    />
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => { setIsPlaying(false); setIndex(i => Math.min(i + 1, words.length)); }}
                  disabled={index === words.length}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-light-gray disabled:opacity-30 transition-all hover:bg-white/5"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>
              </div>

              {/* Progress bar */}
              <AudioProgressBar audioRef={audioRef} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="h-[calc(100dvh-70px)] md:h-dvh overflow-hidden flex bg-absolute-black text-light-gray font-sans">
      <style>{`
        @keyframes waveBar {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1.2); }
        }
        .autoplay-card {
          max-height: 100%;
        }
      `}</style>
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <header className="sticky top-0 z-30 backdrop-blur-md bg-absolute-black/80 border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Logo className="w-24 md:w-32 h-8 md:h-10" />
            </Link>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-widest text-muted-ash">Autoplay</h1>
              <p className="text-[10px] text-muted-ash/60 mt-0.5">For busy times when you still want to learn</p>
            </div>
          </div>
          <div className="relative group shrink-0" title={`${words.length} words queued`}>
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-muted-ash group-hover:text-light-gray group-hover:bg-white/10 transition-all duration-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="9" y1="18" x2="20" y2="18" />
                <line x1="9" y1="12" x2="20" y2="12" />
                <line x1="9" y1="6" x2="20" y2="6" />
                <circle cx="4" cy="6" r="1" fill="currentColor" />
                <circle cx="4" cy="12" r="1" fill="currentColor" />
                <circle cx="4" cy="18" r="1" fill="currentColor" />
              </svg>
            </div>
            <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-terracotta text-[8px] font-black text-light-gray border border-absolute-black shadow-[0_0_8px_rgba(224,75,53,0.5)]">
              {words.length}
            </span>
          </div>
        </header>

        <div className="flex-1 min-h-0 flex flex-col">
          <Overlay isLocked={!isPremium}>
            {content}
          </Overlay>
        </div>
      </div>
    </div>
  );
}
