"use client";

import { Check } from "lucide-react";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";

export default function ProofBar() {
  const { language } = useLandingLanguage();
  
  const stats = [
    { en: "Spaced Repetition", hi: "Spaced Repetition" },
    { en: "Podcasts", hi: "Podcasts" },
    { en: "Community Support", hi: "Community Support" },
    { en: "Personalization", hi: "Personalization" },
    { en: "GRE · UPSC · CAT Ready", hi: "GRE · UPSC · CAT Ke Liye Taiyaar" },
    { en: "Secure Payments", hi: "Secure Payments" },
    { en: "IST Daily Reset", hi: "IST Daily Reset" },
  ];

  const StatItem = ({ label }: { label: string }) => {
    return (
      <div className="flex items-center gap-3">
        <Check className="w-4 h-4 text-terracotta" />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-ash whitespace-nowrap">
          {label}
        </span>
      </div>
    );
  };

  // We duplicate the stats a few times so the marquee is long enough to seamlessly loop
  const repeatedStats = [...stats, ...stats, ...stats, ...stats];

  return (
    <section id="proof" className="border-y border-white/5 bg-deep-canvas py-5 overflow-hidden flex relative">
      {/* We use a single wrapper that translates by 50% to create a seamless infinite loop */}
      <div className="flex gap-12 w-max animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused] px-6">
        {repeatedStats.map((stat, i) => (
          <StatItem key={i} label={language === "hi" ? stat.hi : stat.en} />
        ))}
      </div>
    </section>
  );
}
