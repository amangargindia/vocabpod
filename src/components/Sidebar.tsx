"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, getUser } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { useEffect, useState } from "react";
import Logo from "./Logo";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);


const FlashcardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="2" y="4" width="20" height="14" rx="2" />
    <path d="M8 4v14M2 9h6M2 14h6" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <circle cx="8" cy="15" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="15" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const LeaderboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M8 6H4a1 1 0 00-1 1v10a1 1 0 001 1h4M8 6v12M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M8 18h8M16 6h4a1 1 0 011 1v10a1 1 0 01-1 1h-4M16 6v12" />
  </svg>
);

const AutoplayIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const FeaturesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const SignOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

const BugIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: <HomeIcon /> },
  { href: "/leaderboard", label: "Leaderboard", icon: <LeaderboardIcon /> },
  { href: "/autoplay", label: "Autoplay", icon: <AutoplayIcon /> },
  { href: "/flashcards", label: "Flashcards", icon: <FlashcardIcon /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugText, setBugText] = useState("");
  const [bugStatus, setBugStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    getUser().then(setUser);

    // Silently prefetch heavy data routes into browser cache
    setTimeout(() => {
      fetch("/api/leaderboard").catch(() => {});
      fetch("/api/words").catch(() => {});
    }, 2000);
  }, []);

  const handleSubmitBug = async () => {
    if (!bugText.trim()) return;
    setBugStatus("saving");
    try {
      await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: bugText, user_id: user?.id })
      });
      setBugStatus("saved");
      setTimeout(() => {
        setShowBugModal(false);
        setBugText("");
        setBugStatus("idle");
      }, 2000);
    } catch (e) {
      console.error(e);
      setBugStatus("idle");
    }
  };

  const handleSignOut = async () => {
    logger.info("User clicked sign out", { category: "AUTH", userId: user?.id });
    import("@/lib/audioCache").then(mod => mod.clearAudioCache());
    if (typeof window !== "undefined") {
      localStorage.removeItem("vocabpod_premium_last_checked");
      localStorage.removeItem("vocabpod_is_premium");
      localStorage.removeItem("vocabpod_user");
      localStorage.removeItem("vocabpod_last_user_id");
      localStorage.removeItem("vocabpod_feed_cache");
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("vocabpod_progress_")) {
          localStorage.removeItem(key);
          i--;
        }
      }
    }
    await signOut();
    window.location.href = "/";
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Sidebar / Bottom Bar */}
      <aside
        className={`fixed bottom-0 left-0 w-full h-[70px] z-50 flex flex-row items-center justify-around bg-deep-canvas border-t border-white/5 md:top-0 md:h-full md:border-r md:border-t-0 md:flex-col md:justify-start transition-all duration-300 ${collapsed ? "md:w-[70px]" : "md:w-[220px]"}`}
      >
        {/* Sidebar Toggle Area (Desktop Only) */}
        <div className="hidden md:flex items-center justify-between px-4 py-5 border-b border-white/5 w-full h-[73px] shrink-0">

          <button
            onClick={() => setCollapsed(p => !p)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-ash hover:text-light-gray hover:bg-white/5 transition-colors ml-auto shrink-0"
            aria-label="Toggle sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-4 h-4">
              {collapsed
                ? <><path d="M9 18l6-6-6-6" /></>
                : <><path d="M15 18l-6-6 6-6" /></>
              }
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-row items-center justify-start overflow-x-auto hide-scrollbar w-full px-2 space-x-2 md:flex-col md:items-stretch md:justify-start md:py-4 md:px-2 md:space-x-0 md:space-y-1 md:overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                id={`tour-${item.label.toLowerCase()}`}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 flex-1 md:flex-none md:w-auto h-full md:h-auto px-1 md:px-3 md:py-2.5 md:rounded-xl font-semibold transition-all duration-200 group relative ${
                  active
                    ? "text-terracotta md:bg-dark-blush"
                    : "text-muted-ash hover:text-light-gray md:hover:bg-white/5"
                }`}
              >
                <span className={`shrink-0 ${active ? "text-terracotta" : "text-muted-ash group-hover:text-light-gray"}`}>
                  {item.icon}
                </span>
                
                {/* Mobile Text (Tiny) */}
                <span className="text-[8px] uppercase tracking-wider block md:hidden truncate w-full text-center">
                  {item.label}
                </span>

                {/* Desktop Text */}
                {!collapsed && (
                  <span className="hidden md:block truncate tracking-wide text-sm">{item.label}</span>
                )}
                {active && !collapsed && (
                  <span className="hidden md:block absolute right-3 w-1.5 h-1.5 rounded-full bg-terracotta" />
                )}
              </Link>
            );
          })}

        </nav>

        {/* Divider (Desktop Only) */}
        <div className="hidden md:block border-t border-white/5 mx-3 w-[calc(100%-24px)] shrink-0" />

        {/* Action items (Desktop Only) */}
        <div className="hidden md:block py-4 px-2 space-y-1 w-full shrink-0">
          <button
            onClick={() => setShowBugModal(true)}
            title={collapsed ? "Report Bug" : undefined}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-muted-ash hover:text-amber-400 hover:bg-amber-400/10 transition-all duration-200 group"
          >
            <span className="shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </span>
            {!collapsed && <span className="tracking-wide">Report Bug</span>}
          </button>
          <button
            onClick={handleSignOut}
            title={collapsed ? "Sign Out" : undefined}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-muted-ash hover:text-terracotta hover:bg-dark-blush/50 transition-all duration-200 group"
          >
            <span className="shrink-0"><SignOutIcon /></span>
            {!collapsed && <span className="tracking-wide">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Bug Report Modal */}
      {showBugModal && (
        <div className="fixed inset-0 z-[100] bg-absolute-black/90 backdrop-blur-md flex flex-col justify-center items-center p-4 md:p-6 overflow-y-auto">
          <div className="bg-card-gray border border-white/10 rounded-3xl p-6 md:p-8 max-w-sm w-full relative shadow-2xl space-y-6 my-auto shrink-0">
            <button 
              onClick={() => setShowBugModal(false)}
              className="absolute top-4 right-4 text-muted-ash hover:text-light-gray font-bold text-lg"
            >
              ✕
            </button>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-light-gray uppercase tracking-tight">Report a Bug</h2>
              <p className="text-muted-ash text-sm leading-relaxed">
                Found something broken? Let us know so we can fix it!
              </p>
            </div>
            <div className="space-y-4">
              <textarea 
                value={bugText}
                onChange={e => setBugText(e.target.value)}
                placeholder="What happened?"
                rows={4}
                className="w-full bg-deep-canvas border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-terracotta/50 text-light-gray placeholder:text-muted-ash/40 resize-none"
              />
              <button 
                onClick={handleSubmitBug}
                disabled={bugStatus === "saving" || !bugText.trim()}
                className="w-full bg-terracotta text-light-gray font-bold py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all uppercase tracking-wider text-sm disabled:opacity-50"
              >
                {bugStatus === "saving" ? "Submitting..." : bugStatus === "saved" ? "Submitted!" : "Submit Bug"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer so page content is pushed right on desktop. Hidden on mobile. */}
      <div className={`hidden md:block shrink-0 transition-all duration-300 h-full ${collapsed ? "w-[70px]" : "w-[220px]"}`} />
    </>
  );
}
