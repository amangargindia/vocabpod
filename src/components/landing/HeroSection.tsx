"use client";

import { useState, useEffect } from "react";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";
import Stickman from "@/components/Stickman";
import { Check } from "lucide-react";
import Link from "next/link";

const VOCAB_SPECIALTIES = [
  {
    word: "Laconic",
    phonetic: "/ləˈkɒn.ɪk/",
    definition: "Short and sweet to learn.",
    pose: "reading"
  },
  {
    word: "Indelible",
    phonetic: "/ɪnˈdel.ə.bəl/",
    definition: "Impossible to forget.",
    pose: "lifting"
  },
  {
    word: "Pellucid",
    phonetic: "/pəˈluː.sɪd/",
    definition: "Easily understandable.",
    pose: "pointing"
  },
  {
    word: "Quotidian",
    phonetic: "/kwɒˈtɪd.i.ən/",
    definition: "A habit.",
    pose: "running"
  }
];

export default function HeroSection() {
  const { language, setLanguage } = useLandingLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % VOCAB_SPECIALTIES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeWord = VOCAB_SPECIALTIES[currentIndex];

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden pt-20">
      {/* Ambient background glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(224,75,53,0.08), transparent 70%)"
        }}
      ></div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 py-12">
        {/* Left text column */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-8">
          
          <div className="animate-[slideUp_0.5s_ease_0.1s_both]">
            <span className="text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/30 rounded-full px-4 py-1.5 bg-terracotta/5">
              VOCABULARY FOR GRE &middot; UPSC &middot; CAT &middot; IELTS
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none animate-[slideUp_0.5s_ease_0.2s_both]">
            <div className="text-light-gray">
              {language === "en" ? "Are you at loss of words when you actually start speaking?" : "Bolte time words yaad nahi aate?"}
            </div>
            <div className="text-terracotta mt-4 text-3xl md:text-5xl leading-tight">
              {language === "en" ? "Do you learn a lot of words, but.. forget them eventually?" : "Naye words seekhte toh ho, par bhool jaate ho?"}
            </div>
          </h1>

          <p className="text-base md:text-xl text-muted-ash font-medium leading-relaxed max-w-xl animate-[slideUp_0.5s_ease_0.3s_both]">
            {language === "en" 
              ? "VocabPod teaches you 5 words a day so that in 30 days, you have 150 words permanently locked in memory for your daily speech."
              : "VocabPod aapko roz 5 words sikhata hai jisse 30 din mein 150 words aapki daily speech ka hissa ban jayenge."}
          </p>

          <div className="flex bg-card-gray rounded-full p-1 border border-white/5 animate-[slideUp_0.5s_ease_0.35s_both]">
            <button 
              onClick={() => setLanguage("en")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${language === "en" ? "bg-terracotta text-light-gray" : "text-muted-ash hover:text-light-gray"}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage("hi")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${language === "hi" ? "bg-terracotta text-light-gray" : "text-muted-ash hover:text-light-gray"}`}
            >
              Hinglish
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-[slideUp_0.5s_ease_0.4s_both]">
            <a 
              href="#demo"
              className="bg-terracotta text-light-gray font-bold px-8 py-4 rounded-full text-sm uppercase tracking-widest text-center hover:shadow-[0_0_30px_rgba(224,75,53,0.5)] hover:-translate-y-0.5 transition-all"
            >
              Try a Free Demo
            </a>
            <a 
              href="/checkout"
              className="border border-white/20 text-light-gray font-bold px-8 py-4 rounded-full text-sm uppercase tracking-widest text-center hover:border-white/40 transition-all"
            >
              Subscribe for 99/mo
            </a>
          </div>

          <div className="text-xs text-muted-ash flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start animate-[slideUp_0.5s_ease_0.5s_both]">
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-terracotta" /> 24-hr money-back</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-terracotta" /> No card for demo</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-terracotta" /> Cancel anytime</span>
          </div>

        </div>

        {/* Right visual column */}
        <div className="flex justify-center lg:justify-end animate-[slideUp_0.8s_ease_0.3s_both]">
          <div 
            className="bg-card-gray border border-white/5 rounded-3xl p-6 shadow-2xl w-full max-w-sm relative"
            style={{
              transform: "perspective(1000px) rotateY(-8deg) rotateX(3deg)",
              animation: "smoothFloat 4s infinite ease-in-out alternate"
            }}
          >
            <style jsx>{`
              @keyframes smoothFloat {
                0% { transform: perspective(1000px) rotateY(-8deg) rotateX(3deg) translateY(0px); }
                100% { transform: perspective(1000px) rotateY(-8deg) rotateX(3deg) translateY(-15px); }
              }
              @keyframes contentFadeInOut {
                0% { opacity: 0; transform: translateY(12px); filter: blur(6px); }
                18% { opacity: 1; transform: translateY(0); filter: blur(0); }
                82% { opacity: 1; transform: translateY(0); filter: blur(0); }
                100% { opacity: 0; transform: translateY(-12px); filter: blur(6px); }
              }
            `}</style>
            
            <div className="absolute inset-0 bg-gradient-to-br from-terracotta/5 to-transparent rounded-3xl pointer-events-none"></div>
            
            <div className="mb-6 pb-3 border-b border-white/5 flex justify-between items-end gap-2">
              <h2 className="text-base md:text-lg font-black uppercase tracking-wider text-terracotta">
                We Make Vocabulary
              </h2>
              <span className="text-[10px] md:text-xs text-muted-ash font-bold uppercase tracking-widest shrink-0">
                Specialties
              </span>
            </div>

            <div 
              key={currentIndex} 
              style={{ animation: "contentFadeInOut 5.0s ease-in-out forwards" }}
              className="flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-black text-light-gray uppercase tracking-tight">{activeWord.word}</h3>
                  <p className="text-muted-ash text-sm">{activeWord.phonetic}</p>
                </div>
                <span className="bg-terracotta/10 text-terracotta border border-terracotta/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
                  ADJECTIVE
                </span>
              </div>

              <div className="h-48 flex items-center justify-center border border-white/5 rounded-2xl bg-absolute-black/50 mb-6">
                <Stickman pose={activeWord.pose} size={120} />
              </div>

              <p className="text-light-gray text-base md:text-lg leading-relaxed border-l-2 border-terracotta pl-3 min-h-[48px] font-medium">
                {activeWord.definition}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <a 
        href="#proof" 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-muted-ash hover:text-terracotta transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </a>
    </section>
  );
}
