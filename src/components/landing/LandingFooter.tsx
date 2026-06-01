"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";

export default function LandingFooter() {
  const { language } = useLandingLanguage();
  return (
    <footer className="bg-absolute-black pt-16 pb-8 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-12 text-center md:text-left">
        
        {/* Brand Column */}
        <div className="flex flex-col items-center md:items-start gap-4">
          <Logo className="w-32 h-10" />
          <p className="text-xs text-muted-ash max-w-xs leading-relaxed">
            {language === 'hi' 
              ? "Bhoolna band karein. Confidently bolna shuru karein. Cognitive science par bana ek matra vocabulary tool." 
              : "Stop forgetting. Start speaking fluently. The only vocabulary tool built on cognitive science."}
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center md:justify-end gap-x-12 gap-y-4">
          <div className="flex flex-col gap-3">
             <span className="text-[10px] font-bold uppercase tracking-widest text-light-gray mb-1">Product</span>
             <Link href="#demo" className="text-sm text-muted-ash hover:text-terracotta transition-colors">{language === 'hi' ? "Ye kaise kaam karta hai" : "How it works"}</Link>
             <Link href="#science" className="text-sm text-muted-ash hover:text-terracotta transition-colors">{language === 'hi' ? "Science ke baare mein" : "The Science"}</Link>
             <Link href="#pricing" className="text-sm text-muted-ash hover:text-terracotta transition-colors">Pricing</Link>
          </div>
          
          <div className="flex flex-col gap-3">
             <span className="text-[10px] font-bold uppercase tracking-widest text-light-gray mb-1">Company</span>
             <Link href="/about" className="text-sm text-muted-ash hover:text-terracotta transition-colors">{language === 'hi' ? "Hamare baare mein" : "About Us"}</Link>
             <Link href="/contact" className="text-sm text-muted-ash hover:text-terracotta transition-colors">Contact</Link>
          </div>
          
          <div className="flex flex-col gap-3">
             <span className="text-[10px] font-bold uppercase tracking-widest text-light-gray mb-1">Legal</span>
             <Link href="/privacy" className="text-sm text-muted-ash hover:text-terracotta transition-colors">Terms of Service</Link>
             <Link href="/privacy" className="text-sm text-muted-ash hover:text-terracotta transition-colors">Privacy Policy</Link>
             <Link href="/privacy" className="text-sm text-muted-ash hover:text-terracotta transition-colors">Refund Policy</Link>
          </div>
        </div>

      </div>

      <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-muted-ash">
          &copy; {new Date().getFullYear()} VocabPod. All rights reserved.
        </p>
        <p className="text-xs text-muted-ash">
          {language === 'hi' ? "India mein bana. Duniya ke liye." : "Made in India. For the world."}
        </p>
      </div>
    </footer>
  );
}
