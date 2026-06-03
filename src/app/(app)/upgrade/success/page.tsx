"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function UpgradeSuccessPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-absolute-black text-light-gray font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-terracotta/20 selection:text-terracotta">
      
      {/* CSS sparkles and glowing gradients — plain style tag, App Router compatible */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.1); opacity: 0.3; }
        }
        .success-sparkle {
          position: absolute;
          background: radial-gradient(circle, #E04B35 20%, transparent 60%);
          border-radius: 50%;
          pointer-events: none;
          animation: float 4s infinite linear;
        }
        .success-glow-sphere {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(224, 75, 53, 0.15) 0%, transparent 70%);
          filter: blur(60px);
          pointer-events: none;
          animation: pulse-glow 8s infinite ease-in-out;
        }
      ` }} />

      {/* Background glow */}
      <div className="success-glow-sphere top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
      
      {mounted && (
        <>
          <div className="success-sparkle w-3 h-3 top-[80%] left-[20%]" style={{ animationDelay: '0s', animationDuration: '5s' }}></div>
          <div className="success-sparkle w-2 h-2 top-[70%] left-[80%]" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
          <div className="success-sparkle w-4 h-4 top-[60%] left-[45%]" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
          <div className="success-sparkle w-2.5 h-2.5 top-[90%] left-[60%]" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }}></div>
          <div className="success-sparkle w-3 h-3 top-[50%] left-[15%]" style={{ animationDelay: '1.5s', animationDuration: '5.5s' }}></div>
        </>
      )}

      <div className="bg-card-gray border border-terracotta/20 rounded-3xl p-10 max-w-xl w-full text-center shadow-[0_0_50px_rgba(224,75,53,0.15)] relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-terracotta/5 to-transparent pointer-events-none"></div>

        {/* Success Crown Icon */}
        <div className="w-20 h-20 bg-dark-blush border border-terracotta/30 text-terracotta rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(224,75,53,0.2)] animate-bounce">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>

        <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Welcome to <span className="text-terracotta">Premium</span>!</h1>
        <p className="text-muted-ash mb-8 text-sm uppercase tracking-widest font-bold">Your subscription is now fully active</p>

        {/* Feature List */}
        <div className="bg-deep-canvas border border-white/5 rounded-2xl p-6 text-left space-y-4 mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-ash border-b border-white/5 pb-2">Unlocked Benefits</h3>
          
          <div className="flex items-start space-x-3">
            <span className="text-emerald-500 font-bold">✓</span>
            <div>
              <p className="text-sm font-bold text-light-gray">HD Audio Pronunciations</p>
              <p className="text-xs text-muted-ash">Listen to crystal-clear word lessons and mnemonic audio elements.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span className="text-emerald-500 font-bold">✓</span>
            <div>
              <p className="text-sm font-bold text-light-gray">Interactive Visual Quizzes</p>
              <p className="text-xs text-muted-ash">Test yourself with live vector visual aids & detailed explanations.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span className="text-emerald-500 font-bold">✓</span>
            <div>
              <p className="text-sm font-bold text-light-gray">Spaced Repetition Tracking</p>
              <p className="text-xs text-muted-ash">Smart progress memory automatically isolates review sets just for you.</p>
            </div>
          </div>
        </div>

        <Link 
          href="/" 
          className="block w-full bg-terracotta text-light-gray font-bold py-4 rounded-full text-lg tracking-wide hover:shadow-[0_0_30px_rgba(224,75,53,0.4)] hover:-translate-y-0.5 transition-all uppercase"
        >
          Start Premium Learning
        </Link>
      </div>
    </div>
  );
}
