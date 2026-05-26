"use client";

import { useState } from "react";
import Script from "next/script";
import Logo from "@/components/Logo";
import { signInWithPassword } from "@/lib/supabase";

export default function PaywallLanding() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      // 1. Initialize Razorpay Checkout
      const res = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const response = await res.json();
      
      if (!res.ok) {
        throw new Error(response.error || "Failed to initialize payment");
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: response.id,
        name: "VocabPod",
        description: "Monthly Premium Subscription",
        handler: async function (checkoutResponse: any) {
          setMessage("Payment successful. Verifying & creating account...");
          setIsLoading(true);
          try {
            // 3. Verify Payment & Create Account
            const verifyRes = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: checkoutResponse.razorpay_payment_id,
                razorpay_subscription_id: checkoutResponse.razorpay_subscription_id,
                razorpay_signature: checkoutResponse.razorpay_signature,
                email: email,
                password: password,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Verification failed");
            }

            // 4. Log the user in and refresh
            setMessage("Account Created! Logging you in...");
            const loginRes = await signInWithPassword(email, password);
            if (!loginRes.success) {
              throw new Error(loginRes.message || "Failed to automatically sign in.");
            }
            window.location.href = "/";
            
          } catch (err: any) {
            setError(err.message || "Failed to verify subscription.");
            setIsLoading(false);
          }
        },
        prefill: {
          email: email,
        },
        theme: {
          color: "#FF4A26", // Terracotta
        },
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on("payment.failed", function (response: any) {
        setError(response.error.description || "Payment failed");
        setIsLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-absolute-black flex flex-col items-center justify-center p-6 text-light-gray font-sans selection:bg-terracotta/20 selection:text-terracotta">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Header with Login Button */}
      <div className="absolute top-6 right-6 z-20">
        <a href="/signin" className="text-sm font-bold border border-white/10 px-6 py-2 rounded-full hover:bg-white/5 transition-colors uppercase tracking-widest">
          Login
        </a>
      </div>

      {/* Cinematic Logo */}
      <div className="mb-12 relative z-10">
        <Logo className="w-36 md:w-48 h-12 md:h-16" />
      </div>

      {/* Sales Funnel / Paywall Card */}
      <div className="bg-card-gray border border-white/5 p-8 md:p-10 rounded-3xl w-full max-w-md relative overflow-hidden z-10 shadow-2xl">
        {/* Decorative ambient glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-terracotta/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2">Unlock Fluency.</h1>
          <p className="text-muted-ash text-sm leading-relaxed">
            Master the most powerful vocabulary using Spaced Repetition. Access all premium words and audio lessons instantly.
          </p>
        </div>

        {error && (
          <div className="mb-6 text-xs font-bold text-terracotta bg-dark-blush px-4 py-3 rounded-xl border border-terracotta/20 text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-4 py-3 rounded-xl border border-emerald-500/20 text-center animate-pulse">
            {message}
          </div>
        )}

        <form onSubmit={handleSubscribe} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-ash ml-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-deep-canvas border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-terracotta/50 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-ash ml-1">Create Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-deep-canvas border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-terracotta/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-terracotta text-light-gray font-black text-sm tracking-wide py-4 rounded-xl shadow-[0_0_20px_rgba(224,75,53,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <span>PROCESSING...</span>
            ) : (
              <>
                <span>SUBSCRIBE ₹99 / MONTH</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-muted-ash mt-6">
          Cancel anytime. Auto-renews monthly via Razorpay.
        </p>
      </div>
      
      {/* Footer Text */}
      <div className="mt-12 text-center text-[10px] font-bold text-muted-ash uppercase tracking-widest z-10">
        © 2026 VocabPod Inc. All rights reserved.
      </div>
    </div>
  );
}
