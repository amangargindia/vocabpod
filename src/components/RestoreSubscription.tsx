"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

interface RestoreSubscriptionProps {
  compact?: boolean;
}

export default function RestoreSubscription({ compact = false }: RestoreSubscriptionProps) {
  const { user, isPremium, refreshAuth } = useAuth();
  const [isRestoring, setIsRestoring] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugText, setBugText] = useState("");
  const [bugStatus, setBugStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [message, setMessage] = useState<string | null>(null);

  // If the user is already resolved as premium, we don't need to show the restore options
  if (isPremium) return null;

  const handleRestore = async () => {
    setIsRestoring(true);
    setMessage(null);
    try {
      const res = await fetch("/api/checkout/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      
      if (res.ok && data.is_premium) {
        if (supabase) {
          await supabase.auth.refreshSession();
        }
        await refreshAuth();
        setMessage("Welcome to Premium! 🚀 Your subscription has been successfully restored.");
        
        // Reload page after a delay to ensure everything gets re-rendered
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(data.error || "No active subscription found for this account.");
      }
    } catch (err: any) {
      logger.error("Restore failed", { metadata: { error: err.message || String(err) } });
      setMessage("An error occurred. Please try again or contact support.");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSubmitBug = async () => {
    if (!bugText.trim()) return;
    setBugStatus("saving");
    try {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: bugText,
          source: "RestoreSubscription",
          user_id: user?.id
        })
      });
      if (res.ok) {
        setBugStatus("saved");
        setBugText("");
        setTimeout(() => setBugStatus("idle"), 3000);
      } else {
        setBugStatus("idle");
      }
    } catch (err) {
      setBugStatus("idle");
    }
  };

  return (
    <div className="w-full">
      {message && (
        <div className={`mb-4 text-xs font-bold px-4 py-3 rounded-xl border text-center ${
          message.includes("success") 
            ? "text-emerald-400 bg-emerald-950/40 border-emerald-500/20" 
            : "text-terracotta bg-dark-blush border-terracotta/20"
        }`}>
          {message}
        </div>
      )}

      {compact ? (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-ash">
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="hover:text-light-gray transition-colors disabled:opacity-50"
          >
            {isRestoring ? "RESTORING..." : "Already Subscribed? Restore"}
          </button>
          <span className="hidden sm:inline opacity-30">•</span>
          <button
            onClick={() => setShowBugModal(true)}
            className="hover:text-light-gray transition-colors"
          >
            Report a Bug
          </button>
        </div>
      ) : (
        <div className="bg-card-gray border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg font-black text-light-gray uppercase tracking-tight">Already Subscribed?</h3>
            <p className="text-muted-ash text-sm leading-relaxed">
              If you have already paid for a premium subscription via Razorpay, you can restore access below.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRestore}
              disabled={isRestoring}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-light-gray font-black text-xs tracking-wider py-4 rounded-xl transition-all disabled:opacity-50 uppercase"
            >
              {isRestoring ? "Restoring Access..." : "Restore Subscription"}
            </button>
            <button
              onClick={() => setShowBugModal(true)}
              className="px-6 bg-transparent border border-white/10 hover:bg-white/5 text-muted-ash hover:text-light-gray font-black text-xs tracking-wider py-4 rounded-xl transition-all uppercase"
            >
              Report Issue
            </button>
          </div>
        </div>
      )}

      {/* Bug Report Modal */}
      {showBugModal && (
        <div className="fixed inset-0 z-50 bg-absolute-black/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-card-gray border border-white/10 rounded-3xl p-8 max-w-sm w-full relative space-y-6">
            <button 
              onClick={() => setShowBugModal(false)}
              className="absolute top-4 right-4 text-muted-ash hover:text-light-gray font-bold text-lg"
            >
              ✕
            </button>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-light-gray uppercase tracking-tight">Report a Bug</h2>
              <p className="text-muted-ash text-sm leading-relaxed">
                Facing any issue/bug? Let us know so we can fix it immediately.
              </p>
            </div>
            <div className="space-y-4">
              <textarea 
                value={bugText}
                onChange={e => setBugText(e.target.value)}
                placeholder="What happened? Please describe the issue."
                rows={4}
                className="w-full bg-deep-canvas border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-terracotta/50 text-light-gray placeholder:text-muted-ash/40 resize-none"
              />
              <button 
                onClick={handleSubmitBug}
                disabled={bugStatus === "saving" || !bugText.trim()}
                className="w-full bg-terracotta text-light-gray font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider text-sm disabled:opacity-50"
              >
                {bugStatus === "saving" ? "Submitting..." : bugStatus === "saved" ? "Submitted!" : "Submit Bug"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
