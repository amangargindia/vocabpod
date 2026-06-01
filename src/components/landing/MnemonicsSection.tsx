"use client";

import Stickman from "@/components/Stickman";
import { demoWords } from "./demo-data";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";

export default function MnemonicsSection() {
  const { language } = useLandingLanguage();
  
  return (
    <section className="py-24 px-6 bg-deep-canvas border-t border-white/5 relative overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-4 py-1">
            HOW IT WORKS
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-light-gray tracking-tight mt-6 max-w-2xl mx-auto">
            {language === 'hi' ? "Visual Mnemonics (Yaad Rakhne Ke Tarike)" : "Visual Mnemonics"}
          </h2>
          <p className="text-muted-ash mt-4 max-w-2xl mx-auto">
            {language === 'hi' 
              ? "Aapka dimaag plain text se zyada visuals aur stories yaad rakhta hai. Hum custom animated stickman mnemonics use karte hain taaki vocabulary aapki memory mein hamesha ke liye fit ho jaye." 
              : "Your brain remembers visuals and stories far better than plain text. We use custom animated stickman mnemonics to hardwire vocabulary into your memory."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {demoWords.slice(0, 3).map((word, idx) => (
            <div key={idx} className="bg-card-gray border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center hover:border-terracotta/30 transition-colors">
              <div className="h-32 mb-6 flex items-center justify-center bg-absolute-black/40 w-full rounded-2xl">
                <Stickman pose={word.stickmanPose || "thinking"} size={100} />
              </div>
              <h4 className="text-2xl font-black text-light-gray mb-2 uppercase">{word.word}</h4>
              <p className="text-xs text-terracotta mb-4 uppercase tracking-widest">{word.phonetic}</p>
              <p className="text-sm text-muted-ash leading-relaxed">
                {language === 'hi' && word.narrativeHinglish ? word.narrativeHinglish : word.narrative}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
