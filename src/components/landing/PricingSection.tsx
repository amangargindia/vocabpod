"use client";

import { Check } from "lucide-react";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";
import Link from "next/link";

export default function PricingSection() {
  const { language } = useLandingLanguage();
  return (
    <section id="pricing" className="py-24 px-6 bg-deep-canvas border-t border-white/5 relative overflow-hidden">
      
      {/* Decorative Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-20"
        style={{ background: "radial-gradient(circle, rgba(224,75,53,0.15) 0%, transparent 70%)" }}
      ></div>

      <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-4 py-1">
            {language === 'hi' ? "Din ke sirf 4 rupaye" : "Just 4 rupees a day"}
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-light-gray tracking-tight mt-6">
            {language === 'hi' ? "Ek cup chai se bhi sasta." : "Less than a cup of chai."}
          </h2>
          <p className="text-muted-ash mt-4 max-w-xl mx-auto">
            {language === 'hi'
              ? "Bhari vocabulary books kharidna band karein jinhe aap kabhi poora nahi padhte. Ek aisa system apnaye jo words ko hamesha ke liye aapke dimaag mein bitha de."
              : "Stop buying heavy vocabulary books you'll never finish. Get a system that actually wires the words into your brain for daily use."}
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-absolute-black border-2 border-terracotta/40 rounded-3xl p-1 shadow-[0_0_50px_rgba(224,75,53,0.1)] w-full max-w-lg">
          <div className="bg-card-gray border border-white/5 rounded-[22px] p-8 md:p-12 h-full flex flex-col relative overflow-hidden">
            
            {/* Discount Badge */}
            <div className="absolute top-0 right-0 bg-terracotta text-white font-bold text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
              Limited Time
            </div>

            <div className="mb-8 border-b border-white/10 pb-8 text-center">
              <h3 className="text-2xl font-black text-light-gray uppercase tracking-tight mb-2">VocabPod Premium</h3>
              <div className="flex items-end justify-center gap-2">
                <span className="text-5xl font-black text-terracotta">₹99</span>
                <span className="text-muted-ash text-sm mb-1">{language === 'hi' ? "/ mahina" : "/ month"}</span>
              </div>
              <p className="text-xs text-muted-ash mt-2 line-through opacity-70">₹499 {language === 'hi' ? "/ mahina" : "/ month"}</p>
            </div>

            <div className="flex-1">
              <ul className="space-y-4">
                {[
                  { en: "Full access to 500+ curated words", hi: "500+ curated words ka full access" },
                  { en: "Automated Spaced Repetition (SRS)", hi: "Automated Spaced Repetition (SRS)" },
                  { en: "Custom Stickman Visual Mnemonics", hi: "Custom Stickman Visual Mnemonics" },
                  { en: "Native speaker audio pronunciation", hi: "Native speaker audio pronunciation" },
                  { en: "Active recall quizzes per word", hi: "Har word ke liye active recall quizzes" },
                  { en: "Progress & Streak tracking", hi: "Progress & Streak tracking" },
                  { en: "Access to WhatsApp Community", hi: "WhatsApp Community ka access" },
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <Check size={18} className="text-terracotta" />
                    </div>
                    <span className="text-sm text-light-gray">{language === 'hi' ? feature.hi : feature.en}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12 text-center">
              <a 
                href="/checkout"
                className="block w-full bg-terracotta text-white font-bold py-5 rounded-full text-sm uppercase tracking-widest hover:shadow-[0_0_30px_rgba(224,75,53,0.5)] hover:-translate-y-0.5 transition-all text-center"
              >
                {language === 'hi' ? "Abhi kharidein ₹99/mo mein" : "Buy Now for ₹99/mo"}
              </a>
              <p className="text-[10px] text-muted-ash uppercase tracking-widest mt-4">
                {language === 'hi' ? "24-hour no questions asked money-back guarantee." : "24-hour no questions asked money-back guarantee."}
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
