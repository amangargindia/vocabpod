"use client";

import { useEffect, useRef, useState } from "react";
import { getCachedAudio, prefetchAudio } from "@/lib/audioCache";
import { useAuth } from "@/contexts/AuthContext";
import Overlay from "@/components/Overlay";
import Link from "next/link";
import Logo from "@/components/Logo";

interface AutoplayWord {
  id: string;
  word: string;
  definition: string;
  narrative: string;
  level: number;
  audio_url: string;
}

export default function AutoplayPage() {
  const [words, setWords] = useState<AutoplayWord[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isPremium, isLoadingAuth } = useAuth();

  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/words");
      const data = await res.json();
      // Only L1 and L2, only words with audio
      const eligible = (data.words || [])
        .filter((w: any) => w.audio_url && (w.level ?? 1) <= 2);
      // Shuffle
      const shuffled = eligible.sort(() => Math.random() - 0.5);
      setWords(shuffled);
      setIsLoading(false);
    }
    if (!isLoadingAuth) {
      load();
    }
  }, [isLoadingAuth]);

  // Load audio when index changes
  useEffect(() => {
    if (!isPremium) return;
    
    const w = words[index];
    if (!w?.audio_url) return;

    setAudioSrc("");
    setCurrentTime(0);
    setDuration(0);

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
      if (index < words.length - 1) {
        playDing();
        setIsTransitioning(true);
        setTimeout(() => {
          setIndex(i => i + 1);
          setIsTransitioning(false);
        }, 800);
      } else {
        setIsPlaying(false);
      }
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
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

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const current = words[index];

  const content = (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 md:py-8 overflow-x-hidden overflow-y-auto min-h-0">
      <audio ref={audioRef} src={audioSrc || undefined} preload="auto" autoPlay />

      {isLoading ? (
        <div className="space-y-3 animate-pulse text-center">
          <div className="w-48 h-48 bg-card-gray rounded-full mx-auto" />
          <div className="w-32 h-6 bg-card-gray rounded mx-auto" />
        </div>
      ) : words.length === 0 ? (
        <div className="text-center space-y-4">
          <p className="font-black text-xl text-light-gray">No audio words yet</p>
          <p className="text-sm text-muted-ash">Add Level 1 or 2 words with audio in the admin portal.</p>
        </div>
      ) : current ? (
        <div className={`autoplay-card w-full max-w-sm space-y-4 md:space-y-8 text-center transition-all duration-700 ease-in-out transform ${isTransitioning ? 'opacity-0 scale-95 translate-x-10' : 'opacity-100 scale-100 translate-x-0'}`}>
          {/* Word display */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-terracotta border border-terracotta/30 bg-dark-blush px-3 py-1 rounded-full">
              {index + 1} / {words.length}
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-light-gray uppercase mt-2 md:mt-4">
              {current.word}
            </h1>
            <p className="text-sm md:text-base text-muted-ash leading-relaxed">{current.definition}</p>
          </div>

          {/* Mnemonic */}
          {current.narrative && (
            <div className="bg-card-gray border border-white/5 rounded-2xl p-3.5 md:p-5 text-left">
              <p className="text-xs font-black uppercase tracking-widest text-terracotta mb-1.5">Mnemonic</p>
              <p className="text-xs md:text-sm text-muted-ash leading-relaxed">{current.narrative}</p>
            </div>
          )}

          {/* Waveform animation while playing */}
          <div className="flex items-end justify-center space-x-1 h-10">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-terracotta/60 transition-all duration-200"
                style={{
                  height: isPlaying
                    ? `${20 + Math.sin(Date.now() / 200 + i) * 15}px`
                    : "4px",
                  animationDelay: `${i * 60}ms`,
                  animation: isPlaying ? `waveBar 0.8s ease-in-out ${i * 0.06}s infinite alternate` : "none",
                }}
              />
            ))}
          </div>

          {/* Progress bar */}
          {duration > 0 && (
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
                className="w-full accent-terracotta cursor-pointer h-1"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-ash font-bold">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={() => { setIsPlaying(false); setIndex(i => Math.max(i - 1, 0)); }}
              disabled={index === 0}
              className="w-11 h-11 rounded-full bg-card-gray border border-white/10 flex items-center justify-center text-muted-ash hover:text-light-gray disabled:opacity-30 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-terracotta flex items-center justify-center text-light-gray shadow-[0_0_30px_rgba(224,75,53,0.4)] hover:shadow-[0_0_40px_rgba(224,75,53,0.6)] hover:-translate-y-1 transition-all"
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 translate-x-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => { setIsPlaying(false); setIndex(i => Math.min(i + 1, words.length - 1)); }}
              disabled={index === words.length - 1}
              className="w-11 h-11 rounded-full bg-card-gray border border-white/10 flex items-center justify-center text-muted-ash hover:text-light-gray disabled:opacity-30 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
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
        @media (max-height: 740px) {
          .autoplay-card {
            transform: scale(0.9);
            transform-origin: center center;
            margin-top: -10px;
            margin-bottom: -10px;
          }
        }
        @media (max-height: 660px) {
          .autoplay-card {
            transform: scale(0.82);
            transform-origin: center center;
            margin-top: -25px;
            margin-bottom: -25px;
          }
        }
        @media (max-height: 580px) {
          .autoplay-card {
            transform: scale(0.72);
            transform-origin: center center;
            margin-top: -40px;
            margin-bottom: -40px;
          }
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
