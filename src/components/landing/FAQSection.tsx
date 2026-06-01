"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";

export default function FAQSection() {
  const { language } = useLandingLanguage();
  const faqs = [
    {
      q_en: "Is there a free trial?",
      q_hi: "Kya koi free trial hai?",
      a_en: "The interactive demo above shows exactly how the system works. Since our subscription is extremely affordable at ₹99/month, we don't offer a free trial, but we do offer a 24-hour no-questions-asked money-back guarantee.",
      a_hi: "Upar diya gaya interactive demo dikhata hai ki system kaise kaam karta hai. Kyunki hamara subscription sirf ₹99/month hai, hum free trial nahi dete, par hum 24-hour money-back guarantee zarur dete hain."
    },
    {
      q_en: "Can I do more than 5 words a day?",
      q_hi: "Kya main din mein 5 se zyada words kar sakta hu?",
      a_en: "No, and that's by design. Our data shows that users who try to do 20+ words a day burn out within a week and forget most of them. 5 words a day ensures maximum retention so they actually appear in your speech.",
      a_hi: "Nahi, aur ye jaanbuch kar kiya gaya hai. Jo log 20+ words ek din mein karte hain wo ek hafte mein thak jate hain aur sab bhool jate hain. 5 words a day se maximum retention hota hai."
    },
    {
      q_en: "Is this only for English learners?",
      q_hi: "Kya ye sirf English learners ke liye hai?",
      a_en: "VocabPod is designed for anyone who feels at a loss for words while speaking. Whether you are preparing for an interview, an exam, or just want to sound more articulate in daily conversations, this builds practical fluency.",
      a_hi: "VocabPod un sabhi ke liye hai jinhe bolte waqt words yaad aane mein dikkat hoti hai. Chahe aap interview ki taiyari kar rahe ho ya daily conversations improve karna chahte ho."
    },
    {
      q_en: "How does the Spaced Repetition (SRS) work?",
      q_hi: "Spaced Repetition (SRS) kaise kaam karta hai?",
      a_en: "When you learn a word, our algorithm schedules reviews at optimal forgetting intervals (e.g., 2 days, 4 days, 7 days, 14 days, 30 days). When you log in, your daily session prioritizes these due reviews before showing you new words.",
      a_hi: "Jab aap koi word seekhte hain, hamara algorithm reviews schedule karta hai (jaise 2 din, 4 din, 7 din). Daily session mein aapko pehle purane words review karaye jate hain aur fir naye."
    },
    {
      q_en: "Do I need to download an app?",
      q_hi: "Kya mujhe koi app download karni padegi?",
      a_en: "No. VocabPod is a Progressive Web App (PWA). You can use it in any browser on your phone or laptop. You can also 'Add to Home Screen' to use it exactly like a native app.",
      a_hi: "Nahi. VocabPod ek Progressive Web App (PWA) hai. Aap isse phone ya laptop ke kisi bhi browser par chala sakte hain aur 'Add to Home Screen' karke native app ki tarah use kar sakte hain."
    },
    {
      q_en: "What if I miss a day?",
      q_hi: "Agar main kisi din miss kar du toh kya hoga?",
      a_en: "Nothing happens! Your progress doesn't reset. The Spaced Repetition System (SRS) simply pauses and will resurface your due words whenever you return. No guilt, no lost streaks.",
      a_hi: "Kuch nahi hoga! Aapki progress reset nahi hoti. SRS bas pause ho jata hai aur jab aap wapas aayenge tab bache hue words dikhayega. Koi guilt nahi, koi streak loose nahi."
    }
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-24 px-6 bg-absolute-black">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-light-gray tracking-tight">
            {language === 'hi' ? "Aam Sawal (FAQs)" : "Common Questions"}
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={idx} 
                className={`border rounded-2xl overflow-hidden transition-colors ${
                  isOpen ? "bg-card-gray border-terracotta/30" : "bg-absolute-black border-white/5 hover:border-white/10"
                }`}
              >
                <button
                  className="w-full text-left px-6 py-6 flex items-center justify-between focus:outline-none"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                >
                  <span className={`font-bold pr-8 ${isOpen ? "text-terracotta" : "text-light-gray"}`}>
                    {language === 'hi' ? faq.q_hi : faq.q_en}
                  </span>
                  <span className={`shrink-0 transition-transform duration-300 ${isOpen ? "text-terracotta rotate-180" : "text-muted-ash"}`}>
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                  </span>
                </button>
                <div 
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-muted-ash text-sm leading-relaxed border-l-2 border-terracotta/30 pl-4">
                    {language === 'hi' ? faq.a_hi : faq.a_en}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
