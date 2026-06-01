"use client";

import { useState, useEffect } from "react";
import { useLandingLanguage } from "@/contexts/LandingLanguageContext";
import Stickman from "@/components/Stickman";
import { demoWords } from "./demo-data";
import { Lock, Check, X, ArrowRight, RefreshCw, X as XIcon } from "lucide-react";
import Link from "next/link";

export default function DemoSection() {
  const [isDemoUnlocked, setIsDemoUnlocked] = useState(false);
  const [currentStage, setCurrentStage] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const { language } = useLandingLanguage();
  
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [xpFloating, setXpFloating] = useState(false);

  const word = demoWords[currentWordIndex];
  
  useEffect(() => {
    const unlocked = localStorage.getItem("vocabpod_demo_unlocked");
    if (unlocked) {
      setIsDemoUnlocked(true);
    }
  }, []);

  const handleNextClick = () => {
    if (!isDemoUnlocked && currentStage === 0) {
      setShowEmailModal(true);
      return;
    }
    advanceStage();
  };

  const advanceStage = () => {
    if (currentStage < 5) {
      setCurrentStage((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSubmitting(true);
    setEmailError("");

    if (!/^\S+@\S+\.\S+$/.test(emailInput)) {
      setEmailError("Please enter a valid email address.");
      setEmailSubmitting(false);
      return;
    }

    try {
      await fetch("/api/landing/collect-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });
      
      localStorage.setItem("vocabpod_demo_unlocked", emailInput);
      setIsDemoUnlocked(true);
      setShowEmailModal(false);
      advanceStage();
      
    } catch (err) {
      localStorage.setItem("vocabpod_demo_unlocked", emailInput);
      setIsDemoUnlocked(true);
      setShowEmailModal(false);
      advanceStage();
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (index === word.quiz.correctIndex) {
      setXpFloating(true);
    }
  };

  const handleNextWord = () => {
    setCurrentWordIndex((prev) => (prev + 1) % demoWords.length);
    setCurrentStage(0);
    setSelectedAnswer(null);
    setXpFloating(false);
  };

  const formatTextWithBold = (text: string, highlightColorClass: string = "font-bold text-light-gray") => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <span key={i} className={highlightColorClass}>
            {part.slice(2, -2)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const stages = ["WORD", "STORY", "MNEMONIC", "USAGE", "QUIZ", "RESULT"];

  return (
    <section id="demo" className="py-6 md:py-24 px-4 md:px-6 bg-absolute-black relative min-h-[100dvh] flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center flex-1 justify-center">
        
        {/* Header - Scaled down for mobile */}
        <div className="text-center mb-6 md:mb-12 shrink-0">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-terracotta border border-terracotta/20 rounded-full px-3 py-1">
            HOW IT WORKS
          </span>
          <h2 className="text-2xl md:text-5xl font-black text-light-gray tracking-tight mt-3 md:mt-6">
            Experience a word. Right now.
          </h2>
        </div>

        {/* Step Indicator - Tighter on mobile */}
        <div className="flex w-full justify-between items-center mb-6 md:mb-12 relative shrink-0">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -z-10 -translate-y-1/2"></div>
          {stages.map((stageName, idx) => {
            const isCompleted = idx < currentStage;
            const isCurrent = idx === currentStage;
            const isLocked = !isDemoUnlocked && idx > 0;
            
            return (
              <div key={idx} className="flex flex-col items-center gap-1 md:gap-2 bg-absolute-black px-1 md:px-2">
                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold transition-all ${
                  isCurrent ? "bg-absolute-black border-2 border-terracotta text-terracotta shadow-[0_0_15px_rgba(224,75,53,0.4)]" :
                  isCompleted ? "bg-terracotta text-absolute-black" :
                  "bg-card-gray border border-white/10 text-muted-ash"
                }`}>
                  {isCompleted ? <Check size={12} className="md:w-3.5 md:h-3.5" /> : (isLocked ? <Lock size={10} className="md:w-3 md:h-3" /> : idx + 1)}
                </div>
                <span className={`text-[8px] md:text-[10px] font-bold uppercase tracking-wider hidden sm:block ${
                  isCurrent || isCompleted ? "text-light-gray" : "text-muted-ash"
                }`}>
                  {isLocked ? "LOCKED" : stageName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Demo Content Area - Flex constraints to prevent scroll */}
        <div className="w-full flex-1 bg-card-gray border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-12 relative flex flex-col justify-center overflow-y-auto md:overflow-visible hide-scrollbar max-h-[60vh] md:max-h-none min-h-[350px]">
          


          {/* Stage 0: WORD */}
          {currentStage === 0 && (
            <div className="flex flex-col items-center text-center animate-[scaleIn_0.4s_ease_both] h-full justify-center">
              <div className="mb-4 md:mb-6">
                <h3 className="text-4xl md:text-7xl font-black uppercase text-light-gray tracking-tight leading-none">{word.word}</h3>
                <p className="text-xs md:text-sm text-muted-ash mt-1 md:mt-2 font-mono">{word.phonetic}</p>
              </div>
              <span className="bg-terracotta text-light-gray px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4 md:mb-6">
                {word.type}
              </span>
              <p className="text-light-gray text-base md:text-xl leading-snug md:leading-relaxed max-w-xl">
                {word.definition}
              </p>
              
              <button 
                onClick={handleNextClick}
                className="mt-6 md:mt-12 bg-light-gray text-absolute-black hover:bg-white px-6 md:px-8 py-3 md:py-4 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-2 group shrink-0"
              >
                Next: Story <ArrowRight size={16} className="w-4 h-4 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Stage 1: STORY */}
          {currentStage === 1 && (
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12 animate-[scaleIn_0.4s_ease_both] relative z-10 h-full justify-center">
              <div className="flex-1 text-center md:text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta mb-2 md:mb-4 block">STORY REINFORCEMENT</span>
                <p className="text-light-gray text-sm md:text-lg leading-snug md:leading-relaxed">
                  {formatTextWithBold(language === 'hi' && word.storyHinglish ? word.storyHinglish : word.story)}
                </p>
              </div>
              <div className="shrink-0 bg-absolute-black/40 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 transform scale-75 md:scale-100">
                <Stickman pose={word.stickmanPose} size={140} />
              </div>
              <div className="w-full flex justify-center md:justify-end mt-2 md:mt-8 md:absolute md:bottom-0 md:right-0 shrink-0">
                 <button onClick={advanceStage} className="bg-terracotta text-white px-6 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-terracotta/80 transition-colors flex items-center gap-2">
                    Next <ArrowRight size={14} className="md:w-4 md:h-4" />
                 </button>
              </div>
            </div>
          )}

          {/* Stage 2: MNEMONIC */}
          {currentStage === 2 && (
            <div className="flex flex-col items-center text-center animate-[scaleIn_0.4s_ease_both] h-full justify-center">
               <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta mb-2 md:mb-8 block">VISUAL MNEMONIC</span>
               
               <div className="mb-4 md:mb-10 p-4 md:p-8 bg-absolute-black/40 rounded-2xl md:rounded-3xl border border-white/5 inline-block transform scale-75 md:scale-100 origin-center">
                 <Stickman pose={word.stickmanPose} size={180} />
               </div>

               <p className="text-base md:text-2xl text-light-gray max-w-2xl leading-snug md:leading-relaxed mb-2 md:mb-6">
                 {formatTextWithBold(language === 'hi' && word.narrativeHinglish ? word.narrativeHinglish : word.narrative, "font-black text-terracotta")}
               </p>
               
               <p className="text-[10px] md:text-xs text-muted-ash hidden md:block">Why stickmen? Bodily memory is 3× more durable than text alone.</p>

               <div className="w-full flex justify-center md:justify-end mt-4 md:mt-8 shrink-0">
                 <button onClick={advanceStage} className="bg-terracotta text-white px-6 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-terracotta/80 transition-colors flex items-center gap-2">
                    Next: Usage <ArrowRight size={14} className="md:w-4 md:h-4" />
                 </button>
              </div>
            </div>
          )}

          {/* Stage 3: USAGE */}
          {currentStage === 3 && (
            <div className="flex flex-col items-center text-center animate-[scaleIn_0.4s_ease_both] h-full justify-center">
               <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta mb-4 md:mb-8 block">REAL LIFE USAGE</span>
               
               <p className="text-lg md:text-3xl text-light-gray max-w-3xl leading-snug md:leading-relaxed mb-4 md:mb-6 italic">
                 "{formatTextWithBold(language === 'hi' && word.realLifeUseCaseHinglish ? word.realLifeUseCaseHinglish : word.realLifeUseCase, "font-black text-terracotta")}"
               </p>
               
               <p className="text-xs md:text-sm text-muted-ash max-w-xl">
                 We provide practical examples for every word so you know exactly how to use it in your next conversation, email, or interview.
               </p>

               <div className="w-full flex justify-center md:justify-end mt-6 md:mt-12 shrink-0">
                 <button onClick={advanceStage} className="bg-terracotta text-white px-6 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-terracotta/80 transition-colors flex items-center gap-2">
                    Take Quiz <ArrowRight size={14} className="md:w-4 md:h-4" />
                 </button>
              </div>
            </div>
          )}

          {/* Stage 4: QUIZ */}
          {currentStage === 4 && (
            <div className="flex flex-col animate-[scaleIn_0.4s_ease_both] w-full max-w-2xl mx-auto relative h-full justify-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta mb-3 md:mb-6 block text-center">ACTIVE RECALL QUIZ</span>
              <h3 className="text-base md:text-xl font-bold text-light-gray mb-4 md:mb-8 text-center leading-snug">{word.quiz.question}</h3>
              
              <div className="space-y-2 md:space-y-3">
                {word.quiz.options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === word.quiz.correctIndex;
                  const showResult = selectedAnswer !== null;
                  
                  let btnClass = "bg-absolute-black border-white/5 hover:border-terracotta/30 text-light-gray";
                  if (showResult) {
                    if (isCorrect) {
                      btnClass = "bg-emerald-950/40 border-emerald-500/50 text-emerald-400";
                    } else if (isSelected && !isCorrect) {
                      btnClass = "bg-terracotta/10 border-terracotta/50 text-terracotta";
                    } else {
                      btnClass = "bg-absolute-black/50 border-white/5 text-muted-ash opacity-50";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={showResult}
                      onClick={() => handleAnswerSelect(idx)}
                      className={`w-full p-3 md:p-4 rounded-xl border text-left text-sm md:text-base font-medium transition-all flex justify-between items-center ${btnClass}`}
                    >
                      <span>{option}</span>
                      {showResult && isCorrect && <Check size={16} className="text-emerald-400 md:w-[18px] md:h-[18px]" />}
                      {showResult && isSelected && !isCorrect && <X size={16} className="text-terracotta md:w-[18px] md:h-[18px]" />}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && (
                <div className="mt-4 md:mt-8 p-3 md:p-4 bg-terracotta/5 border border-terracotta/10 rounded-xl animate-[slideUp_0.3s_ease_both] shrink-0">
                  <p className="text-[11px] md:text-sm text-light-gray leading-snug md:leading-relaxed">{word.quiz.explanation}</p>
                  <div className="mt-3 md:mt-6 flex justify-end">
                    <button onClick={advanceStage} className="bg-terracotta text-white px-5 md:px-6 py-2 md:py-2.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-terracotta/80 transition-colors flex items-center gap-2">
                       See Results <ArrowRight size={12} className="md:w-[14px] md:h-[14px]" />
                    </button>
                  </div>
                </div>
              )}

              {xpFloating && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl md:text-4xl font-black text-terracotta drop-shadow-[0_0_20px_rgba(224,75,53,0.8)] pointer-events-none animate-[floatUp_1.5s_ease-out_forwards]">
                  +{word.xp} XP
                </div>
              )}
            </div>
          )}

          {/* Stage 5: RESULT */}
          {currentStage === 5 && (
            <div className="flex flex-col items-center text-center animate-[scaleIn_0.4s_ease_both] h-full justify-center">
              <h3 className="text-xl md:text-3xl font-black text-light-gray mb-1 md:mb-2">You just learned a word using science. 🧠</h3>
              <p className="text-[10px] md:text-sm text-muted-ash mb-6 md:mb-12">Here's how we'll ensure you never forget it.</p>
              
              <div className="flex items-center gap-1 sm:gap-2 md:gap-4 mb-8 md:mb-16 overflow-x-auto w-full max-w-3xl pb-2 md:pb-4 hide-scrollbar justify-start md:justify-center px-4 md:px-0 shrink-0">
                {["Learn", "2d", "4d", "7d", "14d", "30d", "PERMANENT"].map((step, idx, arr) => (
                  <div key={idx} className="flex items-center shrink-0">
                    <div className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest ${
                      idx === arr.length - 1 ? "bg-terracotta text-white shadow-[0_0_15px_rgba(224,75,53,0.5)]" : "bg-dark-blush border border-terracotta/30 text-terracotta"
                    }`}>
                      {step}
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="w-3 md:w-8 h-[1px] bg-terracotta/30 mx-1 border-dashed border-t border-terracotta/30"></div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full md:w-auto shrink-0">
                <Link href="/checkout" className="w-full sm:w-auto bg-terracotta text-light-gray px-6 md:px-8 py-3 md:py-4 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest hover:shadow-[0_0_30px_rgba(224,75,53,0.5)] hover:-translate-y-0.5 transition-all text-center">
                  Subscribe for Daily Words
                </Link>
                <button onClick={handleNextWord} className="w-full sm:w-auto border border-white/20 text-light-gray px-6 md:px-8 py-3 md:py-4 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest hover:border-white/40 transition-all flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="md:w-4 md:h-4" /> Try Another Word
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 z-[100] bg-absolute-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]">
          <div className="bg-card-gray border border-terracotta/20 rounded-3xl p-6 md:p-8 max-w-sm w-full relative shadow-2xl animate-[scaleIn_0.3s_ease]">
            <button 
              onClick={() => setShowEmailModal(false)}
              className="absolute top-4 right-4 md:top-6 md:right-6 text-muted-ash hover:text-light-gray transition-colors"
            >
              <XIcon size={20} />
            </button>
            
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-light-gray mb-1 md:mb-2 mt-2">Unlock the Full Demo</h3>
            <p className="text-xs md:text-sm text-muted-ash mb-6 md:mb-8 leading-relaxed">
              See how VocabPod encodes words permanently. Enter your email to unlock.
            </p>
            
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-absolute-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-terracotta/50 transition-colors text-light-gray"
                />
                {emailError && <p className="text-terracotta text-xs mt-2">{emailError}</p>}
              </div>
              
              <button
                type="submit"
                disabled={emailSubmitting}
                className="w-full bg-terracotta text-light-gray font-bold text-sm tracking-widest uppercase py-3 rounded-xl hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all disabled:opacity-50"
              >
                {emailSubmitting ? "Unlocking..." : "Unlock Demo →"}
              </button>
              
              <p className="text-center text-[8px] md:text-[10px] text-muted-ash uppercase tracking-widest pt-2">
                No spam. No credit card required.
              </p>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
