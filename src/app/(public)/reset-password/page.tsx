"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // Check if we actually have a session (recovery link logs user in temporarily)
    const checkSession = async () => {
      if (!supabase) {
        setError("Supabase client is not initialized.");
        setSessionChecked(true);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Your password reset link is invalid or has expired. Please request a new one.");
      }
      setSessionChecked(true);
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setMessage("Password updated successfully! Redirecting you to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-absolute-black flex flex-col items-center justify-center p-6 text-light-gray font-sans selection:bg-terracotta/20 selection:text-terracotta">
      
      {/* Cinematic Logo */}
      <Link href="/" className="mb-12 hover:opacity-80 transition-opacity">
        <Logo className="w-40 h-14" />
      </Link>

      {/* Auth Card */}
      <div className="bg-card-gray border border-white/5 p-10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* Decorative ambient glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-terracotta/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <h1 className="text-3xl font-black tracking-tight mb-2">
          New Password.
        </h1>
        <p className="text-muted-ash text-sm mb-8 leading-relaxed">
          Create a new secure password for your account.
        </p>

        {error && <div className="mb-6 text-xs font-bold text-terracotta bg-dark-blush px-4 py-3 rounded-xl border border-terracotta/20">{error}</div>}
        {message && <div className="mb-6 text-xs font-bold text-emerald-400 bg-emerald-950/30 px-4 py-3 rounded-xl border border-emerald-500/20">{message}</div>}

        {sessionChecked && (
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-ash ml-1">New Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-deep-canvas border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-terracotta/50 transition-colors"
                placeholder="At least 6 characters"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-ash ml-1">Confirm New Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-deep-canvas border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-terracotta/50 transition-colors"
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!message}
              className="w-full bg-terracotta text-light-gray font-bold text-sm tracking-wide py-4 rounded-full hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
            >
              {loading ? "UPDATING PASSWORD..." : "UPDATE PASSWORD"}
            </button>
          </form>
        )}

        {!sessionChecked && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-t-terracotta border-white/10 rounded-full animate-spin"></div>
          </div>
        )}

      </div>

      <div className="mt-8 text-sm font-medium text-muted-ash text-center">
        <Link href="/login" className="text-terracotta font-bold hover:text-light-gray transition-colors">
          Back to Login
        </Link>
      </div>

    </div>
  );
}
