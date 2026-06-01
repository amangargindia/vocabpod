"use client";

import { Headphones, Eye, BookOpen, Clock, Globe, Trophy, MessageCircle, CheckCircle, Podcast } from "lucide-react";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";

export default function FeaturesSection() {
  const { language } = useLandingLanguage();
  const features = [
    {
      icon: <Headphones size={18} strokeWidth={1.8} />,
      title_en: "Premium Audio",
      title_hi: "Premium Audio",
      desc_en: "Native speaker pronunciation for every word.",
      desc_hi: "Har word ki native speaker pronunciation."
    },
    {
      icon: <Podcast size={18} strokeWidth={1.8} />,
      title_en: "New Podcast Every Day",
      title_hi: "Naya Podcast Har Roz",
      desc_en: "Daily audio content to build your listening and speaking skills.",
      desc_hi: "Listening aur speaking skills badhane ke liye daily audio content."
    },
    {
      icon: <Eye size={18} strokeWidth={1.8} />,
      title_en: "Visual Mnemonics",
      title_hi: "Visual Mnemonics",
      desc_en: "Custom stickman SVGs for every single word.",
      desc_hi: "Har ek word ke liye custom animated stickman SVGs."
    },
    {
      icon: <BookOpen size={18} strokeWidth={1.8} />,
      title_en: "Story Reinforcement",
      title_hi: "Story Reinforcement",
      desc_en: "Narrative context that anchors the word in memory.",
      desc_hi: "Kahaniyon ka context jo word ko memory mein fasa deta hai."
    },
    {
      icon: <Clock size={18} strokeWidth={1.8} />,
      title_en: "Spaced Repetition",
      title_hi: "Spaced Repetition",
      desc_en: "Automated SRS review schedule across 5 sessions.",
      desc_hi: "5 sessions mein automated SRS review schedule."
    },
    {
      icon: <Globe size={18} strokeWidth={1.8} />,
      title_en: "Real Life Usage",
      title_hi: "Real Life Usage",
      desc_en: "Contextual examples per word for daily conversation.",
      desc_hi: "Rozmarra ki baatcheet ke liye har word ke examples."
    },
    {
      icon: <CheckCircle size={18} strokeWidth={1.8} />,
      title_en: "Interactive Flashcards",
      title_hi: "Interactive Flashcards",
      desc_en: "Test your active recall, not just passive reading.",
      desc_hi: "Sirf padho nahi, active recall se khud ko test karo."
    },
    {
      icon: <MessageCircle size={18} strokeWidth={1.8} />,
      title_en: "WhatsApp Community",
      title_hi: "WhatsApp Community",
      desc_en: "Exclusive group for tips, tests, and accountability.",
      desc_hi: "Tips, tests aur accountability ke liye exclusive group."
    }
  ];

  return (
    <section className="py-24 px-6 bg-deep-canvas border-y border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-4 py-1">
            WHAT YOU GET
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-light-gray tracking-tight mt-6 max-w-2xl mx-auto">
            {language === 'hi' ? "Aap jo seekhenge, wo yaad kyu rahega?" : "Why you will retain what you learn"}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          
          {/* Left: Features List */}
          <div className="flex flex-col gap-2">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-dark-blush border border-terracotta/20 flex items-center justify-center text-terracotta shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-light-gray mb-1">{language === 'hi' ? feature.title_hi : feature.title_en}</h4>
                  <p className="text-xs text-muted-ash leading-relaxed">{language === 'hi' ? feature.desc_hi : feature.desc_en}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Blurred Paywall Mock */}
          <div className="flex justify-center">
            <div className="bg-card-gray border border-white/5 rounded-3xl p-6 shadow-2xl w-full max-w-md relative overflow-hidden">
              
              {/* Fake Lesson Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-light-gray tracking-tight uppercase">LACONIC</h3>
                  <p className="text-muted-ash text-xs">/ləˈkɒn.ɪk/</p>
                </div>
              </div>
              <p className="text-sm text-light-gray leading-relaxed mb-6">
                Using very few words; concise to the point of seeming rude or mysterious.
              </p>

              {/* Blurred Content Blocks */}
              <div className="space-y-4 relative">
                
                {/* Mnemonic Block */}
                <div className="h-32 border border-white/5 rounded-2xl bg-absolute-black/40 blur-[4px]"></div>
                
                {/* Story Block */}
                <div className="space-y-2 blur-[4px]">
                  <div className="h-3 bg-white/10 rounded w-full"></div>
                  <div className="h-3 bg-white/10 rounded w-5/6"></div>
                  <div className="h-3 bg-white/10 rounded w-4/6"></div>
                </div>

                {/* Overlay Lock */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-card-gray/50 backdrop-blur-md z-10 rounded-2xl">
                   <div className="w-12 h-12 rounded-full bg-absolute-black border border-white/10 flex items-center justify-center text-muted-ash mb-4">
                     <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                       <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                     </svg>
                   </div>
                   <h4 className="text-sm font-bold text-light-gray uppercase tracking-widest mb-1">Premium Feature</h4>
                   <p className="text-xs text-muted-ash mb-6">
                     {language === 'hi' ? "Sare sections unlock karne ke liye subscribe karein" : "Subscribe to unlock all sections"}
                   </p>
                   <a href="#pricing" className="bg-terracotta text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-terracotta/80 transition-colors">
                     {language === 'hi' ? "Abhi Unlock Karein" : "Unlock Now"}
                   </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
