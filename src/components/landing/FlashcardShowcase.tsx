"use client";

import { useState } from "react";
import { demoWords } from "./demo-data";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";

export default function FlashcardShowcase() {
  const { language } = useLandingLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % demoWords.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + demoWords.length) % demoWords.length);
  };

  const word = demoWords[currentIndex];

  return (
    <section className="py-24 px-6 bg-absolute-black relative overflow-hidden">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-4 py-1">
            ACTIVE RECALL
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-light-gray tracking-tight mt-6 max-w-2xl mx-auto">
            {language === 'hi' ? "Interactive Flashcards" : "Interactive Flashcards"}
          </h2>
          <p className="text-muted-ash mt-4 max-w-xl mx-auto">
            {language === 'hi'
              ? "Answer dekhne se pehle khud ko test karein. Hamare flashcards Spaced Repetition System (SRS) ka use karke words tab dikhate hain jab aap unhe bhoolne wale hote hain."
              : "Test yourself before you look at the answer. Our flashcards use the Spaced Repetition System (SRS) to show you words right before you forget them."}
          </p>
        </div>

        <div className="w-full max-w-md perspective-1000 relative">
          
          {/* Flashcard container */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`w-full aspect-[3/4] relative transition-transform duration-500 transform-style-3d cursor-pointer ${
              isFlipped ? "rotate-y-180" : ""
            }`}
          >
            <style jsx>{`
              .perspective-1000 { perspective: 1000px; }
              .transform-style-3d { transform-style: preserve-3d; }
              .rotate-y-180 { transform: rotateY(180deg); }
              .backface-hidden { backface-visibility: hidden; }
            `}</style>
            
            {/* Front */}
            <div className="absolute inset-0 bg-card-gray border border-terracotta/20 rounded-3xl p-8 flex flex-col items-center justify-center backface-hidden shadow-2xl hover:shadow-[0_0_30px_rgba(224,75,53,0.15)] transition-shadow">
              <span className="absolute top-6 right-6 text-xs font-bold text-muted-ash tracking-widest uppercase">FRONT</span>
              <h3 className="text-4xl font-black text-light-gray uppercase tracking-widest">{word.word}</h3>
              <p className="text-terracotta mt-4 uppercase tracking-widest text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                {language === 'hi' ? "Flip karne ke liye tap karein" : "Tap to flip"}
              </p>
            </div>
            
            {/* Back */}
            <div className="absolute inset-0 bg-deep-canvas border border-terracotta/40 rounded-3xl p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180 shadow-2xl">
              <span className="absolute top-6 right-6 text-xs font-bold text-muted-ash tracking-widest uppercase">BACK</span>
              <div className="w-full h-full flex flex-col overflow-y-auto hide-scrollbar items-center text-center justify-center">
                <h3 className="text-2xl font-black text-light-gray uppercase mb-2">{word.word}</h3>
                <p className="text-terracotta text-xs mb-4 font-mono">{word.phonetic}</p>
                <p className="text-light-gray text-base leading-relaxed mb-6">
                  {word.definition}
                </p>
                <div className="bg-terracotta/10 p-4 rounded-xl w-full border-l-2 border-terracotta">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta mb-1 block">USE CASE</span>
                  <p className="text-xs text-light-gray">
                    {language === 'hi' && word.realLifeUseCaseHinglish ? word.realLifeUseCaseHinglish : word.realLifeUseCase}
                  </p>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* Controls */}
          <div className="flex justify-between items-center mt-8">
            <button 
              onClick={handlePrev}
              className="w-12 h-12 rounded-full bg-card-gray border border-white/5 flex items-center justify-center text-light-gray hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="text-sm font-bold text-muted-ash tracking-widest">
              {currentIndex + 1} / {demoWords.length}
            </span>
            <button 
              onClick={handleNext}
              className="w-12 h-12 rounded-full bg-card-gray border border-white/5 flex items-center justify-center text-light-gray hover:bg-white/10 transition-colors"
            >
              <ArrowRight size={20} />
            </button>
          </div>
          
        </div>

      </div>
    </section>
  );
}
