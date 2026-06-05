"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import * as Sentry from "@sentry/nextjs";

interface BugReportModalProps {
  userId?: string;
}

export default function BugReportModal({ userId }: BugReportModalProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const submit = async () => {
    if (!text.trim()) return;
    setStatus("saving");
    try {
      // 1. Submit to Sentry Feedback Dashboard (Client End)
      Sentry.captureFeedback({ 
        message: text, 
        email: user?.email || undefined,
        name: user?.email ? user.email.split("@")[0] : undefined 
      });

      // 2. Submit to Supabase for Admin Dashboard (Admin End)
      await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text, user_id: userId }),
      });
      
      setStatus("saved");
      setTimeout(() => { setOpen(false); setText(""); setStatus("idle"); }, 2000);
    } catch {
      setStatus("idle");
    }
  };

  const modalContent = open && mounted ? (
    <div className="fixed inset-0 z-[200] bg-absolute-black/90 backdrop-blur-md flex flex-col justify-center items-center p-4 md:p-6 overflow-y-auto">
      <div className="bg-card-gray border border-white/10 rounded-3xl p-6 md:p-8 max-w-sm w-full relative shadow-2xl space-y-5 my-auto shrink-0">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-muted-ash hover:text-light-gray font-bold text-lg hover:cursor-pointer"
        >
          ✕
        </button>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-light-gray uppercase tracking-tight">Report a Bug</h2>
          <p className="text-muted-ash text-sm leading-relaxed">Found something broken? Let us know!</p>
        </div>
        <div className="space-y-4">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What happened?"
            rows={3}
            className="w-full bg-deep-canvas border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-terracotta/50 text-light-gray placeholder:text-muted-ash/40 resize-none"
          />
          <button
            onClick={submit}
            disabled={status === "saving" || !text.trim()}
            className="w-full bg-terracotta text-light-gray font-bold py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all uppercase tracking-wider text-sm disabled:opacity-50 hover:cursor-pointer"
          >
            {status === "saving" ? "Submitting…" : status === "saved" ? "Submitted! ✓" : "Submit Bug"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs md:text-sm font-bold uppercase tracking-widest text-muted-ash hover:text-terracotta transition-colors hover:cursor-pointer whitespace-nowrap"
      >
        Report Bug
      </button>

      {mounted && typeof document !== "undefined"
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
}
