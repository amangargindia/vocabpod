"use client";

import { useLandingLanguage } from "@/contexts/LandingLanguageContext";

export default function CredibilitySection() {
  const { language } = useLandingLanguage();
  return (
    <section className="py-24 px-6 bg-absolute-black">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-4 py-1">
            {language === 'hi' ? "VOCABPOD KYU BANAYA GAYA" : "WHY VOCABPOD EXISTS"}
          </span>
        </div>

        {/* Founder Story */}
        <div className="flex flex-col md:flex-row items-center gap-12 max-w-4xl w-full mb-24">
          <div className="flex-1 order-2 md:order-1">
            <blockquote className="border-l-4 border-terracotta pl-6 text-xl italic text-light-gray mb-8">
              {language === 'hi' 
                ? `"Mujhe apne English aur Russian seekhne ke safar mein vocabulary yaad rakhne mein bohot dikkat aayi. VocabPod isiliye banaya gaya hai taaki koi aur is frustration se na guzre!"` 
                : `"I struggled a lot to retain vocabulary in my English and Russian learning journey. Vocabpod is built to solve that frustration for everyone!"`}
            </blockquote>
            
            <div className="space-y-4 text-muted-ash text-sm leading-relaxed">
              <p>
                {language === 'hi' 
                  ? "Maine English aur fir Russian seekhne mein mahino lagaye traditional methods use karke, par kuch kaam nahi aaya. Aisa lagta tha jaise main ek ched wali balti (bucket) bharne ki koshish kar raha hu." 
                  : "I spend months learning new words in English, and then Russian language using traditional methods, but it never worked. It felt like trying to fill a bucket with a hole in it."}
              </p>
              <p>
                {language === 'hi' 
                  ? "Jab maine cognitive science padhi, jawab saaf tha. Dimaag page par likha text yaad nahi rakhta; wo kahaniya, visuals, aur emotions yaad rakhta hai. Spaced Repetition (SRS) aur visual mnemonics ko mila kar, humne us balti ka ched band kar diya." 
                  : "When I dug into cognitive science, the answer was obvious. The brain doesn't remember text on a page; it remembers stories, visuals, and emotional anchors. By combining Spaced Repetition (SRS) with custom visual mnemonics, we fixed the bucket."}
              </p>
              <p>
                {language === 'hi' 
                  ? "Aaj VocabPod aap jaise kayi logo ko bina thake vocabulary hamesha ke liye yaad rakhne mein madad karta hai." 
                  : "Today, VocabPod helps many people like you encode vocabulary permanently, without the burnout."}
              </p>
            </div>
            
            <div className="mt-8">
              <p className="font-bold text-light-gray uppercase tracking-widest text-sm">Aman Garg</p>
              <p className="text-xs text-terracotta uppercase tracking-widest">Founder, Fluency Bridge (parent of VocabPod)</p>
            </div>
          </div>
          
          <div className="shrink-0 order-1 md:order-2">
            {/* // TODO: Replace founder photo placeholder with real image via next/image */}
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-card-gray border border-white/5 flex items-center justify-center overflow-hidden shadow-2xl relative">
               <div className="absolute inset-0 bg-gradient-to-br from-terracotta/10 to-transparent"></div>
               <span className="text-5xl font-black text-white/10 uppercase">AG</span>
            </div>
          </div>
        </div>

        {/* Video Player Placeholder */}
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-full aspect-video bg-card-gray rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative group cursor-pointer flex items-center justify-center">
            {/* // TODO: Replace YouTube placeholder div with real iframe: src="https://www.youtube.com/embed/[VIDEO_ID]" */}
            
            <div className="absolute inset-0 bg-gradient-to-br from-terracotta/5 to-transparent"></div>
            
            {/* Fake Play Button */}
            <div className="w-20 h-20 bg-terracotta rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(224,75,53,0.5)] group-hover:scale-110 transition-transform relative z-10 pl-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-muted-ash mt-6 uppercase tracking-widest font-bold">
            {language === 'hi' ? "Dekhiye VocabPod kaise kaam karta hai (3 minutes)" : "Watch how VocabPod works (3 minutes)"}
          </p>
        </div>

      </div>
    </section>
  );
}
