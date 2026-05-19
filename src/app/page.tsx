"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWordFeed, getUser, signOut } from "@/lib/supabase";
import { useVocabProgress } from "@/hooks/useVocabProgress";

// Reusing the Animated Logo
const Logo = () => (
  <svg viewBox="0 0 350 120" className="w-32 h-10" xmlns="http://www.w3.org/2000/svg">
    <g stroke="#E04B35" strokeWidth="2.5" strokeLinecap="round">
      <path d="M 50 40 L 40 30" strokeDasharray="20" strokeDashoffset="20">
        <animate attributeName="stroke-dashoffset" values="20; 20; 20; -20; -20" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M 60 35 L 60 20" strokeDasharray="20" strokeDashoffset="20">
        <animate attributeName="stroke-dashoffset" values="20; 20; 20; -20; -20" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M 70 40 L 80 30" strokeDasharray="20" strokeDashoffset="20">
        <animate attributeName="stroke-dashoffset" values="20; 20; 20; -20; -20" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" />
      </path>
    </g>
    <path d="M 16 35 L 60 102 L 104 35" fill="none" stroke="#F5F5F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
      <animate attributeName="d" values="M 16 35 L 60 102 L 104 35; M 16 35 L 60 102 L 104 35; M 4 55 L 60 110 L 116 55; M 16 35 L 60 102 L 104 35; M 16 35 L 60 102 L 104 35" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.5 1; 0.42 0 1 1; 0 0 0.58 1; 1 0 1 1"/>
    </path>
    <path d="M 24 35 L 60 92 L 96 35" fill="none" stroke="#F5F5F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
      <animate attributeName="d" values="M 24 35 L 60 92 L 96 35; M 24 35 L 60 92 L 96 35; M 10 50 L 60 100 L 110 50; M 24 35 L 60 92 L 96 35; M 24 35 L 60 92 L 96 35" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.5 1; 0.42 0 1 1; 0 0 0.58 1; 1 0 1 1"/>
    </path>
    <path d="M 34 35 L 60 80 L 86 35" fill="none" stroke="#F5F5F7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
      <animate attributeName="d" values="M 34 35 L 60 80 L 86 35; M 34 35 L 60 80 L 86 35; M 16 45 L 60 90 L 104 45; M 34 35 L 60 80 L 86 35; M 34 35 L 60 80 L 86 35" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.5 1; 0.42 0 1 1; 0 0 0.58 1; 1 0 1 1"/>
    </path>
    <circle cx="60" cy="48" r="10" fill="#E04B35">
      <animate attributeName="cy" values="48; 20; 65; 48; 48" keyTimes="0; 0.2; 0.4; 0.6; 1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0 0 0.58 1; 0.42 0 1 1; 0 0 0.58 1; 1 0 1 1"/>
    </circle>
    <text x="125" y="74" fill="#F5F5F7" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="36" letterSpacing="-1">VocabPod</text>
  </svg>
);

export default function Dashboard() {
  const [feed, setFeed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{email?: string} | null>(null);
  const { stats, isLoaded, getWordProgress } = useVocabProgress();

  useEffect(() => {
    async function loadData() {
      try {
        const [words, currentUser] = await Promise.all([
          getWordFeed(),
          getUser()
        ]);
        setFeed(words || []);
        setUser(currentUser);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    window.location.reload();
  };

  return (
    <div className="flex flex-col min-h-screen bg-absolute-black text-light-gray font-sans selection:bg-terracotta/20 selection:text-terracotta">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-absolute-black/80 border-b border-white/5 px-6 py-4 md:px-12 transition-all">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 text-sm font-semibold">
              <span className="text-muted-ash">{user ? "Cloud Sync:" : "Local Sync:"}</span>
              <span className="text-terracotta">Active</span>
            </div>
            {user ? (
              <div className="group relative">
                <div className="w-10 h-10 rounded-full bg-card-gray border border-white/10 flex items-center justify-center font-bold text-muted-ash cursor-pointer hover:border-white/30 transition-colors uppercase">
                  {user.email ? user.email.charAt(0) : "U"}
                </div>
                <div className="absolute right-0 mt-2 w-32 bg-card-gray border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-terracotta hover:bg-white/5 rounded-xl">
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="text-xs font-semibold px-4 py-2 border border-white/10 rounded-full hover:bg-white/5 transition-all uppercase tracking-wider">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col space-y-12">
        
        {/* User Progress Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-card-gray border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg hover:-translate-y-1 transition-all">
            <span className="text-muted-ash text-xs font-bold uppercase tracking-widest mb-2">Total Learned</span>
            <span className="text-5xl font-black text-light-gray tracking-tighter">
              {isLoaded ? stats.totalWordsLearned : "-"}
            </span>
            <span className="text-muted-ash text-sm mt-1">words</span>
          </div>

          <div className="bg-card-gray border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg hover:-translate-y-1 transition-all">
            <span className="text-muted-ash text-xs font-bold uppercase tracking-widest mb-2">Current Streak</span>
            <span className="text-5xl font-black text-terracotta tracking-tighter drop-shadow-[0_0_15px_rgba(224,75,53,0.3)]">
              {isLoaded ? stats.currentStreak : "-"}
            </span>
            <span className="text-muted-ash text-sm mt-1">days</span>
          </div>

          <div className="bg-card-gray border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg hover:-translate-y-1 transition-all relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-terracotta/5 to-transparent"></div>
            <span className="text-muted-ash text-xs font-bold uppercase tracking-widest mb-2">Pro Status</span>
            <span className="text-xl font-bold text-light-gray mt-2">Free Tier</span>
            <button className="mt-4 text-xs bg-dark-blush border border-terracotta/30 text-terracotta px-4 py-2 rounded-full font-bold uppercase tracking-wider hover:bg-terracotta hover:text-light-gray transition-all">
              Upgrade Now
            </button>
          </div>

        </section>

        {/* Lesson Feed */}
        <section className="flex flex-col space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold text-light-gray tracking-tight">Available Lessons</h2>
            <span className="text-sm font-semibold text-muted-ash uppercase tracking-widest">
              Week 1
            </span>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-card-gray rounded-2xl w-full"></div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="py-12 text-center text-muted-ash font-medium">
              No lessons available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {feed.map((word) => {
                const progress = getWordProgress(word.word);
                const isCompleted = progress?.is_completed;

                return (
                  <Link 
                    key={word.id} 
                    href={`/lesson/${word.word}`}
                    className={`group flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 ${
                      isCompleted 
                        ? "bg-deep-canvas border-emerald-500/20 hover:border-emerald-500/40" 
                        : "bg-card-gray border-white/5 hover:border-terracotta/50 hover:shadow-[0_0_30px_rgba(224,75,53,0.1)]"
                    }`}
                  >
                    <div className="flex items-center space-x-6">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                        isCompleted 
                          ? "bg-emerald-950 border-emerald-500/30 text-emerald-500" 
                          : "bg-dark-blush border-terracotta/30 text-terracotta"
                      }`}>
                        {isCompleted ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 translate-x-[2px]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold tracking-tight uppercase group-hover:text-terracotta transition-colors">
                          {word.word}
                        </span>
                        <span className="text-sm text-muted-ash mt-1 max-w-md truncate">
                          {word.definition}
                        </span>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-ash group-hover:text-light-gray transition-colors">
                        {isCompleted ? "Review" : "Start"} &rarr;
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
