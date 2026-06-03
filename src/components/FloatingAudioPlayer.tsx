"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface FloatingAudioPlayerProps {
  audioUrl: string | null;
  className?: string;
  autoPlay?: boolean;
}

export default function FloatingAudioPlayer({
  audioUrl,
  className = "",
  autoPlay = false,
}: FloatingAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setIsPlaying(false);
        }
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      setAudioElement(audio);
      audio.onended = () => setIsPlaying(false);
      return () => {
        audio.pause();
        audio.src = "";
      };
    }
  }, [audioUrl]);

  useEffect(() => {
    if (!audioElement) return;
    if (isPlaying) {
      audioElement.play().catch(() => setIsPlaying(false));
    } else {
      audioElement.pause();
    }
  }, [isPlaying, audioElement]);

  if (!audioUrl) return null;

  return (
    <button
      ref={buttonRef}
      onClick={() => setIsPlaying(!isPlaying)}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-full border border-white/10 bg-absolute-black/80 px-4 py-2.5 shadow-2xl backdrop-blur-md transition-all hover:border-terracotta/50 ${
        isPlaying ? "shadow-[0_0_20px_rgba(224,75,53,0.4)]" : "hover:bg-white/5"
      } ${className}`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          isPlaying
            ? "bg-terracotta text-white"
            : "bg-white/10 text-light-gray group-hover:bg-terracotta/20 group-hover:text-terracotta"
        }`}
      >
        {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </div>
      
      <div className="flex flex-col items-start pr-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-ash">
          Pronunciation
        </span>
        <div className="flex h-3 items-center gap-[2px]">
          {/* Animated equalizer bars */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all ${
                isPlaying ? "bg-terracotta animate-pulse" : "bg-white/20 h-1"
              }`}
              style={{
                height: isPlaying ? `${Math.random() * 60 + 40}%` : '4px',
                animationDelay: `${i * 0.15}s`
              }}
            />
          ))}
        </div>
      </div>
    </button>
  );
}
