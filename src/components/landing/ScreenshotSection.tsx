"use client";

import { useLandingLanguage } from "@/contexts/LandingLanguageContext";

export default function ScreenshotSection() {
  const { language } = useLandingLanguage();
  return (
    <section className="py-24 px-6 bg-deep-canvas border-y border-white/5 overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-4 py-1">
            INSIDE VOCABPOD
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-light-gray tracking-tight mt-6 max-w-2xl mx-auto">
            {language === 'hi' ? "Fluency ke liye banaya gaya system" : "A system built for fluency"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
          {/* Screenshot 1 */}
          <div className="bg-card-gray rounded-3xl p-4 border border-white/5 flex flex-col items-center group hover:border-terracotta/30 transition-colors">
            <div className="w-full aspect-video bg-absolute-black/50 rounded-2xl mb-4 flex items-center justify-center border border-white/10 overflow-hidden relative">
              <span className="text-muted-ash text-sm font-bold tracking-widest uppercase opacity-50 z-10">
                [ Screenshot Placeholder ]
              </span>
              <div className="absolute inset-0 bg-gradient-to-tr from-terracotta/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <h4 className="text-lg font-bold text-light-gray mb-1">
              {language === 'hi' ? "Daily Review Dashboard" : "Daily Review Dashboard"}
            </h4>
            <p className="text-sm text-muted-ash text-center">
              {language === 'hi' 
                ? "Aapki memory ke hisaab se tayar kiya gaya spaced repetition schedule." 
                : "Spaced repetition schedule tailored to your memory."}
            </p>
          </div>

          {/* Screenshot 2 */}
          <div className="bg-card-gray rounded-3xl p-4 border border-white/5 flex flex-col items-center group hover:border-terracotta/30 transition-colors">
            <div className="w-full aspect-video bg-absolute-black/50 rounded-2xl mb-4 flex items-center justify-center border border-white/10 overflow-hidden relative">
              <span className="text-muted-ash text-sm font-bold tracking-widest uppercase opacity-50 z-10">
                [ Screenshot Placeholder ]
              </span>
              <div className="absolute inset-0 bg-gradient-to-tr from-terracotta/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <h4 className="text-lg font-bold text-light-gray mb-1">
              {language === 'hi' ? "In-Depth Word Analysis" : "In-Depth Word Analysis"}
            </h4>
            <p className="text-sm text-muted-ash text-center">
              {language === 'hi'
                ? "Etymology, mnemonics, aur real-world audio examples."
                : "Etymology, mnemonics, and real-world audio examples."}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
