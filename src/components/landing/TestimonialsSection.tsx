"use client";

import Stickman from "@/components/Stickman";
import { Star } from "lucide-react";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";
import { useSalesConfig, type SalesConfig } from "./useSalesConfig";
import Link from "next/link";

const DEFAULT_TESTIMONIALS = [
  {
    name: "Himanshu",
    initials: "H",
    quote_en:
      "With VocabPod, even if I forget a word, it comes back to me instantly. I found myself using these words all day...",
    quote_hi:
      "Vocabpod se shabd bhool jaane par bhi turant yaad aa jate hai, mai dinbhar in shabdo ka use kar raha tha..",
  },
  {
    name: "Naeema",
    initials: "N",
    quote_en:
      "I never thought learning vocabulary could be this intuitive. The stories just stick in my head when I'm having conversations.",
    quote_hi:
      "Maine kabhi nahi socha tha vocabulary seekhna itna natural ho sakta hai. Jab main baatcheet karti hu toh kahaniya dimaag mein chapp jati hain.",
  },
  {
    name: "Daksh",
    initials: "D",
    quote_en:
      "I used to learn new words and then completely blank out when talking. Now I actually find myself using them naturally in conversations.",
    quote_hi:
      "Main naye words seekhta tha par bolte waqt sab bhool jata tha. Ab main bina soche un words ko conversations mein naturally use karta hu.",
  },
];

interface Props { initialData?: SalesConfig | null; }
export default function TestimonialsSection({ initialData }: Props) {
  const { language } = useLandingLanguage();
  const { config, isLoading } = useSalesConfig(initialData ?? undefined);

  const testimonials =
    config.testimonials && config.testimonials.length > 0
      ? config.testimonials
      : DEFAULT_TESTIMONIALS;

  return (
    <section className="py-24 px-6 bg-deep-canvas border-t border-white/5 relative overflow-hidden">
      {/* Decorative background stickman */}
      <div className="absolute top-0 right-0 opacity-5 pointer-events-none -translate-y-1/4 translate-x-1/4">
        <Stickman pose="thinking" size={400} />
      </div>

      <div className="max-w-6xl mx-auto flex flex-col items-center relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-4 py-1">
            {language === "hi" ? "LEARNERS KYA KEHTE HAIN" : "WHAT LEARNERS SAY"}
          </span>
        </div>

        {isLoading ? (
          <div className="w-8 h-8 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {/* Regular Testimonial Cards */}
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-card-gray border border-white/5 rounded-3xl p-6 flex flex-col h-full hover:border-terracotta/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dark-blush text-terracotta font-black flex items-center justify-center shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-light-gray">{t.name}</h4>
                    </div>
                  </div>
                  <div className="flex text-terracotta">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-ash leading-relaxed mt-2 italic flex-1">
                  &ldquo;{language === "hi" && t.quote_hi ? t.quote_hi : t.quote_en}&rdquo;
                </p>
              </div>
            ))}

            {/* WhatsApp Screenshot Mock Card */}
            <div className="bg-gradient-to-br from-[#075E54]/20 to-absolute-black border border-[#25D366]/30 rounded-3xl p-6 flex flex-col h-full relative overflow-hidden lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center text-white font-bold shrink-0">
                  <span className="blur-sm select-none">US</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    <span className="blur-sm select-none">User Name</span>
                  </h4>
                  <p className="text-[10px] text-[#25D366]">online</p>
                </div>
              </div>

              <div className="bg-[#056162] rounded-xl rounded-tl-none p-3 max-w-[85%] self-start border border-[#25D366]/20 shadow-sm relative">
                <p className="text-sm text-white">
                  {language === "hi"
                    ? "Hey! Bas thanks kehna tha. Visual mnemonics bahut mast hain. Aaj main apne manager se baat kar raha tha aur words naturally aane lage! 🙏🔥"
                    : "Hey! Just wanted to say thanks. The visual mnemonics are amazing. I was talking to my manager today and the words just flowed naturally! 🙏🔥"}
                </p>
                <span className="text-[9px] text-[#25D366]/70 absolute bottom-1 right-2">
                  10:42 AM
                </span>
              </div>

              <div className="bg-[#202C33] rounded-xl rounded-tr-none p-3 max-w-[85%] self-end mt-4 border border-white/5 shadow-sm relative">
                <p className="text-sm text-white">
                  {language === "hi"
                    ? "Sunkar acha laga! Khushi hai ki ye aapki daily life mein help kar raha hai! 🎉"
                    : "That's amazing to hear! So glad it's helping you in daily life! 🎉"}
                </p>
                <span className="text-[9px] text-muted-ash absolute bottom-1 right-2">
                  10:45 AM ✓✓
                </span>
              </div>
            </div>

            {/* Professional Advertisement Card */}
            <div className="bg-gradient-to-br from-dark-blush to-absolute-black border border-terracotta/30 rounded-3xl p-6 flex flex-col h-full items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-terracotta/5 group-hover:bg-terracotta/10 transition-colors pointer-events-none" />
              <div className="mb-6 h-24 flex items-center justify-center">
                <Stickman pose="pointing" size={100} />
              </div>
              <h4 className="text-2xl font-black text-light-gray uppercase tracking-tight mb-2">
                {language === "hi" ? "Bhoolna Band Karein" : "Stop Forgetting"}
              </h4>
              <p className="text-sm text-muted-ash mb-6">
                {language === "hi"
                  ? "Aap jaise smart learners ke sath judiye."
                  : "Join people like you learning the smart way."}
              </p>
              <a
                href="/checkout"
                className="bg-terracotta text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_15px_rgba(224,75,53,0.5)] transition-all"
              >
                {language === "hi" ? "Aaj Hi Shuru Karein" : "Start Today"}
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
