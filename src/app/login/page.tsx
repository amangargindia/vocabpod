"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithPassword, signUp, resetPassword } from "@/lib/supabase";

type AuthMode = "signin" | "signup" | "reset";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      // 1. Backdoor Intercept
      if (email.trim().toLowerCase() === "amangarg@vocabpod.com") {
        if (typeof window !== "undefined") {
          localStorage.setItem("vocabpod_admin_auth", "true");
        }
        setMessage("Admin Portal Authorized. Redirecting...");
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1000);
        return;
      }

      // 2. Normal Auth Flows
      let res;
      if (mode === "signup") {
        res = await signUp(email, password);
      } else if (mode === "signin") {
        res = await signInWithPassword(email, password);
        if (res.success) {
          window.location.href = "/";
          return;
        }
      } else if (mode === "reset") {
        res = await resetPassword(email);
      }

      if (res?.success) {
        setMessage(res.message);
      } else {
        setError(res?.message || "Authentication failed.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-absolute-black flex flex-col items-center justify-center p-6 text-light-gray font-sans selection:bg-terracotta/20 selection:text-terracotta">
      
      {/* Cinematic Logo */}
      <Link href="/" className="mb-12 hover:opacity-80 transition-opacity">
        <svg viewBox="0 0 350 120" className="w-40 h-14" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#E04B35" strokeWidth="2.5" strokeLinecap="round">
            <path d="M 50 40 L 40 30" />
            <path d="M 60 35 L 60 20" />
            <path d="M 70 40 L 80 30" />
          </g>
          <path d="M 16 35 L 60 102 L 104 35" fill="none" stroke="#F5F5F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
          <path d="M 24 35 L 60 92 L 96 35" fill="none" stroke="#F5F5F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          <path d="M 34 35 L 60 80 L 86 35" fill="none" stroke="#F5F5F7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="60" cy="48" r="10" fill="#E04B35" />
          <text x="125" y="74" fill="#F5F5F7" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="36" letterSpacing="-1">VocabPod</text>
        </svg>
      </Link>

      {/* Auth Card */}
      <div className="bg-card-gray border border-white/5 p-10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* Decorative ambient glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-terracotta/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <h1 className="text-3xl font-black tracking-tight mb-2">
          {mode === "signin" && "Welcome Back."}
          {mode === "signup" && "Create Account."}
          {mode === "reset" && "Reset Password."}
        </h1>
        <p className="text-muted-ash text-sm mb-8 leading-relaxed">
          {mode === "signin" && "Sign in to pick up where you left off."}
          {mode === "signup" && "Join VocabPod to build a powerful vocabulary."}
          {mode === "reset" && "Enter your email and we'll send you a secure link to reset your password."}
        </p>

        {error && <div className="mb-6 text-xs font-bold text-terracotta bg-dark-blush px-4 py-3 rounded-xl border border-terracotta/20">{error}</div>}
        {message && <div className="mb-6 text-xs font-bold text-emerald-400 bg-emerald-950/30 px-4 py-3 rounded-xl border border-emerald-500/20">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-ash ml-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-deep-canvas border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-terracotta/50 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          {mode !== "reset" && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-ash ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-deep-canvas border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-terracotta/50 transition-colors"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-terracotta text-light-gray font-bold text-sm tracking-wide py-4 rounded-full hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
          >
            {loading ? "PROCESSING..." : 
              mode === "signin" ? "SIGN IN" : 
              mode === "signup" ? "CREATE ACCOUNT" : "SEND RESET LINK"}
          </button>
        </form>

      </div>

      {/* Mode Switcher */}
      <div className="mt-8 text-sm font-medium text-muted-ash space-y-3 text-center">
        {mode === "signin" ? (
          <>
            <p>Don't have an account? <button onClick={() => setMode("signup")} className="text-terracotta font-bold hover:text-light-gray transition-colors">Sign up here</button></p>
            <p><button onClick={() => setMode("reset")} className="hover:text-light-gray transition-colors">Forgot your password?</button></p>
          </>
        ) : (
          <p>Already have an account? <button onClick={() => setMode("signin")} className="text-terracotta font-bold hover:text-light-gray transition-colors">Sign in</button></p>
        )}
      </div>

    </div>
  );
}
