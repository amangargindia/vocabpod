"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getUser, signOut, getUserSubscription } from "@/lib/supabase";
import { clearAudioCache } from "@/lib/audioCache";
import { useVocabProgress } from "@/hooks/useVocabProgress";

interface UserProfile {
  total_xp: number;
  streak_count: number;
  last_active_date: string | null;
  phone: string | null;
}

interface SubscriptionInfo {
  is_premium: boolean;
  renews_at: string | null;
}

const LEVEL_LABELS: Record<number, string> = { 1: "Foundation", 2: "Nuance", 3: "Mastery" };

interface UserProfile {
  total_xp: number;
  streak_count: number;
  last_active_date: string | null;
  phone: string | null;
  display_name: string | null;
}

interface SubscriptionInfo {
  is_premium: boolean;
  renews_at: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({ is_premium: false, renews_at: null });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [nameInput, setNameInput] = useState("");
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved">("idle");
  const { isLoaded } = useVocabProgress(user?.id, !isLoading);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getUser();
        if (!currentUser) {
          window.location.href = "/login";
          return;
        }
        setUser(currentUser);

        const sub = await getUserSubscription();
        setIsPremium(sub.is_premium);
        setSubscription(sub as SubscriptionInfo);

        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
        if (currentUser.email && adminEmails.includes(currentUser.email)) {
          setIsAdmin(true);
        }

        // Fetch user profile (XP, streak, phone)
        if (currentUser.id) {
          const res = await fetch(`/api/profile?userId=${currentUser.id}`);
          if (res.ok) {
            const data = await res.json();
            setProfile(data.profile);
            if (data.profile?.phone) setPhoneInput(data.profile.phone);
            if (data.profile?.display_name) setNameInput(data.profile.display_name);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSignOut = async () => {
    await clearAudioCache();
    await signOut();
    window.location.href = "/login";
  };

  const handleSavePhone = async () => {
    if (!user?.id || !phoneInput.trim()) return;
    setPhoneStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, phone: phoneInput.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setPhoneStatus("saved");
    } catch {
      setPhoneStatus("idle");
      alert("Failed to save phone number.");
    }
    setTimeout(() => setPhoneStatus("idle"), 2000);
  };

  const handleSaveName = async () => {
    if (!user?.id || !nameInput.trim()) return;
    setNameStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, display_name: nameInput.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setNameStatus("saved");
    } catch {
      setNameStatus("idle");
      alert("Failed to save name. Make sure you ran the SQL query to add the display_name column!");
    }
    setTimeout(() => setNameStatus("idle"), 2000);
  };

  const [disabledLevels, setDisabledLevels] = useState<number[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("vocabpod_disabled_levels");
    if (saved) {
      try {
        setDisabledLevels(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);

  const toggleLevel = (level: number) => {
    const next = disabledLevels.includes(level)
      ? disabledLevels.filter(l => l !== level)
      : [...disabledLevels, level];
    setDisabledLevels(next);
    localStorage.setItem("vocabpod_disabled_levels", JSON.stringify(next));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-absolute-black items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-terracotta animate-ping" />
      </div>
    );
  }

  const totalXP = profile?.total_xp ?? 0;
  const streak = profile?.streak_count ?? 0;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-absolute-black text-light-gray font-sans">
<div className="flex-1 min-w-0 pb-[70px] md:pb-0">
        <header className="sticky top-0 z-30 backdrop-blur-md bg-absolute-black/80 border-b border-white/5 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex flex-1 justify-start md:justify-center">
            <Logo className="w-32 md:w-40 h-10 md:h-14" />
          </div>
          <div className="flex-1 flex justify-end">
            <span className="text-[10px] md:text-xs text-muted-ash">Profile</span>
          </div>
        </header>

        <main className="px-4 pt-4 pb-8 md:px-10 max-w-2xl mx-auto space-y-6 md:space-y-8">

          {/* Avatar card */}
          <section className="bg-card-gray border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center space-y-4 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="relative w-20 h-20 rounded-full bg-deep-canvas border-2 border-terracotta/30 flex items-center justify-center font-black text-3xl text-terracotta uppercase shadow-[0_0_30px_rgba(224,75,53,0.15)]">
              {user?.email?.charAt(0) ?? "U"}
            </div>

            <div className="space-y-1 relative z-10">
              <h1 className="text-lg md:text-xl font-black text-light-gray">{user?.email}</h1>
              <div className="flex items-center justify-center space-x-2">
                <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 md:px-4 py-1 md:py-1.5 rounded-full border ${
                  isPremium
                    ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/30"
                    : "bg-dark-blush text-terracotta border-terracotta/30"
                }`}>
                  {isPremium ? "Premium Member" : "Free Tier"}
                </span>
                {isAdmin && (
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 md:py-1.5 rounded-full bg-white/10 text-white border border-white/20">
                    Admin
                  </span>
                )}
              </div>
            </div>

            {subscription.renews_at && isPremium && (
              <p className="text-[10px] md:text-xs text-muted-ash relative z-10">
                Premium active until {new Date(subscription.renews_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </section>

          {/* Profile Name & Phone */}
          <section className="bg-card-gray border border-white/5 rounded-3xl p-6 md:p-7 space-y-6">
            <div>
              <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-ash">Display Name</h2>
              <p className="text-[9px] md:text-[10px] text-muted-ash/60 mt-1">How you appear on the leaderboard.</p>
              <div className="flex space-x-2 md:space-x-3 mt-3">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="Your Name"
                  className="flex-1 bg-deep-canvas border border-white/10 rounded-xl px-3 md:px-4 py-3 text-sm focus:outline-none focus:border-terracotta/50 text-light-gray placeholder:text-muted-ash/40"
                />
                <button
                  onClick={handleSaveName}
                  className={`px-4 md:px-5 py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
                    nameStatus === "saved"
                      ? "bg-emerald-950/30 text-emerald-400 border border-emerald-500/30"
                      : "bg-terracotta text-light-gray hover:shadow-[0_0_15px_rgba(224,75,53,0.3)]"
                  }`}
                >
                  {nameStatus === "saving" ? "..." : nameStatus === "saved" ? "Saved" : "Save"}
                </button>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6">
              <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-ash">Phone Number</h2>
              <p className="text-[9px] md:text-[10px] text-muted-ash/60 mt-1">For product updates and support.</p>
              <div className="flex space-x-2 md:space-x-3 mt-3">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="flex-1 bg-deep-canvas border border-white/10 rounded-xl px-3 md:px-4 py-3 text-sm focus:outline-none focus:border-terracotta/50 text-light-gray placeholder:text-muted-ash/40"
                />
                <button
                  onClick={handleSavePhone}
                  className={`px-4 md:px-5 py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
                    phoneStatus === "saved"
                      ? "bg-emerald-950/30 text-emerald-400 border border-emerald-500/30"
                      : "bg-terracotta text-light-gray hover:shadow-[0_0_15px_rgba(224,75,53,0.3)]"
                  }`}
                >
                  {phoneStatus === "saving" ? "..." : phoneStatus === "saved" ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="bg-card-gray border border-white/5 rounded-3xl p-6 md:p-7 space-y-4">
            <div>
              <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-ash">Learning Preferences</h2>
              <p className="text-[9px] md:text-[10px] text-muted-ash/60 mt-1">Select which word levels you want to see.</p>
            </div>
            <div className="flex flex-col space-y-3">
              {[1, 2, 3].map(level => {
                const isEnabled = !disabledLevels.includes(level);
                return (
                  <button
                    key={level}
                    onClick={() => toggleLevel(level)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isEnabled
                        ? "bg-dark-blush border-terracotta/30 text-terracotta"
                        : "bg-deep-canvas border-white/10 text-muted-ash opacity-60"
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold uppercase tracking-widest">Level {level}</span>
                      <span className="text-[10px] mt-1">{LEVEL_LABELS[level]}</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isEnabled ? 'bg-terracotta' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Actions */}
          <section className="space-y-3">
            {!isPremium && (
              <Link
                href="/upgrade"
                className="block w-full bg-terracotta text-light-gray font-bold py-4 rounded-xl text-center hover:shadow-[0_0_20px_rgba(224,75,53,0.3)] transition-all uppercase tracking-wider text-sm"
              >
                Upgrade to Premium
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="block w-full bg-white/5 border border-white/10 text-light-gray font-bold py-4 rounded-xl text-center hover:bg-white/10 transition-colors uppercase tracking-wider text-sm"
              >
                Admin Portal
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="w-full bg-dark-blush border border-terracotta/30 text-terracotta font-bold py-4 rounded-xl hover:bg-terracotta hover:text-light-gray transition-colors uppercase tracking-wider text-sm"
            >
              Sign Out
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
