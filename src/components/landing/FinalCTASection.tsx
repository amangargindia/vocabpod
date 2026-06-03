"use client";

import { Check } from "lucide-react";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";
import Link from "next/link";

export default function FinalCTASection() {
  const { language } = useLandingLanguage();
  return (
    <section className="py-32 px-6 bg-terracotta relative overflow-hidden">
      
      {/* Background pattern (optional subtle grid or lines) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "32px 32px"
        }}
      ></div>

      <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
        <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none mb-8">
          {language === 'hi' ? "Yaad rakhne ke liye taiyaar?" : "Ready to remember?"}
        </h2>
        
        <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mb-12">
          {language === 'hi' 
            ? "Un logo ke sath judein jinhone bhoolna band kar diya hai aur confidently bolna shuru kar diya hai." 
            : "Join people like you who stopped forgetting and started speaking fluently."}
        </p>

        <a 
          href="/checkout"
          className="bg-terracotta text-light-gray font-bold px-12 py-5 rounded-full text-lg uppercase tracking-widest hover:shadow-[0_0_40px_rgba(224,75,53,0.6)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group text-center"
        >
          {language === 'hi' ? "Abhi Subscribe Karein ₹99" : "Subscribe for ₹99"}
        </a>

        <div className="mt-8 flex items-center gap-6 text-sm text-white/80 font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1"><Check className="w-4 h-4" /> {language === 'hi' ? "24-hr Money Back" : "24-hr Money Back"}</span>
          <span className="flex items-center gap-1"><Check className="w-4 h-4" /> {language === 'hi' ? "Kabhi Bhi Cancel Karein" : "Cancel Anytime"}</span>
        </div>
      </div>
    </section>
  );
}
