"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getUser } from "@/lib/supabase";
import { useVocabProgress } from "@/hooks/useVocabProgress";



function XPBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min(100, Math.round((current / max) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold text-muted-ash">
        <span>{current} XP</span>
        <span>{max} XP next tier</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-terracotta rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(224,75,53,0.4)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function XPChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date().getDay();
  const dayOffset = (today + 6) % 7;
  return (
    <div className="flex items-end justify-between space-x-1.5 h-20 px-1">
      {data.map((val, i) => {
        const isToday = i === dayOffset;
        return (
          <div key={i} className="flex-1 flex flex-col items-center space-y-1">
            <div
              className={`w-full rounded-t transition-all duration-700 ${isToday ? "bg-terracotta" : "bg-white/10"}`}
              style={{ height: val > 0 ? `${(val / max) * 56}px` : "0px", minHeight: val > 0 ? "4px" : "0px" }}
            />
            <span className={`text-[9px] font-bold uppercase ${isToday ? "text-terracotta" : "text-muted-ash/50"}`}>
              {days[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const WHATSAPP_GROUP = "https://chat.whatsapp.com/CmFrnRgJ5dJ9W7QXPCoTPY";
const RANK_COLORS = ["text-amber-400", "text-slate-300", "text-amber-700"];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"stats" | "rankings">("stats");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isRankingsLoading, setIsRankingsLoading] = useState(false);
  const [rankingsRequested, setRankingsRequested] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [xpHistory, setXpHistory] = useState<number[]>([0,0,0,0,0,0,0]);
  const { stats, isLoaded } = useVocabProgress(currentUserId, !isStatsLoading);

  const currentStreak = isLoaded ? stats.currentStreak : 0;
  const totalWords = isLoaded ? stats.totalWordsLearned : 0;

  // Load profile stats immediately (fast)
  useEffect(() => {
    async function loadStats() {
      const user = await getUser();
      setCurrentUserId(user?.id ?? null);
      if (user?.id) {
        try {
          const profileRes = await fetch(`/api/profile?userId=${user.id}`);
          if (profileRes.ok) {
            const pData = await profileRes.json();
            setTotalXp(pData.profile?.total_xp || 0);
            setXpHistory(pData.weeklyXp || [0,0,0,0,0,0,0]);
          }
        } catch {}
      }
      setIsStatsLoading(false);
    }
    loadStats();
  }, []);

  // Lazy-load community rankings only when that tab is first activated
  useEffect(() => {
    if (!rankingsRequested) return;
    setIsRankingsLoading(true);
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(data => {
        setLeaderboard(data.leaderboard || []);
        setIsRankingsLoading(false);
      })
      .catch(() => setIsRankingsLoading(false));
  }, [rankingsRequested]);

  const switchTab = (tab: "stats" | "rankings") => {
    setActiveTab(tab);
    if (tab === "rankings" && !rankingsRequested) {
      setRankingsRequested(true);
    }
  };

  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-absolute-black text-light-gray font-sans">
      <div className="flex-1 min-w-0 pb-[70px] md:pb-0">

        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-md bg-absolute-black/80 border-b border-white/5 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex flex-1 justify-start md:justify-center">
            <Link href="/">
              <Logo className="w-32 md:w-40 h-10 md:h-14" />
            </Link>
          </div>
          <div className="flex-1 flex justify-end">
            <a
              href={WHATSAPP_GROUP}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 md:px-4 py-1.5 md:py-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20 rounded-full flex items-center space-x-1.5 md:space-x-2"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 md:w-4 md:h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">Community</span>
            </a>
          </div>
        </header>

        {/* Tab Nav */}
        <nav className="sticky top-[65px] md:top-[89px] z-20 bg-absolute-black/95 backdrop-blur-md border-b border-white/5 px-4 py-2.5 flex items-center justify-center gap-2 shadow-lg">
          <button
            onClick={() => switchTab("stats")}
            className={`px-5 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest border transition-all ${
              activeTab === "stats"
                ? "bg-terracotta/15 border-terracotta/40 text-terracotta"
                : "bg-white/5 border-white/10 text-muted-ash hover:bg-terracotta/10 hover:text-terracotta hover:border-terracotta/25"
            }`}
          >
            Your Stats
          </button>
          <button
            onClick={() => switchTab("rankings")}
            className={`px-5 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest border transition-all ${
              activeTab === "rankings"
                ? "bg-terracotta/15 border-terracotta/40 text-terracotta"
                : "bg-white/5 border-white/10 text-muted-ash hover:bg-terracotta/10 hover:text-terracotta hover:border-terracotta/25"
            }`}
          >
            Community Rankings
          </button>
        </nav>

        <main className="flex-1 px-4 pt-6 pb-8 md:px-10 md:py-10 max-w-5xl w-full mx-auto">

          {/* ── YOUR STATS TAB ── */}
          {activeTab === "stats" && (
            <div className="space-y-6 animate-[fadeIn_0.25s_ease]">
              {isStatsLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-32 bg-card-gray rounded-3xl overflow-hidden relative">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card-gray border border-white/5 rounded-3xl p-6 md:p-7 shadow-2xl">
                  <h2 className="text-lg md:text-xl font-black text-light-gray tracking-tight mb-6">Your Stats</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-4">
                      <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-ash">XP Progress</h3>
                      <XPBar current={totalXp} max={Math.ceil((totalXp + 50) / 100) * 100} />
                      <div className="space-y-2 pt-2">
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-ash">This Week</p>
                        <XPChart data={xpHistory} />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-ash mb-3">Daily Streak</h3>
                        <div className="flex items-center space-x-3 bg-dark-blush/30 border border-terracotta/20 rounded-2xl p-4">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8 text-terracotta shrink-0" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                          </svg>
                          <div>
                            <div className="text-xl font-black text-light-gray">{currentStreak} <span className="text-sm font-bold text-muted-ash">Days</span></div>
                            <p className="text-[10px] text-muted-ash uppercase tracking-wider font-bold">Keep it up!</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-ash mb-3">Words Learned</h3>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-center text-center">
                          <div>
                            <div className="text-xl font-black text-light-gray">{totalWords} <span className="text-sm font-bold text-muted-ash">Words</span></div>
                            <p className="text-[10px] text-muted-ash uppercase tracking-wider font-bold mt-1">Total Learned</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── COMMUNITY RANKINGS TAB ── */}
          {activeTab === "rankings" && (
            <div className="space-y-6 animate-[fadeIn_0.25s_ease]">
              <div className="bg-card-gray border border-white/5 rounded-3xl p-6 md:p-7 shadow-2xl">
                <div className="text-center space-y-1 mb-8">
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight">Community Rankings</h2>
                  <p className="text-xs md:text-sm text-muted-ash">Updated daily. Earn XP by completing words.</p>
                </div>

                {isRankingsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex items-center p-4 rounded-2xl border border-white/5 bg-absolute-black/40 overflow-hidden relative">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                        <div className="w-6 h-3 rounded bg-white/10 mr-3 shrink-0" />
                        <div className="w-9 h-9 rounded-full bg-white/10 mr-3 shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 rounded bg-white/10" style={{ width: `${48 + i * 8}%` }} />
                          <div className="h-2 rounded bg-white/5 w-24" />
                        </div>
                        <div className="w-14 h-4 rounded bg-white/10 ml-3 shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-16 text-muted-ash">
                    <p className="font-bold">No scores yet.</p>
                    <p className="text-sm mt-1">Complete words to earn XP and appear here.</p>
                  </div>
                ) : (
                  <>
                    {/* Podium */}
                    {topThree.length > 0 && (
                      <div className="flex items-end justify-center space-x-4 py-4">
                        {topThree[1] && (
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-card-gray border-2 border-slate-400/30 flex items-center justify-center font-black text-xl text-slate-300">{topThree[1].initial}</div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">2nd</span>
                            <div className="w-20 bg-slate-500/20 border border-slate-500/20 rounded-t-xl h-20 flex items-end justify-center pb-2">
                              <span className="text-slate-300 font-black text-sm">{topThree[1].total_xp}</span>
                            </div>
                          </div>
                        )}
                        {topThree[0] && (
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-16 h-16 rounded-full bg-dark-blush border-2 border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.2)] flex items-center justify-center font-black text-2xl text-amber-400">{topThree[0].initial}</div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">1st</span>
                            <div className="w-20 bg-amber-500/10 border border-amber-500/20 rounded-t-xl h-28 flex items-end justify-center pb-2">
                              <span className="text-amber-400 font-black text-sm">{topThree[0].total_xp}</span>
                            </div>
                          </div>
                        )}
                        {topThree[2] && (
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-card-gray border-2 border-amber-700/30 flex items-center justify-center font-black text-xl text-amber-700">{topThree[2].initial}</div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">3rd</span>
                            <div className="w-20 bg-amber-900/20 border border-amber-700/20 rounded-t-xl h-14 flex items-end justify-center pb-2">
                              <span className="text-amber-700 font-black text-sm">{topThree[2].total_xp}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Full list */}
                    <div className="space-y-2 mt-4">
                      {leaderboard.map((entry, i) => {
                        const isMe = entry.user_id === currentUserId;
                        return (
                          <div
                            key={entry.user_id}
                            className={`flex items-center p-4 rounded-2xl border transition-all ${
                              isMe
                                ? "bg-dark-blush border-terracotta/30 shadow-[0_0_15px_rgba(224,75,53,0.1)]"
                                : "bg-absolute-black/40 border-white/5"
                            }`}
                          >
                            <span className={`w-7 text-xs font-black tabular-nums ${i < 3 ? [RANK_COLORS[0], RANK_COLORS[1], RANK_COLORS[2]][i] : "text-muted-ash"}`}>
                              #{entry.rank}
                            </span>
                            <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-black text-sm mr-3 ${
                              i < 3 ? `${[RANK_COLORS[0], RANK_COLORS[1], RANK_COLORS[2]][i]} border-current/30` : "bg-card-gray border-white/10 text-muted-ash"
                            }`}>
                              {entry.initial}
                            </div>
                            <span className="flex-1 font-semibold text-sm truncate">
                              {entry.display.split("@")[0]}
                              {isMe && <span className="ml-2 text-[10px] font-bold text-terracotta uppercase tracking-widest">You</span>}
                            </span>
                            <span className={`font-black text-sm tabular-nums ${i < 3 ? [RANK_COLORS[0], RANK_COLORS[1], RANK_COLORS[2]][i] : "text-light-gray"}`}>
                              {entry.total_xp} <span className="text-xs font-bold text-muted-ash">XP</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
