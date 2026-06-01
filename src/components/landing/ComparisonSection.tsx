"use client";

import { Check, X } from "lucide-react";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";
import Logo from "@/components/Logo";

export default function ComparisonSection() {
  const { language } = useLandingLanguage();
  const features = [
    { en: "Permanent retention via SRS", hi: "SRS se hamesha ke liye yaad" },
    { en: "Animated visual mnemonics", hi: "Animated visual mnemonics" },
    { en: "Story-based contextual anchoring", hi: "Story-based context" },
    { en: "Native speaker audio", hi: "Native speaker audio" },
    { en: "Active recall quizzes", hi: "Active recall quizzes" },
    { en: "Anti-burnout 5-word limit", hi: "Bina thakan ke roz 5 words" },
    { en: "Exam-specific curation", hi: "Exam-specific curation" },
  ];

  return (
    <section className="py-24 px-6 bg-absolute-black">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-4 py-1">
            {language === 'hi' ? "FARK KYA HAI" : "THE DIFFERENCE"}
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-light-gray tracking-tight mt-6">
            {language === 'hi' ? "Textbooks kyu fail ho jate hain." : "Why textbooks fail you."}
          </h2>
        </div>

        {/* Comparison Table */}
        <div className="w-full bg-card-gray rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          
          {/* Table Header */}
          <div className="grid grid-cols-3 bg-absolute-black/50 border-b border-white/5 p-6 items-center">
             <div className="col-span-1"></div>
             <div className="col-span-1 text-center border-r border-white/5">
                <span className="text-sm font-black text-muted-ash uppercase tracking-widest">
                  {language === 'hi' ? "Kitabein & Lists" : "Books & Lists"}
                </span>
             </div>
             <div className="col-span-1 flex justify-center">
                <Logo className="w-28 h-8" />
             </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {features.map((feature, idx) => (
              <div key={idx} className="grid grid-cols-3 p-6 hover:bg-white/5 transition-colors items-center">
                <div className="col-span-1">
                  <span className="text-sm text-light-gray font-medium">
                    {language === 'hi' ? feature.hi : feature.en}
                  </span>
                </div>
                <div className="col-span-1 flex justify-center border-r border-white/5">
                  <X size={20} className="text-muted-ash opacity-50" />
                </div>
                <div className="col-span-1 flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center">
                    <Check size={18} className="text-terracotta" strokeWidth={3} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
        </div>

        {/* CTA */}
        <div className="mt-12">
          <a href="#demo" className="text-sm text-muted-ash hover:text-light-gray transition-colors border-b border-white/10 pb-1 uppercase tracking-widest font-bold">
            {language === 'hi' ? "Fark khud dekhiye ↑" : "Experience the difference ↑"}
          </a>
        </div>

      </div>
    </section>
  );
}
